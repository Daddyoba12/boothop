import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { getBdSession } from '@/lib/auth/session';

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function tgSend(text: string) {
  const token  = process.env.TELEGRAM_BOT_TOKEN || '8717698733:AAF7GI9Yw1DhdYVv_TK35fYQcwaGdk4caeA';
  const chatId = process.env.TELEGRAM_CHAT_ID   || '8641867751';
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method:  'POST',
    headers: { 'content-type': 'application/json' },
    body:    JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Telegram ${res.status}: ${err}`);
  }
}

// Splits a long body into ≤4000-char chunks on paragraph boundaries
function chunkText(text: string, max = 4000): string[] {
  if (text.length <= max) return [text];
  const chunks: string[] = [];
  const paras = text.split('\n\n');
  let current = '';
  for (const p of paras) {
    if ((current + '\n\n' + p).length > max) {
      if (current) chunks.push(current.trim());
      current = p;
    } else {
      current = current ? current + '\n\n' + p : p;
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}

export async function POST(request: Request) {
  try {
    const adminKey = request.headers.get('x-admin-key');
    const isAdmin  = adminKey && adminKey === process.env.ADMIN_SECRET;
    if (!isAdmin) {
      const cookieStore = await cookies();
      if (!getBdSession(cookieStore)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const supabase = createSupabaseAdminClient();
    const { data: item, error } = await supabase
      .from('bd_content')
      .select('*, bd_variants(*)')
      .eq('id', id)
      .single();

    if (error || !item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const pillarLabel    = (item.pillar as string ?? '').replace(/_/g, ' ');
    const templateLabel  = (item.template_key as string ?? '').replace(/_/g, ' ');
    const isNewspaper    = ['nyt_feature','global_logistics','daily_mail_consumer','dlt_trade'].includes(item.template_key);

    // ── Message 1: header + hook + caption + hashtags ───────────────────────
    const msg1 = [
      `🎯 <b>BootHop BD LTD — Content Preview</b>`,
      `📌 ${escHtml(pillarLabel)} | ${escHtml(templateLabel)} | <b>${escHtml(item.status ?? 'draft')}</b>`,
      isNewspaper ? `📰 <i>Newspaper / Editorial format</i>` : '',
      ``,
      `🪝 <b>HOOK / HEADLINE</b>`,
      escHtml(item.hook ?? '—'),
      ``,
      `📝 <b>CAPTION</b>`,
      escHtml(item.caption ?? '—'),
      ``,
      `#️⃣ <b>HASHTAGS</b>`,
      escHtml(item.hashtags ?? '—'),
      ``,
      `🎬 <b>VISUAL BRIEF</b>`,
      escHtml((item.visual_desc ?? '—').slice(0, 400)),
      item.video_url ? `\n▶ <a href="${item.video_url}">Watch video</a>` : '',
      ``,
      `🔗 <a href="https://www.boothop.com/promo/publish">Open Publish</a>`,
    ].filter(Boolean).join('\n');

    await tgSend(msg1.slice(0, 4096));

    // ── Message 2+: script in chunks (especially long for newspaper) ─────────
    const scriptText = (item.script as string ?? '').trim();
    if (scriptText) {
      const label = isNewspaper ? '📰 <b>FULL ARTICLE</b>\n' : '📜 <b>FULL SCRIPT</b>\n';
      const chunks = chunkText(escHtml(scriptText));
      for (let i = 0; i < chunks.length; i++) {
        const prefix = i === 0 ? label : `📰 <b>...continued (${i + 1}/${chunks.length})</b>\n`;
        await tgSend(prefix + chunks[i]);
      }
    }

    // ── Message 3: variants ──────────────────────────────────────────────────
    const variants = item.bd_variants as { label: string; hook: string; caption: string }[] | null;
    if (variants && variants.length > 0) {
      const varMsg = [
        `🔀 <b>Hook Variants (A/B/C)</b>`,
        ``,
        ...variants.map(v => `<b>${escHtml(v.label)}:</b> ${escHtml(v.hook ?? '')}\n<i>${escHtml((v.caption ?? '').slice(0, 100))}...</i>`),
      ].join('\n');
      await tgSend(varMsg.slice(0, 4096));
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('telegram-send error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
