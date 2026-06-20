import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const ACTIONABLE = ['awaiting_authorisation', 'payment_processing', 'delivery_confirmed', 'cancellation_requested', 'disputed'];

export async function GET() {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const supabase = createSupabaseAdminClient();

  const { data: matches } = await supabase
    .from('matches')
    .select('id, status, sender_email, traveler_email, agreed_price, goods_value, insurance_fee, created_at, sender_trip:sender_trip_id(from_city, to_city, travel_date)')
    .in('status', ACTIONABLE)
    .order('created_at', { ascending: false })
    .limit(200);

  return NextResponse.json({ matches: matches ?? [] });
}
