import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type {
  CustomsInput,
  DutyEstimate,
  RiskAssessment,
  RiskLevel,
  AIClassificationResult,
} from './types';

const HANDLING_FEE_BASE = 15;
const HANDLING_FEE_PERCENT = 0.005;
const DISCLAIMER =
  'Estimated import charges only. Actual duties and taxes may vary based on customs inspection, final classification, and HMRC assessment. BootHop is not liable for final duty amounts.';

export async function estimateDutyFromRules(
  input: CustomsInput,
  category: string
): Promise<DutyEstimate> {
  const supabase = createSupabaseAdminClient();
  const valueGBP = convertToGBP(input.declaredValue, input.currency);

  const { data: rule } = await supabase
    .from('duty_rules')
    .select('*, item_categories!inner(name)')
    .eq('origin_country', input.originCountry)
    .eq('destination_country', input.destinationCountry)
    .eq('item_categories.name', category)
    .eq('is_active', true)
    .single();

  const vatRate = rule?.vat_rate ?? getDefaultVAT(input.destinationCountry);
  const dutyRate = rule?.duty_rate ?? getDefaultDuty(category);
  const deMinimis = rule?.de_minimis_threshold ?? getDefaultDeMinimis(input.destinationCountry);

  if (valueGBP <= deMinimis) {
    return {
      estimatedVAT: 0,
      estimatedDuty: 0,
      estimatedHandling: 0,
      estimatedTotal: 0,
      landedCost: round2(valueGBP),
      method: 'rules_engine',
      currency: 'GBP',
      breakdown: { baseValue: round2(valueGBP), vatRate: 0, dutyRate: 0, handlingFee: 0 },
      disclaimer: DISCLAIMER,
    };
  }

  const estimatedDuty = (valueGBP * dutyRate) / 100;
  const estimatedVAT = ((valueGBP + estimatedDuty) * vatRate) / 100;
  const handlingFee =
    valueGBP > 10000
      ? Math.max(HANDLING_FEE_BASE, valueGBP * HANDLING_FEE_PERCENT)
      : HANDLING_FEE_BASE;
  const estimatedTotal = estimatedVAT + estimatedDuty + handlingFee;

  return {
    estimatedVAT: round2(estimatedVAT),
    estimatedDuty: round2(estimatedDuty),
    estimatedHandling: round2(handlingFee),
    estimatedTotal: round2(estimatedTotal),
    landedCost: round2(valueGBP + estimatedTotal),
    method: 'rules_engine',
    currency: 'GBP',
    breakdown: {
      baseValue: round2(valueGBP),
      vatRate,
      dutyRate,
      handlingFee: round2(handlingFee),
    },
    disclaimer: DISCLAIMER,
  };
}

export function assessRisk(
  input: CustomsInput,
  aiResult: AIClassificationResult,
  valueGBP: number
): RiskAssessment {
  let riskScore = 0;
  const flags: string[] = [...(aiResult.flags ?? [])];
  const actions: string[] = [];

  if (valueGBP > 50000)      riskScore += 40;
  else if (valueGBP > 10000) riskScore += 30;
  else if (valueGBP > 5000)  riskScore += 20;
  else if (valueGBP > 1000)  riskScore += 10;

  const highRisk   = ['jewellery_gold', 'watches_luxury', 'artwork'];
  const mediumRisk = ['luxury_bag', 'jewellery_silver', 'electronics'];
  if (highRisk.includes(aiResult.detectedCategory))        riskScore += 25;
  else if (mediumRisk.includes(aiResult.detectedCategory)) riskScore += 15;

  if (aiResult.confidenceScore < 0.6) {
    riskScore += 10;
    if (!flags.includes('UNCLASSIFIED_ITEM')) flags.push('UNCLASSIFIED_ITEM');
  }

  const requiresAMLReview = valueGBP >= 10000;
  if (requiresAMLReview) {
    riskScore += 20;
    if (!flags.includes('AML_THRESHOLD')) flags.push('AML_THRESHOLD');
    actions.push('AML review required — admin must approve before shipment proceeds');
  }

  const invoiceCategories = ['luxury_bag', 'jewellery_gold', 'jewellery_silver', 'watches_luxury', 'artwork'];
  const requiresInvoice =
    invoiceCategories.includes(aiResult.detectedCategory) || valueGBP > 5000;
  if (requiresInvoice) {
    if (!flags.includes('NO_INVOICE')) flags.push('NO_INVOICE');
    actions.push('Invoice upload required before shipment proceeds');
  }

  const requiresEnhancedID =
    valueGBP > 10000 ||
    ['jewellery_gold', 'watches_luxury', 'artwork'].includes(aiResult.detectedCategory);
  if (requiresEnhancedID) {
    actions.push('Enhanced ID verification required');
  }

  riskScore = Math.min(riskScore, 100);

  const riskLevel: RiskLevel =
    riskScore >= 70 ? 'critical'
    : riskScore >= 50 ? 'high'
    : riskScore >= 25 ? 'medium'
    : 'low';

  return {
    riskScore,
    riskLevel,
    flags: [...new Set(flags)],
    requiresAMLReview,
    requiresInvoice,
    requiresEnhancedID,
    actions,
  };
}

function getDefaultVAT(destinationCountry: string): number {
  const rates: Record<string, number> = {
    GB: 20, DE: 19, FR: 20, IT: 22, ES: 21,
    US: 0,  AE: 5,  NG: 7.5, GH: 15, KE: 16, ZA: 15,
  };
  return rates[destinationCountry] ?? 20;
}

function getDefaultDuty(category: string): number {
  const rates: Record<string, number> = {
    luxury_bag: 3.5, jewellery_gold: 2.5, jewellery_silver: 2.5,
    watches_luxury: 4.5, electronics: 0, clothing: 12, footwear: 3,
    perfume: 6.5, artwork: 0, food: 5, documents: 0, other: 3.5,
  };
  return rates[category] ?? 3.5;
}

function getDefaultDeMinimis(destinationCountry: string): number {
  const thresholds: Record<string, number> = {
    GB: 135, NG: 50, GH: 50, KE: 50, ZA: 500,
    DE: 150, FR: 150, IT: 150, ES: 150, US: 800, AE: 0,
  };
  return thresholds[destinationCountry] ?? 135;
}

export function convertToGBP(value: number, currency: string): number {
  if (currency === 'GBP') return value;
  const rates: Record<string, number> = {
    USD: 0.79, EUR: 0.86, AED: 0.21, NGN: 0.00048,
    CHF: 0.90, JPY: 0.0053, GHS: 0.063, KES: 0.0062, ZAR: 0.043,
  };
  return value * (rates[currency] ?? 1);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
