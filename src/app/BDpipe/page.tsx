'use client';

import { useEffect, useState, useCallback } from 'react';

const PILLAR_COLORS: Record<string, string> = {
  logistics_stories:     '#7C3AED',
  travel_hacks:          '#0EA5E9',
  airport_deliveries:    '#F59E0B',
  supply_chain_failures: '#EF4444',
};

const PILLAR_ICONS: Record<string, string> = {
  logistics_stories:     '🚚',
  travel_hacks:          '✈️',
  airport_deliveries:    '🛃',
  supply_chain_failures: '⚠️',
};

interface BDPost {
  id: string; slot: number; slot_label: string; pillar: string;
  hook: string; script: string; caption: string; hashtags: string;
  visual_desc: string; video_url: string | null;
  tiktok_id: string | null; instagram_id: string | null;
  post_date: string;
}

function PostCard({ post }: { post: BDPost }) {
  const [expanded, setExpanded] = useState(false);
  const [copying,  setCopying]  = useState('');
  const color = PILLAR_COLORS[post.pillar] ?? '#6B7280';
  const icon  = PILLAR_ICONS[post.pillar]  ?? '📦';

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopying(label);
    setTimeout(() => setCopying(''), 1500);
  }

  return (
    <div style={{ background: '#111827', border: `2px solid ${color}33`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 26 }}>{icon}</span>
          <div>
            <div style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Slot {post.slot}</div>
            <div style={{ color: '#F9FAFB', fontSize: 17, fontWeight: 700 }}>{post.slot_label}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {post.tiktok_id    && <span style={{ fontSize: 11, color: '#FF0050', background: '#FF005022', borderRadius: 12, padding: '3px 10px', fontWeight: 600 }}>✓ TikTok</span>}
          {post.instagram_id && <span style={{ fontSize: 11, color: '#E1306C', background: '#E1306C22', borderRadius: 12, padding: '3px 10px', fontWeight: 600 }}>✓ Instagram</span>}
        </div>
      </div>

      {/* Hook */}
      <div style={{ background: '#1F2937', borderRadius: 10, padding: 14, borderLeft: `4px solid ${color}` }}>
        <div style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>Hook</div>
        <div style={{ color: '#F9FAFB', fontSize: 15, fontWeight: 600, lineHeight: 1.5 }}>{post.hook}</div>
      </div>

      {/* Script toggle */}
      <button onClick={() => setExpanded(e => !e)} style={{ background: 'transparent', border: '1px solid #374151', borderRadius: 8, color: '#9CA3AF', cursor: 'pointer', fontSize: 12, padding: '6px 12px', alignSelf: 'flex-start' }}>
        {expanded ? '▲ Hide script' : '▼ Full script'}
      </button>
      {expanded && <pre style={{ background: '#1F2937', borderRadius: 10, color: '#D1D5DB', fontSize: 12, lineHeight: 1.7, padding: 14, margin: 0 }}>{post.script}</pre>}

      {/* Caption */}
      <div style={{ background: '#1F2937', borderRadius: 10, padding: 14 }}>
        <div style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>Caption</div>
        <div style={{ color: '#E5E7EB', fontSize: 13, lineHeight: 1.6, marginBottom: 8 }}>{post.caption}</div>
        <button onClick={() => copy(post.caption, 'caption')} style={copyBtn}>{copying === 'caption' ? '✓ Copied' : 'Copy caption'}</button>
      </div>

      {/* Hashtags */}
      <div style={{ background: '#1F2937', borderRadius: 10, padding: 14 }}>
        <div style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>Hashtags</div>
        <div style={{ color: '#7C3AED', fontSize: 12, lineHeight: 1.8, wordBreak: 'break-word', marginBottom: 8 }}>{post.hashtags}</div>
        <button onClick={() => copy(post.hashtags, 'hashtags')} style={copyBtn}>{copying === 'hashtags' ? '✓ Copied' : 'Copy hashtags'}</button>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={() => copy(`${post.caption}\n\n${post.hashtags}`, 'all')} style={{ ...actionBtn, background: '#1E3A5F', color: '#93C5FD' }}>
          {copying === 'all' ? '✓ Copied!' : '📋 Copy all'}
        </button>
        {post.video_url && (
          <a href={post.video_url} download style={{ ...actionBtn, background: '#065F46', color: '#6EE7B7', textDecoration: 'none' }}>⬇ Download</a>
        )}
      </div>
    </div>
  );
}

