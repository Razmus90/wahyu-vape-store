import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email required' },
        { status: 400 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomUUID();
    const resetExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update admin user with reset token
    const { error: updateError } = await supabaseAdmin
      .from('admin_users')
      .update({
        reset_token: resetToken,
        reset_expires_at: resetExpiresAt.toISOString(),
      })
      .eq('email', email);

    if (updateError) throw updateError;

    // Generate reset link
    const baseUrl = process.env.VERCEL_URL || 'http://localhost:3000';
    const resetLink = `${baseUrl}/admin/reset-password?token=${resetToken}`;

    // TODO: Send email with reset link
    // For MVP, return link in response and log it
    console.log('[RESET PASSWORD] Link:', resetLink);

    return NextResponse.json({
      success: true,
      message: 'Password reset link generated',
      data: { reset_link: resetLink }, // Remove in production
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process request';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
