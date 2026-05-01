import { NextRequest, NextResponse } from 'next/server';
import { productService } from '@/lib/services/productService';

const CRON_SECRET = process.env.CRON_SECRET || 'default-cron-secret-change-me';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
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
