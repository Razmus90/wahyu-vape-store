import { NextRequest, NextResponse } from 'next/server';
import { orderService } from '@/lib/services/orderService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await orderService.getById(params.id);

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch order';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
