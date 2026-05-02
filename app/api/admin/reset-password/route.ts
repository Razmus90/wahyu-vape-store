import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, new_password } = body;

    if (!token || !new_password) {
      return NextResponse.json(
        { success: false, error: 'Token and new password required' },
        { status: 400 }
      );
    }

    if (new_password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Verify token
    const { data: admin, error: fetchError } = await supabaseAdmin
      .from('admin_users')
      .select('id, reset_expires_at')
      .eq('reset_token', token)
      .single();

    if (fetchError || !admin) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check expiry
    if (new Date(admin.reset_expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Token has expired' },
        { status: 401 }
      );
    }

    // Hash new password and update
    const newHash = await hashPassword(new_password);
    const { error: updateError } = await supabaseAdmin
      .from('admin_users')
      .update({
        password_hash: newHash,
        reset_token: null,
        reset_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', admin.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reset password';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
