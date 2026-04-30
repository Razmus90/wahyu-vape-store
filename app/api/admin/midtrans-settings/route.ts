import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/auth';
import { logService } from '@/lib/services/logService';

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
      .from('midtrans_settings')
      .select('*')
      .order('id', { ascending: true })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    const settings = data || null;

    if (settings) {
      settings.server_key = maskKey(settings.server_key);
      settings.sb_server_key = maskKey(settings.sb_server_key);
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch settings';
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
    const {
      is_production,
      merchant_id,
      client_key,
      server_key,
      sb_merchant_id,
      sb_client_key,
      sb_server_key,
    } = body;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (is_production !== undefined) updates.is_production = Boolean(is_production);
    if (merchant_id !== undefined) updates.merchant_id = String(merchant_id || '');
    if (client_key !== undefined && client_key && !client_key.includes('•')) updates.client_key = String(client_key);
    if (server_key !== undefined && server_key && !server_key.includes('•')) updates.server_key = String(server_key);
    if (sb_merchant_id !== undefined) updates.sb_merchant_id = String(sb_merchant_id || '');
    if (sb_client_key !== undefined && sb_client_key && !sb_client_key.includes('•')) updates.sb_client_key = String(sb_client_key);
    if (sb_server_key !== undefined && sb_server_key && !sb_server_key.includes('•')) updates.sb_server_key = String(sb_server_key);

    const { data: existing } = await supabaseAdmin
      .from('midtrans_settings')
      .select('id')
      .limit(1)
      .single();

    let result;
    if (existing) {
      result = await supabaseAdmin
        .from('midtrans_settings')
        .update(updates)
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      result = await supabaseAdmin
        .from('midtrans_settings')
        .insert({ ...updates, created_at: new Date().toISOString() })
        .select()
        .single();
    }

    if (result.error) throw result.error;

    await logService.create('INFO', 'MIDTRANS_SETTINGS_UPDATED', 'Midtrans settings updated', { is_production: updates.is_production });

    const saved = result.data;
    saved.server_key = maskKey(saved.server_key);
    saved.sb_server_key = maskKey(saved.sb_server_key);

    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save settings';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { test } = body;

    if (test) {
      const { data: settings } = await supabaseAdmin
        .from('midtrans_settings')
        .select('*')
        .order('id', { ascending: true })
        .limit(1)
        .single();

      if (!settings) {
        return NextResponse.json({ success: false, error: 'No settings found' }, { status: 400 });
      }

      const isProd = settings.is_production;
      const serverKey = settings.server_key;
      const clientKey = settings.client_key;

      if (!serverKey || !clientKey) {
        return NextResponse.json({ success: false, error: 'Missing keys' }, { status: 400 });
      }

      try {
        const midtransClient = require('midtrans-client');
        const snap = new midtransClient.Snap({
          isProduction: isProd,
          serverKey,
          clientKey,
        });

        return NextResponse.json({ success: true, message: 'Midtrans client initialized successfully' });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: 'Failed to initialize: ' + msg }, { status: 400 });
      }
    }

    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Connection test failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
