// ── Prohibited items (always blocked) ─────────────────────────────────────
const PROHIBITED_ITEMS = new Set([
  'weapons', 'firearms', 'ammunition', 'explosives', 'knives',
  'drugs', 'narcotics', 'controlled_substances', 'illegal_substances',
  'pornographic_material', 'counterfeit_goods', 'fake_goods',
  'human_trafficking_materials', 'hazardous_chemicals', 'radioactive',
  'stolen_goods',
]);

// ── Base risk score by item category ──────────────────────────────────────
const ITEM_RISK: Record<string, number> = {
  documents:   10,
  clothing:    10,
  cosmetics:   10,
  books:       10,
  toys:        10,
  food:        20,
  perfume:     20,
  alcohol:     30,
  electronics: 30,
  art:         30,
  medicine:    40,
  tobacco:     40,
  antiques:    50,
  jewellery:   50,
  cash:        80,
};

// ── Route-specific overrides ───────────────────────────────────────────────
type RouteAction = 'allow' | 'review' | 'block';

const ROUTE_RULES: Record<string, Record<string, RouteAction>> = {
  'GB-NG': {
    medicine:    'review',
    cash:        'block',
    jewellery:   'review',
    electronics: 'review',
    tobacco:     'block',
    alcohol:     'block',
  },
  'NG-GB': {
    cash:      'block',
    jewellery: 'review',
    medicine:  'review',
    food:      'review',
  },
  'US-NG': {
    cash:        'block',
    medicine:    'review',
    electronics: 'review',
  },
  'NG-US': {
    cash:     'block',
    medicine: 'review',
  },
  'GB-US': { cash: 'review' },
  'US-GB': { cash: 'review' },
};

// ── Result type ────────────────────────────────────────────────────────────
export interface ComplianceResult {
  allowed:   boolean;
  action:    RouteAction | 'block';
  reason?:   string;
  riskScore: number;
}

// ── Main check ─────────────────────────────────────────────────────────────
export function checkItemCompliance(
  itemCategory: string,
  fromCountry:  string,
  toCountry:    string,
  declaredValue = 0
): ComplianceResult {
  const cat = (itemCategory ?? '').toLowerCase().replace(/[\s-]/g, '_');

  if (PROHIBITED_ITEMS.has(cat)) {
    return {
      allowed:   false,
      action:    'block',
      reason:    `${itemCategory} is prohibited on the BootHop platform`,
      riskScore: 100,
    };
  }

  const baseRisk  = ITEM_RISK[cat] ?? 20;
  const valueRisk = declaredValue > 2000 ? 40 : declaredValue > 500 ? 20 : 0;

  const routeKey    = `${fromCountry.toUpperCase()}-${toCountry.toUpperCase()}`;
  const routeRule   = ROUTE_RULES[routeKey];
  const routeAction = routeRule?.[cat] as RouteAction | undefined;

  if (routeAction === 'block') {
    return {
      allowed:   false,
      action:    'block',
      reason:    `${itemCategory} is not permitted on the ${fromCountry}→${toCountry} route`,
      riskScore: 100,
    };
  }

  const totalRisk = Math.min(baseRisk + valueRisk, 100);

  if (routeAction === 'review' || totalRisk >= 60) {
    return {
      allowed:   true,
      action:    'review',
      reason:    routeAction === 'review'
        ? `${itemCategory} requires manual review for this route`
        : `High-value or high-risk item flagged for review`,
      riskScore: totalRisk,
    };
  }

  return { allowed: true, action: 'allow', riskScore: totalRisk };
}
