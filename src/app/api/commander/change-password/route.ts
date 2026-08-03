import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { hashPassword, signCommanderSession, getCommanderSession, getCommanderCookieName } from '@/lib/auth/commander';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const session = getCommanderSession(cookieStore);
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { newPassword } = await req.json();
  if (!newPassword || newPassword.length < 8)
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });

  const db = createSupabaseAdminClient();
  await db.from('pipeline_clients').update({
    password_hash:    hashPassword(newPassword),
    is_temp_password: false,
  }).eq('id', session.clientId);

  // Reissue cookie without isTempPassword flag
  const newToken = signCommanderSession({ ...session, isTempPassword: false });
  const res = NextResponse.json({ ok: true, redirectTo: '/commander/dashboard' });
  res.cookies.set(getCommanderCookieName(), newToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path:     '/',
    maxAge:   60 * 60 * 24 * 7,
  });
  return res;
}
