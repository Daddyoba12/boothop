import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protected routes
  const protectedRoutes = [
    '/booter-dashboard',
    '/hooper-dashboard',
    '/journeys/create',
    '/requests/create',
    '/messages',
    '/profile',
  ];

  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  );

  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !session) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If logged in and trying to access login/register, redirect to dashboard
  if (session && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/register')) {
    // Get user type from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', session.user.id)
      .single();

    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = profile?.user_type === 'booter' 
      ? '/booter-dashboard' 
      : '/hooper-dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: [
    '/booter-dashboard/:path*',
    '/hooper-dashboard/:path*',
    '/journeys/create',
    '/requests/create',
    '/messages/:path*',
    '/profile/:path*',
    '/login',
    '/register',
  ],
};
