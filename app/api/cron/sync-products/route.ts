import { NextResponse } from 'next/server';
import { productService } from '@/lib/services/productService';

export const dynamic = 'force-dynamic';

export async function GET() {
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
