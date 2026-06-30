import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { hashPassword, signCommanderSession, getCommanderCookieName } from '@/lib/auth/commander';

export async function POST(req: NextRequest) {
  const { company, slug, email, contact_name, password, plan } = await req.json();

  if (!company || !slug || !password)
    return NextResponse.json({ error: 'Company name, Company ID and password are required' }, { status: 400 });

  if (password.length < 8)
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });

  const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');

  const db = createSupabaseAdminClient();

  // Check slug is not taken
  const { data: existing } = await db
    .from('pipeline_clients')
    .select('id')
    .eq('slug', cleanSlug)
    .single();

  if (existing)
    return NextResponse.json({ error: 'That Company ID is already taken. Try another.' }, { status: 409 });

  const { data: client, error } = await db
    .from('pipeline_clients')
    .insert({
      slug:          cleanSlug,
      company:       company.trim(),
      email:         email?.trim() || null,
      contact_name:  contact_name?.trim() || null,
      plan:          plan ?? 'basic',
      password_hash: hashPassword(password),
      status:        'active',
    })
    .select('id, slug, company, email')
    .single();

  if (error || !client)
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });

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
