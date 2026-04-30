import { NextRequest, NextResponse } from 'next/server';
import { orderService } from '@/lib/services/orderService';
import { rateLimit, getRateLimitKey } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const key = getRateLimitKey(req);
    if (!rateLimit(key, 20, 60000)) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    const { customer_name, customer_email, customer_phone, customer_address, notes, items } = body;

    if (!customer_name || !customer_email || !items?.length) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const order = await orderService.create({
      customer_name,
      customer_email,
      customer_phone: customer_phone || '',
      customer_address: customer_address || '',
      notes: notes || '',
      items,
    });

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const orders = await orderService.getAll(status);
    return NextResponse.json({ success: true, data: orders });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
  }
}
