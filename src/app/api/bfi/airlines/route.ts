import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/admin';
import { bfiDb } from '@/lib/bfi/db';

export async function GET() {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = bfiDb();

  const [{ data: airlinesBase }, { data: offers }, { data: clicks }] = await Promise.all([
    db.from('bfi_airlines').select('*'),
    db.from('bfi_flight_offers').select('airline_code, airline_name, price_gbp, origin, destination'),
    db.from('bfi_clicks').select('airline_code, airline_name'),
  ]);

  // Build per-airline stats from offer history
  const statsMap: Record<string, {
    cheapest: number; prices: number[]; routes: Set<string>; clicks: number;
  }> = {};

  for (const o of offers ?? []) {
    if (!statsMap[o.airline_code]) {
      statsMap[o.airline_code] = { cheapest: o.price_gbp, prices: [], routes: new Set(), clicks: 0 };
    }
    const s = statsMap[o.airline_code];
    s.prices.push(o.price_gbp);
    if (o.price_gbp < s.cheapest) s.cheapest = o.price_gbp;
    s.routes.add(`${o.origin}-${o.destination}`);
  }

  for (const c of clicks ?? []) {
    if (statsMap[c.airline_code]) statsMap[c.airline_code].clicks++;
  }

  // Merge with base airline table
  const seen = new Set<string>();
  const airlines = [];

  for (const base of airlinesBase ?? []) {
    seen.add(base.code);
    const s = statsMap[base.code];
    airlines.push({
      code:        base.code,
      name:        base.name,
      alliance:    base.alliance,
      baggage_kg:  base.baggage_kg,
      rating:      base.rating,
      cheapest:    s ? Math.round(s.cheapest * 100) / 100 : null,
      average:     s?.prices.length
        ? Math.round(s.prices.reduce((a, b) => a + b, 0) / s.prices.length * 100) / 100
        : null,
      totalOffers: s?.prices.length ?? 0,
      clicks:      s?.clicks ?? 0,
      routes:      s ? [...s.routes] : [],
    });
  }

  // Include airlines seen in offers but not in the airlines table
  for (const [code, s] of Object.entries(statsMap)) {
    if (seen.has(code)) continue;
    const nameFromOffer = (offers ?? []).find(o => o.airline_code === code)?.airline_name ?? code;
    airlines.push({
      code, name: nameFromOffer, alliance: null, baggage_kg: null, rating: 4.0,
      cheapest:    Math.round(s.cheapest * 100) / 100,
      average:     Math.round(s.prices.reduce((a, b) => a + b, 0) / s.prices.length * 100) / 100,
      totalOffers: s.prices.length,
      clicks:      s.clicks,
      routes:      [...s.routes],
    });
  }

  return NextResponse.json({ airlines });
}
