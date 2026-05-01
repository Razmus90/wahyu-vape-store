import { supabase, supabaseAdmin, ProductCache } from '@/lib/supabase';
import { logService } from './logService';
import { fetchAllProducts, ExpandedProduct } from '@/lib/olseraApi';
import { aiService } from './aiService';

export const productService = {
  async getAll(filterField?: string, filterValue?: string, limit?: number, offset?: number, hideOutOfStock?: boolean): Promise<{ data: ProductCache[]; total: number }> {
    let query = supabase.from('products_cache').select('*', { count: 'exact' }).order('created_at', { ascending: false });
    if (filterField && filterValue && filterValue !== 'all') {
      query = query.eq(filterField, filterValue);
    }
    if (hideOutOfStock) {
      query = query.gt('stock', 0);
    }
    if (limit !== undefined && offset !== undefined) {
      query = query.range(offset, offset + limit - 1);
    }
    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data || [], total: count || 0 };
  },

  async getById(id: string): Promise<ProductCache | null> {
    const { data, error } = await supabase
      .from('products_cache')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async syncFromOlsera(): Promise<{ synced: number; updated: number; deleted: number; embeddings: number; errors: number }> {
    let synced = 0;
    let updated = 0;
    let deleted = 0;
    let embeddings = 0;
    let errors = 0;
    const olseraIds: string[] = [];

    try {
      const products: ExpandedProduct[] = await fetchAllProducts();

      // 1. Upsert products (insert or update based on olsera_product_id)
      for (const p of products) {
        try {
          const { error } = await supabaseAdmin
            .from('products_cache')
            .upsert(
              {
                olsera_product_id: p.olsera_product_id,
                name: p.name,
                sku: p.sku,
                description: p.description,
                price: p.price,
                stock: p.stock,
                category: p.category,
                brand_name: p.brand_name || '',
                klasifikasi: p.klasifikasi || '',
                image_url: p.image_url,
                last_synced_at: new Date().toISOString(),
              },
              { onConflict: 'olsera_product_id' }
            );

          if (error) {
            errors++;
            await logService.create('ERROR', 'PRODUCT_SYNC_UPSERT_FAILED', error.message, { olsera_id: p.olsera_product_id });
          } else {
            synced++;
          }
          olseraIds.push(p.olsera_product_id);
        } catch (err) {
          errors++;
        }
      }

      // 2. Delete products NOT in incoming data
      if (olseraIds.length > 0) {
        const { count, error: deleteError } = await supabaseAdmin
          .from('products_cache')
          .delete()
          .not('olsera_product_id', 'in', `(${olseraIds.map(id => `"${id}"`).join(',')})`);

        if (deleteError) {
          await logService.create('WARN', 'PRODUCT_SYNC_CLEANUP_FAILED', deleteError.message, {});
        } else {
          deleted = count || 0;
        }
      }

      // 3. Auto-generate embeddings for products without embeddings
      try {
        const { data: needEmbedding, error: embedError } = await supabaseAdmin
          .from('products_cache')
          .select('id, name')
          .is('embedding', null);

        if (!embedError && needEmbedding && needEmbedding.length > 0) {
          const settings = await aiService.getSettings();
          if (settings?.embedding_api_key) {
            for (const p of needEmbedding) {
              try {
                const embedding = await aiService.generateEmbedding(p.name, settings);
                if (embedding) {
                  await supabaseAdmin
                    .from('products_cache')
                    .update({ embedding })
                    .eq('id', p.id);
                  embeddings++;
                }
              } catch {
                // continue
              }
            }
          }
        }
      } catch (e) {
        await logService.create('WARN', 'PRODUCT_SYNC_EMBEDDING_FAILED', String(e), {});
      }

      await logService.create('INFO', 'PRODUCT_SYNC', `Synced: ${synced}, Updated: ${updated}, Deleted: ${deleted}, Embeddings: ${embeddings}, Errors: ${errors}`, { synced, updated, deleted, embeddings, errors });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      await logService.create('ERROR', 'PRODUCT_SYNC_FAILED', msg, { error: msg });
      throw err;
    }

    return { synced, updated, deleted, embeddings, errors };
  },

  async search(query: string, hideOutOfStock?: boolean): Promise<ProductCache[]> {
    let queryBuilder = supabase
      .from('products_cache')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('name');
    const { data, error } = await queryBuilder;
    if (error) throw error;
    const results = data || [];
    return hideOutOfStock ? results.filter(p => p.stock > 0) : results;
  },
};
