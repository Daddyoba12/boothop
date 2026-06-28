import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { recordClick, detectDevice, detectBrowser } from '@/lib/bfi/clicks';

// GET /api/bfi/go?offer=<offerId>&session=<sessionId>
// Records the click and redirects to the booking URL.
export async function GET(request: Request) {
  const url       = new URL(request.url);
  const offerId   = url.searchParams.get('offer');
  const sessionId = url.searchParams.get('session') ?? null;
  const referrer  = request.headers.get('referer') ?? null;
  const ua        = request.headers.get('user-agent') ?? '';
  const utmSource = url.searchParams.get('utm_source')   ?? null;
  const utmMedium = url.searchParams.get('utm_medium')   ?? null;
  const utmCampaign = url.searchParams.get('utm_campaign') ?? null;

  if (!offerId) return NextResponse.redirect(new URL('/', request.url));

  const db = createSupabaseAdminClient();
  const { data: offer } = await db
    .from('bfi_flight_offers')
    .select('id, route_id, origin, destination, airline_code, airline_name, price_gbp, provider, booking_url')
    .eq('id', offerId)
    .single();

  const bookingUrl = offer?.booking_url ?? `https://www.google.com/flights`;

  if (offer) {
    // Fire-and-forget — don't block the redirect
    recordClick({
      offerId:        offer.id,
      routeId:        offer.route_id,
      origin:         offer.origin,
      destination:    offer.destination,
      airlineCode:    offer.airline_code,
      airlineName:    offer.airline_name,
      priceGbp:       offer.price_gbp,
      provider:       offer.provider,
      destinationUrl: bookingUrl,
      sessionId,
      userId:         null,
      device:         detectDevice(ua),
      browser:        detectBrowser(ua),
      ipCountry:      null,  // Sprint 3: geo-IP lookup
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
    }).catch(() => {});
  }

  return NextResponse.redirect(bookingUrl, { status: 302 });
}
