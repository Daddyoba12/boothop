import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBizCookieName } from '@/lib/auth/session';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(getBizCookieName());
  return NextResponse.json({ ok: true });
}
