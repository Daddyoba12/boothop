'use client';

import { useState } from 'react';

const PILLARS = [
  { value: 'logistics_stories',     label: '🚚 Logistics Stories'      },
  { value: 'travel_hacks',          label: '✈️ Travel Hacks'           },
  { value: 'airport_deliveries',    label: '🛃 Airport Deliveries'     },
  { value: 'supply_chain_failures', label: '⚠️ Supply Chain Failures'  },
];

const TEMPLATES = [
  { value: 'documentary',     label: '🎬 Documentary'   },
  { value: 'urgent_news',     label: '📡 Urgent News'   },
  { value: 'travel_hack',     label: '🗺️ Travel Hack'   },
  { value: 'supply_chain',    label: '🔗 Supply Chain'  },
  { value: 'airport_mystery', label: '🛬 Airport Mystery'},
  { value: 'boothop_cta',     label: '📦 BootHop CTA'   },
];

const PLATFORMS = [
  { value: 'all',            label: 'All Platforms'   },
  { value: 'tiktok',         label: 'TikTok'          },
  { value: 'instagram',      label: 'Instagram'       },
  { value: 'youtube_shorts', label: 'YouTube Shorts'  },
];

const SLOTS = [
  { slot: 1, label: '7am — Morning commute', pillar: 'logistics_stories'     },
  { slot: 2, label: '12pm — Lunch scroll',   pillar: 'travel_hacks'          },
  { slot: 3, label: '6pm — Evening wind-down',pillar: 'airport_deliveries'   },
  { slot: 4, label: '9pm — Night grind',     pillar: 'supply_chain_failures' },
];

interface Variant { label: string; hook: string; caption: string; }
interface GeneratedItem {
  id: string; hook: string; script: string; caption: string; hashtags: string;
  visual_desc: string; status: string; pillar: string; template_key: string;
  bd_variants?: Variant[];
}

