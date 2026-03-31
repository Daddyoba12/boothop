import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sendMatchNotificationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { matchId } = await request.json();
    const supabase = getSupabaseAdmin();

    const { data: match } = await supabase
      .from('matches')
      .select(`
        *,
        sender_trip:sender_trip_id(*),
        traveler_trip:traveler_trip_id(*)
      `)
      .eq('id', matchId)
      .single();

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const { data: senderUser }   = await supabase.auth.admin.getUserById(match.sender_trip.user_id);
    const { data: travelerUser } = await supabase.auth.admin.getUserById(match.traveler_trip.user_id);

    const route  = `${match.sender_trip.from_city} → ${match.sender_trip.to_city}`;
    const date   = match.sender_trip.travel_date || match.traveler_trip.travel_date;
    const price  = match.agreed_price ? `£${match.agreed_price}` : 'To be agreed';

    const results = await Promise.allSettled([
      senderUser?.user?.email && sendMatchNotificationEmail({
        to:           senderUser.user.email,
        name:         senderUser.user.user_metadata?.full_name || 'there',
        matchedWith:  travelerUser?.user?.user_metadata?.full_name || 'a traveller',
        from:         match.sender_trip.from_city,
        to_location:  match.sender_trip.to_city,
        date,
        price,
        matchId,
      }),
      travelerUser?.user?.email && sendMatchNotificationEmail({
        to:           travelerUser.user.email,
        name:         travelerUser.user.user_metadata?.full_name || 'there',
        matchedWith:  senderUser?.user?.user_metadata?.full_name || 'a sender',
        from:         match.traveler_trip.from_city,
        to_location:  match.traveler_trip.to_city,
        date,
        price,
        matchId,
      }),
    ]);

    const errors = results.filter(r => r.status === 'rejected');
    if (errors.length) console.error('Some match emails failed:', errors);

    return NextResponse.json({ success: true, route });

  } catch (error) {
    console.error('Match email error:', error);
    return NextResponse.json({ error: 'Email sending failed' }, { status: 500 });
  }
}
