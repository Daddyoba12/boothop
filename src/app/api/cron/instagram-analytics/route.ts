import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getMediaInsights, getAccountInsights } from '@/lib/services/instagram';

export const dynamic    = 'force-dynamic';
export const maxDuration = 60;

// Runs every Monday at 10am UTC.
// Pulls insights for all posts published in the last 7 days,
// stores a weekly summary, and emails the admin.

async function sendWeeklyReportEmail(report: {
  weekEnding: string;
  postsCount: number;
  totalImpressions: number;
  totalReach: number;
  totalSaves: number;
  totalShares: number;
  avgEngagementRate: number;
  bestPost: { id: string; impressions: number } | null;
}) {
  const tk        = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId   = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const recipient = process.env.WHATSAPP_RECIPIENT;
  if (!tk || !phoneId || !recipient) return;

  const msg = [
    `📊 *BootHop Instagram Weekly Report*`,
    `Week ending: ${report.weekEnding}`,
    ``,
    `Posts published: ${report.postsCount}`,
    `Impressions: ${report.totalImpressions.toLocaleString()}`,
    `Reach: ${report.totalReach.toLocaleString()}`,
    `Saves: ${report.totalSaves}`,
    `Shares: ${report.totalShares}`,
    `Avg engagement: ${report.avgEngagementRate.toFixed(2)}%`,
    report.bestPost ? `Best post: ${report.bestPost.id} (${report.bestPost.impressions.toLocaleString()} impressions)` : '',
  ].filter(Boolean).join('\n');

  await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${tk}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      messaging_product: 'whatsapp',
      to:   recipient,
      type: 'text',
      text: { body: msg },
    }),
  }).catch(e => console.error('[IG-Analytics] WhatsApp send error:', e));
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.INSTAGRAM_ACCESS_TOKEN || !process.env.INSTAGRAM_ACCOUNT_ID) {
    return NextResponse.json({ skipped: true, reason: 'Instagram credentials not configured' });
  }

  const supabase = createSupabaseAdminClient();

  // Get posts published in the last 7 days
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: posts } = await supabase
    .from('instagram_posts')
    .select('id, instagram_media_id')
    .eq('status', 'posted')
    .gte('posted_at', weekAgo);

  if (!posts?.length) {
    return NextResponse.json({ processed: 0, reason: 'No posts this week' });
  }

  // Pull insights for each post
  let totalImpressions = 0;
  let totalReach       = 0;
  let totalSaves       = 0;
  let totalShares      = 0;
  let bestPost: { id: string; impressions: number } | null = null;

  for (const post of posts) {
    if (!post.instagram_media_id) continue;
    try {
      const raw  = await getMediaInsights(post.instagram_media_id) as any;
      const data = (raw.data ?? []) as Array<{ name: string; values: Array<{ value: number }> }>;

      const get = (name: string) =>
        data.find(m => m.name === name)?.values?.[0]?.value ?? 0;

      const impressions = get('impressions');
      const reach       = get('reach');
      const saves       = get('saved');
      const shares      = get('shares');

      totalImpressions += impressions;
      totalReach       += reach;
      totalSaves       += saves;
      totalShares      += shares;

      if (!bestPost || impressions > bestPost.impressions) {
        bestPost = { id: post.instagram_media_id, impressions };
      }

      // Store insights back on the row
      await supabase
        .from('instagram_posts')
        .update({ insights: raw })
        .eq('id', post.id);

    } catch (e: any) {
      console.error(`[IG-Analytics] Insights fetch failed for ${post.instagram_media_id}:`, e.message);
    }
  }

  const avgEngagementRate = totalReach > 0
    ? ((totalSaves + totalShares) / totalReach) * 100
    : 0;

  const weekEnding = new Date().toISOString().split('T')[0];

  // Store weekly summary
  await supabase.from('instagram_analytics').insert({
    week_ending:          new Date().toISOString(),
    posts_count:          posts.length,
    total_impressions:    totalImpressions,
    total_reach:          totalReach,
    total_saves:          totalSaves,
    total_shares:         totalShares,
    avg_engagement_rate:  parseFloat(avgEngagementRate.toFixed(2)),
    best_post_id:         bestPost?.id ?? null,
  });

  const report = {
    weekEnding,
    postsCount:          posts.length,
    totalImpressions,
    totalReach,
    totalSaves,
    totalShares,
    avgEngagementRate,
    bestPost,
  };

  await sendWeeklyReportEmail(report);
  console.log('[IG-Analytics] Weekly report stored and sent');

  return NextResponse.json(report);
}
