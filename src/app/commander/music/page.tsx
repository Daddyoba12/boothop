import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCommanderSession } from '@/lib/auth/commander';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import CommanderNav from '@/components/commander/CommanderNav';
import MusicManager from './MusicManager';

export const dynamic = 'force-dynamic';

export default async function MusicPage() {
  const cookieStore = await cookies();
  const session = getCommanderSession(cookieStore);
  if (!session) redirect('/commander');

  const db = createSupabaseAdminClient();

  const [{ data: library }, { data: assigned }] = await Promise.all([
    db.from('music_tracks')
      .select('id, title, artist, genre, duration_seconds, source, youtube_id, created_at')
      .order('created_at', { ascending: false }),
    db.from('client_music')
      .select('id, track_id, assigned_at')
      .eq('client_id', session.clientId),
  ]);

  const assignedTrackIds = new Set((assigned ?? []).map(r => r.track_id));

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <CommanderNav company={session.company} slug={session.slug} />
      <MusicManager
        clientId={session.clientId}
        library={library ?? []}
        assignedTrackIds={[...assignedTrackIds]}
        assigned={assigned ?? []}
      />
    </div>
  );
}
