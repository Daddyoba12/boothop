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
    const { data: carriers } = await supabase
      .from('carrier_profiles')
      .select('id, company_name, contact_name, status, status_active, base_location, fleet_size, coverage_area')
      .eq('email', session.email)
      .limit(1);

    const carrier = Array.isArray(carriers) ? carriers[0] : carriers;
    if (!carrier) {
      return NextResponse.json({ authenticated: true, registered: false, email: session.email });
    }

    return NextResponse.json({
      authenticated:  true,
      registered:     true,
      email:          session.email,
      carrier_id:     carrier.id,
      company_name:   carrier.company_name,
      contact_name:   carrier.contact_name,
      status:         carrier.status,
      status_active:  carrier.status_active,
      base_location:  carrier.base_location,
      fleet_size:     carrier.fleet_size,
      coverage_area:  carrier.coverage_area,
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
