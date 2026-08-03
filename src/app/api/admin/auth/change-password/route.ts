import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { hashPassword, signAdminSession, getAdminSession, getAdminCookieName } from '@/lib/auth/admin-session';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const session = getAdminSession(cookieStore);
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { newPassword } = await req.json();
  if (!newPassword || newPassword.length < 8)
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });

  const db = createSupabaseAdminClient();
  await db.from('admin_accounts').update({
    password_hash:    hashPassword(newPassword),
    is_temp_password: false,
  }).eq('id', session.adminId);

  // Reissue cookie without isTempPassword flag
  const newToken = signAdminSession({ ...session, isTempPassword: false });
  const res = NextResponse.json({ ok: true, redirectTo: '/admin' });
  res.cookies.set(getAdminCookieName(), newToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path:     '/',
    maxAge:   60 * 60 * 8,
  });
  return res;
}
