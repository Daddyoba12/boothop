import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getSessionCookieName, verifyAppSession } from '@/lib/auth/session';

export async function GET(request: Request) {
  try {
    let token: string | undefined;

    // ✅ 1. Try cookie (existing behaviour)
    const cookieStore = await cookies();
    token = cookieStore.get(getSessionCookieName())?.value;

    // ✅ 2. Fallback to Bearer token (NEW)
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.replace('Bearer ', '');
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