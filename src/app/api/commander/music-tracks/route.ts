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

  const tracks = (data ?? []).map((row: any) => {
    const t = Array.isArray(row.music_tracks) ? row.music_tracks[0] : row.music_tracks;
    if (!t) return null;
    const label = t.artist ? `${t.title} — ${t.artist}` : t.title;
    const path  = t.youtube_id ? `yt:${t.youtube_id}` : String(t.id);
    return { label, path };
  }).filter(Boolean);

  return NextResponse.json(tracks);
}
