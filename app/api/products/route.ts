import { NextRequest, NextResponse } from 'next/server';
import { productService } from '@/lib/services/productService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filterField = searchParams.get('filterField') || undefined;
    const filterValue = searchParams.get('filterValue') || undefined;
    const search = searchParams.get('search') || undefined;

    let products;
    if (search) {
      products = await productService.search(search);
    } else {
      products = await productService.getAll(filterField || undefined, filterValue || undefined);
    }

    return NextResponse.json({ success: true, data: products });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch products' }, { status: 500 });
  }
}
