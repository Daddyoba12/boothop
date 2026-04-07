import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getAppSession } from '@/lib/auth/session';
import { cookies } from 'next/headers';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const session = getAppSession(cookieStore);
    if (!session?.email) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const matchId = params.id;
    const supabase = createSupabaseAdminClient();

    const { data: match, error } = await supabase
      .from('matches')
      .select(`
        id,
        status,
        sender_email,
        traveler_email,
        agreed_price,
        proposed_price,
        sender_accepted,
        traveler_accepted,
        sender_kyc_status,
        traveler_kyc_status,
        booter_confirmed_delivery,
        hooper_confirmed_receipt,
        booter_confirmed_at,
        hooper_confirmed_at,
        cancelled_by,
        cancellation_reason,
        created_at,
        sender_trip:sender_trip_id(
          id,
          from_city,
          to_city,
          travel_date,
          weight_capacity,
          asking_price
        )
      `)
      .eq('id', matchId)
      .maybeSingle();

    if (error || !match) {
      return NextResponse.json({ error: 'Match not found.' }, { status: 404 });
    }

    const email = session.email;
    const isParticipant = match.sender_email === email || match.traveler_email === email;
    if (!isParticipant) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    // Check if this user has already accepted terms
    const { data: acceptance } = await supabase
      .from('terms_acceptance')
      .select('id, accepted_at')
      .eq('match_id', matchId)
      .eq('email', email)
      .maybeSingle();

    return NextResponse.json({
      match,
      userRole: match.sender_email === email ? 'sender' : 'traveler',
      userEmail: email,
      alreadyAccepted: !!acceptance,
    });

  } catch (error) {
    console.error('matches/[id]/details error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
