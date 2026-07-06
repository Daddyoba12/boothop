import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCommanderSession } from '@/lib/auth/commander';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const store = await cookies();
  const session = getCommanderSession(store);
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const db = createSupabaseAdminClient();
  const { data } = await db
    .from('commander_bakes')
    .select('id, status, created_at')
    .eq('company_slug', session.slug)
    .order('created_at', { ascending: false })
    .limit(8);

  return NextResponse.json(data ?? []);
}
