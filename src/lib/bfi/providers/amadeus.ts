import type { BFIProvider } from './interface';
import type { RawFlightOffer, SearchParams } from '../types';
import { buildAviasalesUrl } from '../travelpayouts';

// Module-level token cache — survives across warm serverless invocations
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

function baseUrl() {
  return process.env.AMADEUS_ENV === 'production'
    ? 'https://api.amadeus.com'
    : 'https://test.api.amadeus.com';
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) return cachedToken;

  const res = await fetch(`${baseUrl()}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'client_credentials',
      client_id:     process.env.AMADEUS_CLIENT_ID     ?? '',
      client_secret: process.env.AMADEUS_CLIENT_SECRET ?? '',
    }),
  });

  if (!res.ok) throw new Error(`Amadeus auth failed: ${res.status}`);
  const data = await res.json();
  cachedToken    = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;
  return cachedToken!;
}

// PT8H40M → 520 minutes
function parseDurationMins(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return 0;
  return (parseInt(m[1] ?? '0') * 60) + parseInt(m[2] ?? '0');
}

export class AmadeusProvider implements BFIProvider {
  readonly name = 'amadeus';

  async isAvailable(): Promise<boolean> {
    if (!process.env.AMADEUS_CLIENT_ID || !process.env.AMADEUS_CLIENT_SECRET) return false;
    try { await getAccessToken(); return true; }
    catch { return false; }
  }

  async search(params: SearchParams): Promise<RawFlightOffer[]> {
    const token   = await getAccessToken();
    const dateStr = params.departureDate.toISOString().split('T')[0];

    const url = new URL(`${baseUrl()}/v2/shopping/flight-offers`);
    url.searchParams.set('originLocationCode',      params.origin);
    url.searchParams.set('destinationLocationCode', params.destination);
    url.searchParams.set('departureDate',           dateStr);
    url.searchParams.set('adults',                  String(params.adults ?? 1));
    url.searchParams.set('currencyCode',            'GBP');
    url.searchParams.set('max',                     '10');
    if (params.cabin) url.searchParams.set('travelClass', params.cabin);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Amadeus search failed ${res.status}: ${body}`);
    }

    const data   = await res.json();
    const offers: RawFlightOffer[] = [];

    for (const offer of data.data ?? []) {
      try {
        const itinerary  = offer.itineraries[0];
        const segments   = itinerary.segments;
        const firstSeg   = segments[0];
        const lastSeg    = segments[segments.length - 1];
        const pricing    = offer.travelerPricings[0];
        const priceGbp   = parseFloat(offer.price.grandTotal ?? offer.price.total ?? '0');
        const carrier    = firstSeg.carrierCode ?? firstSeg.operating?.carrierCode ?? '??';
        const carrierName: string = data.dictionaries?.carriers?.[carrier] ?? carrier;
        const fareDetail = pricing.fareDetailsBySegment?.[0];
        const cabin      = fareDetail?.cabin ?? params.cabin ?? 'ECONOMY';
        const includedBags = pricing.fareDetailsBySegment?.some(
          (s: { includedCheckedBags?: { quantity?: number } }) => (s.includedCheckedBags?.quantity ?? 0) > 0
        ) ?? false;

        offers.push({
          origin:           firstSeg.departure.iataCode,
          destination:      lastSeg.arrival.iataCode,
          airlineCode:      carrier,
          airlineName:      carrierName,
          flightNumber:     `${carrier}${firstSeg.number}`,
          departureAt:      new Date(firstSeg.departure.at),
          arrivalAt:        new Date(lastSeg.arrival.at),
          travelTimeMins:   parseDurationMins(itinerary.duration),
          stops:            segments.length - 1,
          priceGbp,
          cabin,
          baggageIncluded:  includedBags,
          cabinBagIncluded: true,
          fareClass:        fareDetail?.class ?? undefined,
          refundable:       offer.pricingOptions?.refundableFare ?? false,
          availableSeats:   offer.numberOfBookableSeats ?? undefined,
          bookingUrl:       buildAviasalesUrl(params.origin, params.destination, new Date(firstSeg.departure.at)),
        });
      } catch {
        // Skip malformed offer
      }
    }

    return offers;
  }
}
