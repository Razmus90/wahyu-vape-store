import { NextRequest, NextResponse } from 'next/server';
import { productService } from '@/lib/services/productService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const cronSecret = request.headers.get('x-cron-secret');
  const expectedSecret = process.env.CRON_SECRET;
  if (expectedSecret && cronSecret !== expectedSecret) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const result = await productService.syncFromOlsera();
    return NextResponse.json({
      success: true,
      message: `Synced: ${result.synced}, Deleted: ${result.deleted}, Embeddings: ${result.embeddings}, Errors: ${result.errors}`,
      data: result,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[CRON SYNC ERROR]', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
