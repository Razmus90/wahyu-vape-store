import { NextRequest, NextResponse } from 'next/server';
import { createQRISPayment } from '@/lib/ipaymu';
import { orderService } from '@/lib/services/orderService';
import { logService } from '@/lib/services/logService';
import { verifyAdmin } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID required' }, { status: 400 });
    }

    const order = await orderService.getById(orderId);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    if (order.status !== 'PENDING_PAYMENT') {
      return NextResponse.json({ success: false, error: 'Order already processed' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    console.log('[IPAYMU] Creating QRIS with baseUrl:', baseUrl);
    const result = await createQRISPayment({
      amount: order.total_price,
      referenceId: order.id,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      notifyUrl: `${baseUrl}/api/webhooks/ipaymu`,
    });
    console.log('[IPAYMU] Response:', JSON.stringify(result, null, 2));

    if (result.Success || result.Status === 200) {
      await logService.create('INFO', 'IPAYMU_QRIS_CREATED', `Order ${orderId}`, {
        orderId,
        transactionId: result.Data?.TransactionId,
      });

      return NextResponse.json({
        success: true,
        data: {
          qrString: result.Data?.QrString,
          qrImage: result.Data?.QrImage,
          qrTemplate: result.Data?.QrTemplate,
          transactionId: result.Data?.TransactionId,
          order_id: orderId,
          expired: result.Data?.Expired,
        },
      });
    }

    await logService.create('ERROR', 'IPAYMU_CREATE_FAILED', result.Message || 'Unknown error', { orderId });
    return NextResponse.json({ success: false, error: result.Message || 'iPaymu payment failed' }, { status: 500 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'iPaymu payment failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
