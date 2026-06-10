import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBdSession } from '@/lib/auth/session';

const BASE_URL = 'https://www.boothop.com';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  if (!getBdSession(cookieStore)) {
    return NextResponse.redirect(`${BASE_URL}/promo/login`);
  }

  const { searchParams } = new URL(request.url);
  const code  = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${BASE_URL}/promo/tiktok-auth?error=${encodeURIComponent(error)}`);
  }

  const storedState = cookieStore.get('tt_oauth_state')?.value;
  if (!state || state !== storedState) {
    return NextResponse.redirect(`${BASE_URL}/promo/tiktok-auth?error=state_mismatch`);
  }

  if (!code) {
    return NextResponse.redirect(`${BASE_URL}/promo/tiktok-auth?error=no_code`);
  }

  const clientKey    = process.env.BD_TIKTOK_CLIENT_KEY    ?? '';
  const clientSecret = process.env.BD_TIKTOK_CLIENT_SECRET ?? '';

  if (!clientKey || !clientSecret) {
    return NextResponse.redirect(`${BASE_URL}/promo/tiktok-auth?error=missing_credentials`);
  }

  const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key:    clientKey,
      client_secret: clientSecret,
      code,
      grant_type:    'authorization_code',
      redirect_uri:  `${BASE_URL}/api/bd/tiktok-callback`,
    }),
  }).then(r => r.json());

  if (tokenRes.error || !tokenRes.access_token) {
    const msg = tokenRes.error_description || tokenRes.error || 'token_exchange_failed';
    return NextResponse.redirect(`${BASE_URL}/promo/tiktok-auth?error=${encodeURIComponent(msg)}`);
  }

  // Redirect to tiktok-auth page with token so user can copy it into Vercel
  const params = new URLSearchParams({
    token:      tokenRes.access_token,
    expires_in: String(tokenRes.expires_in ?? ''),
    scope:      tokenRes.scope ?? '',
  });
  if (tokenRes.refresh_token) params.set('refresh_token', tokenRes.refresh_token);

  const response = NextResponse.redirect(`${BASE_URL}/promo/tiktok-auth?${params}`);
  // Clear the state cookie
  response.cookies.set('tt_oauth_state', '', { maxAge: 0, path: '/' });
  return response;
}
