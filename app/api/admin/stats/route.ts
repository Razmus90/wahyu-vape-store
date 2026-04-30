import { NextResponse } from 'next/server';
import { orderService } from '@/lib/services/orderService';
import { productService } from '@/lib/services/productService';

export async function GET() {
  try {
    const [stats, products] = await Promise.all([
      orderService.getStats(),
      productService.getAll(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        totalProducts: products.length,
        lowStockProducts: products.filter((p) => p.stock < 10).length,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 });
  }
}
