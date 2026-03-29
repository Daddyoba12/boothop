// BootHop Compliance Rules Database — 20 countries
// Keys match the country names used in the delivery request form

export interface CountryRules {
  prohibited: string[];
  restricted: string[];
}

export const rulesDB: Record<string, CountryRules> = {
  'United Kingdom': {
    prohibited: [
      'drugs', 'narcotics', 'offensive weapons', 'pepper spray',
      'counterfeit goods', 'fake currency', 'explosives',
    ],
    restricted: [
      'meat', 'dairy', 'plants', 'firearms', 'batteries',
      'food', 'medications', 'animal products',
    ],
  },
  'Nigeria': {
    prohibited: [
      'weapons', 'narcotics', 'drugs', 'used clothing',
      'fake currency', 'explosives', 'counterfeit goods',
    ],
    restricted: [
      'food', 'medications', 'electronics', 'poultry',
      'sugar', 'medicines',
    ],
  },
  'United States': {
    prohibited: [
      'drugs', 'narcotics', 'counterfeit goods', 'fake currency',
    ],
    restricted: [
      'food', 'plants', 'animals', 'medications', 'firearms',
      'tobacco', 'alcohol',
    ],
  },
  'Canada': {
    prohibited: [
      'weapons', 'illegal drugs', 'narcotics', 'explosives',
    ],
    restricted: [
      'food', 'plants', 'firearms', 'medications',
      'alcohol', 'tobacco',
    ],
  },
  'Germany': {
    prohibited: [
      'narcotics', 'weapons', 'nazi symbols', 'counterfeit goods',
    ],
    restricted: [
      'food', 'plants', 'medications', 'firearms',
      'tobacco', 'animals',
    ],
  },
  'France': {
    prohibited: [
      'drugs', 'counterfeit goods', 'weapons', 'explosives',
    ],
    restricted: [
      'food', 'animals', 'plants', 'medications', 'tobacco',
    ],
  },
  'UAE': {
    prohibited: [
      'drugs', 'pornography', 'gambling items', 'pork products',
      'alcohol (large quantities)', 'weapons', 'counterfeit goods',
    ],
    restricted: [
      'medications', 'electronics', 'religious materials',
      'e-cigarettes', 'vapes',
    ],
  },
  'Saudi Arabia': {
    prohibited: [
      'alcohol', 'drugs', 'pornography', 'weapons',
      'pork products', 'gambling materials',
    ],
    restricted: [
      'medications', 'electronics', 'religious materials',
      'religious books (non-islamic)',
    ],
  },
  'China': {
    prohibited: [
      'weapons', 'toxic materials', 'drugs', 'explosives',
      'counterfeit goods',
    ],
    restricted: [
      'food', 'electronics', 'medications', 'plants',
      'animals', 'radio equipment',
    ],
  },
  'India': {
    prohibited: [
      'narcotics', 'weapons', 'explosives', 'counterfeit goods',
    ],
    restricted: [
      'electronics', 'food', 'medications', 'plants',
      'gold (above limit)', 'tobacco',
    ],
  },
  'Australia': {
    prohibited: [
      'drugs', 'weapons', 'explosives', 'counterfeit goods',
    ],
    restricted: [
      'food', 'plants', 'animals', 'seeds', 'soil',
      'medications', 'firearms',
    ],
  },
  'South Africa': {
    prohibited: [
      'narcotics', 'weapons', 'explosives', 'counterfeit goods',
    ],
    restricted: [
      'food', 'medications', 'plants', 'animals',
      'firearms', 'tobacco',
    ],
  },
  'Kenya': {
    prohibited: [
      'drugs', 'weapons', 'counterfeit goods', 'explosives',
    ],
    restricted: [
      'food', 'electronics', 'medications', 'plants',
    ],
  },
  'Ghana': {
    prohibited: [
      'narcotics', 'weapons', 'counterfeit goods', 'explosives',
    ],
    restricted: [
      'food', 'electronics', 'medications',
    ],
  },
  'Netherlands': {
    prohibited: [
      'drugs (hard)', 'weapons', 'explosives',
    ],
    restricted: [
      'food', 'plants', 'medications', 'firearms',
      'soft drugs (non-eu)',
    ],
  },
  'Italy': {
    prohibited: [
      'narcotics', 'counterfeit goods', 'weapons',
    ],
    restricted: [
      'food', 'plants', 'animals', 'medications',
    ],
  },
  'Spain': {
    prohibited: [
      'drugs', 'weapons', 'explosives',
    ],
    restricted: [
      'food', 'animals', 'plants', 'medications',
    ],
  },
  'Ireland': {
    prohibited: [
      'weapons', 'illegal drugs', 'explosives',
    ],
    restricted: [
      'food', 'plants', 'medications', 'firearms',
    ],
  },
  'Singapore': {
    prohibited: [
      'drugs', 'chewing gum', 'weapons', 'explosives',
      'fireworks', 'pornography',
    ],
    restricted: [
      'medications', 'electronics', 'cigarettes',
      'tobacco', 'e-cigarettes',
    ],
  },
  'Japan': {
    prohibited: [
      'narcotics', 'weapons', 'explosives', 'counterfeit goods',
    ],
    restricted: [
      'food', 'medications', 'plants', 'animals',
      'certain electronics',
    ],
  },
};

// Country risk tier — affects risk score
export const countryRiskTier: Record<string, 'strict' | 'moderate' | 'standard'> = {
  'UAE':          'strict',
  'Saudi Arabia': 'strict',
  'Singapore':    'strict',
  'China':        'moderate',
  'Nigeria':      'moderate',
  'India':        'moderate',
  'United Kingdom': 'standard',
  'United States':  'standard',
  'Canada':         'standard',
  'Australia':      'standard',
  'Germany':        'standard',
  'France':         'standard',
  'Italy':          'standard',
  'Spain':          'standard',
  'Netherlands':    'standard',
  'Ireland':        'standard',
  'Japan':          'standard',
  'South Africa':   'standard',
  'Kenya':          'standard',
  'Ghana':          'standard',
};