const copyBtn: React.CSSProperties = { background: 'transparent', border: '1px solid #374151', borderRadius: 6, color: '#9CA3AF', cursor: 'pointer', fontSize: 11, padding: '4px 10px' };
const actionBtn: React.CSSProperties = { border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '8px 16px', display: 'inline-block' };

export default function BDPipePage() {
  const [posts,   setPosts]   = useState<BDPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [date,    setDate]    = useState(() => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' }));
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' });

  const fetchPosts = useCallback(async (d: string) => {
    setLoading(true); setError('');
    try {
      const res  = await fetch(`/api/bd/posts?date=${d}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPosts(data.posts ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPosts(date); }, [date, fetchPosts]);

  return (
    <div style={{ minHeight: '100vh', background: '#0D1117', color: '#F9FAFB', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', padding: '32px 16px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🌍</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>How things move around the world</h1>
          <p style={{ color: '#6B7280', margin: 0, fontSize: 13 }}>Daily content · 4 slots · Automated pipeline</p>
        </div>

        {/* Date + nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setDate(d => { const dt = new Date(d); dt.setDate(dt.getDate()-1); return dt.toLocaleDateString('en-CA'); })} style={{ background: '#1F2937', border: '1px solid #374151', borderRadius: 8, color: '#9CA3AF', cursor: 'pointer', padding: '6px 12px', fontSize: 18 }}>‹</button>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ background: '#1F2937', border: '1px solid #374151', borderRadius: 8, color: '#F9FAFB', fontSize: 14, padding: '6px 12px', width: 'auto' }} />
          <button onClick={() => setDate(d => { const dt = new Date(d); dt.setDate(dt.getDate()+1); return dt.toLocaleDateString('en-CA'); })} style={{ background: '#1F2937', border: '1px solid #374151', borderRadius: 8, color: '#9CA3AF', cursor: 'pointer', padding: '6px 12px', fontSize: 18 }}>›</button>
          {date !== today && <button onClick={() => setDate(today)} style={{ background: '#1F2937', border: '1px solid #374151', borderRadius: 8, color: '#6B7280', cursor: 'pointer', fontSize: 12, padding: '6px 12px' }}>Today</button>}
        </div>

        {loading && <div style={{ color: '#6B7280', textAlign: 'center', padding: 60 }}>Loading...</div>}
        {error   && <div style={{ background: '#1F2937', borderRadius: 12, color: '#FCA5A5', padding: 20, textAlign: 'center' }}>{error}</div>}

        {!loading && !error && posts.length === 0 && (
          <div style={{ background: '#111827', borderRadius: 16, color: '#6B7280', padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🕐</div>
            <div style={{ fontSize: 15, marginBottom: 8 }}>No content generated yet for {date}</div>
            <div style={{ fontSize: 13 }}>Posts are generated at 7am, 12pm, 6pm, and 9pm automatically.<br />
              Visit <a href="/bdpipe_admin/generate" style={{ color: '#7C3AED' }}>Admin → Generate</a> to create now.
            </div>
          </div>
        )}

        {!loading && posts.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {posts.map(post => <PostCard key={post.id} post={post} />)}
          </div>
        )}

        <div style={{ marginTop: 48, textAlign: 'center' }}>
          <a href="/bdpipe_admin" style={{ color: '#374151', fontSize: 12 }}>Admin →</a>
          {' · '}
          <a href="/api/bd/auth" onClick={async e => { e.preventDefault(); await fetch('/api/bd/auth', {method:'DELETE'}); window.location.href='/BDpipe/login'; }} style={{ color: '#374151', fontSize: 12, cursor: 'pointer' }}>Sign out</a>
        </div>
      </div>
    </div>
  );
}