export default function GeneratePage() {
  const [pillar,      setPillar]      = useState('logistics_stories');
  const [template,   setTemplate]    = useState('documentary');
  const [platform,   setPlatform]    = useState('all');
  const [slot,       setSlot]        = useState<number | null>(null);
  const [slotLabel,  setSlotLabel]   = useState('');
  const [loading,    setLoading]     = useState(false);
  const [result,     setResult]      = useState<GeneratedItem | null>(null);
  const [error,      setError]       = useState('');
  const [copyLabel,  setCopyLabel]   = useState('');
  const [bulkLoading,setBulkLoading] = useState(false);
  const [bulkResults,setBulkResults] = useState<string[]>([]);

  function selectSlot(s: typeof SLOTS[0]) {
    setSlot(s.slot);
    setSlotLabel(s.label);
    setPillar(s.pillar);
  }

  async function generate() {
    setLoading(true); setError(''); setResult(null);
    try {
      const res  = await fetch('/api/bd/generate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pillar, templateKey: template, platform, slot, slotLabel }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.item);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Generation failed'); }
    finally { setLoading(false); }
  }

  async function generateAll() {
    setBulkLoading(true); setBulkResults([]);
    const logs: string[] = [];
    for (const s of SLOTS) {
      try {
        setBulkResults([...logs, `⏳ Generating slot ${s.slot}...`]);
        const res  = await fetch('/api/bd/generate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pillar: s.pillar, templateKey: 'documentary', platform: 'all', slot: s.slot, slotLabel: s.label }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        logs.push(`✅ Slot ${s.slot} — "${data.item?.hook?.slice(0, 60)}..."`);
      } catch (e: unknown) { logs.push(`❌ Slot ${s.slot} failed: ${e instanceof Error ? e.message : 'error'}`); }
      setBulkResults([...logs]);
    }
    setBulkLoading(false);
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopyLabel(label);
    setTimeout(() => setCopyLabel(''), 1500);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: '#F9FAFB' }}>✨ Generate Content</h1>
        <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>AI-powered script generation with A/B hook variants</p>
      </div>

      {/* Slot quick-pick */}
      <div style={{ background: '#111827', borderRadius: 14, padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#9CA3AF', marginBottom: 12, textTransform: 'uppercase' }}>Quick-pick daily slot</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {SLOTS.map(s => (
            <button key={s.slot} onClick={() => selectSlot(s)} style={{ background: slot === s.slot ? '#7C3AED22' : '#1F2937', border: `2px solid ${slot === s.slot ? '#7C3AED' : '#374151'}`, borderRadius: 10, color: slot === s.slot ? '#A78BFA' : '#9CA3AF', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '10px 14px', textAlign: 'left', transition: 'all 0.15s' }}>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 2 }}>Slot {s.slot}</div>
              <div style={{ fontSize: 11 }}>{s.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div style={{ background: '#111827', borderRadius: 14, padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Pillar</span>
          <select value={pillar} onChange={e => setPillar(e.target.value)} style={selectStyle}>
            {PILLARS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Tone/Template</span>
          <select value={template} onChange={e => setTemplate(e.target.value)} style={selectStyle}>
            {TEMPLATES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Platform</span>
          <select value={platform} onChange={e => setPlatform(e.target.value)} style={selectStyle}>
            {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </label>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={generate} disabled={loading} style={{ background: loading ? '#374151' : '#7C3AED', border: 'none', borderRadius: 10, color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, padding: '12px 28px' }}>
          {loading ? '⏳ Generating...' : '✨ Generate'}
        </button>
        <button onClick={generateAll} disabled={bulkLoading} style={{ background: bulkLoading ? '#374151' : '#065F46', border: 'none', borderRadius: 10, color: '#6EE7B7', cursor: bulkLoading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, padding: '12px 28px' }}>
          {bulkLoading ? '⏳ Bulk generating...' : '⚡ Generate all 4 slots'}
        </button>
      </div>

      {error && <div style={{ background: '#1F2937', border: '1px solid #EF444444', borderRadius: 10, color: '#FCA5A5', padding: 14, fontSize: 13 }}>{error}</div>}

      {/* Bulk results */}
      {bulkResults.length > 0 && (
        <div style={{ background: '#111827', borderRadius: 14, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: '#F9FAFB' }}>Bulk generation results</div>
          {bulkResults.map((l, i) => <div key={i} style={{ color: '#D1D5DB', fontSize: 13, lineHeight: 2 }}>{l}</div>)}
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{ background: '#111827', borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#F9FAFB' }}>Generated ✅</div>
            <a href="/bdpipe_admin/library" style={{ color: '#7C3AED', fontSize: 12, textDecoration: 'none' }}>View in library →</a>
          </div>

          {/* Variants */}
          {result.bd_variants && result.bd_variants.length > 0 && (
            <div>
              <div style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>A/B/C Hook variants</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.bd_variants.map((v) => (
                  <div key={v.label} style={{ background: '#1F2937', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ background: '#7C3AED33', color: '#A78BFA', borderRadius: 6, fontSize: 11, fontWeight: 800, padding: '2px 8px' }}>Variant {v.label}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#F9FAFB', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{v.hook}</div>
                      <div style={{ color: '#9CA3AF', fontSize: 12 }}>{v.caption}</div>
                    </div>
                    <button onClick={() => copy(v.hook, `hook-${v.label}`)} style={miniBtnStyle}>{copyLabel === `hook-${v.label}` ? '✓' : 'Copy'}</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Script preview */}
          <div>
            <div style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Full script</div>
            <pre style={{ background: '#1F2937', borderRadius: 10, color: '#D1D5DB', fontSize: 12, lineHeight: 1.7, margin: 0, padding: 16, whiteSpace: 'pre-wrap' }}>{result.script}</pre>
          </div>

          {/* Caption + hashtags */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ background: '#1F2937', borderRadius: 10, padding: 14 }}>
              <div style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Caption</div>
              <div style={{ color: '#E5E7EB', fontSize: 12, lineHeight: 1.6, marginBottom: 8 }}>{result.caption}</div>
              <button onClick={() => copy(result.caption, 'cap')} style={miniBtnStyle}>{copyLabel === 'cap' ? '✓ Copied' : 'Copy'}</button>
            </div>
            <div style={{ background: '#1F2937', borderRadius: 10, padding: 14 }}>
              <div style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Hashtags</div>
              <div style={{ color: '#7C3AED', fontSize: 12, lineHeight: 1.8, wordBreak: 'break-word', marginBottom: 8 }}>{result.hashtags}</div>
              <button onClick={() => copy(result.hashtags, 'ht')} style={miniBtnStyle}>{copyLabel === 'ht' ? '✓ Copied' : 'Copy'}</button>
            </div>
          </div>

          <div style={{ background: '#1F2937', borderRadius: 10, padding: 14 }}>
            <div style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Visual description</div>
            <div style={{ color: '#E5E7EB', fontSize: 12, lineHeight: 1.6 }}>{result.visual_desc}</div>
          </div>
        </div>
      )}
    </div>
  );
}

const selectStyle: React.CSSProperties = { background: '#1F2937', border: '1px solid #374151', borderRadius: 8, color: '#F9FAFB', fontSize: 13, padding: '8px 12px' };
const miniBtnStyle: React.CSSProperties = { background: 'transparent', border: '1px solid #374151', borderRadius: 6, color: '#9CA3AF', cursor: 'pointer', fontSize: 11, padding: '4px 10px', whiteSpace: 'nowrap' };
