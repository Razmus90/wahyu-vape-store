import { NextRequest, NextResponse } from 'next/server';
import { orderService } from '@/lib/services/orderService';
import { logService } from '@/lib/services/logService';
import { verifyMidtransSignature } from '@/lib/midtrans';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, transaction_status, payment_type, gross_amount, signature_key } = body;

    if (!order_id || !transaction_status) {
      return NextResponse.json({ success: false, error: 'Missing webhook data' }, { status: 400 });
    }

    if (signature_key && gross_amount && body.status_code && !await verifyMidtransSignature(order_id, body.status_code, gross_amount, signature_key)) {
      await logService.create('WARN', 'WEBHOOK_INVALID_SIGNATURE', `Invalid signature for order ${order_id}`, { order_id });
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
    }

    await logService.create('INFO', 'WEBHOOK_RECEIVED', `Payment webhook for order ${order_id}: ${transaction_status}`, { order_id, transaction_status, payment_type });

    let newStatus: 'PAID' | 'FAILED' | 'CANCELLED' | undefined;

    if (transaction_status === 'settlement' || transaction_status === 'capture') {
      newStatus = 'PAID';
    } else if (transaction_status === 'deny' || transaction_status === 'expire') {
      newStatus = 'FAILED';
    } else if (transaction_status === 'cancel') {
      newStatus = 'CANCELLED';
    }

    if (newStatus) {
      await orderService.updateStatus(order_id, newStatus);
    }

    return NextResponse.json({ success: true, message: 'Webhook processed' });
  } catch {
    return NextResponse.json({ success: false, error: 'Webhook processing failed' }, { status: 500 });
  }
}
