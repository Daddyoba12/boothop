import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBizSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const cookieStore = await cookies();
  const session     = getBizSession(cookieStore);

  if (!session?.email) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from('business_jobs')
    .select('id, job_ref, company_name, pickup, dropoff, status, urgency, estimated_price, driver_name, driver_phone, assigned_at, picked_up_at, delivered_at, created_at')
    .eq('email', session.email)
    .order('created_at', { ascending: false });

  return NextResponse.json({ jobs: data ?? [] });
}
