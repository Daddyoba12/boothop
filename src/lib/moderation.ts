// Content moderation for BootHop messages and attachments.
// Text:  keyword + regex patterns → flagged (delivered but admin-alerted).
// Image: Anthropic Claude vision → blocked if explicit/harmful.

// ── Text moderation ────────────────────────────────────────────────────────

const EXPLICIT_TEXT_PATTERNS = [
  // Violence / threats
  /\b(kill|murder|stab|shoot|rape|bomb|threat(en)?|i('ll| will) (hurt|harm|kill))\b/i,
  // Adult / sexual
  /\b(sex|porn|nude|naked|explicit|xxx|onlyfans)\b/i,
  // Scam patterns
  /\b(western union|moneygram|gift card|bitcoin|crypto|wire transfer|advance fee|nigerian prince)\b/i,
  // Hate speech (basic)
  /\b(n[i1]gg[ae]r|f[a@]gg[o0]t|ch[i1]nk|sp[i1]c)\b/i,
];

export type ModerationResult = {
  flagged:  boolean;
  category: string | null;
};

export function moderateText(content: string): ModerationResult {
  for (const pattern of EXPLICIT_TEXT_PATTERNS) {
    if (pattern.test(content)) {
      const src = pattern.source.toLowerCase();
      const category =
        src.includes('kill')    || src.includes('threat') ? 'violence' :
        src.includes('sex')     || src.includes('porn')   ? 'explicit' :
        src.includes('bitcoin') || src.includes('wire')   ? 'scam'     :
        'hate_speech';
      return { flagged: true, category };
    }
  }
  return { flagged: false, category: null };
}

// ── Image moderation (Anthropic Claude vision) ─────────────────────────────

export async function moderateImage(
  imageBytes: ArrayBuffer,
  mimeType:   string,
): Promise<{ safe: boolean; reason?: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { safe: true }; // fail open if not configured

  try {
    const base64 = Buffer.from(imageBytes).toString('base64');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 10,
        messages: [{
          role:    'user',
          content: [
            {
              type:  'image',
              source: { type: 'base64', media_type: mimeType, data: base64 },
            },
            {
              type: 'text',
              text: 'Does this image contain explicit sexual content, graphic violence, or clearly illegal material? Reply with exactly one word: SAFE or UNSAFE.',
            },
          ],
        }],
      }),
    });

    if (!response.ok) return { safe: true }; // fail open on API error

    const data   = await response.json();
    const answer = (data?.content?.[0]?.text ?? '').trim().toUpperCase();
    if (answer === 'UNSAFE') {
      return { safe: false, reason: 'Image flagged by automated moderation.' };
    }
    return { safe: true };
  } catch {
    return { safe: true }; // fail open
  }
}
