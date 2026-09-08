import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
- Return 5-20 rules per query - focus on most common/important items
- ONLY return the JSON array, no other text`;

// Simulate what getRulesForRoute would produce for Nigeria->UK
const SAMPLE_SUMMARY = `
When travelling from Nigeria to the United Kingdom, there are several key customs and border requirements to be aware of:

**Prohibited Items:**
1. **Khat (Catha edulis)**: Classified as a Class C controlled substance under the Misuse of Drugs Act 1971 (as amended in 2014). Khat is completely prohibited in the UK and cannot be brought in from Nigeria.
2. **Bush meat and wild animal products**: All bush meat (including bushmeat such as monkey, pangolin, or other wild animals) is strictly prohibited under the UK's animal health regulations and CITES. This includes dried, smoked, or preserved forms.
3. **Ivory and elephant products**: Prohibited under CITES Appendix I and the UK Ivory Act 2018. Nearly all ivory trade is banned.
4. **Fresh meat and poultry**: Fresh, chilled, or frozen meat from Nigeria is prohibited under UK animal health rules (retained EU Regulation 2002/99/EC) due to animal disease risk.
5. **Endangered species products**: Any products from CITES-listed species (wildlife, plants, timber) require permits or are banned outright.

**Restricted Items (require documentation or have limits):**
6. **Prescription medication**: Controlled drugs require a Home Office license. All prescription medications should be carried with a valid prescription, ideally in original packaging. The 3-month personal supply rule applies.
7. **Cash and monetary instruments**: Sums of GBP 10,000 or more (or equivalent) must be declared to UK Border Force under the Proceeds of Crime Act 2002 and UK customs regulations.
8. **Plants and plant products**: Most plants, seeds, and plant material from Nigeria require a phytosanitary certificate (issued by Nigerian authorities) to enter the UK. EU Phytosanitary Directive (retained in UK law).
9. **Traditional food items**: Items like suya (dried/spiced meat), egusi (melon seeds), stockfish, and ponmo (cow skin) face varying restrictions. Dried plant-based foods are generally allowed but meat products are not. Palm oil in sealed commercial containers is usually fine.
10. **Alcohol**: Limited to 1 liter of spirits over 22% ABV or 2 liters of wine/lower-strength alcohol duty-free (HMRC Notice 1).
11. **Tobacco**: Cigarettes (200) or cigars (50) duty-free allowance (HMRC Notice 1).
12. **Cosmetics and herbal products**: NAFDAC-regulated products from Nigeria may face scrutiny at UK border. Products with unregistered ingredients or making medicinal claims may be seized.
13. **Electronic devices**: No specific Nigeria-UK restrictions, but commercial quantities may require customs declaration.
`;

async function main() {
  console.log(`Input summary length: ${SAMPLE_SUMMARY.length} chars`);
  console.log('Sending to Claude for extraction...\n');

  const msg = await claude.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: EXTRACTION_SYSTEM,
    messages: [{ role: 'user', content: SAMPLE_SUMMARY }],
  });

  console.log('stop_reason:', msg.stop_reason);
  console.log('content blocks:', msg.content.length);
  console.log('content[0].type:', msg.content[0]?.type);

  const raw = msg.content[0].type === 'text' ? msg.content[0].text : '[]';
  console.log('\nraw length:', raw.length);
  console.log('raw first 50 chars (codes):');
  for (let i = 0; i < Math.min(50, raw.length); i++) {
    process.stdout.write(`[${raw.charCodeAt(i)}:${raw[i]}]`);
  }
  console.log('\n');

  const stripped = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  console.log('stripped length:', stripped.length);
  console.log('stripped first 200:', stripped.substring(0, 200));

  const match = stripped.match(/\[[\s\S]*\]/);
  console.log('\nregex match found:', !!match);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      console.log('parsed count:', parsed.length);
      if (parsed.length > 0) console.log('first rule:', JSON.stringify(parsed[0], null, 2));
    } catch (e: any) {
      console.log('parse error:', e.message);
      console.log('match[0] first 200:', match[0].substring(0, 200));
    }
  }
}

main().catch(console.error);
