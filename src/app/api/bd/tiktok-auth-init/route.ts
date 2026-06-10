import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBdSession } from '@/lib/auth/session';
import crypto from 'crypto';

const BASE_URL = 'https://www.boothop.com';

export async function GET() {
  const cookieStore = await cookies();
  if (!getBdSession(cookieStore)) {
    return NextResponse.redirect(`${BASE_URL}/promo/login`);
  }

  const clientKey = process.env.BD_TIKTOK_CLIENT_KEY ?? '';
  if (!clientKey) {
    return NextResponse.redirect(`${BASE_URL}/promo/tiktok-auth?error=missing_client_key`);
  }

  const state       = crypto.randomBytes(16).toString('hex');
  const redirectUri = `${BASE_URL}/api/bd/tiktok-callback`;

  const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
  authUrl.searchParams.set('client_key',     clientKey);
  authUrl.searchParams.set('scope',          'video.publish,video.upload');
  authUrl.searchParams.set('response_type',  'code');
  authUrl.searchParams.set('redirect_uri',   redirectUri);
  authUrl.searchParams.set('state',          state);

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set('tt_oauth_state', state, {
    httpOnly: true,
    secure:   true,
    sameSite: 'lax',
    maxAge:   600,
    path:     '/',
  });
  return response;
}
