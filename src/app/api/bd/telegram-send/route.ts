import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { getBdSession } from '@/lib/auth/session';

async function sendTelegram(message: string) {
  const token  = process.env.TELEGRAM_BOT_TOKEN  || '8717698733:AAF7GI9Yw1DhdYVv_TK35fYQcwaGdk4caeA';
  const chatId = process.env.TELEGRAM_CHAT_ID    || '8641867751';
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method:  'POST',
    headers: { 'content-type': 'application/json' },
    body:    JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
  });
  if (!res.ok) throw new Error(`Telegram error ${res.status}`);
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    if (!getBdSession(cookieStore)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const supabase = createSupabaseAdminClient();
    const { data: item, error } = await supabase
      .from('bd_content')
      .select('*, bd_variants(*)')
      .eq('id', id)
      .single();

    if (error || !item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const msg = [
      `🎯 <b>BootHop Promo Content</b>`,
      `📌 ${item.pillar?.replace(/_/g, ' ')} | ${item.template_key ?? ''} | <b>${item.status}</b>`,
      ``,
      `🪝 <b>HOOK</b>`,
      item.hook,
      ``,
      `📜 <b>SCRIPT</b>`,
      item.script ?? '—',
      ``,
      `📝 <b>CAPTION</b>`,
      item.caption,
      ``,
      `#️⃣ <b>HASHTAGS</b>`,
      item.hashtags ?? '',
      ``,
      `🎬 <b>VISUAL</b>`,
      item.visual_desc ?? '—',
      item.video_url ? `\n▶ <a href="${item.video_url}">Watch video</a>` : '',
      ``,
      `🔗 <a href="https://www.boothop.com/promo/publish">Open Publish</a>`,
    ].filter(l => l !== undefined).join('\n');

    await sendTelegram(msg.slice(0, 4096));

    // Send variant hooks if any
    const variants = item.bd_variants as { label: string; hook: string }[] | null;
    if (variants && variants.length > 0) {
      const varMsg = [
        `🔀 <b>Hook Variants (A/B/C)</b>`,
        ``,
        ...variants.map(v => `<b>${v.label}:</b> ${v.hook}`),
      ].join('\n');
      await sendTelegram(varMsg.slice(0, 4096));
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('telegram-send error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
