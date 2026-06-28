import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getAirportRoutes, getRouteStats } from '@/lib/bfi/db';

export const dynamic = 'force-dynamic';

export default async function AirportPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: rawCode } = await params;
  const code = rawCode.toUpperCase();

  const db = createSupabaseAdminClient();

  const [routes, { data: airportRow }] = await Promise.all([
    getAirportRoutes(code),
    db.from('bfi_airports').select('*').eq('code', code).single(),
  ]);

  if (!airportRow && !routes.length) notFound();

  const airport = airportRow ?? { code, name: code, city: code, country: '' };

  // Load all airport names for display
  const allCodes = [...new Set(routes.flatMap(r => [r.origin, r.destination]))];
  const { data: airports } = await db
    .from('bfi_airports')
    .select('code, city, name')
    .in('code', allCodes);
  const cityMap: Record<string, string> = {};
  const nameMap: Record<string, string> = {};
  for (const a of airports ?? []) { cityMap[a.code] = a.city; nameMap[a.code] = a.name; }

  // Load stats for each route
  const statsArr = await Promise.all(routes.map(r => getRouteStats(r.id)));
  const statsMap: Record<string, typeof statsArr[number]> = {};
  routes.forEach((r, i) => { statsMap[r.id] = statsArr[i]; });

  const departures = routes.filter(r => r.origin === code);
  const arrivals   = routes.filter(r => r.destination === code);

  function RouteCard({ r, dir }: { r: typeof routes[0]; dir: 'dep' | 'arr' }) {
    const peer  = dir === 'dep' ? r.destination : r.origin;
    const slug  = `${r.origin.toLowerCase()}-${r.destination.toLowerCase()}`;
    const stats = statsMap[r.id];
    return (
      <Link
        href={`/flights/${slug}`}
        className="flex items-center justify-between bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl px-5 py-4 transition-all group"
      >
        <div>
          <p className="font-semibold text-white group-hover:text-blue-400 transition-colors">
            {dir === 'dep' ? `${airport.city} → ${cityMap[peer] ?? peer}` : `${cityMap[peer] ?? peer} → ${airport.city}`}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {r.origin} → {r.destination}
            {stats?.recommendation && (
              <span className={`ml-2 font-semibold ${stats.recommendation === 'BUY' ? 'text-green-400' : stats.recommendation === 'WAIT' ? 'text-red-400' : 'text-gray-400'}`}>
                · {stats.recommendation}
              </span>
            )}
          </p>
        </div>
        <div className="text-right shrink-0">
          {stats?.all_time_lowest_gbp ? (
            <>
              <p className="font-bold text-white">From £{stats.all_time_lowest_gbp.toFixed(0)}</p>
              <p className="text-xs text-gray-500">Best price seen</p>
            </>
          ) : (
            <p className="text-xs text-gray-600">No data yet</p>
          )}
        </div>
      </Link>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">

        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 flex items-center gap-1.5">
          <Link href="/" className="hover:text-white transition-colors">BootHop</Link>
          <span>/</span>
          <Link href="/flights" className="hover:text-white transition-colors">Flights</Link>
          <span>/</span>
          <span className="text-gray-300">Airports</span>
          <span>/</span>
          <span className="text-gray-300">{code}</span>
        </div>

        {/* Header */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-2">
            Airport Hub
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-white">{airport.city}</h1>
          <p className="text-gray-400 mt-1 text-sm">
            {airport.name} · {code}
            {airport.country ? ` · ${airport.country}` : ''}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Departing routes</p>
            <p className="text-2xl font-bold text-white">{departures.length}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Arriving routes</p>
            <p className="text-2xl font-bold text-white">{arrivals.length}</p>
          </div>
        </div>

        {/* Departures */}
        {departures.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              Departures from {airport.city}
            </h2>
            <div className="space-y-2.5">
              {departures.map(r => <RouteCard key={r.id} r={r} dir="dep" />)}
            </div>
          </div>
        )}

        {/* Arrivals */}
        {arrivals.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              Arrivals into {airport.city}
            </h2>
            <div className="space-y-2.5">
              {arrivals.map(r => <RouteCard key={r.id} r={r} dir="arr" />)}
            </div>
          </div>
        )}

        {!departures.length && !arrivals.length && (
          <p className="text-gray-500 text-center py-10">
            No routes tracked for {code} yet. Routes are added via the BFI admin.
          </p>
        )}

        {/* Match layer CTA */}
        <div className="bg-gradient-to-br from-emerald-950/60 to-gray-900 border border-emerald-800/30 rounded-2xl p-6 text-center">
          <p className="text-white font-semibold mb-2">
            Flying through {airport.city}?
          </p>
          <p className="text-gray-400 text-sm mb-4">
            Earn £150–£350 carrying verified BootHop packages on any of these routes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register?type=booter"
              className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Become a Booter →
            </Link>
            <Link
              href="/send"
              className="inline-block bg-emerald-700 hover:bg-emerald-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Send a Package →
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
