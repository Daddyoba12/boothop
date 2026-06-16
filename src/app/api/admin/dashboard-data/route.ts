import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAppSession } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const ADMIN_EMAILS = [
  'daddyoba12@gmail.com',
  ...(process.env.ADMIN_EMAILS ?? 'info@boothop.com').split(',').map(e => e.trim()).filter(Boolean),
];

export async function GET() {
  const cookieStore = await cookies();
  const session = getAppSession(cookieStore);

  if (!session || !ADMIN_EMAILS.includes(session.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();

  const [usersRes, matchesRes, escrowRes, disputesRes] = await Promise.all([
    supabase
      .from('trips')
      .select('id, email, from_city, to_city, travel_date, type, status, created_at, weight')
      .order('created_at', { ascending: false }),

    supabase
      .from('matches')
      .select(`*, sender_trip:sender_trip_id(from_city, to_city, travel_date, user_id), traveler_trip:traveler_trip_id(from_city, to_city, travel_date, user_id)`)
      .order('created_at', { ascending: false }),

    supabase
      .from('matches')
      .select('*')
      .eq('payment_status', 'escrowed'),

    supabase
      .from('disputes')
      .select('*')
      .order('created_at', { ascending: false }),
  ]);

  return NextResponse.json({
    users:    usersRes.data   || [],
    matches:  matchesRes.data || [],
    escrow:   escrowRes.data  || [],
    disputes: disputesRes.data || [],
  });
}
