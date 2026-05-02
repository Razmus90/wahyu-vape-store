import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get admin user info
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('username, email, store_name, store_contact, store_address')
      .limit(1)
      .single();

    if (adminError) throw adminError;

    // Get display settings
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('chat_settings')
      .select('product_display')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const product_display = settings?.product_display
      ? (typeof settings.product_display === 'string'
          ? JSON.parse(settings.product_display)
          : settings.product_display)
      : { show_out_of_stock: true };

    return NextResponse.json({
      success: true,
      data: {
        ...admin,
        product_display,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch settings';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { store_name, store_contact, store_address, product_display } = body;

    // Update admin user info
    if (store_name !== undefined || store_contact !== undefined || store_address !== undefined) {
      const { data: admin, error: fetchError } = await supabaseAdmin
        .from('admin_users')
        .select('id')
        .limit(1)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabaseAdmin
        .from('admin_users')
        .update({
          ...(store_name !== undefined && { store_name }),
          ...(store_contact !== undefined && { store_contact }),
          ...(store_address !== undefined && { store_address }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', admin.id);

      if (updateError) throw updateError;
    }

    // Update product display settings
    if (product_display !== undefined) {
      const { data: existing } = await supabaseAdmin
        .from('chat_settings')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        await supabaseAdmin
          .from('chat_settings')
          .update({ product_display })
          .eq('id', existing.id);
      } else {
        await supabaseAdmin
          .from('chat_settings')
          .insert({ product_display });
      }
    }

    return NextResponse.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update settings';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
