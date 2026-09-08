import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const EXTRACTION_SYSTEM = `You are a customs and trade compliance expert.
Given a description of customs rules for a specific route, extract structured rule entries.

Respond ONLY with a valid JSON array. Each entry must have exactly these fields:
{
  "item_keyword": "single lowercase keyword or short phrase",
  "category": "food|medication|weapons|electronics|cash|animals|plants|cosmetics|wildlife|drugs|other",
  "verdict": "PERMITTED|RESTRICTED|PROHIBITED|REVIEW_REQUIRED",
  "explanation": "1-3 sentence plain English explanation",
  "legal_ref": "specific legal reference",
  "confidence": 85
}

Return 5-10 rules. ONLY return the JSON array, no other text.`;

async function main() {
  const msg = await claude.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system: EXTRACTION_SYSTEM,
    messages: [{
      role: 'user',
      content: 'Nigeria to UK: khat is prohibited by Misuse of Drugs Act 1971. Fresh meat from Nigeria banned by UK animal health rules. Cash over GBP 10000 must be declared to HMRC. Ivory banned under CITES. Medication needs prescription.'
    }],
  });

  const raw = msg.content[0].type === 'text' ? msg.content[0].text : '[]';
  console.log('=== RAW RESPONSE ===');
  console.log(raw.substring(0, 800));
  console.log('\n=== FIRST 20 CHARS (char codes) ===');
  for (let i = 0; i < Math.min(20, raw.length); i++) {
    console.log(`  [${i}] '${raw[i]}' = ${raw.charCodeAt(i)}`);
  }

  const stripped = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  console.log('\n=== STRIPPED (first 200) ===');
  console.log(stripped.substring(0, 200));

  const match = stripped.match(/\[[\s\S]*\]/);
  console.log('\n=== REGEX MATCH ===');
  console.log('Match found:', !!match);
  if (match) {
    console.log('Match length:', match[0].length);
    try {
      const parsed = JSON.parse(match[0]);
      console.log('Parsed count:', parsed.length);
      console.log('First rule:', JSON.stringify(parsed[0], null, 2));
    } catch(e: any) {
      console.log('Parse error:', e.message);
    }
  }
}

main().catch(console.error);
