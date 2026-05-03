import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/auth';

function maskKey(key: string): string {
  if (!key || key.length <= 8) return '••••••••';
  return key.slice(0, 4) + '••••••••' + key.slice(-4);
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('whatsapp_settings')
      .select('*')
      .order('id', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    const settings = data || null;
    if (settings?.waha_api_key) {
      settings.waha_api_key = maskKey(settings.waha_api_key);
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    const message = error?.message || 'Failed to fetch settings';
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
    const { waha_api_url, waha_api_key } = body;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (waha_api_url !== undefined) updates.waha_api_url = String(waha_api_url || '');
    if (waha_api_key !== undefined && waha_api_key && !waha_api_key.includes('•')) {
      updates.waha_api_key = String(waha_api_key);
    }

    // Try to get existing record
    const { data: existing } = await supabaseAdmin
      .from('whatsapp_settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    let result;
    if (existing?.id) {
      result = await supabaseAdmin
        .from('whatsapp_settings')
        .update(updates)
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      result = await supabaseAdmin
        .from('whatsapp_settings')
        .insert({ ...updates, created_at: new Date().toISOString() })
        .select()
        .single();
    }

    if (result.error) throw result.error;

    const saved = result.data;
    if (saved?.waha_api_key) saved.waha_api_key = maskKey(saved.waha_api_key);

    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    const message = error?.message || 'Failed to save settings';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
