import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? 'boothop_pipeline_2026';

// Keyword → decision mapping (case insensitive)
const DECISION_MAP: Record<string, string> = {
  '1': 'all_v1',   'tt': 'all_v1',   'tiktok': 'all_v1',
  '2': 'all_v2',   'ig': 'all_v2',   'instagram': 'all_v2',
  '3': 'tt_ig',    'both': 'tt_ig',   'post both': 'tt_ig',
  '4': 'ignore',   'skip': 'ignore',  'no': 'ignore',
  '5': 'ig_story', 'story': 'ig_story', 'reel': 'ig_story',
  // V1/V2 specifics
  'v1': 'all_v1',  'v2': 'all_v2',
  'tt v1': 'tt_v1', 'tt v2': 'tt_v2',
  'ig v1': 'ig_v1', 'ig v2': 'ig_v2',
};

function parseDecision(text: string): string | null {
  const clean = text.trim().toLowerCase();
  return DECISION_MAP[clean] ?? null;
}

// GET — Meta webhook verification handshake
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode      = searchParams.get('hub.mode');
  const token     = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

// POST — incoming WhatsApp messages
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entry    = body?.entry?.[0];
    const changes  = entry?.changes?.[0];
    const value    = changes?.value;
    const messages = value?.messages;

    if (!messages || messages.length === 0) {
      return NextResponse.json({ status: 'no_messages' });
    }

    const supabase = createSupabaseAdminClient();

    for (const msg of messages) {
      if (msg.type !== 'text') continue;

      const from    = msg.from as string;
      const rawText = (msg.text?.body ?? '') as string;
      const decision = parseDecision(rawText);

      // Store every incoming message — pipeline polls for unprocessed decisions
      await supabase.from('pipeline_decisions').insert({
        from_number: from,
        raw_message: rawText,
        decision:    decision,
        processed:   false,
      });
    }

    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    console.error('[whatsapp-webhook] error:', err);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
