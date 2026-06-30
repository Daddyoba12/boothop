import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCommanderSession } from '@/lib/auth/commander';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const store = await cookies();
  const s = getCommanderSession(store);
  if (!s) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { youtubeId, title, artist } = await req.json();
  if (!youtubeId || !title) return NextResponse.json({ error: 'youtubeId and title required' }, { status: 400 });

  const db = createSupabaseAdminClient();

  // Check if track already exists in library by YouTube ID
  const { data: existing } = await db
    .from('music_tracks')
    .select('id')
    .eq('youtube_id', youtubeId)
    .single();

  let trackId: string;

  if (existing) {
    trackId = existing.id;
  } else {
    // Save the YouTube reference — pipeline (yt-dlp on Oracle) will download the audio
    const { data: newTrack, error } = await db
      .from('music_tracks')
      .insert({
        title,
        artist:     artist ?? '',
        genre:      'YouTube',
        source:     'youtube',
        youtube_id: youtubeId,
      })
      .select('id')
      .single();

    if (error || !newTrack) return NextResponse.json({ error: 'Failed to save track' }, { status: 500 });
    trackId = newTrack.id;
  }

  // Assign to this client (upsert — idempotent)
  await db.from('client_music').upsert(
    { client_id: s.clientId, track_id: trackId },
    { onConflict: 'client_id,track_id' }
  );

  return NextResponse.json({ ok: true, trackId });
}
