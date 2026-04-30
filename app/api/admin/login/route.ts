import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ success: false, error: 'Password required' }, { status: 400 });
    }

    if (!verifyPassword(password)) {
      return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
    }

    const token = await generateToken('admin');

    return NextResponse.json({ success: true, data: { token } });
  } catch {
    return NextResponse.json({ success: false, error: 'Login failed' }, { status: 500 });
  }
}
