import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getBizSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session     = getBizSession(cookieStore);
    if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });

    const supabase = createSupabaseAdminClient();

    // Get company name from most recent job
    const { data: jobs } = await supabase
      .from('business_jobs')
      .select('company_name')
      .eq('email', session.email)
      .order('created_at', { ascending: false })
      .limit(1);

    const companyName = (Array.isArray(jobs) ? jobs[0] : jobs)?.company_name ?? null;

    // Get priority partner record
    const { data: partners } = await supabase
      .from('priority_partners')
      .select('tier, status, discount_pct, response_hours')
      .eq('email', session.email)
      .limit(1);

    const partner = Array.isArray(partners) ? partners[0] : partners;

    return NextResponse.json({
      authenticated:          true,
      email:                  session.email,
      company_name:           companyName,
      partner_tier:           partner?.tier           ?? null,
      partner_status:         partner?.status         ?? null,
      partner_discount:       partner?.discount_pct   ?? null,
      partner_response_hours: partner?.response_hours ?? null,
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
