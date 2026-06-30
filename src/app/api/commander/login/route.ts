import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { verifyPassword, signCommanderSession, getCommanderCookieName } from '@/lib/auth/commander';

export async function POST(req: NextRequest) {
  const { slug, password } = await req.json();
  if (!slug || !password)
    return NextResponse.json({ error: 'Company ID and password required' }, { status: 400 });

  const db = createSupabaseAdminClient();
  const { data: client } = await db
    .from('pipeline_clients')
    .select('id, slug, company, email, password_hash, status')
    .eq('slug', slug.trim().toLowerCase())
    .single();

  if (!client || !client.password_hash || !verifyPassword(password, client.password_hash))
    return NextResponse.json({ error: 'Wrong Company ID or password' }, { status: 401 });

  if (client.status === 'inactive')
    return NextResponse.json({ error: 'This account has been deactivated. Contact support.' }, { status: 403 });

  const token = signCommanderSession({
    clientId: client.id,
    slug:     client.slug,
    company:  client.company,
    email:    client.email ?? '',
  });

  const res = NextResponse.json({ ok: true, redirectTo: '/commander/dashboard' });
  res.cookies.set(getCommanderCookieName(), token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path:     '/',
    maxAge:   60 * 60 * 24 * 7,
  });
  return res;
}
