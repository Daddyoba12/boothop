// BootHop Item Classifier
// Maps user-entered item descriptions to a normalised category
// used by the risk engine and rules DB matching.

export type ItemCategory =
  | 'weapon'
  | 'drug'
  | 'flammable'
  | 'lithium'
  | 'food'
  | 'medication'
  | 'electronics'
  | 'animal'
  | 'plant'
  | 'tobacco'
  | 'alcohol'
  | 'document'
  | 'clothing'
  | 'cosmetic'
  | 'general';

interface ClassifierRule {
  keywords: string[];
  category: ItemCategory;
}

const rules: ClassifierRule[] = [
  // High-risk
  {
    keywords: ['gun', 'rifle', 'pistol', 'weapon', 'knife', 'blade', 'sword', 'firearm', 'ammunition', 'ammo', 'grenade', 'explosive', 'bomb'],
    category: 'weapon',
  },
  {
    keywords: ['drug', 'drugs', 'cocaine', 'heroin', 'cannabis', 'marijuana', 'meth', 'narcotic', 'weed', 'ecstasy', 'mdma', 'ketamine'],
    category: 'drug',
  },
  // Flammable / dangerous goods
  {
    keywords: ['perfume', 'cologne', 'aftershave', 'nail polish', 'lighter', 'aerosol', 'spray', 'petrol', 'fuel', 'alcohol (liquid)', 'paint', 'solvent'],
    category: 'flammable',
  },
  {
    keywords: ['battery', 'batteries', 'lithium', 'power bank', 'powerbank', 'e-scooter', 'hoverboard'],
    category: 'lithium',
  },
  // Food & perishables
  {
    keywords: ['food', 'meat', 'beef', 'pork', 'chicken', 'fish', 'dairy', 'milk', 'cheese', 'egg', 'fruit', 'vegetable', 'snack', 'biscuit', 'bread', 'cake', 'rice', 'pasta', 'sauce', 'spice'],
    category: 'food',
  },
  // Medication
  {
    keywords: ['medicine', 'medication', 'tablet', 'pill', 'capsule', 'prescription', 'antibiotic', 'painkiller', 'drug (medical)', 'supplement', 'vitamin', 'insulin', 'inhaler'],
    category: 'medication',
  },
  // Electronics
  {
    keywords: ['phone', 'laptop', 'computer', 'tablet', 'ipad', 'iphone', 'samsung', 'camera', 'drone', 'electronic', 'charger', 'headphone', 'earphone', 'watch', 'smartwatch'],
    category: 'electronics',
  },
  // Animals / plants
  {
    keywords: ['animal', 'dog', 'cat', 'bird', 'fish (live)', 'reptile', 'insect', 'pet'],
    category: 'animal',
  },
  {
    keywords: ['plant', 'seed', 'soil', 'flower', 'tree', 'cutting', 'bulb'],
    category: 'plant',
  },
  // Tobacco / alcohol
  {
    keywords: ['cigarette', 'tobacco', 'cigar', 'vape', 'e-cigarette', 'shisha'],
    category: 'tobacco',
  },
  {
    keywords: ['wine', 'beer', 'whisky', 'vodka', 'spirits', 'alcohol', 'rum', 'gin', 'champagne'],
    category: 'alcohol',
  },
  // Low-risk
  {
    keywords: ['document', 'letter', 'passport', 'certificate', 'papers', 'form', 'envelope'],
    category: 'document',
  },
  {
    keywords: ['clothes', 'clothing', 'shirt', 'trousers', 'shoes', 'dress', 'jacket', 'coat'],
    category: 'clothing',
  },
  {
    keywords: ['cosmetic', 'makeup', 'lipstick', 'foundation', 'moisturiser', 'cream', 'lotion', 'shampoo', 'soap'],
    category: 'cosmetic',
  },
];

export function classifyItem(item: string): ItemCategory {
  const lower = item.toLowerCase().trim();

  for (const rule of rules) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return rule.category;
    }
  }

  return 'general';
}

// Map category → base risk score contribution
export const categoryRiskScore: Record<ItemCategory, number> = {
  weapon:      90,
  drug:        95,
  explosive:   95, // in case needed
  flammable:   40,
  lithium:     35,
  food:        25,
  medication:  30,
  electronics: 15,
  animal:      35,
  plant:       20,
  tobacco:     25,
  alcohol:     20,
  document:     5,
  clothing:     5,
  cosmetic:    15,
  general:     10,
} as Record<ItemCategory, number>;
