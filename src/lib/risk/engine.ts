import { checkItemCompliance } from '@/lib/services/item-compliance';

export type RiskClassification = 'CLEARED' | 'STANDARD_REVIEW' | 'MANUAL_REVIEW' | 'EXTERNAL_VERIFICATION_REQUIRED' | 'REJECTED';

export interface RiskResult {
  score:          number;
  classification: RiskClassification;
  flags:          string[];
  breakdown:      Record<string, number>;
  reason?:        string;
}

/**
 * Pure risk scoring function — no side effects, no DB calls.
 * Takes all item_declaration fields and returns a risk result.
 *
 * Score thresholds:
 *   0–15  → CLEARED         (auto-approve, no inspection)
 *  16–55  → STANDARD_REVIEW (auto-unlock inspection, no admin needed)
 *  56–99  → MANUAL_REVIEW   (admin must approve before inspection)
 *   100   → REJECTED        (prohibited item, never reaches inspection)
 *
 * Manual-floor triggers (any one alone → minimum MANUAL_REVIEW):
 *  - currency, powder, or sender_owns_item === false
 */
export function scoreRisk(fields: Record<string, unknown>): RiskResult {
  // Hard reject — prohibited items
  if (fields.contains_weapons || fields.contains_hazardous) {
    return { score: 100, classification: 'REJECTED', flags: ['prohibited item'], breakdown: {}, reason: 'Prohibited items declared' };
  }
  if (fields.contains_chemical) {
    return { score: 100, classification: 'REJECTED', flags: ['chemical substances'], breakdown: {}, reason: 'Chemical substances declared' };
  }

  // External verification required — specific item types that legally need third-party clearance
  const value = Number(fields.declared_value ?? 0);
  if (fields.contains_plant_or_animal) {
    return { score: 85, classification: 'EXTERNAL_VERIFICATION_REQUIRED', flags: ['plant/animal — CITES/APHA clearance required'], breakdown: { plant_animal: 85 }, reason: 'Items containing plants or animals require external regulatory clearance before transport' };
  }
  if (fields.contains_currency && value > 1000) {
    return { score: 85, classification: 'EXTERNAL_VERIFICATION_REQUIRED', flags: ['currency above threshold — customs declaration required'], breakdown: { currency_high_value: 85 }, reason: 'Currency above £1,000 requires customs broker verification' };
  }

  // Category hard-block (GB→NG routes) — pass-through for missing category
  if (fields.item_category) {
    const cat = checkItemCompliance(fields.item_category as string, 'GB', 'NG', value);
    if (!cat.allowed) {
      return { score: 100, classification: 'REJECTED', flags: ['prohibited category'], breakdown: {}, reason: cat.reason };
    }
  }

  // MANUAL_REVIEW floor — any single flag forces minimum score of 60
  const manualFloorFlags: string[] = [];
  if (fields.contains_currency)        manualFloorFlags.push('currency');
  if (fields.contains_powder)          manualFloorFlags.push('powder');
  if (fields.sender_owns_item === false) manualFloorFlags.push('third-party item');

  let score = manualFloorFlags.length > 0 ? 60 : 0;
  const breakdown: Record<string, number> = {};
  const flags: string[] = [...manualFloorFlags];

  // Additional risk factors (cumulative)
  if (fields.item_modified) {
    score += 25; breakdown.item_modified = 25; flags.push('item modified');
  }
  if (fields.contains_medication) {
    score += 20; breakdown.medication = 20; flags.push('medication');
  }
  if (fields.contains_jewellery) {
    score += 18; breakdown.jewellery = 18; flags.push('jewellery');
  }
  if (fields.contains_battery) {
    score += 15; breakdown.battery = 15; flags.push('battery');
  }
  if (fields.contains_plant_or_animal) {
    score += 12; breakdown.plant_animal = 12; flags.push('plant/animal');
  }
  if (fields.contains_electronics) {
    score += 12; breakdown.electronics = 12;
  }
  if (fields.contains_food) {
    score += 5; breakdown.food = 5;
  }
  if (fields.contains_liquids) {
    score += 5; breakdown.liquids = 5;
  }

  // Declared value (exclusive brackets)
  if (value > 5000)       { score += 25; breakdown.high_value = 25; flags.push('high value'); }
  else if (value > 2000)  { score += 20; breakdown.high_value = 20; flags.push('high value'); }
  else if (value > 1000)  { score += 14; breakdown.high_value = 14; }
  else if (value > 500)   { score +=  8; breakdown.high_value =  8; }

  // Category review flag (not a hard-block, already checked above)
  if (fields.item_category) {
    const cat = checkItemCompliance(fields.item_category as string, 'GB', 'NG', value);
    if (cat.action === 'review') {
      score += 10; breakdown.category = 10;
      flags.push(`category: ${fields.item_category}`);
    }
  }

  score = Math.min(score, 99);

  const classification: RiskClassification =
    score >= 56 ? 'MANUAL_REVIEW' :
    score >= 16 ? 'STANDARD_REVIEW' :
    'CLEARED';

  return { score, classification, flags, breakdown };
}
