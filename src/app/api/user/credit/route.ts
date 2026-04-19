import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAppSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = getAppSession(cookieStore);
    if (!session) return NextResponse.json(null, { status: 401 });

    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from('signup_credits')
      .select('amount_pence, redeemed, claimed_at')
      .eq('email', session.email)
      .maybeSingle();

    return NextResponse.json(data ?? null);
  } catch {
    return NextResponse.json(null);
  }
}
