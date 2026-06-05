import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { postCarousel } from '@/lib/services/instagram';
import { postPhotoCarousel } from '@/lib/services/tiktok';

export const dynamic    = 'force-dynamic';
export const maxDuration = 60;

// Runs every 15 minutes.
// Finds pending posts where admin replied POST via WhatsApp.
// Publishes to Instagram + TikTok simultaneously, then marks as posted.

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.INSTAGRAM_ACCESS_TOKEN || !process.env.INSTAGRAM_ACCOUNT_ID) {
    return NextResponse.json({ skipped: true, reason: 'Instagram credentials not configured' });
  }

  const supabase = createSupabaseAdminClient();

  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { data: pending } = await supabase
    .from('instagram_posts')
    .select('*')
    .eq('status', 'pending')
    .gte('created_at', cutoff)
    .order('created_at', { ascending: true })
    .limit(3);

  if (!pending?.length) return NextResponse.json({ processed: 0 });

  let published = 0;
  let skipped   = 0;
  let waiting   = 0;

  for (const post of pending) {
    const { data: reply } = await supabase
      .from('whatsapp_messages')
      .select('message_text')
      .eq('approval_id', post.approval_id)
      .order('received_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!reply) { waiting++; continue; }

    const decision = (reply.message_text as string).toUpperCase();

    if (decision.includes('SKIP')) {
      await supabase
        .from('instagram_posts')
        .update({ status: 'skipped' })
        .eq('id', post.id);
      skipped++;
      continue;
    }

    if (decision.includes('POST')) {
      const imageUrls = post.image_urls as string[];
      const caption   = post.caption as string;
      const now       = new Date().toISOString();

      // ── Instagram ─────────────────────────────────────────────────────
      let igMediaId: string | null = null;
      let igStatus = 'failed';
      try {
        igMediaId = await postCarousel(imageUrls, caption);
        igStatus  = 'posted';
        console.log(`[Publish] Instagram carousel posted — mediaId: ${igMediaId}`);
      } catch (e: any) {
        console.error('[Publish] Instagram failed:', e.message);
      }

      // ── TikTok ────────────────────────────────────────────────────────
      let ttPublishId: string | null = null;
      let ttStatus = 'skipped';
      if (process.env.TIKTOK_ACCESS_TOKEN) {
        try {
          ttPublishId = await postPhotoCarousel(imageUrls, caption);
          ttStatus    = 'posted';
          console.log(`[Publish] TikTok photo post published — publishId: ${ttPublishId}`);
        } catch (e: any) {
          ttStatus = 'failed';
          console.error('[Publish] TikTok failed:', e.message);
        }
      }

      // ── Update record ─────────────────────────────────────────────────
      await supabase
        .from('instagram_posts')
        .update({
          status:              igStatus,
          instagram_media_id:  igMediaId,
          tiktok_publish_id:   ttPublishId,
          tiktok_status:       ttStatus,
          approved_at:         now,
          posted_at:           igStatus === 'posted' ? now : null,
        })
        .eq('id', post.id);

      if (igStatus === 'posted') published++;
    }
  }

  return NextResponse.json({ processed: pending.length, published, skipped, waiting });
}
