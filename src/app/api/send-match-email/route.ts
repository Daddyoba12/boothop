import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: Request) {
  try {
    const { matchId } = await request.json();

    // Get match details
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

    // Get user emails
    const { data: senderUser } = await supabase.auth.admin.getUserById(match.sender_trip.user_id);
    const { data: travelerUser } = await supabase.auth.admin.getUserById(match.traveler_trip.user_id);

    // TODO: Integrate with Resend, SendGrid, or Supabase Edge Functions
    // For now, we'll use Supabase's built-in email (you can enhance this)
    
    const emailContent = {
      sender: {
        to: senderUser?.user?.email,
        subject: '🎉 You\'ve Been Matched on BootHop!',
        body: `
          <h1>Great news!</h1>
          <p>A traveler heading from ${match.traveler_trip.from_city} to ${match.traveler_trip.to_city} on ${match.traveler_trip.travel_date} can carry your package.</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/matches/${matchId}">View Match Details</a></p>
        `
      },
      traveler: {
        to: travelerUser?.user?.email,
        subject: '💰 New Delivery Opportunity on BootHop!',
        body: `
          <h1>Earn while you travel!</h1>
          <p>Someone needs a package delivered from ${match.sender_trip.from_city} to ${match.sender_trip.to_city} on ${match.sender_trip.travel_date}.</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/matches/${matchId}">View Match Details</a></p>
        `
      }
    };

    console.log('Emails to send:', emailContent);

    return NextResponse.json({ success: true, emailContent });

  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json({ error: 'Email sending failed' }, { status: 500 });
  }
}
