import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendResendEmail } from '@/lib/resend-client';
import { sendAlternativeJourneysEmail } from '@/lib/email/sendMatchEmail';

const from = process.env.AUTH_FROM_EMAIL || 'BootHop <noreply@boothop.com>';

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

function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Auto-cancels matches stuck at various stages past their deadline.
// Also releases locked trips back to 'active' so other users can match with them.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase  = createSupabaseAdminClient();
    const today     = new Date().toISOString().split('T')[0];
    const cutoff12h = new Date(Date.now() -  12 * 3_600_000).toISOString();
    const cutoff72h = new Date(Date.now() -  72 * 3_600_000).toISOString();
    const cutoff7d  = new Date(Date.now() - 168 * 3_600_000).toISOString();

    // Matches still awaiting acceptance whose travel date has now passed — release the route
    const { data: allMatchedMatches } = await supabase
      .from('matches')
      .select(`id, status, sender_email, traveler_email, sender_trip_id, traveler_trip_id,
        sender_trip:sender_trip_id(from_city, to_city, travel_date, price, auto_created),
        traveler_trip:traveler_trip_id(auto_created)`)
      .eq('status', 'matched');

    const stuckMatched = (allMatchedMatches ?? []).filter((m: any) => {
      const trip = Array.isArray(m.sender_trip) ? m.sender_trip[0] : m.sender_trip;
      return trip?.travel_date && trip.travel_date < today;
    });

    // Matches stuck at 'agreed' or 'committed' for over 12 hours
    const { data: stuckMatches } = await supabase
      .from('matches')
      .select(`id, status, sender_email, traveler_email, sender_trip_id, traveler_trip_id,
        sender_trip:sender_trip_id(from_city, to_city, auto_created),
        traveler_trip:traveler_trip_id(auto_created)`)
      .in('status', ['agreed', 'committed'])
      .lt('created_at', cutoff12h);

    // Matches stuck at 'kyc_pending' for over 72 hours
    const { data: stuckKyc } = await supabase
      .from('matches')
      .select(`id, status, sender_email, traveler_email, sender_trip_id, traveler_trip_id,
        sender_trip:sender_trip_id(from_city, to_city, auto_created),
        traveler_trip:traveler_trip_id(auto_created)`)
      .eq('status', 'kyc_pending')
      .lt('created_at', cutoff72h);

    // Africa-outbound matches held for admin review but never actioned — release after 7 days
    const { data: stuckAuth } = await supabase
      .from('matches')
      .select(`id, status, sender_email, traveler_email, sender_trip_id, traveler_trip_id,
        sender_trip:sender_trip_id(from_city, to_city, auto_created),
        traveler_trip:traveler_trip_id(auto_created)`)
      .eq('status', 'awaiting_authorisation')
      .lt('created_at', cutoff7d);

    const matchedToCancel = stuckMatched ?? [];
    const otherToCancel   = [...(stuckMatches ?? []), ...(stuckKyc ?? []), ...(stuckAuth ?? [])];
    if (!matchedToCancel.length && !otherToCancel.length) return NextResponse.json({ cancelled: 0 });

    let cancelled = 0;
    const nowIso = new Date().toISOString();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.boothop.com';

    // ── Matched cancellations: sender gets alternatives email, traveller gets nothing (ghost) ──
    for (const match of matchedToCancel) {
      const senderTripForReason = Array.isArray(match.sender_trip) ? match.sender_trip[0] : match.sender_trip;
      await supabase.from('matches')
        .update({ status: 'cancelled', cancelled_at: nowIso, cancellation_reason: `Match expired — travel date (${senderTripForReason?.travel_date ?? 'unknown'}) has passed with no response from either party.` })
        .eq('id', match.id);

      const senderTrip   = Array.isArray(match.sender_trip)   ? match.sender_trip[0]   : match.sender_trip;
      const travelerTrip = Array.isArray(match.traveler_trip) ? match.traveler_trip[0] : match.traveler_trip;
      const originalTripId = (senderTrip as any)?.auto_created ? match.traveler_trip_id : match.sender_trip_id;
      const mirrorTripId   = (senderTrip as any)?.auto_created ? match.sender_trip_id
        : (travelerTrip as any)?.auto_created ? match.traveler_trip_id : null;

      await Promise.all([
        originalTripId && supabase.from('trips').update({ status: 'active' }).eq('id', originalTripId),
        mirrorTripId   && supabase.from('trips').delete().eq('id', mirrorTripId).eq('auto_created', true),
      ]);

      // Find alternative traveller trips within ±5 days and 30-mile radius of sender's route
      const alternatives: Array<{ fromCity: string; toCity: string; travelDate: string; price: number | null }> = [];
      if (match.sender_email && senderTrip?.travel_date) {
        try {
          const baseDate  = new Date(senderTrip.travel_date);
          const minDate   = new Date(baseDate.getTime() - 5 * 86_400_000).toISOString().split('T')[0];
          const maxDate   = new Date(baseDate.getTime() + 5 * 86_400_000).toISOString().split('T')[0];

          const { data: candidates } = await supabase
            .from('trips')
            .select('from_city, to_city, travel_date, price')
            .eq('type', 'travel')
            .eq('status', 'active')
            .neq('email', match.traveler_email ?? '')
            .gte('travel_date', minDate)
            .lte('travel_date', maxDate)
            .limit(20);

          const [sFrom, sTo] = await Promise.all([
            geocode(senderTrip.from_city),
            geocode(senderTrip.to_city),
          ]);

          for (const c of candidates ?? []) {
            if (alternatives.length >= 5) break;
            const [cFrom, cTo] = await Promise.all([geocode(c.from_city), geocode(c.to_city)]);
            const fromOk = !sFrom || !cFrom || haversineMiles(sFrom.lat, sFrom.lng, cFrom.lat, cFrom.lng) <= 30;
            const toOk   = !sTo   || !cTo   || haversineMiles(sTo.lat,   sTo.lng,   cTo.lat,   cTo.lng)   <= 30;
            if (fromOk && toOk) {
              alternatives.push({ fromCity: c.from_city, toCity: c.to_city, travelDate: c.travel_date, price: c.price });
            }
          }
        } catch (e) {
          console.error('expire-matches: alternatives lookup failed', e);
        }

        await sendAlternativeJourneysEmail({
          toEmail:      match.sender_email,
          fromCity:     senderTrip.from_city ?? '',
          toCity:       senderTrip.to_city   ?? '',
          travelDate:   senderTrip.travel_date ?? '',
          alternatives,
        }).catch((e) => console.error('expire-matches: alternatives email failed', e));
      }

      cancelled++;
    }

    // ── Other cancellations (agreed/committed/kyc/auth): generic email to both parties ──
    for (const match of otherToCancel) {
      const cancelReason = match.status === 'awaiting_authorisation'
        ? 'Africa-outbound match expired — not authorised within 7 days.'
        : 'Expired — not completed within the required time.';

      await supabase.from('matches')
        .update({ status: 'cancelled', cancelled_at: nowIso, cancellation_reason: cancelReason })
        .eq('id', match.id);

      const senderTrip   = Array.isArray(match.sender_trip)   ? match.sender_trip[0]   : match.sender_trip;
      const travelerTrip = Array.isArray(match.traveler_trip) ? match.traveler_trip[0] : match.traveler_trip;
      const originalTripId = (senderTrip as any)?.auto_created ? match.traveler_trip_id : match.sender_trip_id;
      const mirrorTripId   = (senderTrip as any)?.auto_created ? match.sender_trip_id
        : (travelerTrip as any)?.auto_created ? match.traveler_trip_id : null;

      await Promise.all([
        originalTripId && supabase.from('trips').update({ status: 'active' }).eq('id', originalTripId),
        mirrorTripId   && supabase.from('trips').delete().eq('id', mirrorTripId).eq('auto_created', true),
      ]);

      const trip  = (match as any).sender_trip;
      const route = trip ? `${trip.from_city} → ${trip.to_city}` : 'your delivery';

      const emails = [match.sender_email, match.traveler_email].filter(Boolean);
      await Promise.allSettled(emails.map((email: string) =>
        sendResendEmail({
          from,
          to: email,
          subject: `Match expired — ${route}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;background:#ffffff;">
              <div style="margin-bottom:24px;">
                <span style="font-size:22px;font-weight:900;color:#1e3a8a;">Boot</span><span style="font-size:22px;font-weight:900;color:#2563eb;">Hop</span>
              </div>
              <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">⏰ Your match has expired</h2>
              <p style="font-size:15px;color:#475569;margin:0 0 20px;">
                Unfortunately your <strong>${route}</strong> match was cancelled because the required steps were not completed in time.
              </p>
              <p style="font-size:14px;color:#475569;margin:0 0 24px;">You can post a new trip at any time — we'll find you another match.</p>
              <a href="${appUrl}/dashboard" style="display:inline-block;background:#2563eb;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
                Back to dashboard →
              </a>
            </div>
          `,
          text: `Your BootHop match for ${route} has expired. Visit ${appUrl}/dashboard to post a new trip.`,
        })
      ));

      cancelled++;
    }

    return NextResponse.json({ cancelled });
  } catch (error) {
    console.error('expire-matches cron error:', error);
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}
