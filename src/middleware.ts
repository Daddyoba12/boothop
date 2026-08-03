import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = new URL(request.url);

  // Protect admin routes — require boothop_admin_session
  const adminPublic = ['/admin/login', '/admin/change-password'];
  if (pathname.startsWith('/admin') && !adminPublic.some(p => pathname.startsWith(p))) {
    if (!request.cookies.get('boothop_admin_session')) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Protect Commander dashboard routes — require boothop_commander_session
  const commanderProtected = ['/commander/dashboard', '/commander/music', '/commander/change-password', '/commander/pipeline', '/commanderNew'];
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
