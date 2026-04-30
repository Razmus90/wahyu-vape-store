import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/services/aiService';
import { verifyAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await aiService.getSettings();
    return NextResponse.json({
      success: true,
      data: {
        embedding_api_key: settings?.embedding_api_key ? '••••••••' : '',
        embedding_model: settings?.embedding_model || 'openai/text-embedding-ada-002',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch embedding settings';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { apiKey, model } = body;

    const updates: Record<string, unknown> = {};
    if (apiKey !== undefined && apiKey !== '••••••••') {
      updates.embedding_api_key = apiKey;
    }
    if (model !== undefined) {
      updates.embedding_model = model;
    }

    const settings = await aiService.saveSettings(updates);
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save embedding settings';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
