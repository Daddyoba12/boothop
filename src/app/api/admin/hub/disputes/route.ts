import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const url      = new URL(request.url);
  const adminKey = url.searchParams.get('adminKey');

  if (!adminKey || adminKey !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();

  const { data: disputes } = await supabase
    .from('disputes')
    .select(`
      id, match_id, raised_by, reason, description, status, created_at,
      match:match_id(id, status, sender_email, traveler_email, agreed_price, sender_trip:sender_trip_id(from_city, to_city, travel_date))
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  return NextResponse.json({ disputes: disputes ?? [] });
}
