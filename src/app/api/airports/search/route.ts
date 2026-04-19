import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// Built-in fallback — works before the airports table is populated in Supabase
// terminals field: shown as a sub-picker after airport is selected
const AIRPORTS = [
  { name: 'Heathrow Airport',                        city: 'London',        country: 'United Kingdom', iata: 'LHR', terminals: ['T1','T2','T3','T4','T5'] },
  { name: 'Gatwick Airport',                         city: 'London',        country: 'United Kingdom', iata: 'LGW', terminals: ['South Terminal','North Terminal'] },
  { name: 'Stansted Airport',                        city: 'London',        country: 'United Kingdom', iata: 'STN' },
  { name: 'Luton Airport',                           city: 'London',        country: 'United Kingdom', iata: 'LTN' },
  { name: 'City Airport',                            city: 'London',        country: 'United Kingdom', iata: 'LCY' },
  { name: 'Manchester Airport',                      city: 'Manchester',    country: 'United Kingdom', iata: 'MAN', terminals: ['T1','T2','T3'] },
  { name: 'Birmingham Airport',                      city: 'Birmingham',    country: 'United Kingdom', iata: 'BHX', terminals: ['T1','T2'] },
  { name: 'Edinburgh Airport',                       city: 'Edinburgh',     country: 'United Kingdom', iata: 'EDI' },
  { name: 'Glasgow Airport',                         city: 'Glasgow',       country: 'United Kingdom', iata: 'GLA' },
  { name: 'Bristol Airport',                         city: 'Bristol',       country: 'United Kingdom', iata: 'BRS' },
  { name: 'Leeds Bradford Airport',                  city: 'Leeds',         country: 'United Kingdom', iata: 'LBA' },
  { name: 'Newcastle International Airport',         city: 'Newcastle',     country: 'United Kingdom', iata: 'NCL' },
  { name: 'Charles de Gaulle Airport',               city: 'Paris',         country: 'France',         iata: 'CDG' },
  { name: 'Orly Airport',                            city: 'Paris',         country: 'France',         iata: 'ORY' },
  { name: 'Amsterdam Schiphol Airport',              city: 'Amsterdam',     country: 'Netherlands',    iata: 'AMS' },
  { name: 'Frankfurt Airport',                       city: 'Frankfurt',     country: 'Germany',        iata: 'FRA' },
  { name: 'Munich Airport',                          city: 'Munich',        country: 'Germany',        iata: 'MUC' },
  { name: 'Düsseldorf Airport',                      city: 'Düsseldorf',    country: 'Germany',        iata: 'DUS' },
  { name: 'Brussels Airport',                        city: 'Brussels',      country: 'Belgium',        iata: 'BRU' },
  { name: 'Madrid Barajas Airport',                  city: 'Madrid',        country: 'Spain',          iata: 'MAD' },
  { name: 'Barcelona El Prat Airport',               city: 'Barcelona',     country: 'Spain',          iata: 'BCN' },
  { name: 'Rome Fiumicino Airport',                  city: 'Rome',          country: 'Italy',          iata: 'FCO' },
  { name: 'Milan Malpensa Airport',                  city: 'Milan',         country: 'Italy',          iata: 'MXP' },
  { name: 'Zurich Airport',                          city: 'Zurich',        country: 'Switzerland',    iata: 'ZRH' },
  { name: 'Geneva Airport',                          city: 'Geneva',        country: 'Switzerland',    iata: 'GVA' },
  { name: 'Vienna International Airport',            city: 'Vienna',        country: 'Austria',        iata: 'VIE' },
  { name: 'Copenhagen Airport',                      city: 'Copenhagen',    country: 'Denmark',        iata: 'CPH' },
  { name: 'Stockholm Arlanda Airport',               city: 'Stockholm',     country: 'Sweden',         iata: 'ARN' },
  { name: 'Oslo Gardermoen Airport',                 city: 'Oslo',          country: 'Norway',         iata: 'OSL' },
  { name: 'Helsinki Airport',                        city: 'Helsinki',      country: 'Finland',        iata: 'HEL' },
  { name: 'Warsaw Chopin Airport',                   city: 'Warsaw',        country: 'Poland',         iata: 'WAW' },
  { name: 'Prague Václav Havel Airport',             city: 'Prague',        country: 'Czech Republic', iata: 'PRG' },
  { name: 'Budapest Ferenc Liszt Airport',           city: 'Budapest',      country: 'Hungary',        iata: 'BUD' },
  { name: 'Lisbon Humberto Delgado Airport',         city: 'Lisbon',        country: 'Portugal',       iata: 'LIS' },
  { name: 'Dublin Airport',                          city: 'Dublin',        country: 'Ireland',        iata: 'DUB' },
  { name: 'Dubai International Airport',             city: 'Dubai',         country: 'UAE',            iata: 'DXB' },
  { name: 'Abu Dhabi International Airport',         city: 'Abu Dhabi',     country: 'UAE',            iata: 'AUH' },
  { name: 'Doha Hamad International Airport',        city: 'Doha',          country: 'Qatar',          iata: 'DOH' },
  { name: 'Singapore Changi Airport',                city: 'Singapore',     country: 'Singapore',      iata: 'SIN' },
  { name: 'Hong Kong International Airport',         city: 'Hong Kong',     country: 'China',          iata: 'HKG' },
  { name: 'Tokyo Narita International Airport',      city: 'Tokyo',         country: 'Japan',          iata: 'NRT' },
  { name: 'Tokyo Haneda Airport',                    city: 'Tokyo',         country: 'Japan',          iata: 'HND' },
  { name: 'Beijing Capital International Airport',   city: 'Beijing',       country: 'China',          iata: 'PEK' },
  { name: 'Shanghai Pudong International Airport',   city: 'Shanghai',      country: 'China',          iata: 'PVG' },
  { name: 'Sydney Kingsford Smith Airport',          city: 'Sydney',        country: 'Australia',      iata: 'SYD' },
  { name: 'Melbourne Airport',                       city: 'Melbourne',     country: 'Australia',      iata: 'MEL' },
  { name: 'JFK International Airport',               city: 'New York',      country: 'United States',  iata: 'JFK' },
  { name: 'Los Angeles International Airport',       city: 'Los Angeles',   country: 'United States',  iata: 'LAX' },
  { name: "O'Hare International Airport",            city: 'Chicago',       country: 'United States',  iata: 'ORD' },
  { name: 'Miami International Airport',             city: 'Miami',         country: 'United States',  iata: 'MIA' },
  { name: 'Toronto Pearson International Airport',   city: 'Toronto',       country: 'Canada',         iata: 'YYZ' },
  { name: 'Vancouver International Airport',         city: 'Vancouver',     country: 'Canada',         iata: 'YVR' },
  { name: 'Murtala Muhammed International Airport',  city: 'Lagos',         country: 'Nigeria',        iata: 'LOS' },
  { name: 'Nnamdi Azikiwe International Airport',    city: 'Abuja',         country: 'Nigeria',        iata: 'ABV' },
  { name: 'O.R. Tambo International Airport',        city: 'Johannesburg',  country: 'South Africa',   iata: 'JNB' },
  { name: 'Cape Town International Airport',         city: 'Cape Town',     country: 'South Africa',   iata: 'CPT' },
  { name: 'Jomo Kenyatta International Airport',     city: 'Nairobi',       country: 'Kenya',          iata: 'NBO' },
  { name: 'Cairo International Airport',             city: 'Cairo',         country: 'Egypt',          iata: 'CAI' },
  { name: 'Kotoka International Airport',            city: 'Accra',         country: 'Ghana',          iata: 'ACC' },
  { name: 'Mumbai Chhatrapati Shivaji Airport',      city: 'Mumbai',        country: 'India',          iata: 'BOM' },
  { name: 'Delhi Indira Gandhi International',       city: 'Delhi',         country: 'India',          iata: 'DEL' },
  { name: 'Bangkok Suvarnabhumi Airport',            city: 'Bangkok',       country: 'Thailand',       iata: 'BKK' },
  { name: 'Kuala Lumpur International Airport',      city: 'Kuala Lumpur',  country: 'Malaysia',       iata: 'KUL' },
  { name: 'Incheon International Airport',           city: 'Seoul',         country: 'South Korea',    iata: 'ICN' },
];

