import type { NextRequest } from 'next/server';
import { getAuth } from '@/lib/auth/server';
import { NextResponse } from 'next/server';
export default async function proxy(request: NextRequest) {
  try { return await getAuth().middleware({ loginUrl: '/auth/sign-in' })(request); }
  catch { return NextResponse.redirect(new URL('/auth/sign-in', request.url)); }
}
export const config = { matcher: ['/app/:path*', '/register'] };
