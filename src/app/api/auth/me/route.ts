import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getSessionCookieName, verifyAppSession } from '@/lib/auth/session';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getSessionCookieName())?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const session = verifyAppSession(token);
    return NextResponse.json({ authenticated: true, user: session });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
