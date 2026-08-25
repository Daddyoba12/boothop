/**
 * Compliance DB lookup — checks local rules + cache before hitting Claude.
 * Order: compliance_rules (static) → compliance_cache (Claude results) → Claude
 */

import { createAdminClient } from '@/lib/supabase/admin';

export type ComplianceVerdict = 'PERMITTED' | 'RESTRICTED' | 'PROHIBITED' | 'REVIEW_REQUIRED';

export interface DBLookupResult {
  verdict:        ComplianceVerdict;
  explanation:    string;
  tips:           string[];
  requiresReview: boolean;
  riskScore:      number;
  source:         'rules_db' | 'cache';
  legalRef?:      string;
}

// African country ISO codes for region matching
const AFRICA_CODES = new Set([
  'NG','GH','KE','ZA','SN','CI','CM','TZ','ET','UG','RW','BJ','TG','MZ',
  'ZM','ZW','MW','AO','BW','NA','LS','SZ','MU','SC','MG','ML','BF','NE',
  'TD','CF','GA','CG','CD','GQ','ST','ER','DJ','SO','SS','SD','LY','TN',
  'DZ','MA','EG','MR','GM','GW','SL','LR','GN','CV','KM',
]);

// EU member state ISO codes
const EU_CODES = new Set([
  'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU',
  'IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE',
]);

/** Normalise item text for consistent matching and cache key */
export function normalizeItem(item: string): string {
  return item.toLowerCase().trim().replace(/\s+/g, ' ').slice(0, 120);
}

/** Map a specific country to its region codes for broad rule matching */
function regionVariants(countryCode: string): string[] {
  const variants = [countryCode, 'ANY'];
  if (AFRICA_CODES.has(countryCode)) variants.push('AFRICA');
  if (EU_CODES.has(countryCode))     variants.push('EU');
  return variants;
}

/**
 * Check the static compliance_rules table first.
 * Searches every keyword in the item description against stored patterns.
 */
export async function checkRulesDB(
  item: string,
  fromCountry: string,
  toCountry:   string,
): Promise<DBLookupResult | null> {
  const supabase    = createAdminClient();
  const normalized  = normalizeItem(item);
  const keywords    = normalized.split(/\s+/).filter(w => w.length >= 3);
  const fromRegions = regionVariants(fromCountry.toUpperCase());
  const toRegions   = regionVariants(toCountry.toUpperCase());

  // Fetch all active rules for this route (broad set, filter in JS)
  const { data: rules, error } = await supabase
    .from('compliance_rules')
    .select('verdict, explanation, legal_ref, item_keyword, confidence, category')
    .eq('active', true)
    .in('from_region', fromRegions)
    .in('to_region',   toRegions);

  if (error || !rules || rules.length === 0) return null;

  // Find rules whose keyword appears in the item description
  const VERDICT_PRIORITY: Record<string, number> = {
    PROHIBITED:       4,
    REVIEW_REQUIRED:  3,
    RESTRICTED:       2,
    PERMITTED:        1,
  };

  let best: typeof rules[0] | null = null;

  for (const rule of rules) {
    const kw = rule.item_keyword.toLowerCase();
    const matches = keywords.some(w => kw.includes(w) || w.includes(kw)) ||
                    normalized.includes(kw);
    if (!matches) continue;
    if (!best || VERDICT_PRIORITY[rule.verdict] > VERDICT_PRIORITY[best.verdict]) {
      best = rule;
    }
    // Short-circuit if we already found a PROHIBITED rule with high confidence
    if (best.verdict === 'PROHIBITED' && best.confidence >= 95) break;
  }

  if (!best) return null;

  const riskMap: Record<string, number> = {
    PROHIBITED: 90, REVIEW_REQUIRED: 65, RESTRICTED: 40, PERMITTED: 10,
  };

  return {
    verdict:        best.verdict as ComplianceVerdict,
    explanation:    best.explanation,
    tips:           buildTips(best.verdict as ComplianceVerdict, best.category, toCountry),
    requiresReview: best.verdict === 'REVIEW_REQUIRED' || best.verdict === 'PROHIBITED',
    riskScore:      riskMap[best.verdict] ?? 50,
    source:         'rules_db',
    legalRef:       best.legal_ref ?? undefined,
  };
}

