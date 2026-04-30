import { NextRequest, NextResponse } from 'next/server';
import { logService } from '@/lib/services/logService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const level = searchParams.get('level') as 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | null;
    const limit = parseInt(searchParams.get('limit') || '100');

    const logs = level
      ? await logService.getByLevel(level, limit)
      : await logService.getAll(limit);

    return NextResponse.json({ success: true, data: logs });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch logs' }, { status: 500 });
  }
}
