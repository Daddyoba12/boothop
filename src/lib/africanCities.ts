// Canonical set of African cities used to detect Africa-outbound trips.
// A trip is "Africa-outbound" when from_city normalises to one of these.
const AFRICAN_CITIES = new Set([
  // Nigeria
  'lagos', 'abuja', 'port harcourt', 'kano', 'ibadan', 'enugu',
  'benin city', 'calabar', 'warri', 'aba', 'onitsha', 'jos', 'maiduguri',
  'kaduna', 'ilorin', 'abeokuta', 'uyo', 'owerri', 'asaba', 'nnewi',
  // Ghana
  'accra', 'kumasi', 'takoradi', 'tamale',
  // Kenya
  'nairobi', 'mombasa', 'kisumu', 'nakuru',
  // South Africa
  'johannesburg', 'cape town', 'durban', 'pretoria', 'soweto',
  // Egypt
  'cairo', 'alexandria', 'giza',
  // Ethiopia
  'addis ababa',
  // Tanzania
  'dar es salaam', 'dodoma', 'arusha',
  // Uganda
  'kampala', 'entebbe',
  // Rwanda
  'kigali',
  // Senegal
  'dakar',
  // Cameroon
  'douala', 'yaoundé', 'yaounde',
  // Ivory Coast
  'abidjan', 'yamoussoukro',
  // Zimbabwe
  'harare', 'bulawayo',
  // Zambia
  'lusaka', 'ndola',
  // Morocco
  'casablanca', 'rabat', 'marrakesh', 'marrakech', 'fes', 'fez',
  // Tunisia
  'tunis',
  // Angola
  'luanda',
  // Mozambique
  'maputo',
  // Sudan
  'khartoum',
  // Algeria
  'algiers',
  // Sierra Leone
  'freetown',
  // Liberia
  'monrovia',
  // Togo
  'lomé', 'lome',
  // Benin
  'cotonou', 'porto-novo',
  // Gambia
  'banjul',
  // Malawi
  'lilongwe', 'blantyre',
  // Botswana
  'gaborone',
  // Namibia
  'windhoek',
]);

/** Returns true when the city (case-insensitive, strip country suffix) is in Africa. */
export function isAfricanCity(city: string): boolean {
  const normalised = city.toLowerCase().split(',')[0].trim();
  // Exact match
  if (AFRICAN_CITIES.has(normalised)) return true;
  // Partial match — catch "Lagos, Nigeria" → "lagos" already handled above,
  // but also catch composite names like "Port Harcourt, Nigeria" where the
  // comma split gives "port harcourt"
  for (const known of AFRICAN_CITIES) {
    if (normalised.startsWith(known) || normalised.endsWith(known)) return true;
  }
  return false;
}
