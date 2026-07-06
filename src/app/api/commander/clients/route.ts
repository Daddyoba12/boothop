import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCommanderSession } from '@/lib/auth/commander';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { hashPassword } from '@/lib/auth/commander';

export const dynamic = 'force-dynamic';

async function getSession() {
  const store = await cookies();
  return getCommanderSession(store);
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  if (!session.isSuper) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from('pipeline_clients')
    .select('id, slug, company, email, plan, is_active, is_super_admin, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    (data ?? []).map(c => ({
      name:           c.company,
      slug:           c.slug,
      email:          c.email,
      plan:           c.plan,
      is_active:      c.is_active,
      is_super_admin: c.is_super_admin,
      created_at:     c.created_at,
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  if (!session.isSuper) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { name, slug, email, plan, password } = await req.json();
  if (!name || !slug || !password) {
    return NextResponse.json({ error: 'name, slug and password are required' }, { status: 400 });
  }

  const db = createSupabaseAdminClient();
  const { error } = await db.from('pipeline_clients').insert({
    company:       name,
    slug:          slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
    email:         email || '',
    plan:          plan  || 'basic',
    password_hash: hashPassword(password),
    is_active:     true,
    is_super_admin: false,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
