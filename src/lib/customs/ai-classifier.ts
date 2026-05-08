import Anthropic from '@anthropic-ai/sdk';
import type { AIClassificationResult, CustomsInput } from './types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a customs classification expert for BootHop, a cross-border logistics platform.
Classify the item and return ONLY a valid JSON object — no markdown, no explanation outside the JSON.

CATEGORIES (pick exactly one):
luxury_bag | jewellery_gold | jewellery_silver | watches_luxury | electronics | clothing | footwear | perfume | artwork | food | documents | other

Return format:
{
  "detectedCategory": "<category>",
  "confidenceScore": <0.0-1.0>,
  "hsSuggestion": "<4-digit HS prefix>",
  "flags": [],
  "reasoning": "<one sentence>"
}

Apply these flags when relevant:
- HIGH_VALUE_LUXURY: declared value > £10,000
- AML_THRESHOLD: declared value > £10,000
- JEWELLERY_HIGH_VALUE: jewellery category and value > £5,000
- UNCLASSIFIED_ITEM: confidence < 0.6`;

export async function classifyItemWithAI(
  input: CustomsInput
): Promise<AIClassificationResult> {
  const userContent = `Item: ${input.itemDescription}
Brand: ${input.brand || 'not specified'}
Declared Value: ${input.currency} ${input.declaredValue}
Route: ${input.originCountry} → ${input.destinationCountry}
Condition: ${input.isNew !== false ? 'New' : 'Used'}`;

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    });

    const text =
      message.content[0].type === 'text' ? message.content[0].text.trim() : '';

    const parsed = JSON.parse(text) as AIClassificationResult;

    if (!parsed.confidenceScore || parsed.confidenceScore < 0.1) {
      parsed.confidenceScore = 0.5;
      if (!parsed.flags) parsed.flags = [];
      if (!parsed.flags.includes('UNCLASSIFIED_ITEM')) {
        parsed.flags.push('UNCLASSIFIED_ITEM');
      }
    }

    return parsed;
  } catch {
    return {
      detectedCategory: 'other',
      confidenceScore: 0.5,
      hsSuggestion: undefined,
      flags: ['UNCLASSIFIED_ITEM'],
      reasoning: 'Could not classify item automatically — defaulting to other.',
    };
  }
}
