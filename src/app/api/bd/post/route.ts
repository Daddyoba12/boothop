import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getBdSession } from '@/lib/auth/session';
import { cookies } from 'next/headers';

const IG_TOKEN   = process.env.BD_INSTAGRAM_TOKEN   ?? '';
const IG_USER_ID = process.env.BD_INSTAGRAM_USER_ID ?? '';
const TK_TOKEN   = process.env.BD_TIKTOK_TOKEN      ?? '';

async function postToInstagram(videoUrl: string, caption: string, hashtags: string): Promise<string | null> {
  if (!IG_TOKEN || !IG_USER_ID) return null;

  const fullCaption = `${caption}\n\n${hashtags}`.slice(0, 2200);

  // Create container
  const container = await fetch(
    `https://graph.instagram.com/v21.0/${IG_USER_ID}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        media_type:   'REELS',
        video_url:    videoUrl,
        caption:      fullCaption,
        access_token: IG_TOKEN,
      }),
    }
  ).then(r => r.json());

  if (container.error || !container.id) {
    console.error('IG container error:', container);
    return null;
  }

  // Poll until FINISHED (max 5 min)
  const containerId = container.id;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 10000));
    const st = await fetch(
      `https://graph.instagram.com/v21.0/${containerId}?fields=status_code&access_token=${IG_TOKEN}`
    ).then(r => r.json());
    if (st.status_code === 'FINISHED') break;
    if (st.status_code === 'ERROR' || st.status_code === 'EXPIRED') return null;
  }

  // Publish
  const pub = await fetch(
    `https://graph.instagram.com/v21.0/${IG_USER_ID}/media_publish?creation_id=${containerId}&access_token=${IG_TOKEN}`,
    { method: 'POST' }
  ).then(r => r.json());

  return pub.id ?? null;
}

async function postToTikTok(videoUrl: string, caption: string, hashtags: string): Promise<string | null> {
  if (!TK_TOKEN) return null;

  const fullCaption = `${caption}\n\n${hashtags}`.slice(0, 2200);
  const title       = caption.split('\n')[0].slice(0, 150);

  // TikTok PULL_FROM_URL — TikTok fetches the video from Supabase Storage
  const init = await fetch(
    'https://open.tiktokapis.com/v2/post/publish/video/init/',
    {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${TK_TOKEN}`,
        'Content-Type':  'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        post_info: {
          title,
          description:     fullCaption,
          privacy_level:   'PUBLIC_TO_EVERYONE',
          disable_duet:    false,
          disable_comment: false,
          disable_stitch:  false,
        },
        source_info: {
          source:    'PULL_FROM_URL',
          video_url: videoUrl,
        },
      }),
    }
  ).then(r => r.json());

  const publishId = init?.data?.publish_id ?? init?.publish_id;
  if (!publishId) {
    console.error('TikTok init error:', init);
    return null;
  }

  // Poll status
  const authH = {
    'Authorization': `Bearer ${TK_TOKEN}`,
    'Content-Type':  'application/json; charset=UTF-8',
  };
  for (let i = 0; i < 24; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const st = await fetch(
      'https://open.tiktokapis.com/v2/post/publish/status/fetch/',
      { method: 'POST', headers: authH, body: JSON.stringify({ publish_id: publishId }) }
    ).then(r => r.json());
    const status = st?.data?.status ?? st?.status;
    if (['PUBLISH_COMPLETE', 'SEND_TO_USER_INBOX', 'SUCCESS'].includes(status)) return publishId;
    if (['FAILED', 'CANCELLED'].includes(status)) return null;
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    if (!getBdSession(cookieStore)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, platform } = await request.json();
    if (!id || !platform) return NextResponse.json({ error: 'id and platform required.' }, { status: 400 });
    if (!['tiktok', 'instagram'].includes(platform)) return NextResponse.json({ error: 'platform must be tiktok or instagram.' }, { status: 400 });

    const supabase = createSupabaseAdminClient();
    const { data: content } = await supabase
      .from('bd_content')
      .select('id, video_url, caption, hashtags, status')
      .eq('id', id)
      .maybeSingle();

    if (!content) return NextResponse.json({ error: 'Content not found.' }, { status: 404 });
    if (!content.video_url) return NextResponse.json({ error: 'No video rendered yet. Render first.' }, { status: 400 });

    let resultId: string | null = null;

    if (platform === 'instagram') {
      resultId = await postToInstagram(content.video_url, content.caption, content.hashtags);
      if (resultId) await supabase.from('bd_content').update({ instagram_id: resultId, status: 'posted' }).eq('id', id);
    } else {
      resultId = await postToTikTok(content.video_url, content.caption, content.hashtags);
      if (resultId) await supabase.from('bd_content').update({ tiktok_id: resultId, status: 'posted' }).eq('id', id);
    }

    if (!resultId) return NextResponse.json({ error: `Failed to post to ${platform}. Check token or credentials.` }, { status: 502 });

    await supabase.from('bd_notifications').insert({
      message: `Posted to ${platform}: "${content.caption.slice(0, 60)}..."`,
      type: 'success',
    });

    return NextResponse.json({ ok: true, platform, id: resultId });

  } catch (error) {
    console.error('bd/post error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
