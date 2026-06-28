import type { BFIProvider } from './interface';
import type { RawFlightOffer, SearchParams } from '../types';
import { buildAviasalesUrl } from '../travelpayouts';

// Realistic airline options per route corridor
const LONDON_LAGOS_AIRLINES = [
  { code: 'RAM', name: 'Royal Air Maroc',   minGbp: 348, maxGbp: 510, stops: 1, travelMins: 810  },
  { code: 'TK',  name: 'Turkish Airlines',  minGbp: 362, maxGbp: 520, stops: 1, travelMins: 840  },
  { code: 'BA',  name: 'British Airways',   minGbp: 465, maxGbp: 640, stops: 0, travelMins: 390  },
  { code: 'QR',  name: 'Qatar Airways',     minGbp: 410, maxGbp: 580, stops: 1, travelMins: 870  },
  { code: 'ET',  name: 'Ethiopian Airlines',minGbp: 355, maxGbp: 500, stops: 1, travelMins: 900  },
  { code: 'MS',  name: 'EgyptAir',          minGbp: 335, maxGbp: 470, stops: 1, travelMins: 840  },
];

const LAGOS_KIGALI_AIRLINES = [
  { code: 'WB',  name: 'RwandAir',          minGbp: 148, maxGbp: 320, stops: 0, travelMins: 195  },
  { code: 'ET',  name: 'Ethiopian Airlines',minGbp: 162, maxGbp: 340, stops: 1, travelMins: 420  },
  { code: 'KQ',  name: 'Kenya Airways',     minGbp: 170, maxGbp: 350, stops: 1, travelMins: 480  },
];

function rand(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

function pickSubset<T>(arr: T[], count: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, count);
}

function buildOffers(
  origin: string,
  destination: string,
  departureDate: Date,
  airlines: typeof LONDON_LAGOS_AIRLINES,
): RawFlightOffer[] {
  const selected = pickSubset(airlines, Math.floor(2 + Math.random() * (airlines.length - 1)));

  return selected.map(a => {
    const priceGbp = rand(a.minGbp, a.maxGbp);
    const departureAt = new Date(departureDate);
    departureAt.setHours(Math.floor(6 + Math.random() * 14), Math.floor(Math.random() * 60));
    const arrivalAt = addMinutes(departureAt, a.travelMins);

    return {
      origin,
      destination,
      airlineCode: a.code,
      airlineName: a.name,
      flightNumber: `${a.code}${Math.floor(100 + Math.random() * 899)}`,
      departureAt,
      arrivalAt,
      travelTimeMins: a.travelMins,
      stops: a.stops,
      priceGbp,
      cabin: 'ECONOMY',
      baggageIncluded: a.code === 'BA' || a.code === 'QR',
      cabinBagIncluded: true,
      refundable: priceGbp > (a.maxGbp * 0.85),
      availableSeats: Math.floor(1 + Math.random() * 9),
      bookingUrl: buildAviasalesUrl(origin, destination, departureAt),
    };
  });
}

// London airport codes — mapped to the same airline pool as LHR
const LONDON_AIRPORTS = ['LHR', 'LGW', 'STN', 'LTN', 'LCY'];

export class MockProvider implements BFIProvider {
  readonly name = 'mock';

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async search(params: SearchParams): Promise<RawFlightOffer[]> {
    await new Promise(r => setTimeout(r, 50 + Math.random() * 150));

    const { origin, destination, departureDate } = params;

    const isLondonLagos =
      (LONDON_AIRPORTS.includes(origin)  && destination === 'LOS') ||
      (LONDON_AIRPORTS.includes(destination) && origin === 'LOS');

    const isLagosKigali =
      (origin === 'LOS' && destination === 'KGL') ||
      (origin === 'KGL' && destination === 'LOS');

    if (isLondonLagos) return buildOffers(origin, destination, departureDate, LONDON_LAGOS_AIRLINES);
    if (isLagosKigali) return buildOffers(origin, destination, departureDate, LAGOS_KIGALI_AIRLINES);

    return [];
  }
}
