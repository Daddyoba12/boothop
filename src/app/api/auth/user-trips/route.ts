import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { normalizeEmail } from '@/lib/auth/code';
import { getAppSession } from '@/lib/auth/session';

export async function POST() {
  try {
    // Require authentication — never expose trip data to unauthenticated callers
    const cookieStore = await cookies();
    const session = getAppSession(cookieStore);
    if (!session) {
      return NextResponse.json({ trips: [] }, { status: 401 });
    }

    // Use the session email only — never trust a body-supplied email
    const email = normalizeEmail(session.email);
    if (!email || !email.includes('@')) {
      return NextResponse.json({ trips: [] });
    }

    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from('trips')
      .select('id, type, from_city, to_city, travel_date, weight')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({ trips: data || [] });
  } catch {
    return NextResponse.json({ trips: [] });
  }
}
