import { NextRequest, NextResponse } from 'next/server';
import { orderService } from '@/lib/services/orderService';
import { logService } from '@/lib/services/logService';
import { createTransaction } from '@/lib/midtrans';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    const order = await orderService.getById(orderId);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    if (order.status !== 'PENDING_PAYMENT') {
      return NextResponse.json({ success: false, error: 'Order already processed' }, { status: 400 });
    }

    try {
      const payment = await createTransaction({
        orderId: order.id,
        grossAmount: order.total_price,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        customerPhone: order.customer_phone,
      });

      await orderService.updatePaymentToken(orderId, payment.token, payment.redirect_url);
      await logService.create('INFO', 'PAYMENT_CREATED', `Midtrans payment created for order ${orderId}`, { orderId, token: payment.token });

      return NextResponse.json({
        success: true,
        data: {
          token: payment.token,
          redirect_url: payment.redirect_url,
          order_id: orderId,
          gross_amount: order.total_price,
        },
      });
    } catch (midtransError) {
      const msg = midtransError instanceof Error ? midtransError.message : String(midtransError);
      await logService.create('ERROR', 'MIDTRANS_CREATE_FAILED', msg, { orderId });
      return NextResponse.json({ success: false, error: 'Payment gateway error: ' + msg }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ success: false, error: 'Payment creation failed' }, { status: 500 });
  }
}
