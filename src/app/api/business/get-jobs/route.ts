import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const url      = new URL(request.url);
  const adminKey = url.searchParams.get('adminKey');

  if (!adminKey || adminKey !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from('business_jobs')
    .select('*')
    .order('created_at', { ascending: false });

  return NextResponse.json({ jobs: data ?? [] });
}
