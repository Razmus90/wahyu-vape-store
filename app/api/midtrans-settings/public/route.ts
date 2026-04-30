import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('midtrans_settings')
      .select('is_production, client_key, sb_client_key')
      .order('id', { ascending: true })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    const settings = data || null;
    const isProduction = settings?.is_production || false;
    const clientKey = isProduction
      ? (settings?.client_key || '')
      : (settings?.sb_client_key || '');

    return NextResponse.json({
      success: true,
      data: {
        is_production: isProduction,
        client_key: clientKey,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch settings';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
