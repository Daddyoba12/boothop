import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAppSession } from '@/lib/auth/session';

const protectedPaths = ['/dashboard', '/journeys/create', '/profile'];

export function middleware(request: NextRequest) {
  const isProtected = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get('boothop_session')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    verifyAppSession(token);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/journeys/create/:path*', '/profile/:path*'],
};
