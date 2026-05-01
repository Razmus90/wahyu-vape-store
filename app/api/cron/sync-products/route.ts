import { NextRequest, NextResponse } from 'next/server';
import { productService } from '@/lib/services/productService';

const CRON_SECRET = process.env.CRON_SECRET || 'default-cron-secret-change-me';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  // Debug: log whether CRON_SECRET is set (don't log the actual secret)
  console.log('[CRON DEBUG] CRON_SECRET exists:', !!CRON_SECRET, 'length:', CRON_SECRET.length);
  console.log('[CRON DEBUG] Auth header present:', !!authHeader);

  if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
    console.log('[CRON DEBUG] Auth failed. Expected length:', CRON_SECRET.length, 'Got length:', authHeader?.length);
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
