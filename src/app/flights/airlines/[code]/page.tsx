import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getAirlineOffers } from '@/lib/bfi/db';

export const dynamic = 'force-dynamic';

const AIRLINE_NAMES: Record<string, string> = {
  BA: 'British Airways',     VS: 'Virgin Atlantic',  TK: 'Turkish Airlines',
  AT: 'Royal Air Maroc',     QR: 'Qatar Airways',    ET: 'Ethiopian Airlines',
  MS: 'EgyptAir',            WB: 'RwandAir',         KQ: 'Kenya Airways',
  LH: 'Lufthansa',           AF: 'Air France',       KL: 'KLM',
  P4: 'Air Peace',           EK: 'Emirates',         EY: 'Etihad Airways',
  DL: 'Delta Air Lines',     AA: 'American Airlines', UA: 'United Airlines',
  RAM:'Royal Air Maroc',
};

export default async function AirlinePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: rawCode } = await params;
  const code = rawCode.toUpperCase();

  const db = createSupabaseAdminClient();

  // Load offers for this airline in last 30 days
  const offers = await getAirlineOffers(code, 30);

  if (!offers.length) notFound();

  const airlineName = AIRLINE_NAMES[code] ?? code;

  // Group by route
  const routeMap: Record<string, { origin: string; destination: string; prices: number[] }> = {};
  for (const o of offers) {
    const key = `${o.origin}-${o.destination}`;
    if (!routeMap[key]) routeMap[key] = { origin: o.origin, destination: o.destination, prices: [] };
    routeMap[key].prices.push(o.price_gbp);
  }

  const routes = Object.values(routeMap).map(r => ({
    origin:      r.origin,
    destination: r.destination,
    minGbp:      Math.min(...r.prices),
    avgGbp:      r.prices.reduce((s, p) => s + p, 0) / r.prices.length,
    count:       r.prices.length,
    slug:        `${r.origin.toLowerCase()}-${r.destination.toLowerCase()}`,
  })).sort((a, b) => a.minGbp - b.minGbp);

  // Load airport names
  const codes = [...new Set(routes.flatMap(r => [r.origin, r.destination]))];
  const { data: airports } = await db
    .from('bfi_airports')
    .select('code, city')
    .in('code', codes);
  const cityMap: Record<string, string> = {};
  for (const a of airports ?? []) cityMap[a.code] = a.city;

  const overallMin = Math.min(...routes.map(r => r.minGbp));
  const overallAvg = routes.reduce((s, r) => s + r.avgGbp, 0) / routes.length;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">

        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 flex items-center gap-1.5">
          <Link href="/" className="hover:text-white transition-colors">BootHop</Link>
          <span>/</span>
          <Link href="/flights" className="hover:text-white transition-colors">Flights</Link>
          <span>/</span>
          <span className="text-gray-300">Airlines</span>
          <span>/</span>
          <span className="text-gray-300">{code}</span>
        </div>

        {/* Header */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-2">
            Airline Intelligence
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-white">{airlineName}</h1>
          <p className="text-gray-400 mt-1 text-sm">IATA code: {code} · Last 30 days of BFI scan data</p>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Cheapest Fare',  value: `£${overallMin.toFixed(0)}` },
            { label: 'Average Fare',   value: `£${overallAvg.toFixed(0)}` },
            { label: 'Routes Tracked', value: `${routes.length}`          },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Route list */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Routes with {airlineName} fares</h2>
          <div className="space-y-2.5">
            {routes.map(r => (
              <Link
                key={r.slug}
                href={`/flights/${r.slug}`}
                className="flex items-center justify-between bg-gray-900 border border-gray-800 hover:border-gray-700 hover:bg-gray-900/80 rounded-xl px-5 py-4 transition-all group"
              >
                <div>
                  <p className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                    {cityMap[r.origin] ?? r.origin} → {cityMap[r.destination] ?? r.destination}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {r.origin} → {r.destination} · {r.count} fare{r.count !== 1 ? 's' : ''} scanned
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-white">From £{r.minGbp.toFixed(0)}</p>
                  <p className="text-xs text-gray-500">Avg £{r.avgGbp.toFixed(0)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-blue-950/60 to-gray-900 border border-blue-800/30 rounded-2xl p-6 text-center">
          <p className="text-white font-semibold mb-2">Travelling on {airlineName}?</p>
          <p className="text-gray-400 text-sm mb-4">
            Earn £150–£350 carrying verified BootHop packages on your flight.
          </p>
          <Link
            href="/register?type=booter"
            className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            Become a Booter →
          </Link>
        </div>

      </div>
    </div>
  );
}
