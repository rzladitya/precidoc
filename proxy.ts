import type { NextRequest } from 'next/server';
import { getAuth } from '@/lib/auth/server';
import { NextResponse } from 'next/server';
export default async function proxy(request: NextRequest) {
  const destination = new URL(request.url);
  if (destination.hostname === 'precidoc.rainc.web.id') {
    // Preserve the original query encoding; OpenNext's config redirects decode it.
    destination.protocol = 'https:';
    destination.host = 'precidoc.rainc.tech';
    return NextResponse.redirect(destination, 308);
  }
  if (request.nextUrl.pathname !== '/app' && !request.nextUrl.pathname.startsWith('/app/')) return NextResponse.next();
  try { return await getAuth().middleware({ loginUrl: '/auth/sign-in' })(request); }
  catch { return NextResponse.redirect(new URL('/auth/sign-in', request.url)); }
}
export const config = { matcher: ['/app/:path*', { source: '/:path*', has: [{ type: 'host', value: 'precidoc\\.rainc\\.web\\.id' }] }] };
