import type { BFIProvider } from './interface';
import type { RawFlightOffer, SearchParams } from '../types';
import { buildAviasalesUrl, injectMarker } from '../travelpayouts';

const BASE = 'https://api.tequila.kiwi.com';

export class KiwiProvider implements BFIProvider {
  readonly name = 'kiwi';

  private apiKey(): string {
    const key = process.env.KIWI_API_KEY;
    if (!key) throw new Error('KIWI_API_KEY not set');
    return key;
  }

  async isAvailable(): Promise<boolean> {
    if (!process.env.KIWI_API_KEY) return false;
    try {
      const res = await fetch(`${BASE}/locations/query?term=LHR&locale=en-US&location_types=airport&limit=1`, {
        headers: { apikey: this.apiKey() },
      });
      return res.ok;
    } catch { return false; }
  }

  async search(params: SearchParams): Promise<RawFlightOffer[]> {
    const dateStr = params.departureDate.toLocaleDateString('en-GB').replace(/\//g, '/');
    // Kiwi uses dd/mm/yyyy format
    const d       = params.departureDate;
    const day     = String(d.getDate()).padStart(2, '0');
    const month   = String(d.getMonth() + 1).padStart(2, '0');
    const year    = d.getFullYear();
    const kiwiDate = `${day}/${month}/${year}`;

    const url = new URL(`${BASE}/v2/search`);
    url.searchParams.set('fly_from',    params.origin);
    url.searchParams.set('fly_to',      params.destination);
    url.searchParams.set('date_from',   kiwiDate);
    url.searchParams.set('date_to',     kiwiDate);
    url.searchParams.set('adults',      String(params.adults ?? 1));
    url.searchParams.set('curr',        'GBP');
    url.searchParams.set('limit',       '15');
    url.searchParams.set('sort',        'price');
    url.searchParams.set('partner',     process.env.KIWI_PARTNER_ID ?? 'picky');
    if (params.cabin) url.searchParams.set('selected_cabins', params.cabin.charAt(0));

    const res = await fetch(url.toString(), {
      headers: { apikey: this.apiKey() },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Kiwi search failed ${res.status}: ${body}`);
    }

    const data    = await res.json();
    const offers: RawFlightOffer[] = [];

    for (const item of data.data ?? []) {
      try {
        const route       = item.route as KiwiSegment[];
        const firstSeg    = route[0];
        const lastSeg     = route[route.length - 1];
        const stops       = route.length - 1;
        const primaryAirline = firstSeg.airline ?? item.airlines?.[0] ?? '??';
        // Duration is in seconds
        const travelMins  = Math.round((item.duration?.total ?? 0) / 60);
        const priceGbp    = typeof item.conversion?.GBP === 'number'
          ? item.conversion.GBP
          : item.price;

        // Prefer Kiwi deep link with TravelPayouts marker injected,
        // fall back to Aviasales (also TravelPayouts partner) with our marker.
        const rawDeepLink = item.deep_link
          ?? (item.booking_token
            ? `https://www.kiwi.com/deep?affilid=${process.env.KIWI_PARTNER_ID ?? 'picky'}&booking_token=${item.booking_token}`
            : null);
        const bookingUrl = rawDeepLink
          ? injectMarker(rawDeepLink)
          : buildAviasalesUrl(params.origin, params.destination, params.departureDate);

        offers.push({
          origin:           firstSeg.flyFrom,
          destination:      lastSeg.flyTo,
          airlineCode:      primaryAirline,
          airlineName:      AIRLINE_NAMES[primaryAirline] ?? primaryAirline,
          flightNumber:     `${primaryAirline}${firstSeg.flight_no}`,
          departureAt:      new Date(firstSeg.local_departure),
          arrivalAt:        new Date(lastSeg.local_arrival),
          travelTimeMins:   travelMins,
          stops,
          priceGbp,
          cabin:            params.cabin ?? 'ECONOMY',
          baggageIncluded:  item.bags_price?.['1'] === 0,
          cabinBagIncluded: true,
          refundable:       false,
          availableSeats:   item.availability?.seats ?? undefined,
          bookingUrl,
        });
      } catch {
        // Skip malformed item
      }
    }

    return offers;
  }
}

interface KiwiSegment {
  airline:         string;
  flight_no:       number;
  flyFrom:         string;
  flyTo:           string;
  local_departure: string;
  local_arrival:   string;
}

// Common airlines on Lagos/Kigali routes — Kiwi returns codes, we map to names
const AIRLINE_NAMES: Record<string, string> = {
  BA:  'British Airways',
  VS:  'Virgin Atlantic',
  TK:  'Turkish Airlines',
  AT:  'Royal Air Maroc',
  QR:  'Qatar Airways',
  ET:  'Ethiopian Airlines',
  MS:  'EgyptAir',
  WB:  'RwandAir',
  KQ:  'Kenya Airways',
  LH:  'Lufthansa',
  AF:  'Air France',
  KL:  'KLM',
  P4:  'Air Peace',
  WT:  'Nigerian Eagle Airlines',
  DN:  'Dana Air',
  '9J': 'Air Nigeria',
  EK:  'Emirates',
  EY:  'Etihad Airways',
};
