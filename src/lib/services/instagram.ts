const BASE = 'https://graph.facebook.com/v18.0';

function token() {
  const t = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!t) throw new Error('Missing INSTAGRAM_ACCESS_TOKEN');
  return t;
}

function accountId() {
  const id = process.env.INSTAGRAM_ACCOUNT_ID;
  if (!id) throw new Error('Missing INSTAGRAM_ACCOUNT_ID');
  return id;
}

async function gql(url: string, method = 'POST') {
  const res = await fetch(url, { method });
  const data = await res.json() as Record<string, unknown>;
  if ((data as any).error) throw new Error(JSON.stringify((data as any).error));
  return data;
}

// ── Single photo post ──────────────────────────────────────────────────────
export async function postPhoto(imageUrl: string, caption: string): Promise<string> {
  const acct = accountId();
  const tk   = token();

  const container = await gql(
    `${BASE}/${acct}/media?image_url=${encodeURIComponent(imageUrl)}&caption=${encodeURIComponent(caption)}&access_token=${tk}`
  ) as any;

  const published = await gql(
    `${BASE}/${acct}/media_publish?creation_id=${container.id}&access_token=${tk}`
  ) as any;

  return published.id as string;
}

// ── Carousel post ──────────────────────────────────────────────────────────
export async function postCarousel(imageUrls: string[], caption: string): Promise<string> {
  const acct = accountId();
  const tk   = token();

  // Step 1 — one container per image
  const containerIds: string[] = [];
  for (const url of imageUrls) {
    const item = await gql(
      `${BASE}/${acct}/media?image_url=${encodeURIComponent(url)}&is_carousel_item=true&access_token=${tk}`
    ) as any;
    containerIds.push(item.id as string);
    await new Promise(r => setTimeout(r, 500)); // avoid rate limit
  }

  // Step 2 — carousel container
  const carousel = await gql(
    `${BASE}/${acct}/media?media_type=CAROUSEL&caption=${encodeURIComponent(caption)}&children=${containerIds.join(',')}&access_token=${tk}`
  ) as any;

  // Step 3 — publish
  const published = await gql(
    `${BASE}/${acct}/media_publish?creation_id=${carousel.id}&access_token=${tk}`
  ) as any;

  return published.id as string;
}

// ── Insights for a single post ─────────────────────────────────────────────
export async function getMediaInsights(mediaId: string) {
  const tk = token();
  const metrics = 'impressions,reach,saved,shares,likes,comments,profile_visits';
  const res = await fetch(
    `${BASE}/${mediaId}/insights?metric=${metrics}&access_token=${tk}`
  );
  return res.json();
}

// ── Recent account media ───────────────────────────────────────────────────
export async function getRecentMedia(limit = 10) {
  const acct = accountId();
  const tk   = token();
  const res  = await fetch(
    `${BASE}/${acct}/media?fields=id,media_type,timestamp,like_count,comments_count&limit=${limit}&access_token=${tk}`
  );
  return res.json();
}

// ── Account-level metrics ──────────────────────────────────────────────────
export async function getAccountInsights(period: 'day' | 'week' | 'month' = 'week') {
  const acct    = accountId();
  const tk      = token();
  const metrics = 'impressions,reach,profile_views,follower_count';
  const res     = await fetch(
    `${BASE}/${acct}/insights?metric=${metrics}&period=${period}&access_token=${tk}`
  );
  return res.json();
}
