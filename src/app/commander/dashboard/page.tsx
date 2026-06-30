import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCommanderSession } from '@/lib/auth/commander';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import CommanderNav from '@/components/commander/CommanderNav';

export const dynamic = 'force-dynamic';

export default async function CommanderDashboard() {
  const cookieStore = await cookies();
  const session = getCommanderSession(cookieStore);
  if (!session) redirect('/commander');

  const db = createSupabaseAdminClient();

  const [{ data: client }, { data: tracks }] = await Promise.all([
    db.from('pipeline_clients')
      .select('id, slug, company, email, contact_name, plan, status, created_at, platforms')
      .eq('id', session.clientId)
      .single(),
    db.from('client_music')
      .select('id, track_id, assigned_at, music_tracks(id, title, artist, genre, duration_seconds, source)')
      .eq('client_id', session.clientId)
      .order('assigned_at', { ascending: false })
      .limit(20),
  ]);

  const planBadge: Record<string, string> = {
    basic: 'bg-slate-700 text-slate-200',
    pro:   'bg-amber-500/20 text-amber-300',
  };

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <CommanderNav company={session.company} slug={session.slug} />

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{session.company}</h1>
            <p className="text-sm text-white/40 mt-0.5">Company ID: <span className="font-mono text-white/60">{session.slug}</span></p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${planBadge[client?.plan ?? 'basic'] ?? planBadge.basic}`}>
              {client?.plan ?? 'basic'} plan
            </span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${client?.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
              {client?.status ?? 'active'}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Tracks assigned',  value: tracks?.length ?? 0 },
            { label: 'Contact',          value: client?.contact_name ?? '—' },
            { label: 'Email',            value: client?.email ?? '—', mono: true, truncate: true },
            { label: 'Member since',     value: client?.created_at ? new Date(client.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
          ].map(({ label, value, mono, truncate }) => (
            <div key={label} className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1">{label}</p>
              <p className={`text-sm font-semibold text-white ${mono ? 'font-mono' : ''} ${truncate ? 'truncate' : ''}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Music section */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-white">Your Music</h2>
            <Link href="/commander/music"
              className="text-xs font-semibold px-4 py-2 rounded-xl bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors">
              Manage music →
            </Link>
          </div>

          {!tracks || tracks.length === 0 ? (
            <div className="text-center py-10 text-white/25 text-sm">
              No music assigned yet.{' '}
              <Link href="/commander/music" className="text-orange-400 hover:underline">Add tracks →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {tracks.map((row) => {
                const t = Array.isArray(row.music_tracks) ? row.music_tracks[0] : row.music_tracks;
                if (!t) return null;
                const mins = Math.floor((t.duration_seconds ?? 0) / 60);
                const secs = ((t.duration_seconds ?? 0) % 60).toString().padStart(2, '0');
                return (
                  <div key={row.id} className="flex items-center gap-4 py-2.5 border-b border-white/5 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{t.title}</p>
                      <p className="text-xs text-white/40">{t.artist} · {t.genre}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono text-white/30">{mins}:{secs}</p>
                      <p className="text-[10px] text-white/20">{t.source}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { href: '/commander/music', label: 'Music Library', desc: 'Browse, add, replace tracks' },
            { href: '/client-onboarding', label: 'Pipeline Onboarding', desc: 'Oracle onboarding portal' },
            { href: '/onboard/admin', label: 'Admin Panel', desc: 'All pipeline clients (admin only)' },
          ].map(({ href, label, desc }) => (
            <Link key={href} href={href}
              className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 hover:border-orange-500/30 hover:bg-white/[0.05] transition-all group">
              <p className="text-sm font-bold text-white group-hover:text-orange-300 transition-colors">{label}</p>
              <p className="text-xs text-white/30 mt-1">{desc}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
