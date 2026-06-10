'use client';

import { useEffect, useState, useCallback } from 'react';

interface ContentItem {
  id: string; pillar: string; hook: string; caption: string; hashtags: string;
  script?: string; visual_desc: string; status: string; slot: number | null;
  slot_label: string | null; video_url: string | null; created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  approved: '#3B82F6', queued: '#8B5CF6', rendering: '#06B6D4',
  rendered: '#10B981', posted: '#22C55E',
};

export default function PublishPage() {
  const [items,     setItems]     = useState<ContentItem[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [posting,   setPosting]   = useState<string | null>(null);
  const [saving,    setSaving]    = useState<string | null>(null);
  const [videoUrls, setVideoUrls] = useState<Record<string, string>>({});
  const [msg,       setMsg]       = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch('/api/bd/content?status=all&limit=100');
    const data = await res.json();
    const publishable = (data.items ?? []).filter((x: ContentItem) =>
      ['approved','queued','rendering','rendered','posted'].includes(x.status)
    );
    setItems(publishable);
    const urls: Record<string, string> = {};
    for (const item of publishable) {
      if (item.video_url) urls[item.id] = item.video_url;
    }
    setVideoUrls(urls);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function flash(id: string, m: string) {
    setMsg(prev => ({ ...prev, [id]: m }));
    setTimeout(() => setMsg(prev => { const n = { ...prev }; delete n[id]; return n; }), 5000);
  }

  async function saveVideoUrl(id: string) {
    const url = videoUrls[id]?.trim();
    if (!url) return;
    setSaving(id);
    try {
      const res = await fetch('/api/bd/content', {
        method:  'PATCH',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ id, video_url: url, status: 'rendered' }),
      });
      if (!res.ok) throw new Error('Failed to save');
      flash(id, '✅ Video URL saved — ready to post!');
      load();
    } catch { flash(id, '❌ Failed to save URL'); }
    finally { setSaving(null); }
  }

  async function post(id: string, platform: 'tiktok' | 'instagram') {
    setPosting(id + platform);
    try {
      const res  = await fetch('/api/bd/post', {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ id, platform }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      flash(id, `✅ Posted to ${platform}!`);
      load();
    } catch (e: unknown) { flash(id, `❌ ${e instanceof Error ? e.message : 'Post failed'}`); }
    finally { setPosting(null); }
  }

  if (loading) return <div style={{ color: '#6B7280', padding: 60, textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: '#F9FAFB' }}>🚀 Publish</h1>
        <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>Approve content in Library first, paste a video URL, then post directly to TikTok or Instagram.</p>
      </div>

      {/* How it works */}
      <div style={{ background: '#111827', borderRadius: 14, padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#F9FAFB', marginBottom: 14 }}>How to get content live — 3 steps</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {[
            { n: '1', title: 'Generate the content', desc: 'AI writes you a script, caption and hashtags. Takes 10 seconds.', color: '#7C3AED', action: '/promo/generate', actionLabel: 'Go →' },
            { n: '2', title: 'Approve it in Library', desc: 'Find your draft in Library, click "→ approved". It will appear here on this page.', color: '#0EA5E9', action: '/promo/library', actionLabel: 'Go →' },
            { n: '3', title: 'Add video URL and post', desc: 'Record a video using the script. Upload it anywhere (Google Drive public link, Dropbox, etc.), paste the URL below, then click Post to TikTok or Post to Instagram.', color: '#10B981', action: null, actionLabel: null },
          ].map((step, i, arr) => (
            <div key={step.n} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: i < arr.length - 1 ? '1px solid #1F2937' : 'none' }}>
              <div style={{ background: step.color, borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: '#fff', flexShrink: 0, marginTop: 2 }}>{step.n}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#F9FAFB', fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{step.title}</div>
                <div style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 1.6 }}>{step.desc}</div>
              </div>
              {step.action && (
                <a href={step.action} style={{ color: step.color, fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', alignSelf: 'center' }}>{step.actionLabel}</a>
              )}
            </div>
          ))}
        </div>
      </div>

      {items.length === 0 && (
        <div style={{ background: '#111827', borderRadius: 14, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
          <div style={{ color: '#F9FAFB', fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Nothing ready to publish yet</div>
          <div style={{ color: '#6B7280', fontSize: 13, marginBottom: 20 }}>Generate content and approve it in the Library — it will appear here.</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <a href="/promo/generate" style={{ background: '#7C3AED', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, padding: '10px 20px', textDecoration: 'none' }}>✨ Generate content</a>
            <a href="/promo/library" style={{ background: '#1F2937', border: '1px solid #374151', borderRadius: 8, color: '#9CA3AF', fontSize: 13, padding: '10px 20px', textDecoration: 'none' }}>📚 Go to Library</a>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {items.map(it => {
          const color      = STATUS_COLORS[it.status] ?? '#6B7280';
          const hasVideo   = !!(it.video_url || videoUrls[it.id]?.trim());
          const isPosted   = it.status === 'posted';
          const canPost    = it.status === 'rendered' || hasVideo;

          return (
            <div key={it.id} style={{ background: '#111827', border: `1px solid ${color}33`, borderRadius: 14, padding: 22 }}>

              {/* Status + hook */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, background: `${color}22`, color, borderRadius: 6, padding: '2px 10px', fontWeight: 700 }}>{it.status}</span>
                  {it.slot && <span style={{ color: '#6B7280', fontSize: 11 }}>Slot {it.slot} · {it.slot_label}</span>}
                  <span style={{ color: '#374151', fontSize: 11 }}>{new Date(it.created_at).toLocaleDateString()}</span>
                </div>
                <div style={{ color: '#F9FAFB', fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{it.hook}</div>
                <div style={{ color: '#9CA3AF', fontSize: 12, lineHeight: 1.6 }}>{it.caption.slice(0, 160)}...</div>
              </div>

              {/* Copy boxes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <CopyBox label="Caption" value={it.caption} />
                <CopyBox label="Hashtags" value={it.hashtags} />
              </div>

              {/* Script */}
              {it.script && (
                <details style={{ marginBottom: 14 }}>
                  <summary style={{ color: '#6B7280', fontSize: 12, cursor: 'pointer', userSelect: 'none' }}>📄 View script to record your video</summary>
                  <pre style={{ background: '#1F2937', borderRadius: 8, color: '#D1D5DB', fontSize: 12, lineHeight: 1.7, margin: '8px 0 0', padding: 14, whiteSpace: 'pre-wrap', maxHeight: 280, overflow: 'auto' }}>{it.script}</pre>
                </details>
              )}

              {/* Video URL */}
              {!isPosted && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>
                    🎬 {it.video_url ? 'Video URL (change if needed)' : 'Paste your video URL to enable posting'}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="url"
                      value={videoUrls[it.id] ?? ''}
                      onChange={e => setVideoUrls(prev => ({ ...prev, [it.id]: e.target.value }))}
                      placeholder="https://... public direct video link"
                      style={{ flex: 1, background: '#1F2937', border: `1px solid ${hasVideo ? '#10B981' : '#374151'}`, borderRadius: 8, color: '#F9FAFB', fontSize: 13, padding: '10px 14px', outline: 'none' }}
                    />
                    <button
                      onClick={() => saveVideoUrl(it.id)}
                      disabled={saving === it.id || !videoUrls[it.id]?.trim()}
                      style={{ background: saving === it.id ? '#374151' : '#065F46', border: 'none', borderRadius: 8, color: '#6EE7B7', cursor: saving === it.id ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, padding: '10px 18px', whiteSpace: 'nowrap' }}
                    >
                      {saving === it.id ? '⏳' : 'Save'}
                    </button>
                  </div>
                  {it.video_url && (
                    <a href={it.video_url} target="_blank" rel="noopener" style={{ color: '#10B981', fontSize: 12, marginTop: 6, display: 'inline-block' }}>▶ Preview video</a>
                  )}
                </div>
              )}

              {/* Post buttons */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                {isPosted ? (
                  <span style={{ color: '#22C55E', fontWeight: 700, fontSize: 14 }}>✅ Posted live</span>
                ) : canPost ? (
                  <>
                    <button
                      onClick={() => post(it.id, 'tiktok')}
                      disabled={posting === it.id + 'tiktok'}
                      style={{ background: posting === it.id + 'tiktok' ? '#374151' : '#FF004F', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 800, padding: '10px 24px' }}
                    >
                      {posting === it.id + 'tiktok' ? '⏳ Posting...' : '↑ Post to TikTok'}
                    </button>
                    <button
                      onClick={() => post(it.id, 'instagram')}
                      disabled={posting === it.id + 'instagram'}
                      style={{ background: posting === it.id + 'instagram' ? '#374151' : '#E1306C', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 800, padding: '10px 24px' }}
                    >
                      {posting === it.id + 'instagram' ? '⏳ Posting...' : '↑ Post to Instagram'}
                    </button>
                  </>
                ) : (
                  <span style={{ color: '#6B7280', fontSize: 13 }}>Paste a video URL above to unlock the post buttons</span>
                )}
                {msg[it.id] && (
                  <span style={{ color: msg[it.id].startsWith('✅') ? '#86EFAC' : '#FCA5A5', fontSize: 13, fontWeight: 600 }}>{msg[it.id]}</span>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}

function CopyBox({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ background: '#1F2937', borderRadius: 10, padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{label}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          style={{ background: 'none', border: '1px solid #374151', borderRadius: 6, color: copied ? '#86EFAC' : '#9CA3AF', cursor: 'pointer', fontSize: 11, padding: '2px 10px' }}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <div style={{ color: '#D1D5DB', fontSize: 12, lineHeight: 1.6, maxHeight: 60, overflow: 'hidden' }}>{value.slice(0, 130)}{value.length > 130 ? '...' : ''}</div>
    </div>
  );
}
