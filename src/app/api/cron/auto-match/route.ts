import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendMatchConfirmedEmail } from '@/lib/email/sendMatchEmail';

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

/* ── Haversine distance in miles ── */
function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function geocode(city: string): Promise<{ lat: number; lng: number } | null> {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  try {
    const res  = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${key}`);
    const json = await res.json();
    const loc  = json.results?.[0]?.geometry?.location;
    return loc ? { lat: loc.lat, lng: loc.lng } : null;
  } catch { return null; }
}

async function withinPickupRange(city1: string, city2: string): Promise<boolean> {
  const [c1, c2] = await Promise.all([geocode(city1), geocode(city2)]);
  if (!c1 || !c2) return true; // let through if geocoding unavailable
  return haversineMiles(c1.lat, c1.lng, c2.lat, c2.lng) <= 20;
}

/** Strip country suffix so "London, UK" and "London" both normalise to "london" */
function normalizeCity(city: string): string {
  return (city ?? '').toLowerCase().split(',')[0].trim();
}

function calcScore(send: any, travel: any): number {
  let score = 0;
  if (normalizeCity(send.from_city) === normalizeCity(travel.from_city) &&
      normalizeCity(send.to_city)   === normalizeCity(travel.to_city)) {
    score += 50;
  }
  const daysDiff = Math.abs(
    (new Date(send.travel_date).getTime() - new Date(travel.travel_date).getTime()) / 86400000
  );
  if (daysDiff === 0)      score += 30;
  else if (daysDiff <= 1)  score += 20;
  else if (daysDiff <= 3)  score += 10;
  if (send.price && travel.price) {
    const diff = Math.abs(send.price - travel.price) / Math.max(send.price, travel.price);
    if (diff <= 0.2) score += 20;
  }
  return score;
}

export async function GET(request: Request) {
  /* Verify cron secret — Vercel sends Authorization: Bearer <CRON_SECRET> */
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const today    = new Date().toISOString().split('T')[0];

  /* Fetch all future active trips only */
  const [{ data: senders }, { data: travellers }] = await Promise.all([
    supabase.from('trips').select('*').eq('type', 'send').eq('status', 'active').gte('travel_date', today),
    supabase.from('trips').select('*').eq('type', 'travel').eq('status', 'active').gte('travel_date', today),
  ]);

  if (!senders?.length || !travellers?.length) {
    return NextResponse.json({ ok: true, matched: 0, message: 'Not enough trips to match.', debug: { senders: senders?.length ?? 0, travellers: travellers?.length ?? 0 } });
  }

  /* Fetch existing matches to avoid duplicates */
  const { data: existingMatches } = await supabase
    .from('matches')
    .select('sender_trip_id, traveler_trip_id');

  const alreadyMatched = new Set<string>(
    (existingMatches ?? []).map((m: any) => `${m.sender_trip_id}__${m.traveler_trip_id}`)
  );

  const created: string[] = [];
  const skipped: object[] = [];

  for (const send of senders) {
    for (const travel of travellers) {
      const pairKey = `${send.id}__${travel.id}`;
      if (alreadyMatched.has(pairKey)) {
        skipped.push({ reason: 'already_matched', send: send.from_city, travel: travel.from_city });
        continue;
      }

      const score = calcScore(send, travel);
      if (score < 60) {
        skipped.push({ reason: 'low_score', score, sendFrom: normalizeCity(send.from_city), sendTo: normalizeCity(send.to_city), travelFrom: normalizeCity(travel.from_city), travelTo: normalizeCity(travel.to_city) });
        continue;
      }

      const inRange = await withinPickupRange(normalizeCity(send.from_city), normalizeCity(travel.from_city));
      if (!inRange) {
        skipped.push({ reason: 'out_of_range', sendFrom: normalizeCity(send.from_city), travelFrom: normalizeCity(travel.from_city) });
        continue;
      }

      const agreedPrice = (send.price && travel.price)
        ? Math.round(((send.price + travel.price) / 2) * 100) / 100
        : send.price ?? travel.price ?? null;

      const { data: matchRecord, error: matchErr } = await supabase
        .from('matches')
        .insert({
          sender_trip_id:   send.id,
          traveler_trip_id: travel.id,
          sender_email:     send.email    ?? null,
          traveler_email:   travel.email  ?? null,
          sender_user_id:   send.user_id  ?? null,
          traveler_user_id: travel.user_id ?? null,
          status:           'matched',
          agreed_price:     agreedPrice,
          interest_type:    'full_price',
        })
        .select('id')
        .single();

      if (matchErr || !matchRecord) {
        console.error('auto-match insert error', matchErr);
        continue;
      }

      created.push(matchRecord.id);
      alreadyMatched.add(pairKey); // prevent double-matching in same run

      /* Create one-click accept/decline tokens for each party */
      const emailPromises = [];

      for (const [email, role] of [[send.email, 'sender'], [travel.email, 'traveler']] as [string, string][]) {
        if (!email) continue;
        const [acceptToken, declineToken] = await Promise.all([
          createActionToken(supabase, email, 'accept_match', matchRecord.id, { role }),
          createActionToken(supabase, email, 'decline_match', matchRecord.id, { role }),
        ]);
        emailPromises.push(
          sendMatchConfirmedEmail({
            toEmail:     email,
            fromCity:    send.from_city,
            toCity:      send.to_city,
            travelDate:  send.travel_date,
            price:       agreedPrice ?? 0,
            matchId:     matchRecord.id,
            acceptToken,
            declineToken,
          }),
        );
      }
      await Promise.allSettled(emailPromises);
    }
  }

  /* ── Re-notify orphaned matches (matched status but no action tokens yet) ── */
  const { data: orphans } = await supabase
    .from('matches')
    .select(`
      id, sender_email, traveler_email, agreed_price,
      sender_trip:trips!matches_sender_trip_id_fkey(from_city, to_city, travel_date),
      traveler_trip:trips!matches_traveler_trip_id_fkey(from_city, to_city, travel_date)
    `)
    .eq('status', 'matched');

  const notified: string[] = [];

  for (const orphan of orphans ?? []) {
    // Check if action tokens already exist for this match
    const { data: tokens } = await supabase
      .from('action_tokens')
      .select('id')
      .eq('entity_id', orphan.id)
      .limit(1);

    if (tokens?.length) continue; // already has tokens, skip

    const senderTrip   = Array.isArray(orphan.sender_trip)   ? orphan.sender_trip[0]   : orphan.sender_trip;
    const travelerTrip = Array.isArray(orphan.traveler_trip) ? orphan.traveler_trip[0] : orphan.traveler_trip;
    const trip         = senderTrip ?? travelerTrip;
    if (!trip) continue;

    const emailPromises = [];
    for (const [email, role] of [[orphan.sender_email, 'sender'], [orphan.traveler_email, 'traveler']] as [string, string][]) {
      if (!email) continue;
      const [acceptToken, declineToken] = await Promise.all([
        createActionToken(supabase, email, 'accept_match', orphan.id, { role }),
        createActionToken(supabase, email, 'decline_match', orphan.id, { role }),
      ]);
      emailPromises.push(
        sendMatchConfirmedEmail({
          toEmail:      email,
          fromCity:     trip.from_city,
          toCity:       trip.to_city,
          travelDate:   trip.travel_date,
          price:        orphan.agreed_price ?? 0,
          matchId:      orphan.id,
          acceptToken,
          declineToken,
        }),
      );
    }
    await Promise.allSettled(emailPromises);
    notified.push(orphan.id);
  }

  return NextResponse.json({ ok: true, matched: created.length, matchIds: created, notified, skipped });
}
