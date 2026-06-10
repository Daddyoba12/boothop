import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { getBdSession } from '@/lib/auth/session';

const PILLAR_CONTEXT: Record<string, string> = {
  logistics_stories:     'a real or realistic logistics company/brand story — courier startup disrupting the market, DHL/UPS/FedEx crisis, or African logistics company changing the game.',
  travel_hacks:          'a practical travel hack about shipping abroad, customs, or saving money with lots of luggage. Must be specific and actionable.',
  airport_deliveries:    'a dramatic story about airport logistics — missed packages, customs seizures, last-minute saves, or airport workers going above and beyond.',
  supply_chain_failures: 'a famous real-world supply chain failure — Suez Canal, COVID PPE, port strikes. Explain the lesson simply.',
};

const TONE: Record<string, string> = {
  documentary:     'calm, authoritative, mini-documentary narrator',
  urgent_news:     'fast-paced, urgent, breaking-news energy',
  travel_hack:     'friendly, helpful, slightly surprised',
  supply_chain:    'analytical, slightly alarmed, expert commentator',
  airport_mystery: 'suspenseful, curious, dramatic',
  boothop_cta:     'informative but leading naturally toward BootHop at the end',
};

function buildPrompt(pillar: string, templateKey: string, platform: string) {
  return `You are a content creator for a faceless ${platform === 'youtube_shorts' ? 'YouTube Shorts' : 'TikTok/Instagram Reels'} page "How things move around the world".
Tone: ${TONE[templateKey] ?? TONE.documentary}. No fluff.
Audience: 18-35 UK/Nigeria diaspora who ship things abroad or travel frequently.

Generate content about: ${PILLAR_CONTEXT[pillar] ?? PILLAR_CONTEXT.logistics_stories}

Formula — HOOK(1 line, <12 words, stops scroll) → PROBLEM(2-3 lines) → STAKES(1-2 lines) → RESOLUTION(2-3 lines) → LESSON(1 punchy line)

Also provide:
CAPTION: 3-4 sentences with CTA.
HASHTAGS: 20 hashtags (logistics, travel, UK/Nigeria diaspora, boothop).
VISUAL_DESC: 2-3 sentences on ideal visuals.

Return ONLY valid JSON:
{"hook":"...","script":"HOOK:\\n...\\n\\nPROBLEM:\\n...\\n\\nSTAKES:\\n...\\n\\nRESOLUTION:\\n...\\n\\nLESSON:\\n...","caption":"...","hashtags":"#logistics ...","visual_desc":"..."}`;
}

function buildVariantPrompt(hook: string, caption: string) {
  return `Expert at viral logistics/travel social media hooks.
Original hook: "${hook}"
Caption start: "${caption.slice(0, 100)}"
Generate 2 variant hooks (B=money angle, C=urgency angle).
Return ONLY valid JSON: {"variantB":{"hook":"...","caption_opener":"..."},"variantC":{"hook":"...","caption_opener":"..."}}`;
}

async function callClaude(prompt: string) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: {
      'x-api-key':         process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
    },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] }),
  });
  const data  = await res.json();
  const raw   = (data.content?.[0]?.text ?? '').trim();
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON in response');
  return JSON.parse(match[0]);
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    if (!getBdSession(cookieStore)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { pillar = 'logistics_stories', templateKey = 'documentary', platform = 'all', slot, slotLabel } = await request.json();

    const content  = await callClaude(buildPrompt(pillar, templateKey, platform));
    const variants = await callClaude(buildVariantPrompt(content.hook, content.caption)).catch(() => null);

    const supabase = createSupabaseAdminClient();

    const { data: item, error } = await supabase
      .from('bd_content')
      .insert({
        pillar, template_key: templateKey, platform,
        slot: slot ?? null, slot_label: slotLabel ?? null,
        hook:        content.hook,
        script:      content.script,
        caption:     content.caption,
        hashtags:    content.hashtags,
        visual_desc: content.visual_desc,
        status:      'draft',
      })
      .select('*')
      .single();

    if (error) throw error;

    // Insert variants
    if (variants && item) {
      await supabase.from('bd_variants').insert([
        { content_id: item.id, label: 'A', hook: content.hook, caption: content.caption },
        { content_id: item.id, label: 'B', hook: variants.variantB.hook, caption: variants.variantB.caption_opener },
        { content_id: item.id, label: 'C', hook: variants.variantC.hook, caption: variants.variantC.caption_opener },
      ]);
    }

    await supabase.from('bd_notifications').insert({ message: `Generated: "${content.hook.slice(0, 60)}..."`, type: 'success' });

    const { data: full } = await supabase.from('bd_content').select('*, bd_variants(*)').eq('id', item!.id).single();
    return NextResponse.json({ ok: true, item: full });

  } catch (error) {
    console.error('bd/generate error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
