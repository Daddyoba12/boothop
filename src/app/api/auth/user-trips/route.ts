import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { normalizeEmail } from '@/lib/auth/code';
import { getAppSession } from '@/lib/auth/session';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const session = getAppSession(cookieStore);

    let email: string | null = null;

    if (session) {
      // Authenticated: use session email
      email = normalizeEmail(session.email);
    } else {
      // Pre-login check: accept email from body (login page needs this before OTP is sent)
      const body = await req.json().catch(() => ({}));
      email = body.email ? normalizeEmail(body.email) : null;
    }

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
