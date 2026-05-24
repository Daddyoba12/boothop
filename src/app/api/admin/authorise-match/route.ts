import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendMatchConfirmedEmail } from '@/lib/email/sendMatchEmail';

// Admin approves or rejects an Africa-outbound match held at awaiting_authorisation.
// Approve → status: matched, match emails sent to both parties (same as normal flow).
// Reject  → status: cancelled, neither party is notified (match silently removed).
//
// Called via email link: GET /api/admin/authorise-match?matchId=X&action=approve&adminKey=Y

async function createActionToken(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  email: string,
  action_type: string,
  entity_id: string,
  payload: object,
  hoursValid = 72,
) {
  const expires_at = new Date(Date.now() + hoursValid * 3_600_000).toISOString();
  const { data } = await supabase
    .from('action_tokens')
    .insert({ email, action_type, entity_id, payload, expires_at })
    .select('token')
    .single();
  return data?.token as string | undefined;
}

export async function GET(request: NextRequest) {
  const url      = new URL(request.url);
  const matchId  = url.searchParams.get('matchId');
  const action   = url.searchParams.get('action'); // 'approve' | 'reject'
  const adminKey = url.searchParams.get('adminKey');

  if (!adminKey || adminKey !== process.env.ADMIN_SECRET) {
    return new NextResponse('Unauthorized.', { status: 401 });
  }
  if (!matchId || !action || !['approve', 'reject'].includes(action)) {
    return new NextResponse('matchId and action (approve|reject) required.', { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  const { data: match } = await supabase
    .from('matches')
    .select(`
      id, status, agreed_price, sender_email, traveler_email,
      sender_trip:sender_trip_id(from_city, to_city, travel_date),
      traveler_trip:traveler_trip_id(from_city, to_city, travel_date)
    `)
    .eq('id', matchId)
    .maybeSingle();

  if (!match) {
    return new NextResponse('Match not found.', { status: 404 });
  }

  if (match.status !== 'awaiting_authorisation') {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';
    return NextResponse.redirect(`${appUrl}/admin/hub?adminKey=${adminKey}&notice=already_processed`);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';

  if (action === 'reject') {
    await supabase
      .from('matches')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancellation_reason: 'Rejected during Africa-outbound authorisation review.' })
      .eq('id', matchId);

    return NextResponse.redirect(`${appUrl}/admin/hub?adminKey=${adminKey}&notice=rejected`);
  }

  // ── APPROVE ──
  await supabase
    .from('matches')
    .update({ status: 'matched' })
    .eq('id', matchId);

  // Resolve trip data (Supabase joins return arrays)
  const senderTripRaw   = Array.isArray(match.sender_trip)   ? match.sender_trip[0]   : match.sender_trip;
  const travelerTripRaw = Array.isArray(match.traveler_trip) ? match.traveler_trip[0] : match.traveler_trip;
  const trip = (senderTripRaw ?? travelerTripRaw) as { from_city: string; to_city: string; travel_date: string } | null;

  if (trip) {
    // Send match confirmed emails to both parties with one-click accept/decline tokens
    const parties: [string, string][] = [
      [match.sender_email,   'sender'],
      [match.traveler_email, 'traveler'],
    ];
    await Promise.allSettled(
      parties
        .filter(([email]) => !!email)
        .map(async ([email, role]) => {
          const [acceptToken, declineToken] = await Promise.all([
            createActionToken(supabase, email, 'confirm_match', matchId, { role }),
            createActionToken(supabase, email, 'decline_match', matchId, { role }),
          ]);
          return sendMatchConfirmedEmail({
            toEmail:    email,
            fromCity:   trip.from_city,
            toCity:     trip.to_city,
            travelDate: trip.travel_date,
            price:      match.agreed_price ?? 0,
            matchId,
            acceptToken,
            declineToken,
          });
        }),
    );
  }

  return NextResponse.redirect(`${appUrl}/admin/hub?adminKey=${adminKey}&notice=approved`);
}

export async function POST(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key');
  if (!adminKey || adminKey !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { matchId, action } = await request.json();
  if (!matchId || !action || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'matchId and action (approve|reject) required.' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  const { data: match } = await supabase
    .from('matches')
    .select(`
      id, status, agreed_price, sender_email, traveler_email,
      sender_trip:sender_trip_id(from_city, to_city, travel_date),
      traveler_trip:traveler_trip_id(from_city, to_city, travel_date)
    `)
    .eq('id', matchId)
    .maybeSingle();

  if (!match) return NextResponse.json({ error: 'Match not found.' }, { status: 404 });
  if (match.status !== 'awaiting_authorisation') {
    return NextResponse.json({ error: 'Match is not awaiting authorisation.', status: match.status });
  }

  if (action === 'reject') {
    await supabase
      .from('matches')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancellation_reason: 'Rejected during Africa-outbound authorisation review.' })
      .eq('id', matchId);
    return NextResponse.json({ ok: true, action: 'rejected' });
  }

  // Approve
  await supabase.from('matches').update({ status: 'matched' }).eq('id', matchId);

  const senderTripRaw   = Array.isArray(match.sender_trip)   ? match.sender_trip[0]   : match.sender_trip;
  const travelerTripRaw = Array.isArray(match.traveler_trip) ? match.traveler_trip[0] : match.traveler_trip;
  const trip = (senderTripRaw ?? travelerTripRaw) as { from_city: string; to_city: string; travel_date: string } | null;

  if (trip) {
    const parties: [string, string][] = [
      [match.sender_email,   'sender'],
      [match.traveler_email, 'traveler'],
    ];
    await Promise.allSettled(
      parties
        .filter(([email]) => !!email)
        .map(async ([email, role]) => {
          const [acceptToken, declineToken] = await Promise.all([
            createActionToken(supabase, email, 'confirm_match', matchId, { role }),
            createActionToken(supabase, email, 'decline_match', matchId, { role }),
          ]);
          return sendMatchConfirmedEmail({
            toEmail:    email,
            fromCity:   trip.from_city,
            toCity:     trip.to_city,
            travelDate: trip.travel_date,
            price:      match.agreed_price ?? 0,
            matchId,
            acceptToken,
            declineToken,
          });
        }),
    );
  }

  return NextResponse.json({ ok: true, action: 'approved' });
}
