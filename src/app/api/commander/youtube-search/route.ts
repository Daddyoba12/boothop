import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCommanderSession } from '@/lib/auth/commander';

export async function GET(req: NextRequest) {
  const store = await cookies();
  const s = getCommanderSession(store);
  if (!s) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const urlParam = req.nextUrl.searchParams.get('url');
  const qParam   = req.nextUrl.searchParams.get('q');

  // ── Mode 1: resolve a YouTube URL / video ID (keyless oEmbed) ────────────────
  if (urlParam) {
    const id = extractVideoId(urlParam.trim());
    if (!id) return NextResponse.json({ error: 'Could not recognise a YouTube video ID from that URL' }, { status: 400 });

    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`);
    if (!res.ok) return NextResponse.json({ error: 'Video not found or not accessible' }, { status: 404 });

    const data = await res.json();
    return NextResponse.json({
      results: [{
        id,
        title:     data.title       ?? '',
        channel:   data.author_name ?? '',
        thumbnail: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
      }],
    });
  }

  // ── Mode 2: keyword search via YouTube Data API v3 ───────────────────────────
  if (qParam) {
    const apiKey = process.env.YOUTUBE_DATA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'YouTube search not configured (no Google API key)', results: [] }, { status: 503 });
    }

    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part',            'snippet');
    url.searchParams.set('q',               qParam);
    url.searchParams.set('type',            'video');
    url.searchParams.set('maxResults',      '8');
    url.searchParams.set('videoCategoryId', '10'); // Music
    url.searchParams.set('key',             apiKey);

    const res = await fetch(url.toString(), { next: { revalidate: 300 } });

    if (!res.ok) {
      // If Data API not enabled, return a friendly message
      const err = await res.json().catch(() => ({}));
      const reason = (err?.error?.errors?.[0]?.reason as string) ?? '';
      if (reason === 'accessNotConfigured' || reason === 'quotaExceeded') {
        return NextResponse.json({
          error: 'YouTube search is not available — paste a YouTube link instead.',
          results: [],
        }, { status: 503 });
      }
      return NextResponse.json({ error: 'YouTube search failed', results: [] }, { status: 502 });
    }

    const data = await res.json();
    const results = (data.items ?? []).map((item: {
      id: { videoId: string };
      snippet: { title: string; channelTitle: string; thumbnails: { medium: { url: string } } };
    }) => ({
      id:        item.id.videoId,
      title:     item.snippet.title,
      channel:   item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.medium?.url ?? `https://i.ytimg.com/vi/${item.id.videoId}/mqdefault.jpg`,
    }));

    return NextResponse.json({ results });
  }

  return NextResponse.json({ error: 'Provide ?url= or ?q=' }, { status: 400 });
}

function extractVideoId(input: string): string | null {
  if (/^[A-Za-z0-9_-]{11}$/.test(input)) return input;
  try {
    const u = new URL(input.startsWith('http') ? input : `https://${input}`);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null;
    const v = u.searchParams.get('v');
    if (v) return v;
    const match = u.pathname.match(/\/(shorts|embed|v)\/([A-Za-z0-9_-]{11})/);
    if (match) return match[2];
  } catch { /* not a URL */ }
  const m = input.match(/[?&/]v[=/]([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
