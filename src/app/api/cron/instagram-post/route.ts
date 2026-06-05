import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { generateDailyContent } from '@/lib/services/boothop-content';
import { searchPexelsPhoto, getFallbackImage } from '@/lib/services/pexels';

export const dynamic    = 'force-dynamic';
export const maxDuration = 60;

// ── Helpers ────────────────────────────────────────────────────────────────

function makeApprovalId(): string {
  return Math.random().toString(36).slice(2, 10); // 8-char alphanumeric
}

async function sendWhatsAppPreview(
  approvalId: string,
  hook: string,
  slides: Array<{ text: string }>,
  captionPreview: string
) {
  const tk        = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId   = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const recipient = process.env.WHATSAPP_RECIPIENT;
  if (!tk || !phoneId || !recipient) {
    console.warn('[IG-Post] WhatsApp not fully configured — skipping preview send');
    return;
  }

  const slideLines = slides.map((s, i) => `  ${i + 1}. ${s.text}`).join('\n');
  const msg = [
    `🔵 *BootHop Instagram — Daily Post*`,
    `ID: ${approvalId}`,
    ``,
    `*Hook:* ${hook}`,
    ``,
    `*Slides:*`,
    slideLines,
    ``,
    `*Caption:*`,
    captionPreview.slice(0, 220) + (captionPreview.length > 220 ? '…' : ''),
    ``,
    `Reply *POST ${approvalId}* to publish`,
    `Reply *SKIP ${approvalId}* to discard`,
  ].join('\n');

  await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${tk}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      messaging_product: 'whatsapp',
      to:   recipient,
      type: 'text',
      text: { body: msg },
    }),
  }).catch(e => console.error('[IG-Post] WhatsApp send error:', e));
}

// ── Cron handler ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();

  try {
    // 1. Generate content with Claude AI
    const content = await generateDailyContent();

    // 2. Fetch one Pexels image per slide (fall back to curated set if no API key)
    const imageUrls: string[] = [];
    for (let i = 0; i < content.slides.length; i++) {
      const url =
        (await searchPexelsPhoto(content.slides[i].pexels_query)) ??
        getFallbackImage(i);
      imageUrls.push(url);
    }

    // 3. Build full caption
    const fullCaption = `${content.caption}\n\n${content.hashtags}`;

    // 4. Create approval record in Supabase
    const approvalId = makeApprovalId();

    const { error: insertErr } = await supabase.from('instagram_posts').insert({
      approval_id: approvalId,
      scenario:    content.scenario,
      hook:        content.hook,
      slides:      content.slides,
      caption:     fullCaption,
      hashtags:    content.hashtags,
      image_urls:  imageUrls,
      status:      'pending',
    });

    if (insertErr) throw insertErr;

    // 5. Send WhatsApp preview for admin approval
    await sendWhatsAppPreview(approvalId, content.hook, content.slides, fullCaption);

    console.log(`[IG-Post] Generated daily post — approvalId: ${approvalId}, theme: ${content.theme}`);

    return NextResponse.json({
      success:    true,
      approvalId,
      theme:      content.theme,
      hook:       content.hook,
      slides:     content.slides.length,
      imagesReady: imageUrls.length,
    });

  } catch (err: any) {
    console.error('[IG-Post cron] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
