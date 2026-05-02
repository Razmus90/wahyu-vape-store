import { NextRequest, NextResponse } from 'next/server';
import { getQR } from '@/lib/whatsapp';
import { verifyAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await getQR();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get QR code';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
