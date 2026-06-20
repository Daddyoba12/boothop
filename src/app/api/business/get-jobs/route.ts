import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from('business_jobs')
    .select('*')
    .order('created_at', { ascending: false });

  return NextResponse.json({ jobs: data ?? [] });
}
