import { NextRequest, NextResponse } from 'next/server';
import { productService } from '@/lib/services/productService';
import { supabaseAdmin } from '@/lib/supabase';

export const revalidate = 300;

async function getShowOutOfStock(): Promise<boolean> {
  try {
    const { data } = await supabaseAdmin
      .from('chat_settings')
      .select('product_display')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const display = data?.product_display;
    const parsed = typeof display === 'string' ? JSON.parse(display) : display;
    return parsed?.show_out_of_stock ?? true;
  } catch {
    return true;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filterField = searchParams.get('filterField') || undefined;
    const filterValue = searchParams.get('filterValue') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPageParam = searchParams.get('perPage') || '20';
    const perPage = Math.min(parseInt(perPageParam, 10), 100);
    const showAll = searchParams.get('showAll') === 'true';

    const showOutOfStock = showAll ? true : await getShowOutOfStock();
    const hideOutOfStock = !showOutOfStock;

    let response: { data: unknown[]; total: number; page: number; perPage: number };

    if (search) {
      const all = await productService.search(search, hideOutOfStock);
      const total = all.length;
      const start = (page - 1) * perPage;
      response = { data: all.slice(start, start + perPage), total, page, perPage };
    } else {
      const result = await productService.getAll(filterField, filterValue, perPage, (page - 1) * perPage, hideOutOfStock);
      response = { data: result.data, total: result.total, page, perPage };
    }

    const res = NextResponse.json({ success: true, ...response });
    res.headers.set('Cache-Control', showAll ? 'no-cache' : 'max-age=300, stale-while-revalidate=600');
    return res;
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch products' }, { status: 500 });
  }
}
