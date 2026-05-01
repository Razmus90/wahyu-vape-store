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

    // Use DB settings if available
    if (data) {
      const isProduction = data.is_production || false;
      const clientKey = isProduction
        ? (data.client_key || '')
        : (data.sb_client_key || '');

      return NextResponse.json({
        success: true,
        data: {
          is_production: isProduction,
          client_key: clientKey,
        },
      });
    }

    // Fallback to env vars (same logic as lib/midtrans.ts)
    const isProduction =
      process.env.MIDTRANS_IS_PRODUCTION === 'true' ||
      process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';

    const clientKey = isProduction
      ? (process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '')
      : (process.env.SANDBOX_MIDTRANS_CLIENT_KEY ||
        process.env.NEXT_PUBLIC_SANDBOX_MIDTRANS_CLIENT_KEY ||
        '');

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
