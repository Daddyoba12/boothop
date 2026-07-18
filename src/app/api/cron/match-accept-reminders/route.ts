import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendMatchReminderEmail } from '@/lib/email/sendMatchEmail';
import { sendPushToEmail } from '@/lib/services/notifications';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';

async function createToken(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  email: string,
  actionType: string,
  matchId: string,
  role: string,
  expiresAt: string,
): Promise<string | undefined> {
  const { data } = await supabase
    .from('action_tokens')
    .insert({ email, action_type: actionType, entity_id: matchId, payload: { role }, expires_at: expiresAt })
    .select('token')
    .single();
  return data?.token as string | undefined;
}

// Runs every 4 hours. For every match still in 'matched' status (travel date not yet passed),
// re-sends the accept/decline email and a push notification to any party who hasn't yet responded.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const now      = new Date();
  const today    = now.toISOString().split('T')[0];
  const nowIso   = now.toISOString();

  // All matches still awaiting acceptance where the travel date hasn't passed yet
  const { data: pendingMatches } = await supabase
    .from('matches')
    .select(`
      id, sender_email, traveler_email, agreed_price,
      sender_trip:trips!matches_sender_trip_id_fkey(from_city, to_city, travel_date),
      traveler_trip:trips!matches_traveler_trip_id_fkey(from_city, to_city, travel_date)
    `)
    .eq('status', 'matched');

  // Filter to matches whose travel date is today or in the future
  const active = (pendingMatches ?? []).filter((m: any) => {
    const trip = Array.isArray(m.sender_trip) ? m.sender_trip[0] : m.sender_trip;
    return trip?.travel_date && trip.travel_date >= today;
  });

  if (!active.length) return NextResponse.json({ reminded: 0 });

  let reminded = 0;

  for (const match of active) {
    const senderTrip = Array.isArray(match.sender_trip) ? match.sender_trip[0] : match.sender_trip;
    const trip = senderTrip ?? (Array.isArray(match.traveler_trip) ? match.traveler_trip[0] : match.traveler_trip);
    if (!trip?.travel_date) continue;

    // Expire tokens at midnight on the travel date (the latest they're useful)
    const travelDateMidnight = new Date(trip.travel_date + 'T23:59:59').toISOString();

    const travelMs = new Date(trip.travel_date + 'T00:00:00').getTime();
    const hoursUntilTravel = Math.max(0, (travelMs - now.getTime()) / 3_600_000);

    const parties: Array<{ email: string; role: 'sender' | 'traveler' }> = [
      { email: match.sender_email,   role: 'sender'   },
      { email: match.traveler_email, role: 'traveler' },
    ].filter(p => !!p.email) as Array<{ email: string; role: 'sender' | 'traveler' }>;

    for (const party of parties) {
      // Fetch all action tokens for this party+match
      const { data: allTokens } = await supabase
        .from('action_tokens')
        .select('id, token, action_type, used, used_at, expires_at, created_at')
        .eq('entity_id', match.id)
        .eq('email', party.email)
        .in('action_type', ['confirm_match', 'decline_match'])
        .order('created_at', { ascending: false });

      // Skip if the party already clicked accept or decline
      if (allTokens?.some((t: any) => t.used)) continue;

      // Skip if we notified this party very recently (< 4 hours ago based on newest token creation)
      const mostRecentCreated = allTokens?.[0]?.created_at
        ? new Date(allTokens[0].created_at).getTime()
        : 0;
      const fourHoursAgo = now.getTime() - 4 * 3_600_000;
      if (mostRecentCreated > fourHoursAgo) continue;

      // Reuse existing valid tokens or create new ones
      let acceptToken  = allTokens?.find((t: any) => t.action_type === 'confirm_match' && !t.used && t.expires_at > nowIso)?.token as string | undefined;
      let declineToken = allTokens?.find((t: any) => t.action_type === 'decline_match' && !t.used && t.expires_at > nowIso)?.token as string | undefined;

      if (!acceptToken) {
        acceptToken = await createToken(supabase, party.email, 'confirm_match', match.id, party.role, travelDateMidnight);
      }
      if (!declineToken) {
        declineToken = await createToken(supabase, party.email, 'decline_match', match.id, party.role, travelDateMidnight);
      }

      if (!acceptToken || !declineToken) continue;

      const acceptUrl  = `${appUrl}/confirm?token=${acceptToken}`;
      const declineUrl = `${appUrl}/confirm?token=${declineToken}`;

      // Send reminder email
      await sendMatchReminderEmail({
        toEmail:          party.email,
        fromCity:         trip.from_city,
        toCity:           trip.to_city,
        travelDate:       trip.travel_date,
        price:            match.agreed_price ?? 0,
        matchId:          match.id,
        acceptToken,
        declineToken,
        hoursUntilTravel: Math.round(hoursUntilTravel),
      }).catch(e => console.error('match-accept-reminders: email failed', party.email, e));

      // Send push notification
      const urgencyTag = hoursUntilTravel <= 24 ? '🚨 Urgent — ' : '⏰ ';
      await sendPushToEmail(supabase, party.email, {
        title: `${urgencyTag}Match waiting: ${trip.from_city} → ${trip.to_city}`,
        body: hoursUntilTravel <= 24
          ? `Your travel date is almost here! Accept or decline your match now before it expires.`
          : `You have a match for your ${trip.from_city} → ${trip.to_city} trip on ${new Date(trip.travel_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}. Tap to respond.`,
        url: acceptUrl,
      }).catch(() => {});

      reminded++;
    }
  }

  return NextResponse.json({ reminded, checked: active.length });
}
