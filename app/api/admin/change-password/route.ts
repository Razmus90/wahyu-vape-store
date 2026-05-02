import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin, hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { current_password, new_password } = body;

    if (!current_password || !new_password) {
      return NextResponse.json(
        { success: false, error: 'Current and new password required' },
        { status: 400 }
      );
    }

    if (new_password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Get current admin user
    const { data: admin, error: fetchError } = await supabaseAdmin
      .from('admin_users')
      .select('id, password_hash')
      .limit(1)
      .single();

    if (fetchError || !admin) {
      return NextResponse.json(
        { success: false, error: 'Admin user not found' },
        { status: 500 }
      );
    }

    // Verify current password
    const currentHash = await hashPassword(current_password);
    if (currentHash !== admin.password_hash) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Hash new password and update
    const newHash = await hashPassword(new_password);
    const { error: updateError } = await supabaseAdmin
      .from('admin_users')
      .update({
        password_hash: newHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', admin.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to change password';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
