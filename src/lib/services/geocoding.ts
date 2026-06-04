import type { SupabaseClient } from '@supabase/supabase-js';

type Precision = 'city' | 'street' | 'building';

const memCache = new Map<string, string>();
let lastCall = 0;

function round(v: number, p: Precision): number {
  if (p === 'city')     return Math.round(v * 10) / 10;
  if (p === 'street')   return Math.round(v * 1000) / 1000;
  return v;
}

function cacheKey(lat: number, lng: number, p: Precision): string {
  return `${round(lat, p).toFixed(4)},${round(lng, p).toFixed(4)},${p}`;
}

function nominatimZoom(p: Precision): number {
  return { city: 10, street: 16, building: 18 }[p];
}

export async function reverseGeocode(
  lat: number,
  lng: number,
  precision: Precision,
  supabase: SupabaseClient
): Promise<string> {
  const key = cacheKey(lat, lng, precision);

  if (memCache.has(key)) return memCache.get(key)!;

  try {
    const { data } = await supabase
      .from('geocode_cache')
      .select('address')
      .eq('coordinate_key', key)
      .single();
    if (data?.address) { memCache.set(key, data.address); return data.address; }
  } catch { /* miss */ }

  // Rate-limit: 1 req/sec for Nominatim
  const wait = 1000 - (Date.now() - lastCall);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastCall = Date.now();

  try {
    const rLat = round(lat, precision);
    const rLng = round(lng, precision);
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${rLat}&lon=${rLng}&format=json&zoom=${nominatimZoom(precision)}`,
      { headers: { 'User-Agent': 'BootHop/1.0 (info@boothop.com)' } }
    );
    const json = await res.json();
    const addr = json.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    memCache.set(key, addr);
    supabase.from('geocode_cache').upsert({ coordinate_key: key, address: addr, precision, updated_at: new Date().toISOString() }).then(() => {});
    return addr;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}
