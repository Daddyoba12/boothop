import { NextResponse } from 'next/server';
import { getBdCookieName } from '@/lib/auth/session';

export async function GET() {
  const response = NextResponse.redirect(new URL('/promo/login', process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com'));
  response.cookies.set(getBdCookieName(), '', { maxAge: 0, path: '/' });
  return response;
}
