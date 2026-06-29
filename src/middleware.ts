import { NextRequest, NextResponse } from 'next/server';

const ORACLE_HOST = 'http://140.238.73.32';

// Proxy the entire commander subdomain straight through to Oracle.
// Relative redirects from Oracle (e.g. Location: /login) resolve against
// commander.boothop.com, which re-enters this middleware — so auth flows work.
function proxyToOracle(request: NextRequest): NextResponse {
  const { pathname, search } = new URL(request.url);
  const target = `${ORACLE_HOST}${pathname}${search}`;
  return NextResponse.rewrite(target);
}

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? '';

  if (host.startsWith('commander.')) {
    return proxyToOracle(request);
  }

  // Protect /dashboard, /journeys/create, /profile
  const { pathname } = new URL(request.url);
  const protectedPaths = ['/dashboard', '/journeys/create', '/profile'];
  if (protectedPaths.some(p => pathname.startsWith(p))) {
    const sessionCookie = request.cookies.get('boothop_session');
    if (!sessionCookie) {
      return NextResponse.redirect(
        new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)).*)',
  ],
};
