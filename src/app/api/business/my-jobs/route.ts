import { NextRequest, NextResponse } from 'next/server';
import { requireBizAuth } from '@/lib/auth/bizAuth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const session = await requireBizAuth(request);
  if (session instanceof NextResponse) return session;

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from('business_jobs')
    .select('id, job_ref, company_name, pickup, dropoff, status, urgency, estimated_price, driver_name, driver_phone, assigned_at, picked_up_at, delivered_at, created_at')
    .eq('email', session.email)
    .order('created_at', { ascending: false });

  return NextResponse.json({ jobs: data ?? [] });
}
