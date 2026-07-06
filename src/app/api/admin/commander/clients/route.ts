import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from('pipeline_clients')
    .select('id, slug, company, email, plan, status, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ clients: data ?? [] });
}
