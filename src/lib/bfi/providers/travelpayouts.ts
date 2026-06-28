import type { BFIProvider } from './interface';
import type { RawFlightOffer, SearchParams } from '../types';
import { buildAviasalesUrl } from '../travelpayouts';

const BASE = 'https://api.travelpayouts.com';

function token(): string {
  return process.env.TRAVELPAYOUTS_TOKEN ?? '';
}

const AIRLINE_NAMES: Record<string, string> = {
  AP: 'Air Peace',          DN: 'Dana Air',           W3: 'Arik Air',
  WB: 'RwandAir',           AT: 'Royal Air Maroc',    TK: 'Turkish Airlines',
  ET: 'Ethiopian Airlines', BA: 'British Airways',    VS: 'Virgin Atlantic',
  KQ: 'Kenya Airways',      MS: 'EgyptAir',           LH: 'Lufthansa',
  AF: 'Air France',         KL: 'KLM',                QR: 'Qatar Airways',
  EK: 'Emirates',           EY: 'Etihad Airways',     LX: 'Swiss',
  OS: 'Austrian Airlines',  AZ: 'ITA Airways',        '9J': 'Air Nigeria',
};

function airlineName(code: string): string {
  return AIRLINE_NAMES[code] ?? code;
}

function toYearMonth(date: Date): string {
  return date.toISOString().slice(0, 7); // "2026-07"
}

// ── BFIProvider: cheapest prices per airline via TravelPayouts Data API ───────

export class TravelPayoutsDataProvider implements BFIProvider {
  readonly name = 'travelpayouts';

  async isAvailable(): Promise<boolean> {
    return !!token();
  }

  async search(params: SearchParams): Promise<RawFlightOffer[]> {
    const t = token();
    if (!t) throw new Error('TRAVELPAYOUTS_TOKEN not set');

    const url = new URL(`${BASE}/v1/prices/cheap`);
    url.searchParams.set('origin',      params.origin);
    url.searchParams.set('destination', params.destination);
    url.searchParams.set('depart_date', toYearMonth(params.departureDate));
    url.searchParams.set('currency',    'gbp');
    url.searchParams.set('token',       t);

    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`TravelPayouts cheap API: ${res.status}`);

    const json = await res.json();
    const data = (json.data?.[params.destination] ?? {}) as Record<string, TpCheapFlight>;

    const offers: RawFlightOffer[] = [];
    for (const [code, flight] of Object.entries(data)) {
      try {
        const depAt = flight.depart_date ? new Date(flight.depart_date) : params.departureDate;
        offers.push({
          origin:           params.origin,
          destination:      params.destination,
          airlineCode:      code,
          airlineName:      airlineName(code),
          flightNumber:     flight.flight_number ? `${code}${flight.flight_number}` : undefined,
          departureAt:      depAt,
          arrivalAt:        depAt, // cheap endpoint doesn't return arrival
          travelTimeMins:   0,
          stops:            flight.number_of_changes ?? 0,
          priceGbp:         Math.round(flight.price ?? 0),
          cabin:            'ECONOMY',
          baggageIncluded:  false,
          cabinBagIncluded: true,
          refundable:       false,
          bookingUrl:       buildAviasalesUrl(params.origin, params.destination, depAt),
        });
      } catch {
        // skip malformed entry
      }
    }

    return offers.sort((a, b) => a.priceGbp - b.priceGbp);
  }
}

// ── Price Calendar — cheapest per day for a given month ───────────────────────

export interface TpCalendarResult {
  calendar:      Record<string, number>; // date → cheapest GBP
  cheapestDate:  string;
  cheapestPrice: number;
  currency:      string;
}

export async function getTpPriceCalendar(
  origin: string,
  destination: string,
  month: string, // "YYYY-MM"
): Promise<TpCalendarResult> {
  const t = token();
  if (!t) throw new Error('TRAVELPAYOUTS_TOKEN not set');

  const url = new URL(`${BASE}/v1/prices/calendar`);
  url.searchParams.set('origin',        origin);
  url.searchParams.set('destination',   destination);
  url.searchParams.set('month',         month);
  url.searchParams.set('currency',      'gbp');
  url.searchParams.set('calendar_type', 'departure_date');
  url.searchParams.set('token',         t);

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`TravelPayouts calendar API: ${res.status}`);

  const json = await res.json();
  const data = (json.data ?? {}) as Record<string, { price: number }>;

  const calendar: Record<string, number> = {};
  let cheapestDate  = '';
  let cheapestPrice = Infinity;

  for (const [date, info] of Object.entries(data)) {
    const price = Math.round(info.price ?? 0);
    calendar[date] = price;
    if (price < cheapestPrice) { cheapestPrice = price; cheapestDate = date; }
  }

  return { calendar, cheapestDate, cheapestPrice, currency: 'GBP' };
}

// ── Cheapest Month — ranked list of months by price ──────────────────────────

export interface TpMonthPrice { month: string; price: number; currency: string }

export async function getTpCheapestMonths(
  origin: string,
  destination: string,
): Promise<TpMonthPrice[]> {
  const t = token();
  if (!t) throw new Error('TRAVELPAYOUTS_TOKEN not set');

  const url = new URL(`${BASE}/v1/prices/monthly`);
  url.searchParams.set('origin',      origin);
  url.searchParams.set('destination', destination);
  url.searchParams.set('currency',    'gbp');
  url.searchParams.set('token',       t);

  const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`TravelPayouts monthly API: ${res.status}`);

  const json = await res.json();
  return ((json.data ?? []) as Array<{ month: string; price: number }>)
    .map(item => ({ month: item.month, price: Math.round(item.price), currency: 'GBP' }))
    .sort((a, b) => a.price - b.price);
}

// ── Internal types ────────────────────────────────────────────────────────────

interface TpCheapFlight {
  price:             number;
  airline:           string;
  flight_number:     number | null;
  departure_at?:     string;
  depart_date?:      string;
  return_date?:      string;
  number_of_changes: number;
  expires_at?:       string;
}
