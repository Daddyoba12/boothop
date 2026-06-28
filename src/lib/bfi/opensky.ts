// OpenSky Network — free flight tracking API
// Used by BootHop to verify a Booter's flight has actually departed.
// Docs: https://openskynetwork.github.io/opensky-api/rest.html

const BASE = 'https://opensky-network.org/api';

// IATA → ICAO airport code mapping for our monitored airports
const IATA_TO_ICAO: Record<string, string> = {
  LHR: 'EGLL',
  LGW: 'EGKK',
  STN: 'EGSS',
  LTN: 'EGGW',
  LCY: 'EGLC',
  LOS: 'DNMM',
  KGL: 'HRYR',
  ABV: 'DNAA',
  ACC: 'DGAA',
};

export function iataToIcao(iata: string): string | null {
  return IATA_TO_ICAO[iata.toUpperCase()] ?? null;
}

export interface OpenSkyFlight {
  icao24:           string;   // aircraft transponder ID
  firstSeen:        number;   // unix timestamp
  estDepartureAirport: string | null;
  lastSeen:         number;
  estArrivalAirport:   string | null;
  callsign:         string | null;  // usually airline + flight number e.g. TK0023
  estDepartureAirportHorizDistance: number | null;
  estDepartureAirportVertDistance:  number | null;
  estArrivalAirportHorizDistance:   number | null;
  estArrivalAirportVertDistance:    number | null;
  departureAirportCandidatesCount:  number;
  arrivalAirportCandidatesCount:    number;
}

export interface FlightStatus {
  departed:        boolean;
  departedAt:      Date | null;
  callsign:        string | null;
  icao24:          string | null;
  estimatedArrival: string | null;
}

// Check if a specific flight has departed from an airport within a time window.
// flightNumber: e.g. "TK023" or "BA75"
// departureIata: e.g. "LOS"
// windowStart / windowEnd: JS Date objects (typically ±2 hours around scheduled departure)
export async function checkFlightDeparted(
  flightNumber: string,
  departureIata: string,
  windowStart: Date,
  windowEnd: Date,
): Promise<FlightStatus> {
  const icao = iataToIcao(departureIata);
  if (!icao) return { departed: false, departedAt: null, callsign: null, icao24: null, estimatedArrival: null };

  const begin = Math.floor(windowStart.getTime() / 1000);
  const end   = Math.ceil(windowEnd.getTime()   / 1000);

  // Normalise callsign format: "TK023" → "TK0023" (OpenSky pads to 8 chars)
  const targetCallsign = flightNumber.replace(/([A-Z]+)(\d+)/, (_, letters, digits) =>
    letters + digits.padStart(4, '0')
  ).toUpperCase();

  try {
    const res = await fetch(
      `${BASE}/flights/departure?airport=${icao}&begin=${begin}&end=${end}`,
      { headers: { 'User-Agent': 'BootHop-BFI/1.0' } }
    );

    if (!res.ok) return { departed: false, departedAt: null, callsign: null, icao24: null, estimatedArrival: null };

    const flights: OpenSkyFlight[] = await res.json();

    const match = flights.find(f =>
      f.callsign && f.callsign.trim().toUpperCase().startsWith(targetCallsign.slice(0, 6))
    );

    if (!match) return { departed: false, departedAt: null, callsign: null, icao24: null, estimatedArrival: null };

    return {
      departed:         true,
      departedAt:       new Date(match.firstSeen * 1000),
      callsign:         match.callsign?.trim() ?? null,
      icao24:           match.icao24,
      estimatedArrival: match.estArrivalAirport,
    };
  } catch {
    return { departed: false, departedAt: null, callsign: null, icao24: null, estimatedArrival: null };
  }
}

// Get all departures from an airport in the last N hours — used for dashboard monitoring
export async function getRecentDepartures(
  airportIata: string,
  hoursBack = 2,
): Promise<OpenSkyFlight[]> {
  const icao  = iataToIcao(airportIata);
  if (!icao) return [];

  const end   = Math.floor(Date.now() / 1000);
  const begin = end - hoursBack * 3600;

  try {
    const res = await fetch(
      `${BASE}/flights/departure?airport=${icao}&begin=${begin}&end=${end}`,
      { headers: { 'User-Agent': 'BootHop-BFI/1.0' } }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

// Get all arrivals at an airport in the next N hours — useful for delivery ETAs
export async function getRecentArrivals(
  airportIata: string,
  hoursBack = 4,
): Promise<OpenSkyFlight[]> {
  const icao  = iataToIcao(airportIata);
  if (!icao) return [];

  const end   = Math.floor(Date.now() / 1000);
  const begin = end - hoursBack * 3600;

  try {
    const res = await fetch(
      `${BASE}/flights/arrival?airport=${icao}&begin=${begin}&end=${end}`,
      { headers: { 'User-Agent': 'BootHop-BFI/1.0' } }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}
