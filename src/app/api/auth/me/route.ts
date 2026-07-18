import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  getSessionCookieName, verifyAppSession,
  getAppRemember, signAppSession,
} from '@/lib/auth/session';

export async function GET(request: Request) {
  try {
    let token: string | undefined;

    const cookieStore = await cookies();

    // 1. Try active session cookie
    token = cookieStore.get(getSessionCookieName())?.value;

    // 2. Fallback to Bearer token (mobile clients)
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.replace('Bearer ', '');
      }
    }

    // 3. Fallback to remember-me cookie — refreshes the session transparently
    //    so returning users within 30 days are never forced through OTP again.
    if (!token) {
      const remembered = getAppRemember(cookieStore);
      if (remembered?.email) {
        const freshToken = signAppSession({ email: remembered.email, verified: true });
        const res = NextResponse.json({
          authenticated: true,
          user: { email: remembered.email, verified: true },
        });
        res.cookies.set(getSessionCookieName(), freshToken, {
          httpOnly: true,
          secure:   process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path:     '/',
          maxAge:   60 * 60 * 24 * 7,
        });
        return res;
      }
    }

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const session = verifyAppSession(token);

    return NextResponse.json({
      authenticated: true,
      user: session,
    });

  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}