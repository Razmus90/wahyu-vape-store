import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('chat_settings')
      .select('product_display')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    // Parse if stored as string
    const display = data?.product_display;
    const parsed = typeof display === 'string' ? JSON.parse(display) : display;

    return NextResponse.json({
      success: true,
      data: parsed || { show_out_of_stock: true },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
