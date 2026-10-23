/**
 * City/country → IANA timezone.
 *
 * `trips` stores only a free-text city string like "Lagos, Nigeria" or
 * "London, UK", so the zone has to be inferred from that. Resolution order:
 *
 *   1. city-level override — needed for countries spanning several zones
 *   2. country name after the comma
 *   3. UTC, with a warning logged so the gap is visible
 */

/** Countries with a single practical zone for our purposes. */
const COUNTRY_ZONES: Record<string, string> = {
  'nigeria': 'Africa/Lagos',
  'uk': 'Europe/London',
  'united kingdom': 'Europe/London',
  'england': 'Europe/London',
  'scotland': 'Europe/London',
  'wales': 'Europe/London',
  'ireland': 'Europe/Dublin',
  'ghana': 'Africa/Accra',
  'rwanda': 'Africa/Kigali',
  'kenya': 'Africa/Nairobi',
  'south africa': 'Africa/Johannesburg',
  'egypt': 'Africa/Cairo',
  'morocco': 'Africa/Casablanca',
  'cameroon': 'Africa/Douala',
  'ivory coast': 'Africa/Abidjan',
  "côte d'ivoire": 'Africa/Abidjan',
  'senegal': 'Africa/Dakar',
  'uganda': 'Africa/Kampala',
  'tanzania': 'Africa/Dar_es_Salaam',
  'ethiopia': 'Africa/Addis_Ababa',
  'spain': 'Europe/Madrid',
  'france': 'Europe/Paris',
  'germany': 'Europe/Berlin',
  'italy': 'Europe/Rome',
  'portugal': 'Europe/Lisbon',
  'netherlands': 'Europe/Amsterdam',
  'belgium': 'Europe/Brussels',
  'poland': 'Europe/Warsaw',
  'czechia': 'Europe/Prague',
  'czech republic': 'Europe/Prague',
  'sweden': 'Europe/Stockholm',
  'denmark': 'Europe/Copenhagen',
  'norway': 'Europe/Oslo',
  'finland': 'Europe/Helsinki',
  'switzerland': 'Europe/Zurich',
  'austria': 'Europe/Vienna',
  'greece': 'Europe/Athens',
  'turkey': 'Europe/Istanbul',
  'india': 'Asia/Kolkata',
  'pakistan': 'Asia/Karachi',
  'bangladesh': 'Asia/Dhaka',
  'china': 'Asia/Shanghai',
  'japan': 'Asia/Tokyo',
  'south korea': 'Asia/Seoul',
  'uae': 'Asia/Dubai',
  'united arab emirates': 'Asia/Dubai',
  'qatar': 'Asia/Qatar',
  'saudi arabia': 'Asia/Riyadh',
};

