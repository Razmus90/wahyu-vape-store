import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logService } from '@/lib/services/logService';
import { verifyIPaymuSignature } from '@/lib/ipaymu';

export async function POST(request: NextRequest) {
  try {
    // Get signature from header
    const signature = request.headers.get('signature') || '';
    const va = request.headers.get('va') || '';

    if (!signature) {
      return NextResponse.json({ success: false, error: 'Missing signature' }, { status: 401 });
    }

    const body = await request.json();
    const { referenceId, status, transactionId } = body;

    if (!referenceId) {
      return NextResponse.json({ success: false, error: 'Missing referenceId' }, { status: 400 });
    }

    // Verify signature (if apiKey available)
    const apiKey = process.env.IPAYMU_MODE === 'true'
      ? process.env.IPAYMU_PR_API_KEY
      : process.env.IPAYMU_SB_API_KEY;

    if (apiKey) {
      const method = 'POST';
      const isValid = verifyIPaymuSignature(method, va, body, apiKey, signature);
      if (!isValid) {
        await logService.create('WARN', 'IPAYMU_WEBHOOK_INVALID_SIG', `Invalid signature for ${referenceId}`, { referenceId });
        return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
      }
    }

    await logService.create('INFO', 'IPAYMU_WEBHOOK', `Transaction ${transactionId}: ${status}`, {
      referenceId,
      status,
      transactionId,
    });

    let newStatus: 'PAID' | 'FAILED' | undefined;
    if (status === 'PAID' || status === 'settlement') {
      newStatus = 'PAID';
    } else if (status === 'failed' || status === 'expire') {
      newStatus = 'FAILED';
    }

    if (newStatus) {
      const { error } = await supabaseAdmin
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', referenceId);

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook failed';
    console.error('[IPAYMU WEBHOOK]', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