/**
 * Check the compliance_cache for a previous Claude response on this exact item+route.
 * Increments hit_count so we can track what's being looked up most.
 */
export async function checkCache(
  item: string,
  fromCountry: string,
  toCountry:   string,
): Promise<DBLookupResult | null> {
  const supabase   = createAdminClient();
  const normalized = normalizeItem(item);

  const { data, error } = await supabase
    .from('compliance_cache')
    .select('verdict, explanation, tips, requires_review, risk_score')
    .eq('item_normalized', normalized)
    .eq('from_country',    fromCountry.toUpperCase())
    .eq('to_country',      toCountry.toUpperCase())
    .single();

  if (error || !data) return null;

  // Fire-and-forget hit counter bump
  supabase.rpc('bump_compliance_cache_hit', {
    p_item: normalized,
    p_from: fromCountry.toUpperCase(),
    p_to:   toCountry.toUpperCase(),
  }).then(() => {}).catch(() => {});

  return {
    verdict:        data.verdict as ComplianceVerdict,
    explanation:    data.explanation ?? '',
    tips:           Array.isArray(data.tips) ? data.tips : [],
    requiresReview: data.requires_review ?? false,
    riskScore:      data.risk_score ?? 50,
    source:         'cache',
  };
}

/**
 * Store a Claude response in the cache for future reuse.
 */
export async function storeInCache(
  item:           string,
  fromCountry:    string,
  toCountry:      string,
  verdict:        ComplianceVerdict,
  explanation:    string,
  tips:           string[],
  requiresReview: boolean,
  riskScore:      number,
  category:       string,
): Promise<void> {
  const supabase   = createAdminClient();
  const normalized = normalizeItem(item);

  await supabase
    .from('compliance_cache')
    .upsert(
      {
        item_normalized: normalized,
        from_country:    fromCountry.toUpperCase(),
        to_country:      toCountry.toUpperCase(),
        verdict,
        explanation,
        tips,
        requires_review: requiresReview,
        risk_score:      riskScore,
        category,
        hit_count:       1,
        last_hit_at:     new Date().toISOString(),
      },
      { onConflict: 'item_normalized,from_country,to_country' },
    );
}

/** Build contextual tips based on verdict */
function buildTips(verdict: ComplianceVerdict, category: string | null, toCountry: string): string[] {
  const tips: string[] = [];
  if (verdict === 'PROHIBITED') {
    tips.push('Do not attempt to send this item — it may be seized and the sender could face legal consequences.');
    tips.push('Contact the BootHop compliance team if you believe this classification is incorrect for your specific item.');
  } else if (verdict === 'RESTRICTED') {
    tips.push('Always carry original documentation (receipts, prescriptions, certificates) with the item.');
    tips.push('Declare the item honestly at customs — failure to declare can result in seizure even for permitted items.');
    if (category === 'medication') {
      tips.push('Carry medication in original pharmacy packaging with your name on the label.');
    }
    if (category === 'cash') {
      tips.push('Complete the customs declaration form before arrival — there is no penalty for declaring cash, only for not declaring it.');
    }
  } else if (verdict === 'PERMITTED') {
    tips.push('Still declare the item if its value exceeds the duty-free threshold for the destination country.');
    tips.push('Keep receipts as proof of value in case customs asks.');
  } else {
    tips.push('Contact BootHop support before sending — our compliance team will advise on documentation required.');
    tips.push('Do not send until you have received written confirmation from BootHop compliance.');
  }
  return tips;
}
