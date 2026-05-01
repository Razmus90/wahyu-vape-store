import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const isAdminPage = pathname.startsWith('/admin') && pathname !== '/admin/login';
  const isAdminApi = pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/login');

  if (isAdminPage || isAdminApi) {
    const token = req.cookies.get('admin_token')?.value;

    if (!token) {
      if (isAdminApi) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    const payload = await verifyToken(token);
    if (!payload) {
      if (isAdminApi) {
        return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
