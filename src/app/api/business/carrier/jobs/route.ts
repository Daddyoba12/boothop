import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getBizSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session     = getBizSession(cookieStore);
    if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

    const supabase = createSupabaseAdminClient();

    const { data: carriers } = await supabase
      .from('carrier_profiles')
      .select('id, status, status_active')
      .eq('email', session.email)
      .limit(1);

    const carrier = Array.isArray(carriers) ? carriers[0] : carriers;
    if (!carrier) return NextResponse.json({ error: 'Not a registered carrier' }, { status: 403 });
    if (carrier.status !== 'active' || !carrier.status_active) {
      return NextResponse.json({ error: 'Carrier profile not yet active' }, { status: 403 });
    }

    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, reference, status, delivery_type, package_size, cargo_description, special_instructions, partner_rate, pickup_address, delivery_address, pickup_contact, delivery_contact, assigned_at, created_at')
      .eq('partner_id', carrier.id)
      .order('assigned_at', { ascending: false });

    return NextResponse.json({ jobs: jobs ?? [] });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
