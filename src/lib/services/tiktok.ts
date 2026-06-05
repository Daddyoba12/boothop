const BASE = 'https://open.tiktokapis.com/v2';

function token() {
  const t = process.env.TIKTOK_ACCESS_TOKEN;
  if (!t) throw new Error('Missing TIKTOK_ACCESS_TOKEN');
  return t;
}

// ── Photo carousel post ────────────────────────────────────────────────────
export async function postPhotoCarousel(
  imageUrls: string[],
  caption: string
): Promise<string> {
  const tk = token();

  const res = await fetch(`${BASE}/post/publish/content/init/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tk}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      post_info: {
        title:              caption.slice(0, 2200),
        privacy_level:      'PUBLIC_TO_EVERYONE',
        disable_duet:       false,
        disable_comment:    false,
        disable_stitch:     false,
        auto_add_music:     true,
      },
      source_info: {
        source:             'PULL_FROM_URL',
        photo_images:       imageUrls,
        photo_cover_index:  0,
      },
      media_type: 'PHOTO',
    }),
  });

  const data = await res.json() as any;
  if (data.error?.code && data.error.code !== 'ok') {
    throw new Error(`TikTok API error: ${JSON.stringify(data.error)}`);
  }

  return (data.data?.publish_id ?? data.data?.video_id ?? '') as string;
}