/** Cities in countries that span multiple zones, plus common airport spellings. */
const CITY_ZONES: Record<string, string> = {
  // United States
  'new york': 'America/New_York',
  'newark': 'America/New_York',
  'orlando': 'America/New_York',
  'miami': 'America/New_York',
  'atlanta': 'America/New_York',
  'washington': 'America/New_York',
  'boston': 'America/New_York',
  'chicago': 'America/Chicago',
  'houston': 'America/Chicago',
  'dallas': 'America/Chicago',
  'denver': 'America/Denver',
  'phoenix': 'America/Phoenix',
  'los angeles': 'America/Los_Angeles',
  'san francisco': 'America/Los_Angeles',
  'seattle': 'America/Los_Angeles',
  // Canada
  'toronto': 'America/Toronto',
  'ottawa': 'America/Toronto',
  'montreal': 'America/Toronto',
  'calgary': 'America/Edmonton',
  'vancouver': 'America/Vancouver',
  // Australia
  'sydney': 'Australia/Sydney',
  'melbourne': 'Australia/Melbourne',
  'brisbane': 'Australia/Brisbane',
  'perth': 'Australia/Perth',
  // Brazil
  'sao paulo': 'America/Sao_Paulo',
  'são paulo': 'America/Sao_Paulo',
  'rio de janeiro': 'America/Sao_Paulo',

  // Corridor cities, listed by name so they still resolve when the string
  // carries no country — e.g. "London (LGW) · South Terminal".
  'london': 'Europe/London',
  'manchester': 'Europe/London',
  'birmingham': 'Europe/London',
  'glasgow': 'Europe/London',
  'edinburgh': 'Europe/London',
  'leeds': 'Europe/London',
  'liverpool': 'Europe/London',
  'bristol': 'Europe/London',
  'nottingham': 'Europe/London',
  'southport': 'Europe/London',
  'lagos': 'Africa/Lagos',
  'abuja': 'Africa/Lagos',
  'port harcourt': 'Africa/Lagos',
  'kano': 'Africa/Lagos',
  'ibadan': 'Africa/Lagos',
  'accra': 'Africa/Accra',
  'kigali': 'Africa/Kigali',
  'nairobi': 'Africa/Nairobi',
  'johannesburg': 'Africa/Johannesburg',
  'dublin': 'Europe/Dublin',
  'paris': 'Europe/Paris',
  'madrid': 'Europe/Madrid',
  'barcelona': 'Europe/Madrid',
  'amsterdam': 'Europe/Amsterdam',
  'eindhoven': 'Europe/Amsterdam',
  'berlin': 'Europe/Berlin',
  'rome': 'Europe/Rome',
  'lisbon': 'Europe/Lisbon',
  'warsaw': 'Europe/Warsaw',
  'prague': 'Europe/Prague',
  'dubai': 'Asia/Dubai',
  'delhi': 'Asia/Kolkata',
  'new delhi': 'Asia/Kolkata',
  'mumbai': 'Asia/Kolkata',
  'chennai': 'Asia/Kolkata',
  'lahore': 'Asia/Karachi',
  'karachi': 'Asia/Karachi',
  'seoul': 'Asia/Seoul',
};

const strip = (s: string): string =>
  (s ?? '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')   // drop "(LGW)" and similar
    .replace(/[·–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Best-effort IANA zone for a free-text city string.
 * Returns 'UTC' when nothing matches.
 */
export function timezoneForCity(cityString: string): string {
  const cleaned = strip(cityString);
  if (!cleaned) return 'UTC';

  const parts = cleaned.split(',').map((p) => strip(p)).filter(Boolean);
  const city    = parts[0] ?? '';
  const country = parts.length > 1 ? parts[parts.length - 1] : '';

  // 1. city override (multi-zone countries)
  for (const [name, zone] of Object.entries(CITY_ZONES)) {
    if (city === name || city.startsWith(`${name} `)) return zone;
  }

  // 2. country name
  if (country && COUNTRY_ZONES[country]) return COUNTRY_ZONES[country];

  // 3. the whole string may itself be a country ("London, UK" handled above;
  //    "Nigeria" alone lands here)
  if (COUNTRY_ZONES[cleaned]) return COUNTRY_ZONES[cleaned];

  console.warn('[timezones] no zone for city string, defaulting to UTC', { cityString });
  return 'UTC';
}

/** Milliseconds that `zone` is ahead of UTC at the given instant. */
function zoneOffsetMs(at: Date, zone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: zone, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const p = Object.fromEntries(dtf.formatToParts(at).map((x) => [x.type, x.value])) as Record<string, string>;
  const asUtc = Date.UTC(
    Number(p.year), Number(p.month) - 1, Number(p.day),
    Number(p.hour) % 24, Number(p.minute), Number(p.second),
  );
  return asUtc - at.getTime();
}

/**
 * The UTC instant corresponding to `hour:00` local time on `dateStr` in `zone`.
 *
 * Offsets are resolved iteratively because the offset itself depends on the
 * instant — one correction pass is enough except across a DST boundary, where
 * the second pass settles it.
 */
export function zonedHourToUtc(dateStr: string, hour: number, zone: string): Date {
  const naive = Date.UTC(
    Number(dateStr.slice(0, 4)), Number(dateStr.slice(5, 7)) - 1, Number(dateStr.slice(8, 10)), hour,
  );
  let instant = new Date(naive - zoneOffsetMs(new Date(naive), zone));
  instant = new Date(naive - zoneOffsetMs(instant, zone));
  return instant;
}
