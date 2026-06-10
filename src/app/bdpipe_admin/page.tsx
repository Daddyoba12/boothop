'use client';

import { useEffect, useState } from 'react';

interface NotifItem { id: string; message: string; type: string; created_at: string; read: boolean; }
interface ContentItem { id: string; status: string; pillar: string; hook: string; created_at: string; score: number | null; }

const STATUS_COLORS: Record<string, string> = {
  draft: '#6B7280', review: '#F59E0B', approved: '#3B82F6',
  queued: '#8B5CF6', rendering: '#06B6D4', rendered: '#10B981',
  posted: '#22C55E', archived: '#374151',
};

export default function AdminOverview() {
  const [notifs,  setNotifs]  = useState<NotifItem[]>([]);
  const [recent,  setRecent]  = useState<ContentItem[]>([]);
  const [counts,  setCounts]  = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [nr, cr] = await Promise.all([
        fetch('/api/bd/notifications').then(r => r.json()).catch(() => ({ items: [] })),
        fetch('/api/bd/content?limit=50').then(r => r.json()).catch(() => ({ items: [] })),
      ]);
      setNotifs((nr.items ?? []).slice(0, 8));
      const items: ContentItem[] = cr.items ?? [];
      setRecent(items.slice(0, 6));
      const c: Record<string, number> = {};
      for (const it of items) c[it.status] = (c[it.status] ?? 0) + 1;
      setCounts(c);
      setLoading(false);
    })();
  }, []);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  async function markRead(id: string) {
    await fetch('/api/bd/notifications', { method: 'PATCH', body: JSON.stringify({ id }), headers: { 'content-type': 'application/json' } });
    setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x));
  }

  if (loading) return <div style={{ color: '#6B7280', padding: 60, textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: '#F9FAFB' }}>⚡ Pipeline Overview</h1>
        <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>Real-time status of your BD content pipeline</p>
      </div>

      {/* Status grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} style={{ background: '#111827', border: `1px solid ${color}44`, borderRadius: 12, padding: '16px 14px' }}>
            <div style={{ color, fontSize: 22, fontWeight: 800 }}>{counts[status] ?? 0}</div>
            <div style={{ color: '#9CA3AF', fontSize: 11, textTransform: 'uppercase', fontWeight: 600, marginTop: 2 }}>{status}</div>
          </div>
        ))}
        <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: 12, padding: '16px 14px' }}>
          <div style={{ color: '#F9FAFB', fontSize: 22, fontWeight: 800 }}>{total}</div>
          <div style={{ color: '#9CA3AF', fontSize: 11, textTransform: 'uppercase', fontWeight: 600, marginTop: 2 }}>Total</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent content */}
        <div style={{ background: '#111827', borderRadius: 14, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: '#F9FAFB' }}>Recent Content</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recent.length === 0 && <div style={{ color: '#6B7280', fontSize: 13 }}>No content yet — go generate!</div>}
            {recent.map(it => (
              <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#1F2937', borderRadius: 10 }}>
                <span style={{ fontSize: 10, background: `${STATUS_COLORS[it.status]}22`, color: STATUS_COLORS[it.status], borderRadius: 6, padding: '2px 8px', fontWeight: 700, whiteSpace: 'nowrap' }}>{it.status}</span>
                <div style={{ color: '#E5E7EB', fontSize: 12, flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{it.hook}</div>
                {it.score != null && <div style={{ color: '#7C3AED', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>⚡{it.score}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div style={{ background: '#111827', borderRadius: 14, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: '#F9FAFB' }}>Activity Log</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {notifs.length === 0 && <div style={{ color: '#6B7280', fontSize: 13 }}>No notifications yet.</div>}
            {notifs.map(n => (
              <div key={n.id} onClick={() => markRead(n.id)} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 10px', background: n.read ? '#1F2937' : '#1E3A5F', borderRadius: 8, cursor: 'pointer', opacity: n.read ? 0.6 : 1 }}>
                <span style={{ fontSize: 14 }}>{n.type === 'success' ? '✅' : n.type === 'error' ? '❌' : 'ℹ️'}</span>
                <div>
                  <div style={{ color: '#E5E7EB', fontSize: 12, lineHeight: 1.4 }}>{n.message}</div>
                  <div style={{ color: '#6B7280', fontSize: 10, marginTop: 2 }}>{new Date(n.created_at).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { href: '/bdpipe_admin/generate', label: '✨ Generate content', color: '#7C3AED' },
          { href: '/bdpipe_admin/library',  label: '📚 Review library',   color: '#0EA5E9' },
          { href: '/bdpipe_admin/publish',  label: '🚀 Publish queue',    color: '#10B981' },
          { href: '/bdpipe_admin/analytics',label: '📊 Analytics',        color: '#F59E0B' },
        ].map(l => (
          <a key={l.href} href={l.href} style={{ background: `${l.color}18`, border: `1px solid ${l.color}44`, borderRadius: 10, color: l.color, fontSize: 13, fontWeight: 600, padding: '10px 18px', textDecoration: 'none' }}>{l.label}</a>
        ))}
      </div>
    </div>
  );
}
