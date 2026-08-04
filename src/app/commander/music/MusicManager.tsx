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

const SB_MUSIC_BASE = 'https://zwgngbzbdvnrdnanjded.supabase.co/storage/v1/object/public/music-files';
const FOLDER: Record<string, string> = { archive: 'archive', daily: 'daily', clip: 'clips', clips: 'clips', yt_download: 'yt_downloads', yt_downloads: 'yt_downloads' };

function audioUrl(t: Track): string | null {
  if (t.youtube_id) return null;
  const folder = FOLDER[t.source];
  if (!folder) return null;
  return `${SB_MUSIC_BASE}/${folder}/${encodeURIComponent(t.title)}.mp3`;
}
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
  const [playingId, setPlayingId]   = useState<string | null>(null);

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
    `flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`;

  const inputCls = "rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all";

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Music Management</h1>
        <span className="text-xs text-gray-400 font-medium">{assigned.size} track{assigned.size !== 1 ? 's' : ''} assigned</span>
      </div>

      {msg && (
        <div className="mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">{msg}</div>
      )}

      {/* Tabs */}
      <div className="flex bg-gray-100 border border-gray-200 rounded-xl p-1 mb-6 gap-1">
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
            <div className="text-center py-16 text-gray-400 text-sm">
              No tracks in the library yet.<br />
              <span className="text-gray-300 text-xs">
                Use the &ldquo;Add from YouTube&rdquo; tab to add tracks via YouTube URL.<br />
                Admin can run a music sync to import the archive of ~120 tracks.
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(t => {
                const isOn = assigned.has(t.id);
                const aUrl = audioUrl(t);
                const isPlaying = playingId === t.id;
                return (
                  <div key={t.id} className="rounded-2xl border border-gray-100 bg-white hover:border-orange-100 hover:shadow-sm px-5 py-4 transition-all">
                    <div className="flex items-center gap-4">
                      {t.youtube_id && (
                        <img src={`https://i.ytimg.com/vi/${t.youtube_id}/mqdefault.jpg`} alt=""
                          width="64" height="40"
                          className="h-10 w-16 object-cover rounded-lg shrink-0" />
                      )}
                      {aUrl && !t.youtube_id && (
                        <button onClick={() => setPlayingId(isPlaying ? null : t.id)}
                          className="shrink-0 w-10 h-10 rounded-lg bg-gray-100 hover:bg-orange-50 text-gray-500 hover:text-orange-500 text-base transition-all flex items-center justify-center">
                          {isPlaying ? '⏸' : '▶'}
                        </button>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{t.title}</p>
                        <p className="text-xs text-gray-400">{t.artist} · {t.genre} · {fmtDuration(t.duration_seconds)}</p>
                      </div>
                      <span className="text-[10px] text-gray-300 shrink-0">{t.source}</span>
                      {t.youtube_id && (
                        <a href={`https://www.youtube.com/watch?v=${t.youtube_id}`} target="_blank" rel="noreferrer"
                          className="text-xs text-gray-400 hover:text-orange-500 transition-colors shrink-0">▶ YT</a>
                      )}
                      <button onClick={() => toggleAssign(t.id)} disabled={busy === t.id}
                        className={`shrink-0 px-4 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${isOn ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                        {busy === t.id ? '…' : isOn ? 'Remove' : '+ Add'}
                      </button>
                    </div>
                    {isPlaying && aUrl && (
                      <audio key={aUrl} src={aUrl} controls autoPlay
                        style={{ width: '100%', marginTop: '10px', height: '36px' }}
                        onEnded={() => setPlayingId(null)} />
                    )}
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
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">or search by keyword</span>
            <div className="flex-1 h-px bg-gray-200" />
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
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">{ytError}</p>
          )}

          {/* Results */}
          {ytResults.length > 0 && (
            <div className="space-y-3">
              {ytResults.map(v => (
                <div key={v.id} className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white shadow-sm px-5 py-4">
                  <img src={v.thumbnail} alt="" width="80" height="48" className="h-12 w-20 object-cover rounded-lg shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{v.title}</p>
                    <p className="text-xs text-gray-400">{v.channel}</p>
                    <a href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noreferrer"
                      className="text-[10px] text-gray-400 hover:text-orange-500 transition-colors">
                      ▶ Preview →
                    </a>
                  </div>
                  <button onClick={() => importTrack(v)} disabled={busy === v.id || assigned.has(v.id)}
                    className={`shrink-0 px-4 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${
                      assigned.has(v.id)
                        ? 'bg-gray-100 text-gray-400 cursor-default'
                        : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
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
            <div className="text-center py-16 text-gray-400 text-sm">
              No tracks assigned yet. Go to the Library tab to add some.
            </div>
          ) : (
            <div className="space-y-2">
              {library.filter(t => assigned.has(t.id)).map(t => {
                const aUrl = audioUrl(t);
                const isPlaying = playingId === t.id;
                return (
                  <div key={t.id} className="rounded-2xl border border-gray-100 bg-white shadow-sm px-5 py-4">
                    <div className="flex items-center gap-4">
                      {t.youtube_id && (
                        <img src={`https://i.ytimg.com/vi/${t.youtube_id}/mqdefault.jpg`} alt=""
                          width="64" height="40"
                          className="h-10 w-16 object-cover rounded-lg shrink-0" />
                      )}
                      {aUrl && !t.youtube_id && (
                        <button onClick={() => setPlayingId(isPlaying ? null : t.id)}
                          className="shrink-0 w-10 h-10 rounded-lg bg-gray-100 hover:bg-orange-50 text-gray-500 hover:text-orange-500 text-base transition-all flex items-center justify-center">
                          {isPlaying ? '⏸' : '▶'}
                        </button>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{t.title}</p>
                        <p className="text-xs text-gray-400">{t.artist} · {t.genre} · {fmtDuration(t.duration_seconds)}</p>
                      </div>
                      {t.youtube_id && (
                        <a href={`https://www.youtube.com/watch?v=${t.youtube_id}`} target="_blank" rel="noreferrer"
                          className="text-xs text-gray-400 hover:text-orange-500 transition-colors shrink-0">▶ YT</a>
                      )}
                      <button onClick={() => toggleAssign(t.id)} disabled={busy === t.id}
                        className="shrink-0 px-4 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-500 hover:bg-red-100 transition-all disabled:opacity-50">
                        {busy === t.id ? '…' : 'Remove'}
                      </button>
                    </div>
                    {isPlaying && aUrl && (
                      <audio key={aUrl} src={aUrl} controls autoPlay
                        style={{ width: '100%', marginTop: '10px', height: '36px' }}
                        onEnded={() => setPlayingId(null)} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
