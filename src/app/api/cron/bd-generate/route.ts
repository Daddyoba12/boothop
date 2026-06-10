import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic     = 'force-dynamic';
export const maxDuration = 60;

const SLOTS = [
  { slot: 1, label: '7am — Morning commute',     pillar: 'logistics_stories',     template: 'documentary'     },
  { slot: 2, label: '12pm — Lunch scroll',       pillar: 'travel_hacks',          template: 'travel_hack'     },
  { slot: 3, label: '6pm — Evening wind-down',   pillar: 'airport_deliveries',    template: 'airport_mystery' },
  { slot: 4, label: '9pm — Night grind',         pillar: 'supply_chain_failures', template: 'supply_chain'    },
];

const PILLAR_CONTEXT: Record<string, string> = {
  logistics_stories:     'a real or realistic logistics company/brand story — courier startup disrupting the market, DHL/UPS/FedEx crisis, or African logistics company changing the game.',
  travel_hacks:          'a practical travel hack about shipping abroad, customs, or saving money with lots of luggage. Must be specific and actionable.',
  airport_deliveries:    'a dramatic story about airport logistics — missed packages, customs seizures, last-minute saves, or airport workers going above and beyond.',
  supply_chain_failures: 'a famous real-world supply chain failure — Suez Canal, COVID PPE, port strikes. Explain the lesson simply.',
};

const TONE: Record<string, string> = {
  documentary:     'calm, authoritative, mini-documentary narrator',
  travel_hack:     'friendly, helpful, slightly surprised',
  supply_chain:    'analytical, slightly alarmed, expert commentator',
  airport_mystery: 'suspenseful, curious, dramatic',
};

async function callClaude(prompt: string) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
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
  if (!match) throw new Error('No JSON in Claude response');
  return JSON.parse(match[0]);
}

function buildPrompt(pillar: string, templateKey: string) {
  return `You are a content creator for a faceless TikTok/Instagram Reels page "How things move around the world".
Tone: ${TONE[templateKey] ?? TONE.documentary}. No fluff.
Audience: 18-35 UK/Nigeria diaspora who ship things abroad or travel frequently.

Generate content about: ${PILLAR_CONTEXT[pillar] ?? PILLAR_CONTEXT.logistics_stories}

Formula — HOOK(1 line, <12 words, stops scroll) → PROBLEM(2-3 lines) → STAKES(1-2 lines) → RESOLUTION(2-3 lines) → LESSON(1 punchy line)

Also provide:
CAPTION: 3-4 sentences with CTA mentioning BootHop.
HASHTAGS: 20 hashtags (logistics, travel, UK/Nigeria diaspora, boothop).
VISUAL_DESC: 2-3 sentences describing ideal real-world photos/footage to use as background.
PHOTO_QUERIES: 5 short Pexels search queries (comma-separated, each 2-4 words) matching the visual.

Return ONLY valid JSON:
{"hook":"...","script":"HOOK:\\n...\\n\\nPROBLEM:\\n...\\n\\nSTAKES:\\n...\\n\\nRESOLUTION:\\n...\\n\\nLESSON:\\n...","caption":"...","hashtags":"#logistics ...","visual_desc":"...","photo_queries":"query1, query2, query3, query4, query5"}`;
}

function buildVariantPrompt(hook: string, caption: string) {
  return `Expert at viral logistics/travel social media hooks.
Original hook: "${hook}"
Caption start: "${caption.slice(0, 100)}"
Generate 2 variant hooks (B=money angle, C=urgency angle).
Return ONLY valid JSON: {"variantB":{"hook":"...","caption_opener":"..."},"variantC":{"hook":"...","caption_opener":"..."}}`;
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization') ?? '';
  if (auth !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const slot = Number(request.nextUrl.searchParams.get('slot') ?? '1');
  const cfg  = SLOTS.find(s => s.slot === slot) ?? SLOTS[0];

  try {
    const content  = await callClaude(buildPrompt(cfg.pillar, cfg.template));
    const variants = await callClaude(buildVariantPrompt(content.hook, content.caption)).catch(() => null);

    const supabase = createSupabaseAdminClient();

    const { data: item, error } = await supabase
      .from('bd_content')
      .insert({
        pillar: cfg.pillar, template_key: cfg.template, platform: 'all',
        slot: cfg.slot, slot_label: cfg.label,
        hook:         content.hook,
        script:       content.script,
        caption:      content.caption,
        hashtags:     content.hashtags,
        visual_desc:  content.visual_desc,
        status:       'queued',
      })
      .select()
      .single();

    if (error || !item) throw error ?? new Error('Insert failed');

    if (variants) {
      await supabase.from('bd_variants').insert([
        { content_id: item.id, label: 'A', hook: content.hook,           caption: content.caption },
        { content_id: item.id, label: 'B', hook: variants.variantB.hook, caption: variants.variantB.caption_opener },
        { content_id: item.id, label: 'C', hook: variants.variantC.hook, caption: variants.variantC.caption_opener },
      ]);
    }

    // Store photo queries as metadata for the Python renderer
    if (content.photo_queries) {
      await supabase.from('bd_content')
        .update({ visual_desc: `${content.visual_desc}\n\nPHOTO_QUERIES: ${content.photo_queries}` })
        .eq('id', item.id);
    }

    await supabase.from('bd_notifications').insert({
      message: `🎬 Slot ${cfg.slot} queued for render: "${content.hook.slice(0, 60)}..." — Python worker will render + post`,
      type: 'info',
    });

    return NextResponse.json({ ok: true, slot: cfg.slot, contentId: item.id, hook: content.hook });

  } catch (err) {
    console.error('bd-generate cron error:', err);
    const supabase = createSupabaseAdminClient();
    await supabase.from('bd_notifications').insert({
      message: `❌ Slot ${cfg.slot} cron failed: ${String(err).slice(0, 120)}`,
      type: 'error',
    });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
