'use client';

import { useState, useTransition } from 'react';

type Track = {
  id:               string;
  title:            string;
  artist:           string;
  genre:            string;
  duration_seconds: number | null;
  source:           string;
  youtube_id:       string | null;
  created_at:       string;
};

interface Props {
  clientId:         string;
  library:          Track[];
  assignedTrackIds: string[];
  assigned:         { id: string; track_id: string; assigned_at: string }[];
}

type Tab = 'library' | 'youtube' | 'assigned';
type YtResult = { id: string; title: string; channel: string; thumbnail: string };

export default function MusicManager({ clientId: _clientId, library, assignedTrackIds: initial }: Props) {
  const [tab, setTab]           = useState<Tab>(library.length === 0 ? 'youtube' : 'library');
  const [assigned, setAssigned] = useState(new Set(initial));
  const [busy, setBusy]         = useState<string | null>(null);
  const [msg, setMsg]           = useState('');
  const [, startTransition]     = useTransition();

  // YouTube — shared
  const [ytResults, setYtResults]   = useState<YtResult[]>([]);
  const [ytLoading, setYtLoading]   = useState(false);
  const [ytError, setYtError]       = useState('');

  // YouTube — keyword search
  const [ytQuery, setYtQuery]       = useState('');

  // YouTube — URL paste
  const [ytUrl, setYtUrl]           = useState('');

  // Library filter
  const [search, setSearch]         = useState('');
  const [genreFilter, setGenreFilter] = useState('');

  const genres = [...new Set(library.map(t => t.genre).filter(Boolean))].sort();

  const filtered = library.filter(t => {
    const q = search.toLowerCase();
    return (!q || t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q))
      && (!genreFilter || t.genre === genreFilter);
  });

  async function toggleAssign(trackId: string) {
    setBusy(trackId); setMsg('');
    const isAssigned = assigned.has(trackId);
    const res = await fetch('/api/commander/music', {
      method: isAssigned ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackId }),
    });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) { setMsg(data.error ?? 'Failed'); return; }
    setAssigned(prev => {
      const next = new Set(prev);
      if (isAssigned) next.delete(trackId); else next.add(trackId);
      return next;
    });
    setMsg(isAssigned ? 'Track removed.' : 'Track added to your list.');
  }

  async function searchByKeyword() {
    if (!ytQuery.trim()) return;
    setYtError(''); setYtResults([]); setYtLoading(true);
    const res = await fetch(`/api/commander/youtube-search?q=${encodeURIComponent(ytQuery.trim())}`);
    const data = await res.json();
    setYtLoading(false);
    if (!res.ok || data.error) {
      setYtError(data.error ?? 'Search failed');
      return;
    }
    setYtResults(data.results ?? []);
  }

  async function lookupByUrl() {
    if (!ytUrl.trim()) return;
    setYtError(''); setYtResults([]); setYtLoading(true);
    const res = await fetch(`/api/commander/youtube-search?url=${encodeURIComponent(ytUrl.trim())}`);
    const data = await res.json();
    setYtLoading(false);
    if (!res.ok || data.error) {
      setYtError(data.error ?? 'Could not find that video');
      return;
    }
    setYtResults(data.results ?? []);
  }

  async function importTrack(video: YtResult) {
    setBusy(video.id); setMsg('');
    const res = await fetch('/api/commander/youtube-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ youtubeId: video.id, title: video.title, artist: video.channel }),
    });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) { setYtError(data.error ?? 'Import failed'); return; }
    setAssigned(prev => new Set([...prev, data.trackId]));
    setMsg(`"${video.title}" added to your tracks.`);
    startTransition(() => {});
  }

  const fmtDuration = (s: number | null) =>
    s ? `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}` : '—';

  const tabClass = (t: Tab) =>
    `flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${tab === t ? 'bg-orange-500 text-black' : 'text-white/35 hover:text-white/60'}`;

  const inputCls = "rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-orange-500/40";

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Music Management</h1>
        <span className="text-xs text-white/30">{assigned.size} track{assigned.size !== 1 ? 's' : ''} assigned</span>
      </div>

      {msg && (
        <div className="mb-4 text-sm text-green-300 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">{msg}</div>
      )}

      {/* Tabs */}
      <div className="flex bg-white/[0.04] border border-white/8 rounded-xl p-1 mb-6">
        <button className={tabClass('library')}  onClick={() => setTab('library')}>BootHop Library</button>
        <button className={tabClass('youtube')}  onClick={() => setTab('youtube')}>Add from YouTube</button>
        <button className={tabClass('assigned')} onClick={() => setTab('assigned')}>My Tracks ({assigned.size})</button>
      </div>

      {/* ── LIBRARY TAB ── */}
      {tab === 'library' && (
        <div>
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search title or artist…" className={`flex-1 ${inputCls}`} />
            <select value={genreFilter} onChange={e => setGenreFilter(e.target.value)} className={inputCls}>
              <option value="" className="bg-slate-900">All genres</option>
              {genres.map(g => <option key={g} value={g} className="bg-slate-900">{g}</option>)}
            </select>
          </div>
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-white/25 text-sm">
              No tracks in the library yet.<br />
              <span className="text-white/15 text-xs">
                Use the &ldquo;Add from YouTube&rdquo; tab to add tracks via YouTube URL.<br />
                Admin can run a music sync to import the archive of ~120 tracks.
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(t => {
                const isOn = assigned.has(t.id);
                return (
                  <div key={t.id} className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.04] px-5 py-4 transition-all">
                    {t.youtube_id && (
                      <img src={`https://i.ytimg.com/vi/${t.youtube_id}/mqdefault.jpg`} alt=""
                        width="64" height="40"
                        className="h-10 w-16 object-cover rounded-lg shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{t.title}</p>
                      <p className="text-xs text-white/40">{t.artist} · {t.genre} · {fmtDuration(t.duration_seconds)}</p>
                    </div>
                    <span className="text-[10px] text-white/20 shrink-0">{t.source}</span>
                    <button onClick={() => toggleAssign(t.id)} disabled={busy === t.id}
                      className={`shrink-0 px-4 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${isOn ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'}`}>
                      {busy === t.id ? '…' : isOn ? 'Remove' : '+ Add'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── YOUTUBE TAB ── */}
      {tab === 'youtube' && (
        <div>
          {/* URL paste — primary method (no API key needed) */}
          <div className="mb-6">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2">Paste a YouTube link (recommended)</p>
            <div className="flex gap-3">
              <input value={ytUrl}
                onChange={e => { setYtUrl(e.target.value); setYtResults([]); setYtError(''); }}
                onKeyDown={e => e.key === 'Enter' && lookupByUrl()}
                placeholder="https://youtube.com/watch?v=… or dQw4w9WgXcQ"
                className={`flex-1 font-mono ${inputCls}`} />
              <button onClick={lookupByUrl} disabled={ytLoading || !ytUrl.trim()}
                className="px-5 py-2.5 rounded-xl bg-orange-500 text-black text-sm font-bold disabled:opacity-40 hover:bg-orange-400 transition-all">
                {ytLoading ? '…' : 'Look up'}
              </button>
            </div>
            <p className="text-[10px] text-white/20 mt-2">Open YouTube, copy the link and paste it here — works without any API key.</p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-[10px] text-white/25 font-semibold uppercase tracking-wider">or search by keyword</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Keyword search */}
          <div className="mb-6">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2">Search by artist or title</p>
            <div className="flex gap-3">
              <input value={ytQuery}
                onChange={e => { setYtQuery(e.target.value); setYtResults([]); setYtError(''); }}
                onKeyDown={e => e.key === 'Enter' && searchByKeyword()}
                placeholder="e.g. Burna Boy afrobeats 2025"
                className={`flex-1 ${inputCls}`} />
              <button onClick={searchByKeyword} disabled={ytLoading || !ytQuery.trim()}
                className="px-5 py-2.5 rounded-xl bg-white/10 text-white text-sm font-bold disabled:opacity-40 hover:bg-white/15 transition-all">
                {ytLoading ? '…' : 'Search'}
              </button>
            </div>
            <p className="text-[10px] text-white/20 mt-2">Keyword search requires a YouTube Data API key to be configured — paste a link above if this fails.</p>
          </div>

          {/* Error */}
          {ytError && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">{ytError}</p>
          )}

          {/* Results */}
          {ytResults.length > 0 && (
            <div className="space-y-3">
              {ytResults.map(v => (
                <div key={v.id} className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.02] px-5 py-4">
                  <img src={v.thumbnail} alt="" width="80" height="48" className="h-12 w-20 object-cover rounded-lg shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{v.title}</p>
                    <p className="text-xs text-white/40">{v.channel}</p>
                    <a href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noreferrer"
                      className="text-[10px] text-white/25 hover:text-orange-400 transition-colors">
                      ▶ Preview →
                    </a>
                  </div>
                  <button onClick={() => importTrack(v)} disabled={busy === v.id || assigned.has(v.id)}
                    className={`shrink-0 px-4 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${
                      assigned.has(v.id)
                        ? 'bg-white/10 text-white/30 cursor-default'
                        : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                    }`}>
                    {busy === v.id ? 'Adding…' : assigned.has(v.id) ? '✓ Added' : '+ Add'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ASSIGNED TAB ── */}
      {tab === 'assigned' && (
        <div>
          {assigned.size === 0 ? (
            <div className="text-center py-16 text-white/25 text-sm">
              No tracks assigned yet. Go to the Library tab to add some.
            </div>
          ) : (
            <div className="space-y-2">
              {library.filter(t => assigned.has(t.id)).map(t => (
                <div key={t.id} className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.02] px-5 py-4">
                  {t.youtube_id && (
                    <img src={`https://i.ytimg.com/vi/${t.youtube_id}/mqdefault.jpg`} alt=""
                      width="64" height="40"
                      className="h-10 w-16 object-cover rounded-lg shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{t.title}</p>
                    <p className="text-xs text-white/40">{t.artist} · {t.genre} · {fmtDuration(t.duration_seconds)}</p>
                  </div>
                  {t.youtube_id && (
                    <a href={`https://www.youtube.com/watch?v=${t.youtube_id}`} target="_blank" rel="noreferrer"
                      className="text-xs text-white/25 hover:text-white/50 transition-colors shrink-0">
                      ▶ Preview
                    </a>
                  )}
                  <button onClick={() => toggleAssign(t.id)} disabled={busy === t.id}
                    className="shrink-0 px-4 py-1.5 rounded-lg text-xs font-bold bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all disabled:opacity-50">
                    {busy === t.id ? '…' : 'Remove'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
