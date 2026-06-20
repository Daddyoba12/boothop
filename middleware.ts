import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPagePaths = ['/dashboard', '/journeys/create', '/profile', '/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Mobile Bearer token → cookie injection ─────────────────────────────────
  // Mobile clients send "Authorization: Bearer <jwt>" instead of a cookie.
  // Middleware runs on Edge Runtime (no jsonwebtoken), so we can't verify here.
  // We forward the token as the boothop_session cookie so every API route
  // handler picks it up via `cookies()` without any changes.
  if (pathname.startsWith('/api/')) {
    // Cron routes use their own Bearer-secret auth — skip cookie injection so
    // the Authorization header reaches the route handler untouched.
    if (pathname.startsWith('/api/cron/')) {
      return NextResponse.next();
    }

    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (bearerToken && !request.cookies.get('boothop_session')) {
      // Inject the token as a cookie into the request so route handlers
      // that call `cookies()` see it without any changes.
      const requestHeaders = new Headers(request.headers);
      const existing = requestHeaders.get('cookie') ?? '';
      requestHeaders.set(
        'cookie',
        existing ? `${existing}; boothop_session=${bearerToken}` : `boothop_session=${bearerToken}`
      );
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
    return NextResponse.next();
  }

  // ── Page route protection ──────────────────────────────────────────────────
  const isProtected = protectedPagePaths.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get('boothop_session')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*', '/dashboard/:path*', '/journeys/create/:path*', '/profile/:path*'],
};
