/**
 * One-off compliance rules scraper.
 * Run: npx tsx scripts/scrape-compliance-rules.ts
 *
 * Uses Claude to extract structured prohibition/restriction rules from
 * official customs sources for key BootHop routes, then seeds the
 * compliance_rules table in Supabase.
 *
 * Sources covered:
 *   - HMRC (UK) — gov.uk
 *   - Nigeria Customs Service / NAFDAC
 *   - US CBP / USDA APHIS / FDA / DEA
 *   - EU customs (ec.europa.eu)
 *   - CITES (international wildlife trade)
 *
 * Run this once to seed the DB. Re-run periodically (e.g. quarterly) to
 * pick up rule changes.
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface ScrapedRule {
  from_region:  string;
  to_region:    string;
  item_keyword: string;
  category:     string;
  verdict:      'PERMITTED' | 'RESTRICTED' | 'PROHIBITED' | 'REVIEW_REQUIRED';
  explanation:  string;
  legal_ref:    string;
  confidence:   number;
}

// ── Route prompts — each asks Claude for structured rules per route ──────────

const ROUTE_QUERIES: Array<{ label: string; from: string; to: string; prompt: string }> = [
  {
    label: 'Nigeria → UK',
    from:  'NG',
    to:    'GB',
    prompt: `List all significant customs prohibited and restricted items when travelling from Nigeria to the United Kingdom. Include:
- Items that are completely PROHIBITED from entering the UK from Nigeria (e.g. khat, bush meat, ivory, fresh meat)
- Items that are RESTRICTED (require documentation, declarations, or have limits) e.g. medication, cash over £10,000, plants, cosmetics
- Any specific Nigerian items that often cause issues at UK border (e.g. suya, egusi, palm oil, ponmo, stockfish)
Focus on HMRC rules, UK Border Force guidance, CITES, and animal/plant health regulations.
Be specific and include legal references where known.`,
  },
  {
    label: 'UK → Nigeria',
    from:  'GB',
    to:    'NG',
    prompt: `List all significant customs prohibited and restricted items when travelling from the United Kingdom to Nigeria. Include:
- Items PROHIBITED from entering Nigeria from the UK
- Items RESTRICTED by NAFDAC (food, drugs, cosmetics, water, herbal products, medical devices)
- Items restricted by Nigerian Customs or SON (Standards Organisation of Nigeria) for electronics
- Cash/currency declaration requirements
- Used goods restrictions
Focus on Nigeria Customs Service rules, NAFDAC regulations, and SON requirements. Include legal references.`,
  },
  {
    label: 'USA → Nigeria',
    from:  'US',
    to:    'NG',
    prompt: `List all significant customs prohibited and restricted items when travelling from the USA to Nigeria. Include:
- Items PROHIBITED from entering Nigeria from the USA
- NAFDAC-regulated items (food, medication, cosmetics, supplements)
- SON-regulated electronics
- Currency declaration requirements (over $10,000 USD equivalent)
Include legal references to NAFDAC Act, Nigerian Customs Act, and SON regulations.`,
  },
  {
    label: 'Nigeria → USA',
    from:  'NG',
    to:    'US',
    prompt: `List all significant customs prohibited and restricted items when travelling from Nigeria to the USA. Include:
- Items PROHIBITED by CBP, USDA APHIS, or FDA from entering the USA from Nigeria
- Bush meat and African animal products
- Plant and agricultural restrictions (USDA)
- Medication rules (DEA, FDA - personal use limits, controlled substances)
- Cash declaration rules (over $10,000 USD - FinCEN 105)
- CITES-protected items common in Nigeria
Include specific legal references (CFR titles, USC sections).`,
  },
  {
    label: 'Africa → UK (general)',
    from:  'AFRICA',
    to:    'GB',
    prompt: `List customs prohibited and restricted items that apply broadly when travelling from ANY African country to the United Kingdom. This should cover rules that apply regardless of which specific African country (e.g. bush meat, ivory, wildlife products, fresh meat, plants without phytosanitary certificate). Include HMRC, CITES, and animal/plant health rules.`,
  },
  {
    label: 'Africa → EU (general)',
    from:  'AFRICA',
    to:    'EU',
    prompt: `List customs prohibited and restricted items that apply broadly when travelling from ANY African country to any EU member state. Include EU Regulation 338/97 (CITES), EC Regulation 1774/2002 (animal by-products), EU plant health rules, cash declaration rules (over €10,000), and personal import limits on food/drink/tobacco.`,
  },
  {
    label: 'Africa → USA (general)',
    from:  'AFRICA',
    to:    'US',
    prompt: `List customs prohibited and restricted items that apply broadly when travelling from ANY African country to the USA. Include USDA APHIS animal product rules, bush meat prohibition, CITES restrictions, FDA food import rules, and CBP cash declaration requirements.`,
  },
  {
    label: 'USA → Africa (general)',
    from:  'US',
    to:    'AFRICA',
    prompt: `List significant customs rules that apply broadly when travelling from the USA to African countries. Include common medication documentation requirements, electronics import rules, currency declaration thresholds, and any US export restrictions on items going to Africa (EAR99 items, ITAR-controlled goods).`,
  },
  {
    label: 'Ghana ↔ UK',
    from:  'GH',
    to:    'GB',
    prompt: `List significant prohibited and restricted items specific to the Ghana-UK travel corridor. Include items specific to Ghanaian culture/food that often cause issues at UK border (similar to Nigerian items but Ghana-specific). Include any items with specific Ghana Customs rules for export.`,
  },
  {
    label: 'Kenya ↔ UK',
    from:  'KE',
    to:    'GB',
    prompt: `List significant prohibited and restricted items for travel between Kenya and the UK. Include Kenya-specific exports (coffee, tea, fresh flowers, wildlife products) and UK import rules that specifically affect Kenyan travellers. Include KEBS (Kenya Bureau of Standards) regulations for imports into Kenya.`,
  },
];

const EXTRACTION_SYSTEM = `You are a customs and trade compliance expert.
Given a description of customs rules for a specific route, extract structured rule entries.

Respond ONLY with a valid JSON array. Each entry must have exactly these fields:
{
  "item_keyword": "single lowercase keyword or short phrase that would appear in an item description",
  "category": "food|medication|weapons|electronics|cash|animals|plants|cosmetics|wildlife|drugs|other",
  "verdict": "PERMITTED|RESTRICTED|PROHIBITED|REVIEW_REQUIRED",
  "explanation": "clear plain English explanation of the rule, 1-3 sentences, mentioning the specific law/regulation",
  "legal_ref": "specific legal reference e.g. HMRC Notice 701, NAFDAC Act Cap N1 LFN 2004, 21 USC 812",
  "confidence": number between 70-99 indicating how certain this rule is
}

Rules:
- item_keyword must be a single word or short phrase (2-4 words max) that a person would naturally use to describe an item
- Be specific: prefer "khat" over "drug", "ivory" over "animal product"
- Include both common names and technical terms as separate entries where useful
- Minimum confidence 70, maximum 99 (never 100)
- Return 5-20 rules per query — focus on most common/important items
- ONLY return the JSON array, no other text`;

async function extractRules(queryResult: string, from: string, to: string): Promise<ScrapedRule[]> {
  const msg = await claude.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 2000,
    system:     EXTRACTION_SYSTEM,
    messages:   [{ role: 'user', content: queryResult }],
  });

  const raw = msg.content[0].type === 'text' ? msg.content[0].text : '[]';
  // Strip markdown code fences if present
  const stripped = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const match = stripped.match(/\[[\s\S]*\]/);
  if (!match) {
    console.log('  No JSON array found. Raw (first 400 chars):');
    console.log('  ' + stripped.substring(0, 400).replace(/\n/g, '\n  '));
    return [];
  }

  try {
    const parsed = JSON.parse(match[0]) as Array<Record<string, unknown>>;
    return parsed
      .filter(r => r.item_keyword && r.verdict && r.explanation)
      .map(r => ({
        from_region:  from,
        to_region:    to,
        item_keyword: String(r.item_keyword).toLowerCase().trim(),
        category:     String(r.category ?? 'other'),
        verdict:      String(r.verdict) as ScrapedRule['verdict'],
        explanation:  String(r.explanation),
        legal_ref:    String(r.legal_ref ?? ''),
        confidence:   Number(r.confidence ?? 80),
      }));
  } catch {
    return [];
  }
}

async function getRulesForRoute(label: string, from: string, to: string, prompt: string): Promise<ScrapedRule[]> {
  console.log(`\nQuerying: ${label}...`);

  // Ask Claude to generate the compliance rules summary
  const summaryMsg = await claude.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 1500,
    system:     `You are a customs and trade compliance expert with comprehensive knowledge of international customs law.
Provide accurate, detailed information about customs regulations. Be specific about laws and regulations.
Do not hedge excessively — state what the actual rules are based on your training knowledge.`,
    messages:   [{ role: 'user', content: prompt }],
  });

  const summary = summaryMsg.content[0].type === 'text' ? summaryMsg.content[0].text : '';
  if (!summary) {
    console.log(`  No summary returned for ${label}`);
    return [];
  }

  console.log(`  Got summary (${summary.length} chars), extracting structured rules...`);

  // Extract structured rules from the summary
  const rules = await extractRules(summary, from, to);
  console.log(`  Extracted ${rules.length} rules`);
  return rules;
}

async function seedRules(rules: ScrapedRule[]): Promise<void> {
  if (rules.length === 0) return;

  // De-duplicate by (from, to, keyword) — keep highest confidence
  const deduped = new Map<string, ScrapedRule>();
  for (const rule of rules) {
    const key = `${rule.from_region}|${rule.to_region}|${rule.item_keyword}`;
    const existing = deduped.get(key);
    if (!existing || rule.confidence > existing.confidence) {
      deduped.set(key, rule);
    }
  }

  const toInsert = Array.from(deduped.values());

  // Insert in batches of 50
  for (let i = 0; i < toInsert.length; i += 50) {
    const batch = toInsert.slice(i, i + 50);
    const { error } = await supabase
      .from('compliance_rules')
      .upsert(batch, { onConflict: 'from_region,to_region,item_keyword' });
    if (error) console.error('Insert error:', error.message);
    else console.log(`  Inserted batch ${Math.floor(i / 50) + 1} (${batch.length} rules)`);
  }
}

async function main() {
  console.log('BootHop Compliance Rules Scraper');
  console.log('==================================');
  console.log(`Routes to process: ${ROUTE_QUERIES.length}`);
  console.log('Source: Claude knowledge base (HMRC, NAFDAC, CBP, EU Customs, CITES)\n');

  const allRules: ScrapedRule[] = [];

  for (const q of ROUTE_QUERIES) {
    try {
      const rules = await getRulesForRoute(q.label, q.from, q.to, q.prompt);
      allRules.push(...rules);
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 1500));
    } catch (e) {
      console.error(`Error on ${q.label}:`, e);
    }
  }

  console.log(`\nTotal rules scraped: ${allRules.length}`);
  console.log('Seeding Supabase compliance_rules table...');

  await seedRules(allRules);

  console.log('\nDone. Compliance rules database is now populated.');
  console.log('The AI safety check will now check this DB before calling Claude.');

  // Summary stats
  const byVerdict = allRules.reduce((acc, r) => {
    acc[r.verdict] = (acc[r.verdict] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log('\nVerdict breakdown:');
  for (const [v, count] of Object.entries(byVerdict)) {
    console.log(`  ${v}: ${count}`);
  }

  const byRoute = allRules.reduce((acc, r) => {
    const k = `${r.from_region} → ${r.to_region}`;
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log('\nRules by route:');
  for (const [route, count] of Object.entries(byRoute)) {
    console.log(`  ${route}: ${count}`);
  }
}

main().catch(console.error);
