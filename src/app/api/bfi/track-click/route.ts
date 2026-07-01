import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// POST /api/bfi/track-click
// Lightweight click tracker for the FlightTicker news-flash bar.
// Fire-and-forget — client does not wait for response.
export async function POST(request: Request) {
  try {
    const { origin, destination, priceGbp } = await request.json();
    if (!origin || !destination) return NextResponse.json({ ok: true });

    const db = createSupabaseAdminClient();
    await db.from('bfi_route_stats').upsert(
      { origin, destination, today_clicks: 1 },
      { onConflict: 'origin,destination', ignoreDuplicates: false }
    );
    // Best-effort — silently ignore if table doesn't exist yet
    db.from('bfi_ticker_clicks').insert({
      origin,
      destination,
      price_gbp:  priceGbp ?? null,
      clicked_at: new Date().toISOString(),
    }).then(() => {}, () => {});
  } catch { /* non-blocking */ }

  return NextResponse.json({ ok: true });
}
