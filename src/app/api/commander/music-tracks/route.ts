import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCommanderSession } from '@/lib/auth/commander';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const store = await cookies();
  const session = getCommanderSession(store);
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const db = createSupabaseAdminClient();

  // Tracks assigned to this client
  const { data } = await db
    .from('client_music')
    .select('music_tracks(id, title, artist, youtube_id, source)')
    .eq('client_id', session.clientId);

  // Map stored source → subfolder in Supabase music-files bucket
  const FOLDER: Record<string, string> = {
    archive:      'archive',
    daily:        'daily',
    yt_download:  'yt_downloads',
    yt_downloads: 'yt_downloads',
    clip:         'clips',
    clips:        'clips',
  };

  const SB_MUSIC_BASE = 'https://zwgngbzbdvnrdnanjded.supabase.co/storage/v1/object/public/music-files';

  const tracks = (data ?? []).map((row: any) => {
    const t = Array.isArray(row.music_tracks) ? row.music_tracks[0] : row.music_tracks;
    if (!t) return null;
    const label = t.title || t.id;
    let path: string;
    if (t.youtube_id) {
      // YouTube tracks — Oracle downloads via yt-dlp; fall back to relative path
      path = `yt_downloads/${t.title}.mp3`;
    } else if (t.source && FOLDER[t.source]) {
      // Local/archive tracks — use Supabase Storage URL so Oracle can fetch if not local
      const folder = FOLDER[t.source];
      path = `${SB_MUSIC_BASE}/${folder}/${t.title}.mp3`;
    } else {
      path = String(t.id);
    }
    return { label, path };
  }).filter(Boolean);

  return NextResponse.json(tracks);
}
