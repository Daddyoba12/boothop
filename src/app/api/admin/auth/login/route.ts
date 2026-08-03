import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { verifyPassword, signAdminSession, getAdminCookieName } from '@/lib/auth/admin-session';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password)
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });

  const db = createSupabaseAdminClient();
  const { data: admin } = await db
    .from('admin_accounts')
    .select('id, email, password_hash, is_temp_password')
    .eq('email', email.trim().toLowerCase())
    .single();

  if (!admin || !verifyPassword(password, admin.password_hash))
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

  const isTempPassword = admin.is_temp_password ?? false;

  const token = signAdminSession({
    adminId:        admin.id,
    email:          admin.email,
    isTempPassword,
  });

  const redirectTo = isTempPassword ? '/admin/change-password' : '/admin';

  const res = NextResponse.json({ ok: true, redirectTo });
  res.cookies.set(getAdminCookieName(), token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path:     '/',
    maxAge:   60 * 60 * 8,
  });
  return res;
}
