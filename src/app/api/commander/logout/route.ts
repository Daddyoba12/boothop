import { NextResponse } from 'next/server';
import { getCommanderCookieName } from '@/lib/auth/commander';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(getCommanderCookieName(), '', { maxAge: 0, path: '/' });
  return res;
}
