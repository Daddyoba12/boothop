import { NextResponse } from 'next/server';
import { checkFlightDeparted, getRecentDepartures } from '@/lib/bfi/opensky';

// Public endpoint — used by the BootHop match system to verify flight departure.
// GET /api/bfi/flight-status?flight=TK023&from=LOS&scheduled=2026-07-10T14:00:00Z
// GET /api/bfi/flight-status?departures=LOS  (recent departures from airport)

export async function GET(request: Request) {
  const url   = new URL(request.url);
  const flight = url.searchParams.get('flight');
  const from   = url.searchParams.get('from');
  const scheduledStr = url.searchParams.get('scheduled');
  const departuresAirport = url.searchParams.get('departures');

  // Mode 1: recent departures from an airport
  if (departuresAirport) {
    const hours  = parseInt(url.searchParams.get('hours') ?? '4', 10);
    const flights = await getRecentDepartures(departuresAirport, Math.min(hours, 12));
    return NextResponse.json({
      airport:  departuresAirport,
      count:    flights.length,
      flights:  flights.slice(0, 50).map(f => ({
        callsign:  f.callsign?.trim() ?? null,
        icao24:    f.icao24,
        departedAt: new Date(f.firstSeen * 1000).toISOString(),
        arrival:   f.estArrivalAirport,
      })),
    });
  }

  // Mode 2: check if a specific flight has departed
  if (!flight || !from) {
    return NextResponse.json({ error: 'flight and from params required' }, { status: 400 });
  }

  const scheduled = scheduledStr ? new Date(scheduledStr) : new Date();
  const windowStart = new Date(scheduled.getTime() - 2 * 3600_000);
  const windowEnd   = new Date(scheduled.getTime() + 4 * 3600_000);

  const status = await checkFlightDeparted(flight, from, windowStart, windowEnd);

  return NextResponse.json({
    flight,
    airport:         from,
    scheduled:       scheduled.toISOString(),
    departed:        status.departed,
    departedAt:      status.departedAt?.toISOString() ?? null,
    callsign:        status.callsign,
    icao24:          status.icao24,
    estimatedArrival: status.estimatedArrival,
    checkedAt:       new Date().toISOString(),
  });
}
