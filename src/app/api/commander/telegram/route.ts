import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCommanderSession } from '@/lib/auth/commander';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const TG_TOKEN = process.env.TELEGRAM_TOKEN || '';
const TG_ADMIN_CHAT = process.env.TG_ADMIN_CHAT || '8641867751';

export async function POST(req: NextRequest) {
  const store = await cookies();
  const session = getCommanderSession(store);
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  if (!TG_TOKEN) return NextResponse.json({ error: 'Telegram not configured' }, { status: 503 });

  const { video_url, caption, forClient } = await req.json().catch(() => ({} as any));
  if (!video_url) return NextResponse.json({ error: 'video_url required' }, { status: 400 });

  const slug = (session.isSuper && forClient) ? forClient : session.slug;
  const db = createSupabaseAdminClient();

  // Get client's tg_chat_id from their saved profile
  let chatId = TG_ADMIN_CHAT;
  const { data: clientRow } = await db
    .from('pipeline_clients')
    .select('id')
    .eq('slug', slug)
    .single();
  if (clientRow?.id) {
    const { data: profile } = await db
      .from('company_profiles')
      .select('tg_chat_id')
      .eq('company_id', clientRow.id)
      .single();
    if (profile?.tg_chat_id) chatId = profile.tg_chat_id;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendVideo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        video: video_url,
        caption: caption || 'New video from BootHop Pipeline',
        supports_streaming: true,
      }),
    });
    const data = await res.json();
    if (data.ok) return NextResponse.json({ ok: true });
    return NextResponse.json({ error: data.description || 'Telegram error' }, { status: 502 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
