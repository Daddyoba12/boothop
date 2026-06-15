import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendMatchConfirmedEmail } from '@/lib/email/sendMatchEmail';
import { Resend } from 'resend';
import { isAfricanCity } from '@/lib/africanCities';

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

/** Prefer the English translation if available, otherwise use the original */
function cityEn(trip: any, field: 'from_city' | 'to_city'): string {
  const enField = field === 'from_city' ? 'from_city_en' : 'to_city_en';
  return trip[enField] || trip[field] || '';
}

function calcScore(send: any, travel: any): number {
  let score = 0;
  if (normalizeCity(cityEn(send, 'from_city')) === normalizeCity(cityEn(travel, 'from_city')) &&
      normalizeCity(cityEn(send, 'to_city'))   === normalizeCity(cityEn(travel, 'to_city'))) {
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

function isAuthorized(request: Request): boolean {
  const auth     = request.headers.get('authorization');
  const adminKey = request.headers.get('x-admin-key');
  return (
    auth === `Bearer ${process.env.CRON_SECRET}` ||
    adminKey === process.env.ADMIN_SECRET
  );
}

/* POST — manual trigger via admin key (for testing) */
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return runAutoMatch();
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return runAutoMatch();
}

async function runAutoMatch() {

  const supabase = createSupabaseAdminClient();

  // Only match trips from tomorrow onwards — same-day bookings give zero time to coordinate
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  /* Fetch all future trips — active or NULL status (old trips before status field existed).
     .not('in') silently drops NULLs in PostgreSQL so we use .or() instead. */
  const [{ data: senders, error: sendErr }, { data: travellers, error: travErr }] = await Promise.all([
    supabase.from('trips').select('*').eq('type', 'send').or('status.eq.active,status.is.null').gte('travel_date', tomorrowStr),
    supabase.from('trips').select('*').eq('type', 'travel').or('status.eq.active,status.is.null').gte('travel_date', tomorrowStr),
  ]);

  if (sendErr || travErr) {
    return NextResponse.json({ ok: false, error: sendErr?.message ?? travErr?.message });
  }

  if (!senders?.length || !travellers?.length) {
    return NextResponse.json({
      ok: true, matched: 0, message: 'Not enough trips to match.',
      debug: {
        senders:    senders?.length ?? 0,
        travellers: travellers?.length ?? 0,
        senderCities:    senders?.map(s => `${s.from_city} → ${s.to_city} (${s.travel_date}) status:${s.status}`),
        travellerCities: travellers?.map(t => `${t.from_city} → ${t.to_city} (${t.travel_date}) status:${t.status}`),
      },
    });
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
      // Threshold 50 = route match only (cities). Date/price add bonus points.
      if (score < 50) {
        skipped.push({ reason: 'low_score', score, sendFrom: normalizeCity(cityEn(send,'from_city')), sendTo: normalizeCity(cityEn(send,'to_city')), travelFrom: normalizeCity(cityEn(travel,'from_city')), travelTo: normalizeCity(cityEn(travel,'to_city')) });
        continue;
      }

      const agreedPrice = (send.price && travel.price)
        ? Math.round(((send.price + travel.price) / 2) * 100) / 100
        : send.price ?? travel.price ?? null;

      // Africa-outbound trips require manual admin authorisation before the
      // match is surfaced to either party.
      const originCity      = cityEn(send, 'from_city');
      const isAfricaOutbound = isAfricanCity(originCity);
      const initialStatus   = isAfricaOutbound ? 'awaiting_authorisation' : 'matched';

      const { data: matchRecord, error: matchErr } = await supabase
        .from('matches')
        .insert({
          sender_trip_id:   send.id,
          traveler_trip_id: travel.id,
          sender_email:     send.email    ?? null,
          traveler_email:   travel.email  ?? null,
          sender_user_id:   send.user_id  ?? null,
          traveler_user_id: travel.user_id ?? null,
          status:           initialStatus,
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
      alreadyMatched.add(pairKey);

      // Lock both trips so no one else can match with them while this is pending
      await Promise.all([
        supabase.from('trips').update({ status: 'pending' }).eq('id', send.id),
        supabase.from('trips').update({ status: 'pending' }).eq('id', travel.id),
      ]);

      if (isAfricaOutbound) {
        // ── Africa-outbound: email admin only, hold match for authorisation ──
        const resend   = new Resend(process.env.RESEND_API_KEY);
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@boothop.com';
        const appUrl     = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';

        // Use single-use action tokens instead of exposing ADMIN_SECRET in emails
        const tokenExpiry = new Date(Date.now() + 7 * 24 * 3_600_000).toISOString();
        const [approveTokenRow, rejectTokenRow] = await Promise.all([
          supabase.from('action_tokens').insert({ email: adminEmail, action_type: 'admin_approve_match', entity_id: matchRecord.id, payload: { action: 'approve' }, expires_at: tokenExpiry }).select('token').single(),
          supabase.from('action_tokens').insert({ email: adminEmail, action_type: 'admin_reject_match',  entity_id: matchRecord.id, payload: { action: 'reject'  }, expires_at: tokenExpiry }).select('token').single(),
        ]);
        const approveUrl = `${appUrl}/api/admin/authorise-match?matchId=${matchRecord.id}&action=approve&token=${approveTokenRow.data?.token ?? ''}`;
        const rejectUrl  = `${appUrl}/api/admin/authorise-match?matchId=${matchRecord.id}&action=reject&token=${rejectTokenRow.data?.token ?? ''}`;

        await resend.emails.send({
          from:    process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>',
          to:      adminEmail,
          subject: `[Auth required] Africa-outbound match — ${send.from_city} → ${send.to_city}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;padding:32px 24px;color:#0f172a;">
              <div style="margin-bottom:20px;">
                <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
              </div>
              <h2 style="margin:0 0 6px;font-size:20px;font-weight:700;">🌍 Africa-outbound match pending authorisation</h2>
              <p style="font-size:14px;color:#64748b;margin:0 0 20px;">A new match has been found for a trip originating in Africa. Review the details below and approve or reject before the parties are notified.</p>
              <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
                <tr><td style="padding:8px 0;color:#64748b;width:40%;">Match ID</td><td style="padding:8px 0;color:#0f172a;font-weight:600;">${matchRecord.id}</td></tr>
                <tr><td style="padding:8px 0;color:#64748b;">Route</td><td style="padding:8px 0;color:#0f172a;font-weight:600;">${send.from_city} → ${send.to_city}</td></tr>
                <tr><td style="padding:8px 0;color:#64748b;">Travel date</td><td style="padding:8px 0;color:#0f172a;">${send.travel_date}</td></tr>
                <tr><td style="padding:8px 0;color:#64748b;">Sender</td><td style="padding:8px 0;color:#0f172a;">${send.email ?? '—'}</td></tr>
                <tr><td style="padding:8px 0;color:#64748b;">Carrier</td><td style="padding:8px 0;color:#0f172a;">${travel.email ?? '—'}</td></tr>
                <tr><td style="padding:8px 0;color:#64748b;">Agreed price</td><td style="padding:8px 0;color:#0f172a;font-weight:600;">£${agreedPrice ?? '—'}</td></tr>
                <tr><td style="padding:8px 0;color:#64748b;">Match score</td><td style="padding:8px 0;color:#0f172a;">${score}</td></tr>
              </table>
              <div style="display:flex;gap:12px;">
                <a href="${approveUrl}" style="display:inline-block;background:#16a34a;color:#fff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;margin-right:12px;">
                  ✅ Approve match
                </a>
                <a href="${rejectUrl}" style="display:inline-block;background:#dc2626;color:#fff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;">
                  ❌ Reject match
                </a>
              </div>
              <p style="font-size:12px;color:#94a3b8;margin-top:20px;">Neither party has been notified yet. They will only receive an email after you approve.</p>
            </div>
          `,
          text: `Africa-outbound match pending authorisation.\nRoute: ${send.from_city} → ${send.to_city}\nDate: ${send.travel_date}\nSender: ${send.email}\nCarrier: ${travel.email}\nPrice: £${agreedPrice}\n\nApprove: ${approveUrl}\nReject: ${rejectUrl}`,
        }).catch(e => console.error('auto-match admin auth email failed', e));

      } else {
        // ── Standard match: notify both parties immediately ──
        const emailPromises = [];
        for (const [email, role] of [[send.email, 'sender'], [travel.email, 'traveler']] as [string, string][]) {
          if (!email) continue;
          const [acceptToken, declineToken] = await Promise.all([
            createActionToken(supabase, email, 'confirm_match', matchRecord.id, { role }),
            createActionToken(supabase, email, 'decline_match', matchRecord.id, { role }),
          ]);
          emailPromises.push(
            sendMatchConfirmedEmail({
              toEmail:    email,
              fromCity:   send.from_city,
              toCity:     send.to_city,
              travelDate: send.travel_date,
              price:      agreedPrice ?? 0,
              matchId:    matchRecord.id,
              acceptToken,
              declineToken,
            }),
          );
        }
        await Promise.allSettled(emailPromises);
      }
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
        createActionToken(supabase, email, 'confirm_match', orphan.id, { role }),
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

  // Split created into normal vs awaiting_authorisation for summary
  const { data: createdMatches } = await supabase
    .from('matches').select('id, status').in('id', created);
  const awaitingAuth = (createdMatches ?? []).filter(m => m.status === 'awaiting_authorisation').map(m => m.id);
  const normalMatched = created.filter(id => !awaitingAuth.includes(id));

  return NextResponse.json({
    ok: true,
    matched: normalMatched.length,
    awaiting_authorisation: awaitingAuth.length,
    matchIds: normalMatched,
    awaitingIds: awaitingAuth,
    notified,
    skipped,
    debug: {
      senders:    senders.length,
      travellers: travellers.length,
      senderCities:    senders.map(s => `${s.from_city} → ${s.to_city} (${s.travel_date}) status:${s.status}`),
      travellerCities: travellers.map(t => `${t.from_city} → ${t.to_city} (${t.travel_date}) status:${t.status}`),
    },
  });
}
