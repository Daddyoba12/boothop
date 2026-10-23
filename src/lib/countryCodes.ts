/**
 * Free-text city string → ISO 3166-1 alpha-2 country code.
 *
 * `trips` stores cities as free text ("Lagos, Nigeria", "London, UK"), so the
 * country has to be read off the string. Used by the risk engine to pick the
 * right row out of ROUTE_RULES in item-compliance.ts, which is keyed "GB-NG".
 *
 * Returns '' when nothing matches — callers must treat that as "no
 * route-specific rules apply", never as a default route.
 */

const COUNTRY_ISO: Record<string, string> = {
  'nigeria': 'NG',
  'uk': 'GB',
  'united kingdom': 'GB',
  'great britain': 'GB',
  'england': 'GB',
  'scotland': 'GB',
  'wales': 'GB',
  'northern ireland': 'GB',
  'usa': 'US',
  'us': 'US',
  'united states': 'US',
  'united states of america': 'US',
  'canada': 'CA',
  'ireland': 'IE',
  'ghana': 'GH',
  'rwanda': 'RW',
  'kenya': 'KE',
  'south africa': 'ZA',
  'egypt': 'EG',
  'morocco': 'MA',
  'cameroon': 'CM',
  'senegal': 'SN',
  'uganda': 'UG',
  'tanzania': 'TZ',
  'ethiopia': 'ET',
  'ivory coast': 'CI',
  "côte d'ivoire": 'CI',
  'spain': 'ES',
  'france': 'FR',
  'germany': 'DE',
  'italy': 'IT',
  'portugal': 'PT',
  'netherlands': 'NL',
  'belgium': 'BE',
  'poland': 'PL',
  'czechia': 'CZ',
  'czech republic': 'CZ',
  'sweden': 'SE',
  'denmark': 'DK',
  'norway': 'NO',
  'finland': 'FI',
  'switzerland': 'CH',
  'austria': 'AT',
  'greece': 'GR',
  'turkey': 'TR',
  'india': 'IN',
  'pakistan': 'PK',
  'bangladesh': 'BD',
  'china': 'CN',
  'japan': 'JP',
  'south korea': 'KR',
  'uae': 'AE',
  'united arab emirates': 'AE',
  'qatar': 'QA',
  'saudi arabia': 'SA',
  'australia': 'AU',
  'brazil': 'BR',
};

/** Cities recognised on their own, for strings carrying no country. */
const CITY_ISO: Record<string, string> = {
  'london': 'GB', 'manchester': 'GB', 'birmingham': 'GB', 'glasgow': 'GB',
  'edinburgh': 'GB', 'leeds': 'GB', 'liverpool': 'GB', 'bristol': 'GB',
  'nottingham': 'GB', 'southport': 'GB', 'ilford': 'GB', 'sittingbourne': 'GB',
  'lagos': 'NG', 'abuja': 'NG', 'port harcourt': 'NG', 'kano': 'NG', 'ibadan': 'NG',
  'accra': 'GH', 'kigali': 'RW', 'nairobi': 'KE', 'johannesburg': 'ZA',
  'dublin': 'IE', 'paris': 'FR', 'madrid': 'ES', 'barcelona': 'ES',
  'amsterdam': 'NL', 'eindhoven': 'NL', 'berlin': 'DE', 'rome': 'IT',
  'lisbon': 'PT', 'warsaw': 'PL', 'prague': 'CZ', 'dubai': 'AE',
  'delhi': 'IN', 'new delhi': 'IN', 'mumbai': 'IN', 'chennai': 'IN',
  'lahore': 'PK', 'karachi': 'PK', 'seoul': 'KR',
  'new york': 'US', 'chicago': 'US', 'orlando': 'US', 'houston': 'US',
  'los angeles': 'US', 'miami': 'US', 'atlanta': 'US', 'boston': 'US',
  'toronto': 'CA', 'vancouver': 'CA', 'montreal': 'CA',
};

const strip = (s: string): string =>
  (s ?? '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[·–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Best-effort ISO alpha-2 for a free-text city string.
 * Returns '' when unknown — the caller must not substitute a default route.
 */
export function isoCountryForCity(cityString: string): string {
  const cleaned = strip(cityString);
  if (!cleaned) return '';

  const parts   = cleaned.split(',').map(strip).filter(Boolean);
  const city    = parts[0] ?? '';
  const country = parts.length > 1 ? parts[parts.length - 1] : '';

  if (country && COUNTRY_ISO[country]) return COUNTRY_ISO[country];

  for (const [name, iso] of Object.entries(CITY_ISO)) {
    if (city === name || city.startsWith(`${name} `)) return iso;
  }

  if (COUNTRY_ISO[cleaned]) return COUNTRY_ISO[cleaned];

  console.warn('[countryCodes] no ISO code for city string', { cityString });
  return '';
}
