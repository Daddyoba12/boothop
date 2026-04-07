import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getBizSession } from '@/lib/auth/session';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session     = getBizSession(cookieStore);
    if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });
    return NextResponse.json({ authenticated: true, email: session.email });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
