import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/auth';
import { logService } from '@/lib/services/logService';
import { ipaymuConfig } from '@/lib/ipaymu';

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
      .from('ipaymu_settings')
      .select('*')
      .order('id', { ascending: true })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    const settings = data || null;

    if (settings) {
      settings.sb_api_key = maskKey(settings.sb_api_key);
      settings.pr_api_key = maskKey(settings.pr_api_key);
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
      sb_api_key,
      sb_va,
      sb_mode,
      pr_api_key,
      pr_va,
    } = body;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (is_production !== undefined) updates.is_production = Boolean(is_production);
    if (sb_api_key !== undefined && sb_api_key && !sb_api_key.includes('•')) updates.sb_api_key = String(sb_api_key);
    if (sb_va !== undefined) updates.sb_va = String(sb_va || '');
    if (sb_mode !== undefined) updates.sb_mode = String(sb_mode || 'sandbox');
    if (pr_api_key !== undefined && pr_api_key && !pr_api_key.includes('•')) updates.pr_api_key = String(pr_api_key);
    if (pr_va !== undefined) updates.pr_va = String(pr_va || '');

    const { data: existing } = await supabaseAdmin
      .from('ipaymu_settings')
      .select('id')
      .limit(1)
      .single();

    let result;
    if (existing) {
      result = await supabaseAdmin
        .from('ipaymu_settings')
        .update(updates)
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      result = await supabaseAdmin
        .from('ipaymu_settings')
        .insert({ ...updates, created_at: new Date().toISOString() })
        .select()
        .single();
    }

    if (result.error) throw result.error;

    await logService.create('INFO', 'IPAYMU_SETTINGS_UPDATED', 'iPaymu settings updated', { is_production: updates.is_production });

    const saved = result.data;
    saved.sb_api_key = maskKey(saved.sb_api_key);
    saved.pr_api_key = maskKey(saved.pr_api_key);

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
        .from('ipaymu_settings')
        .select('*')
        .order('id', { ascending: true })
        .limit(1)
        .single();

      if (!settings) {
        return NextResponse.json({ success: false, error: 'No settings found' }, { status: 400 });
      }

      const isProd = Boolean(settings.is_production);
      const apiKey = isProd ? settings.pr_api_key : settings.sb_api_key;
      const va = isProd ? settings.pr_va : settings.sb_va;

      if (!apiKey || !va) {
        return NextResponse.json({
          success: false,
          error: `Missing ${isProd ? 'production' : 'sandbox'} credentials`,
        }, { status: 400 });
      }

      // Test by creating a test QRIS payment
      const { createQRISPayment } = await import('@/lib/ipaymu');
      const result = await createQRISPayment({
        amount: 10000,
        referenceId: `ADMIN-TEST-${Date.now()}`,
        customerName: 'Admin Test',
        customerEmail: 'admin-test@example.com',
        customerPhone: '08111222333',
        notifyUrl: 'https://example.com/webhook',
      });

      if (result.Success || result.Status === 200) {
        return NextResponse.json({
          success: true,
          message: `${isProd ? 'Production' : 'Sandbox'} iPaymu connection successful!`,
          data: { transactionId: result.Data?.TransactionId },
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Test failed: ' + (result.Message || 'Unknown error'),
        }, { status: 400 });
      }
    }

    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Connection test failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
