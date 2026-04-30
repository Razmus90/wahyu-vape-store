import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/auth';
import { aiService } from '@/lib/services/aiService';

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get settings for API key + model
    const settings = await aiService.getSettings();
    if (!settings?.embedding_api_key) {
      return NextResponse.json({ success: false, error: 'Embedding API key not configured' }, { status: 400 });
    }

    // Fetch products without embeddings
    const { data: products, error } = await supabaseAdmin
      .from('products_cache')
      .select('id, name')
      .is('embedding', null);

    if (error) throw error;
    if (!products || products.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: 'All products already have embeddings' });
    }

    let generated = 0;
    for (const product of products) {
      try {
        const embedding = await aiService.generateEmbedding(product.name, settings);
        if (embedding) {
          await supabaseAdmin
            .from('products_cache')
            .update({ embedding })
            .eq('id', product.id);
          generated++;
        }
      } catch (err) {
        console.error(`Failed to generate embedding for ${product.name}:`, err);
      }
    }

    return NextResponse.json({ success: true, count: generated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate embeddings';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
