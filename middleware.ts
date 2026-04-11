import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = ['/dashboard', '/journeys/create', '/profile'];

export function middleware(request: NextRequest) {
  const isProtected = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));
  if (!isProtected) return NextResponse.next();

  // Middleware runs on Edge Runtime — jsonwebtoken (Node.js crypto) is not
  // available here. We just check the cookie exists; full JWT verification
  // happens in /api/auth/me (Node.js runtime) which the dashboard calls on load.
  const token = request.cookies.get('boothop_session')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/journeys/create/:path*', '/profile/:path*'],
};
