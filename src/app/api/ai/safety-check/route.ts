import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { classifyItem } from '@/lib/classifier';
import { calculateRisk } from '@/lib/riskEngine';
import { rulesDB } from '@/data/complianceRules';

export interface SafetyCheckRequest {
  item:        string;
  fromCountry: string;
  toCountry:   string;
  value?:      number;
  quantity?:   number;
  question?:   string;  // optional free-text question from user
}

export interface SafetyCheckResponse {
  verdict:        'PERMITTED' | 'RESTRICTED' | 'PROHIBITED' | 'REVIEW_REQUIRED';
  verdictLabel:   string;
  explanation:    string;
  tips:           string[];
  requiresReview: boolean;
  riskScore:      number;
  category:       string;
  disclaimer:     string;
}

const VERDICT_LABELS = {
  PERMITTED:       'Likely Permitted',
  RESTRICTED:      'Restricted — conditions apply',
  PROHIBITED:      'Prohibited — do not send',
  REVIEW_REQUIRED: 'Requires Manual Review',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as SafetyCheckRequest;
    const { item, fromCountry, toCountry, value = 0, quantity = 1, question } = body;

    if (!item || !toCountry) {
      return NextResponse.json(
        { error: 'item and toCountry are required' },
        { status: 400 },
      );
    }

    // ── 1. Run existing rule-based check ──────────────────────────────────────
    const category  = classifyItem(item);
    const risk      = calculateRisk({ item, country: toCountry, value, quantity });
    const itemLower = item.toLowerCase();
    const rules     = rulesDB[toCountry];

    let rulesStatus: 'ALLOWED' | 'RESTRICTED' | 'PROHIBITED' = 'ALLOWED';
    if (!rules) {
      rulesStatus = 'RESTRICTED';
    } else if (rules.prohibited.some((p) => itemLower.includes(p))) {
      rulesStatus = 'PROHIBITED';
    } else if (rules.restricted.some((r) => itemLower.includes(r) || category === r)) {
      rulesStatus = 'RESTRICTED';
    }

    // ── 2. Build Claude prompt ────────────────────────────────────────────────
    const systemPrompt = `You are the BootHop AI Safety Assistant. BootHop is a peer-to-peer delivery marketplace where travelers carry goods for senders between cities and countries.

Your job is to assess whether an item can safely and legally be sent via BootHop, based on:
- The item description
- The route (origin and destination countries)
- BootHop's internal compliance rules
- General customs and airline carry-on / checked baggage restrictions
- Legal restrictions in the destination country

Always respond in plain, friendly English. Be honest about restrictions. When uncertain, err on the side of caution and recommend human review. Never guarantee customs clearance — always include that final decisions rest with border authorities.

Respond ONLY as a valid JSON object with these exact fields:
{
  "verdict": "PERMITTED" | "RESTRICTED" | "PROHIBITED" | "REVIEW_REQUIRED",
  "explanation": "2-4 sentence plain English explanation",
  "tips": ["tip 1", "tip 2", "tip 3"],
  "requiresReview": true | false
}`;

    const userMessage = `Item to send: "${item}"
From: ${fromCountry || 'Not specified'}
To: ${toCountry}
Declared value: ${value > 0 ? `£${value}` : 'Not declared'}
Quantity: ${quantity}
${question ? `User question: "${question}"` : ''}

BootHop compliance engine result:
- Item category: ${category}
- Risk score: ${risk.score}/100
- Rules DB status: ${rulesStatus}
- Risk breakdown: item=${risk.breakdown.itemScore}, country=${risk.breakdown.countryScore}, value=${risk.breakdown.valueScore}, quantity=${risk.breakdown.quantityScore}

Based on this, give your verdict and explanation.`;

    // ── 3. Call Claude ────────────────────────────────────────────────────────
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 600,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userMessage }],
    });

    const rawContent = message.content[0].type === 'text' ? message.content[0].text : '';

    // ── 4. Parse Claude response ───────────────────────────────────────────────
    let aiResult: {
      verdict:        SafetyCheckResponse['verdict'];
      explanation:    string;
      tips:           string[];
      requiresReview: boolean;
    };

    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      aiResult = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);
    } catch {
      // Fallback if JSON parse fails
      aiResult = {
        verdict:        rulesStatus === 'PROHIBITED' ? 'PROHIBITED' : rulesStatus === 'RESTRICTED' ? 'RESTRICTED' : 'REVIEW_REQUIRED',
        explanation:    rawContent.slice(0, 300),
        tips:           ['Please contact BootHop support for guidance on this item.'],
        requiresReview: true,
      };
    }

    // ── 5. Build response ─────────────────────────────────────────────────────
    const response: SafetyCheckResponse = {
      verdict:        aiResult.verdict,
      verdictLabel:   VERDICT_LABELS[aiResult.verdict],
      explanation:    aiResult.explanation,
      tips:           aiResult.tips || [],
      requiresReview: aiResult.requiresReview,
      riskScore:      risk.score,
      category,
      disclaimer:     'This check is advisory only. Final customs and border decisions rest with the relevant authorities. BootHop accepts no liability for items rejected at the border.',
    };

    return NextResponse.json(response);

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Safety check failed';
    console.error('[ai/safety-check]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
