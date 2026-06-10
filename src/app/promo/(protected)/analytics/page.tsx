'use client';

import { useEffect, useState } from 'react';

interface ContentItem {
  id: string; pillar: string; hook: string; status: string;
  views: number; likes: number; comments: number; shares: number;
  saves: number; clicks: number; conversions: number; score: number | null;
  created_at: string;
  bd_variants?: { label: string; hook: string; views: number; likes: number; clicks: number; score: number; is_winner: boolean; }[];
}

const PILLAR_COLORS: Record<string, string> = {
  logistics_stories:'#7C3AED', travel_hacks:'#0EA5E9',
  airport_deliveries:'#F59E0B', supply_chain_failures:'#EF4444',
};

function score(it: ContentItem) {
  return it.views * 1 + it.likes * 3 + it.comments * 4 + it.shares * 6 + it.saves * 5 + it.clicks * 8 + it.conversions * 20;
}

export default function AnalyticsPage() {
  const [items,   setItems]   = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort,    setSort]    = useState<'score' | 'views' | 'created_at'>('score');
  const [pillar,  setPillar]  = useState('all');

  useEffect(() => {
    (async () => {
      const res  = await fetch('/api/bd/content?status=all&limit=200');
      const data = await res.json();
      setItems(data.items ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = items
    .filter(x => pillar === 'all' || x.pillar === pillar)
    .filter(x => ['posted','rendered','approved'].includes(x.status))
    .sort((a, b) => {
      if (sort === 'score')      return (b.score ?? score(b)) - (a.score ?? score(a));
      if (sort === 'views')      return b.views - a.views;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const totalViews       = filtered.reduce((s, x) => s + x.views, 0);
  const totalLikes       = filtered.reduce((s, x) => s + x.likes, 0);
  const totalConversions = filtered.reduce((s, x) => s + x.conversions, 0);
  const avgScore         = filtered.length ? Math.round(filtered.reduce((s, x) => s + (x.score ?? score(x)), 0) / filtered.length) : 0;

  const pillarTotals = Object.fromEntries(
    ['logistics_stories','travel_hacks','airport_deliveries','supply_chain_failures'].map(p => [
      p, items.filter(x => x.pillar === p).reduce((s, x) => s + x.views, 0),
    ])
  );
  const maxPillarViews = Math.max(...Object.values(pillarTotals), 1);

  if (loading) return <div style={{ color: '#6B7280', padding: 60, textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: '#F9FAFB' }}>📊 Analytics</h1>
        <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>Performance across posted content · Score = views×1 + likes×3 + comments×4 + shares×6 + saves×5 + clicks×8 + conversions×20</p>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
        {[
          { label: 'Total views',       value: totalViews.toLocaleString(),       color: '#7C3AED' },
          { label: 'Total likes',       value: totalLikes.toLocaleString(),       color: '#0EA5E9' },
          { label: 'Total conversions', value: totalConversions.toLocaleString(), color: '#22C55E' },
          { label: 'Avg score',         value: avgScore.toLocaleString(),         color: '#F59E0B' },
          { label: 'Content tracked',   value: filtered.length.toString(),        color: '#6B7280' },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: '#111827', border: `1px solid ${kpi.color}33`, borderRadius: 12, padding: '18px 16px' }}>
            <div style={{ color: kpi.color, fontSize: 24, fontWeight: 800 }}>{kpi.value}</div>
            <div style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 600, marginTop: 2, textTransform: 'uppercase' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Pillar breakdown */}
      <div style={{ background: '#111827', borderRadius: 14, padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#F9FAFB', marginBottom: 16 }}>Views by pillar</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Object.entries(pillarTotals).map(([p, v]) => (
            <div key={p}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#D1D5DB', fontSize: 12 }}>{p.replace(/_/g,' ')}</span>
                <span style={{ color: PILLAR_COLORS[p] ?? '#6B7280', fontSize: 12, fontWeight: 700 }}>{v.toLocaleString()}</span>
              </div>
              <div style={{ background: '#1F2937', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                <div style={{ background: PILLAR_COLORS[p] ?? '#6B7280', borderRadius: 6, height: '100%', width: `${Math.round((v / maxPillarViews) * 100)}%`, transition: 'width 0.5s' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters + table */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <select value={pillar} onChange={e => setPillar(e.target.value)} style={selStyle}>
          <option value="all">All pillars</option>
          {['logistics_stories','travel_hacks','airport_deliveries','supply_chain_failures'].map(p => (
            <option key={p} value={p}>{p.replace(/_/g,' ')}</option>
          ))}
        </select>
        <select value={sort} onChange={e => setSort(e.target.value as typeof sort)} style={selStyle}>
          <option value="score">Sort by score</option>
          <option value="views">Sort by views</option>
          <option value="created_at">Sort by date</option>
        </select>
      </div>

      {filtered.length === 0 && <div style={{ color: '#6B7280', textAlign: 'center', padding: 40, background: '#111827', borderRadius: 14 }}>No posted content to analyse yet.</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((it, idx) => {
          const s  = it.score ?? score(it);
          const color = PILLAR_COLORS[it.pillar] ?? '#6B7280';
          const winner = it.bd_variants?.find(v => v.is_winner);
          return (
            <div key={it.id} style={{ background: '#111827', borderRadius: 12, padding: 18, border: `1px solid ${color}22` }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ color: '#374151', fontWeight: 800, fontSize: 18, minWidth: 28 }}>#{idx + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#F9FAFB', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                    {winner ? `[${winner.label}] ${winner.hook}` : it.hook}
                  </div>
                  <div style={{ color: '#6B7280', fontSize: 11, marginBottom: 10 }}>{it.pillar.replace(/_/g,' ')} · {new Date(it.created_at).toLocaleDateString()}</div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {[
                      { l: 'Views',       v: it.views,       c: '#7C3AED' },
                      { l: 'Likes',       v: it.likes,       c: '#0EA5E9' },
                      { l: 'Comments',    v: it.comments,    c: '#F59E0B' },
                      { l: 'Shares',      v: it.shares,      c: '#10B981' },
                      { l: 'Saves',       v: it.saves,       c: '#06B6D4' },
                      { l: 'Clicks',      v: it.clicks,      c: '#8B5CF6' },
                      { l: 'Conversions', v: it.conversions, c: '#22C55E' },
                    ].map(m => (
                      <div key={m.l} style={{ textAlign: 'center' }}>
                        <div style={{ color: m.c, fontSize: 15, fontWeight: 700 }}>{m.v.toLocaleString()}</div>
                        <div style={{ color: '#6B7280', fontSize: 10 }}>{m.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ color: color, fontSize: 22, fontWeight: 800 }}>⚡{s.toLocaleString()}</div>
                  <div style={{ color: '#6B7280', fontSize: 10 }}>score</div>
                </div>
              </div>
              {it.bd_variants && it.bd_variants.length > 1 && (
                <div style={{ marginTop: 12, background: '#1F2937', borderRadius: 8, padding: '8px 12px', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  {it.bd_variants.map(v => (
                    <div key={v.label} style={{ fontSize: 11 }}>
                      <span style={{ color: v.is_winner ? '#86EFAC' : '#9CA3AF', fontWeight: v.is_winner ? 800 : 500 }}>{v.is_winner ? '🏆 ' : ''}{v.label}: </span>
                      <span style={{ color: '#D1D5DB' }}>{v.views}v · {v.likes}l · {v.clicks}c · ⚡{v.score}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const selStyle: React.CSSProperties = { background: '#1F2937', border: '1px solid #374151', borderRadius: 8, color: '#F9FAFB', fontSize: 12, padding: '8px 12px' };
