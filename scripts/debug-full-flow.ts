/**
 * Tests the full two-step flow for one route: summary → extraction
 */
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
- item_keyword must be a single word or short phrase (2-4 words max)
- Return 5-20 rules. ONLY return the JSON array, no other text`;

async function main() {
  // Step 1: Get summary
  console.log('Step 1: Getting compliance summary...');
  const summaryMsg = await claude.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 1500,
    system:     `You are a customs and trade compliance expert with comprehensive knowledge of international customs law.
Provide accurate, detailed information about customs regulations. Be specific about laws and regulations.
Do not hedge excessively — state what the actual rules are based on your training knowledge.`,
    messages:   [{ role: 'user', content: `List all significant customs prohibited and restricted items when travelling from Nigeria to the United Kingdom. Include:
- Items that are completely PROHIBITED from entering the UK from Nigeria (e.g. khat, bush meat, ivory, fresh meat)
- Items that are RESTRICTED (require documentation, declarations, or have limits) e.g. medication, cash over £10,000, plants, cosmetics
- Any specific Nigerian items that often cause issues at UK border (e.g. suya, egusi, palm oil, ponmo, stockfish)
Focus on HMRC rules, UK Border Force guidance, CITES, and animal/plant health regulations.
Be specific and include legal references where known.` }],
  });

  const summary = summaryMsg.content[0].type === 'text' ? summaryMsg.content[0].text : '';
  console.log(`Summary length: ${summary.length} chars`);
  console.log(`Summary stop_reason: ${summaryMsg.stop_reason}`);
  console.log('Summary first 100:', summary.substring(0, 100));
  console.log('---');

  // Step 2: Extract rules
  console.log('\nStep 2: Extracting structured rules...');
  const extractMsg = await claude.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 2000,
    system:     EXTRACTION_SYSTEM,
    messages:   [{ role: 'user', content: summary }],
  });

  console.log(`Extract stop_reason: ${extractMsg.stop_reason}`);
  console.log(`Extract content blocks: ${extractMsg.content.length}`);
  console.log(`Extract content[0].type: ${extractMsg.content[0]?.type}`);

  const raw = extractMsg.content[0].type === 'text' ? extractMsg.content[0].text : 'FALLBACK_[]';
  console.log(`Raw length: ${raw.length}`);
  console.log('Raw first 200:', raw.substring(0, 200));

  const stripped = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  console.log(`Stripped length: ${stripped.length}`);

  const match = stripped.match(/\[[\s\S]*\]/);
  console.log(`Regex match: ${!!match}`);

  if (match) {
    const parsed = JSON.parse(match[0]);
    console.log(`Parsed ${parsed.length} rules`);
  }
}

main().catch(console.error);