// LON is the IATA metropolitan area code for all London airports
const LON_IATAS = new Set(['LHR', 'LGW', 'STN', 'LTN', 'LCY']);

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json([]);

  const lower = q.toLowerCase();

  // "LON" → return all London airports
  if (lower === 'lon') {
    return NextResponse.json(AIRPORTS.filter(a => LON_IATAS.has(a.iata)));
  }

  // Try Supabase airports table first (populated after migration)
  // Supabase won't have terminals yet so we merge from built-in list
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('airports')
      .select('name, city, country, iata')
      .or(`name.ilike.%${q}%,city.ilike.%${q}%,iata.ilike.%${q}%`)
      .limit(8);
    if (!error && data && data.length > 0) {
      // Merge terminals from built-in list
      const enriched = data.map((row: any) => {
        const local = AIRPORTS.find(a => a.iata === row.iata);
        return local ? { ...row, terminals: local.terminals } : row;
      });
      return NextResponse.json(enriched);
    }
  } catch { /* table not yet created — fall through to built-in list */ }

  const results = AIRPORTS.filter(a =>
    a.iata.toLowerCase().startsWith(lower) ||
    a.city.toLowerCase().includes(lower) ||
    a.name.toLowerCase().includes(lower) ||
    a.country.toLowerCase().includes(lower)
  ).slice(0, 8);

  return NextResponse.json(results);
}
