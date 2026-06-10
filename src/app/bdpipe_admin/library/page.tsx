'use client';

import { useEffect, useState, useCallback } from 'react';

const PILLARS = ['all','logistics_stories','travel_hacks','airport_deliveries','supply_chain_failures'];
const STATUSES = ['all','draft','review','approved','queued','rendering','rendered','posted','archived'];

const STATUS_COLORS: Record<string, string> = {
  draft:'#6B7280', review:'#F59E0B', approved:'#3B82F6', queued:'#8B5CF6',
  rendering:'#06B6D4', rendered:'#10B981', posted:'#22C55E', archived:'#374151',
};

const PILLAR_ICONS: Record<string, string> = {
  logistics_stories:'🚚', travel_hacks:'✈️', airport_deliveries:'🛃', supply_chain_failures:'⚠️',
};

interface Variant { label: string; hook: string; caption: string; views: number; likes: number; clicks: number; is_winner: boolean; }
interface ContentItem {
  id: string; pillar: string; template_key: string; platform: string;
  hook: string; script: string; caption: string; hashtags: string; visual_desc: string;
  status: string; slot: number | null; slot_label: string | null;
  created_at: string; score: number | null; views: number; likes: number;
  bd_variants?: Variant[];
}

export default function LibraryPage() {
  const [items,    setItems]    = useState<ContentItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [pillar,   setPillar]   = useState('all');
  const [status,   setStatus]   = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing,  setEditing]  = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<ContentItem>>({});
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ status, pillar, limit: '100' });
    const res  = await fetch(`/api/bd/content?${params}`);
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  }, [status, pillar]);

  useEffect(() => { load(); }, [load]);

  async function save(id: string) {
    setSaving(true);
    await fetch('/api/bd/content', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, ...editData }) });
    setEditing(null);
    setSaving(false);
    load();
  }

  async function del(id: string) {
    if (!confirm('Delete this content?')) return;
    setDeleting(id);
    await fetch('/api/bd/content', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }) });
    setDeleting(null);
    setItems(prev => prev.filter(x => x.id !== id));
  }

  async function setStatus2(id: string, s: string) {
    await fetch('/api/bd/content', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, status: s }) });
    setItems(prev => prev.map(x => x.id === id ? { ...x, status: s } : x));
  }

  if (loading) return <div style={{ color: '#6B7280', padding: 60, textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: '#F9FAFB' }}>📚 Content Library</h1>
        <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>{items.length} items · Filter, edit, approve, and manage</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <select value={status} onChange={e => setStatus(e.target.value)} style={selStyle}>
          {STATUSES.map(s => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>)}
        </select>
        <select value={pillar} onChange={e => setPillar(e.target.value)} style={selStyle}>
          {PILLARS.map(p => <option key={p} value={p}>{p === 'all' ? 'All pillars' : p.replace(/_/g,' ')}</option>)}
        </select>
        <button onClick={load} style={{ background: '#1F2937', border: '1px solid #374151', borderRadius: 8, color: '#9CA3AF', cursor: 'pointer', fontSize: 12, padding: '8px 14px' }}>↺ Refresh</button>
      </div>

      {items.length === 0 && <div style={{ color: '#6B7280', padding: 40, textAlign: 'center', background: '#111827', borderRadius: 14 }}>No content found. Generate some first.</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {items.map(it => (
          <div key={it.id} style={{ background: '#111827', borderRadius: 14, padding: 20, border: `1px solid ${STATUS_COLORS[it.status] ?? '#374151'}33` }}>
            {/* Header */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: 22 }}>{PILLAR_ICONS[it.pillar] ?? '📦'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#F9FAFB', fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{it.hook}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, background: `${STATUS_COLORS[it.status]}22`, color: STATUS_COLORS[it.status], borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>{it.status}</span>
                  <span style={{ color: '#6B7280', fontSize: 11 }}>{it.pillar.replace(/_/g,' ')}</span>
                  {it.slot && <span style={{ color: '#6B7280', fontSize: 11 }}>Slot {it.slot}</span>}
                  {it.score != null && <span style={{ color: '#7C3AED', fontSize: 11, fontWeight: 700 }}>⚡ {it.score}</span>}
                  <span style={{ color: '#374151', fontSize: 11 }}>{new Date(it.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => { setExpanded(expanded === it.id ? null : it.id); }} style={iconBtn}>
                  {expanded === it.id ? '▲' : '▼'}
                </button>
                <button onClick={() => { setEditing(it.id); setEditData({ hook: it.hook, caption: it.caption, hashtags: it.hashtags, script: it.script, visual_desc: it.visual_desc }); }} style={iconBtn}>✏️</button>
                <button onClick={() => del(it.id)} disabled={deleting === it.id} style={{ ...iconBtn, color: '#EF4444' }}>🗑</button>
              </div>
            </div>

            {/* Status actions */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: expanded === it.id ? 14 : 0 }}>
              {['draft','review','approved','queued','archived'].filter(s => s !== it.status).map(s => (
                <button key={s} onClick={() => setStatus2(it.id, s)} style={{ background: `${STATUS_COLORS[s]}18`, border: `1px solid ${STATUS_COLORS[s]}44`, borderRadius: 6, color: STATUS_COLORS[s], cursor: 'pointer', fontSize: 10, fontWeight: 700, padding: '3px 10px' }}>
                  → {s}
                </button>
              ))}
            </div>

            {/* Expanded detail */}
            {expanded === it.id && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid #1F2937', paddingTop: 14 }}>
                {/* A/B variants */}
                {it.bd_variants && it.bd_variants.length > 0 && (
                  <div>
                    <div style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>A/B/C Variants</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {it.bd_variants.map(v => (
                        <div key={v.label} style={{ background: '#1F2937', borderRadius: 8, padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                          <span style={{ background: v.is_winner ? '#22C55E33' : '#7C3AED33', color: v.is_winner ? '#86EFAC' : '#A78BFA', borderRadius: 6, fontSize: 11, fontWeight: 800, padding: '2px 8px' }}>
                            {v.is_winner ? '🏆 ' : ''}{v.label}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: '#F9FAFB', fontSize: 12, fontWeight: 600 }}>{v.hook}</div>
                            <div style={{ color: '#6B7280', fontSize: 11, marginTop: 2 }}>{v.views} views · {v.likes} likes · {v.clicks} clicks</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <pre style={{ background: '#1F2937', borderRadius: 10, color: '#D1D5DB', fontSize: 12, lineHeight: 1.7, margin: 0, padding: 14, whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto' }}>{it.script}</pre>
                <div style={{ color: '#9CA3AF', fontSize: 12 }}>{it.caption}</div>
                <div style={{ color: '#7C3AED', fontSize: 12 }}>{it.hashtags}</div>
                <div style={{ color: '#6B7280', fontSize: 12, fontStyle: 'italic' }}>Visual: {it.visual_desc}</div>
              </div>
            )}

            {/* Edit form */}
            {editing === it.id && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid #1F2937', paddingTop: 14, marginTop: 14 }}>
                <div style={{ fontWeight: 700, color: '#F9FAFB', fontSize: 13 }}>Edit content</div>
                {(['hook','caption','hashtags','visual_desc'] as (keyof ContentItem)[]).map(f => (
                  <label key={f} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{f.replace(/_/g,' ')}</span>
                    <textarea value={(editData[f] as string) ?? ''} onChange={e => setEditData(d => ({ ...d, [f]: e.target.value }))} style={{ background: '#1F2937', border: '1px solid #374151', borderRadius: 8, color: '#F9FAFB', fontSize: 12, lineHeight: 1.6, padding: 10, resize: 'vertical', minHeight: 70 }} />
                  </label>
                ))}
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Script</span>
                  <textarea value={(editData.script as string) ?? ''} onChange={e => setEditData(d => ({ ...d, script: e.target.value }))} style={{ background: '#1F2937', border: '1px solid #374151', borderRadius: 8, color: '#F9FAFB', fontSize: 12, lineHeight: 1.6, padding: 10, resize: 'vertical', minHeight: 160 }} />
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => save(it.id)} disabled={saving} style={{ background: saving ? '#374151' : '#7C3AED', border: 'none', borderRadius: 8, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, padding: '8px 20px' }}>{saving ? 'Saving...' : 'Save'}</button>
                  <button onClick={() => setEditing(null)} style={{ background: '#1F2937', border: '1px solid #374151', borderRadius: 8, color: '#9CA3AF', cursor: 'pointer', fontSize: 13, padding: '8px 20px' }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const selStyle: React.CSSProperties = { background: '#1F2937', border: '1px solid #374151', borderRadius: 8, color: '#F9FAFB', fontSize: 12, padding: '8px 12px' };
const iconBtn:  React.CSSProperties = { background: '#1F2937', border: '1px solid #374151', borderRadius: 6, color: '#9CA3AF', cursor: 'pointer', fontSize: 13, padding: '4px 10px' };
