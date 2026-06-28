import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export interface ClickPayload {
  offerId:        string | null;
  routeId:        string | null;
  origin:         string;
  destination:    string;
  airlineCode:    string;
  airlineName:    string;
  priceGbp:       number;
  provider:       string;
  destinationUrl: string;
  sessionId:      string | null;
  userId:         string | null;
  device:         string | null;
  browser:        string | null;
  ipCountry:      string | null;
  referrer:       string | null;
  utmSource:      string | null;
  utmMedium:      string | null;
  utmCampaign:    string | null;
}

export async function recordClick(payload: ClickPayload): Promise<string> {
  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from('bfi_clicks')
    .insert({
      offer_id:        payload.offerId,
      route_id:        payload.routeId,
      origin:          payload.origin,
      destination:     payload.destination,
      airline_code:    payload.airlineCode,
      airline_name:    payload.airlineName,
      price_gbp:       payload.priceGbp,
      provider:        payload.provider,
      destination_url: payload.destinationUrl,
      session_id:      payload.sessionId,
      user_id:         payload.userId,
      device:          payload.device,
      browser:         payload.browser,
      ip_country:      payload.ipCountry,
      referrer:        payload.referrer,
      utm_source:      payload.utmSource,
      utm_medium:      payload.utmMedium,
      utm_campaign:    payload.utmCampaign,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function recordView(
  routeId: string,
  origin: string,
  destination: string,
  opts: { sessionId?: string; ipCountry?: string; device?: string; referrer?: string } = {},
): Promise<void> {
  const db = createSupabaseAdminClient();
  await db.from('bfi_route_views').insert({
    route_id:    routeId,
    origin,
    destination,
    session_id:  opts.sessionId  ?? null,
    ip_country:  opts.ipCountry  ?? null,
    device:      opts.device     ?? null,
    referrer:    opts.referrer   ?? null,
  });
}

// ── Analytics helpers ─────────────────────────────────────────────────────────

export async function getClickStats(since: Date): Promise<{
  totalClicks:   number;
  topAirline:    string | null;
  topRoute:      string | null;
  topCountry:    string | null;
  byRoute:       Array<{ route: string; clicks: number; ctr: number }>;
  byAirline:     Array<{ airline: string; clicks: number }>;
  recent:        Array<{ origin: string; destination: string; airline: string; price: number; device: string | null; clicked_at: string }>;
}> {
  const db = createSupabaseAdminClient();
  const sinceStr = since.toISOString();

  const { data: clicks } = await db
    .from('bfi_clicks')
    .select('*')
    .gte('clicked_at', sinceStr)
    .order('clicked_at', { ascending: false });

  const rows = clicks ?? [];
  const totalClicks = rows.length;

  // Top airline
  const airlineCounts: Record<string, number> = {};
  for (const r of rows) airlineCounts[r.airline_name] = (airlineCounts[r.airline_name] ?? 0) + 1;
  const topAirline = Object.entries(airlineCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Top route
  const routeCounts: Record<string, number> = {};
  for (const r of rows) {
    const key = `${r.origin} → ${r.destination}`;
    routeCounts[key] = (routeCounts[key] ?? 0) + 1;
  }
  const topRoute = Object.entries(routeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Top country
  const countryCounts: Record<string, number> = {};
  for (const r of rows) {
    if (r.ip_country) countryCounts[r.ip_country] = (countryCounts[r.ip_country] ?? 0) + 1;
  }
  const topCountry = Object.entries(countryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Clicks by route
  const byRoute = Object.entries(routeCounts)
    .map(([route, c]) => ({ route, clicks: c, ctr: Math.round((c / Math.max(totalClicks, 1)) * 100) }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  // Clicks by airline
  const byAirline = Object.entries(airlineCounts)
    .map(([airline, clicks]) => ({ airline, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  const recent = rows.slice(0, 20).map(r => ({
    origin:      r.origin,
    destination: r.destination,
    airline:     r.airline_name,
    price:       r.price_gbp,
    device:      r.device,
    clicked_at:  r.clicked_at,
  }));

  return { totalClicks, topAirline, topRoute, topCountry, byRoute, byAirline, recent };
}

export async function getTodayClickCount(): Promise<number> {
  const db = createSupabaseAdminClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count } = await db
    .from('bfi_clicks')
    .select('id', { count: 'exact', head: true })
    .gte('clicked_at', today.toISOString());
  return count ?? 0;
}

export async function getTodayViewCount(): Promise<number> {
  const db = createSupabaseAdminClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count } = await db
    .from('bfi_route_views')
    .select('id', { count: 'exact', head: true })
    .gte('viewed_at', today.toISOString());
  return count ?? 0;
}

// Detect device type from user-agent string
export function detectDevice(ua: string): string {
  if (/mobile|android|iphone|ipad/i.test(ua)) return 'mobile';
  if (/tablet/i.test(ua)) return 'tablet';
  return 'desktop';
}

// Detect browser from user-agent string
export function detectBrowser(ua: string): string {
  if (/firefox/i.test(ua))                 return 'Firefox';
  if (/edg/i.test(ua))                     return 'Edge';
  if (/chrome/i.test(ua))                  return 'Chrome';
  if (/safari/i.test(ua))                  return 'Safari';
  return 'Other';
}
