'use client';

import { useEffect, useState, useCallback } from 'react';

interface Variant { label: string; hook: string; caption: string; is_winner: boolean; }
interface ContentItem {
  id: string; pillar: string; hook: string; caption: string; hashtags: string;
  visual_desc: string; status: string; slot: number | null; slot_label: string | null;
  video_url: string | null; created_at: string; bd_variants?: Variant[];
  bd_render_jobs?: { status: string; error: string | null; created_at: string }[];
}

const STATUS_COLORS: Record<string, string> = {
  approved:'#3B82F6', queued:'#8B5CF6', rendering:'#06B6D4', rendered:'#10B981', posted:'#22C55E',
};

export default function PublishPage() {
  const [items,     setItems]     = useState<ContentItem[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [posting,   setPosting]   = useState<string | null>(null);
  const [rendering, setRendering] = useState<string | null>(null);
  const [msg,       setMsg]       = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch('/api/bd/content?status=all&limit=100');
    const data = await res.json();
    const publishable = (data.items ?? []).filter((x: ContentItem) => ['approved','queued','rendering','rendered'].includes(x.status));
    setItems(publishable);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function flash(id: string, m: string) {
    setMsg(prev => ({ ...prev, [id]: m }));
    setTimeout(() => setMsg(prev => { const n = { ...prev }; delete n[id]; return n; }), 4000);
  }

  async function render(id: string) {
    setRendering(id);
    try {
      const res  = await fetch('/api/bd/render', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contentId: id }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      flash(id, '✅ Render job queued — Python script will process this.');
      load();
    } catch (e: unknown) { flash(id, `❌ ${e instanceof Error ? e.message : 'Render failed'}`); }
    finally { setRendering(null); }
  }

  async function post(id: string, platform: 'tiktok' | 'instagram') {
    setPosting(id + platform);
    try {
      const res  = await fetch('/api/bd/post', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, platform }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      flash(id, `✅ Posted to ${platform}!`);
      load();
    } catch (e: unknown) { flash(id, `❌ ${e instanceof Error ? e.message : 'Post failed'}`); }
    finally { setPosting(null); }
  }

  if (loading) return <div style={{ color: '#6B7280', padding: 60, textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: '#F9FAFB' }}>🚀 Publish Queue</h1>
        <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>Render videos and post to TikTok / Instagram</p>
      </div>

      {/* Info banner */}
      <div style={{ background: '#1E3A5F', borderRadius: 12, padding: 16, fontSize: 13, color: '#93C5FD', lineHeight: 1.6 }}>
        <strong>How publishing works:</strong><br />
        1. Approve content in Library → it appears here.<br />
        2. Click <strong>Render</strong> to queue video generation (processed by Python on your machine).<br />
        3. Once rendered (status = "rendered"), click <strong>Post to TikTok</strong> or <strong>Post to Instagram</strong>.<br />
        4. TikTok uses PULL_FROM_URL — TikTok fetches directly from Supabase Storage.<br />
        5. Instagram uses the Graph API: video → public URL → Reel container → publish.
      </div>

      {items.length === 0 && (
        <div style={{ background: '#111827', borderRadius: 14, padding: 40, textAlign: 'center', color: '#6B7280' }}>
          No content in the publish pipeline. Approve content in the <a href="/bdpipe_admin/library" style={{ color: '#7C3AED' }}>Library</a> first.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {items.map(it => {
          const latestJob = it.bd_render_jobs?.[0];
          const color = STATUS_COLORS[it.status] ?? '#6B7280';
          return (
            <div key={it.id} style={{ background: '#111827', border: `1px solid ${color}33`, borderRadius: 14, padding: 20 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  {/* Status + slot */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, background: `${color}22`, color, borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>{it.status}</span>
                    {it.slot && <span style={{ color: '#6B7280', fontSize: 11 }}>Slot {it.slot} · {it.slot_label}</span>}
                    <span style={{ color: '#374151', fontSize: 11 }}>{new Date(it.created_at).toLocaleDateString()}</span>
                  </div>
                  <div style={{ color: '#F9FAFB', fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{it.hook}</div>
                  <div style={{ color: '#9CA3AF', fontSize: 12 }}>{it.caption.slice(0, 120)}...</div>

                  {/* Render job info */}
                  {latestJob && (
                    <div style={{ marginTop: 10, background: '#1F2937', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                      <span style={{ color: '#9CA3AF' }}>Render job: </span>
                      <span style={{ color: latestJob.status === 'done' ? '#22C55E' : latestJob.status === 'error' ? '#EF4444' : '#F59E0B', fontWeight: 600 }}>{latestJob.status}</span>
                      {latestJob.error && <span style={{ color: '#EF4444', marginLeft: 8 }}>{latestJob.error}</span>}
                    </div>
                  )}

                  {/* Video URL */}
                  {it.video_url && (
                    <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                      <a href={it.video_url} target="_blank" rel="noopener" style={{ color: '#10B981', fontSize: 12 }}>▶ Preview video</a>
                      <a href={it.video_url} download style={{ color: '#6B7280', fontSize: 12 }}>⬇ Download</a>
                    </div>
                  )}

                  {msg[it.id] && <div style={{ marginTop: 10, color: msg[it.id].startsWith('✅') ? '#86EFAC' : '#FCA5A5', fontSize: 13 }}>{msg[it.id]}</div>}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                  {(it.status === 'approved' || it.status === 'queued') && (
                    <button onClick={() => render(it.id)} disabled={rendering === it.id} style={{ background: rendering === it.id ? '#374151' : '#065F46', border: 'none', borderRadius: 8, color: '#6EE7B7', cursor: rendering === it.id ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700, padding: '8px 14px', whiteSpace: 'nowrap' }}>
                      {rendering === it.id ? '⏳...' : '🎬 Render'}
                    </button>
                  )}
                  {it.status === 'rendered' && it.video_url && (
                    <>
                      <button onClick={() => post(it.id, 'tiktok')} disabled={posting === it.id + 'tiktok'} style={{ background: '#FF005018', border: '1px solid #FF005044', borderRadius: 8, color: '#FF0050', cursor: posting === it.id + 'tiktok' ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700, padding: '8px 14px', whiteSpace: 'nowrap' }}>
                        {posting === it.id + 'tiktok' ? '⏳...' : '↑ TikTok'}
                      </button>
                      <button onClick={() => post(it.id, 'instagram')} disabled={posting === it.id + 'instagram'} style={{ background: '#E1306C18', border: '1px solid #E1306C44', borderRadius: 8, color: '#E1306C', cursor: posting === it.id + 'instagram' ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700, padding: '8px 14px', whiteSpace: 'nowrap' }}>
                        {posting === it.id + 'instagram' ? '⏳...' : '↑ Instagram'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
