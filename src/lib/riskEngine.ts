// BootHop Risk Engine
// Calculates a risk score (0–100) based on item type, country, user behaviour, value & quantity

import { classifyItem, categoryRiskScore, ItemCategory } from './classifier';
import { countryRiskTier } from '@/data/complianceRules';

export interface RiskInput {
  item:     string;
  country:  string;
  value?:   number;   // declared item value in GBP
  quantity?: number;  // number of units / approximate weight
  user?: {
    verified: boolean;
    isNew:    boolean;   // account < 30 days or 0 deliveries
    flagged:  boolean;   // previously flagged by admin
  };
}

export interface RiskOutput {
  score:    number;       // 0–100
  category: ItemCategory;
  breakdown: {
    itemScore:     number;
    countryScore:  number;
    userScore:     number;
    valueScore:    number;
    quantityScore: number;
  };
}

export function calculateRisk(input: RiskInput): RiskOutput {
  const { item, country, value = 0, quantity = 1, user } = input;

  const category   = classifyItem(item);
  let itemScore    = categoryRiskScore[category] ?? 10;

  // ── Country risk ──────────────────────────────────────────────────────────
  const tier = countryRiskTier[country] ?? 'standard';
  const countryScore =
    tier === 'strict'   ? 25 :
    tier === 'moderate' ? 15 :
                          5;

  // ── User behaviour ────────────────────────────────────────────────────────
  let userScore = 0;
  if (user) {
    if (!user.verified) userScore += 40;
    if (user.isNew)     userScore += 20;
    if (user.flagged)   userScore += 50;
    if (user.verified)  userScore -= 20;
  } else {
    // Unknown user — treat as unverified new user
    userScore = 30;
  }
  userScore = Math.max(userScore, 0);

  // ── Value risk ────────────────────────────────────────────────────────────
  const valueScore =
    value > 2000 ? 30 :
    value > 500  ? 20 :
    value > 100  ? 10 :
                    0;

  // ── Quantity risk ─────────────────────────────────────────────────────────
  const quantityScore =
    quantity > 20 ? 30 :
    quantity > 5  ? 15 :
                     0;

  const raw   = itemScore + countryScore + userScore + valueScore + quantityScore;
  const score = Math.min(Math.max(Math.round(raw), 0), 100);

  return {
    score,
    category,
    breakdown: { itemScore, countryScore, userScore, valueScore, quantityScore },
  };
}
