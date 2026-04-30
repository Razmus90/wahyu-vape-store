import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

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
    const message = error instanceof Error ? error.message : 'Failed to fetch product display settings';
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
    const { product_display } = body;

    // Get existing settings
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('chat_settings')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existing) {
      const { error: updateError } = await supabaseAdmin
        .from('chat_settings')
        .update({ product_display })
        .eq('id', existing.id);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabaseAdmin
        .from('chat_settings')
        .insert({ product_display });
      if (insertError) throw insertError;
    }

    return NextResponse.json({ success: true, data: { product_display } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save product display settings';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
