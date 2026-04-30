import { NextRequest, NextResponse } from 'next/server';
import { productService } from '@/lib/services/productService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await productService.getById(params.id);

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch product';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
