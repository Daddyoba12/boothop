import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createSupabaseAdminClient();

  const [usersRes, matchesRes, escrowRes, disputesRes] = await Promise.all([
    supabase
      .from('trips')
      .select('*')
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
