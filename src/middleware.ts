import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = new URL(request.url);

  // Protect Commander dashboard routes — require boothop_commander_session
  const commanderProtected = ['/commander/dashboard', '/commander/music'];
  if (commanderProtected.some(p => pathname.startsWith(p))) {
    if (!request.cookies.get('boothop_commander_session')) {
      return NextResponse.redirect(new URL('/commander', request.url));
    }
  }

  // Protect BootHop user routes — require boothop_session
  const protectedPaths = ['/dashboard', '/journeys/create', '/profile', '/requests/create'];
  if (protectedPaths.some(p => pathname.startsWith(p))) {
    if (!request.cookies.get('boothop_session')) {
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
