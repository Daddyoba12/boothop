'use client';
import Link from 'next/link';

export default function DemoPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0d0d18', color: '#e4e4e8', fontFamily: 'system-ui, sans-serif', padding: '40px 24px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ff6a00', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            G-Inspired Automall · Client Walkthrough
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Commander Demo</h1>
          <p style={{ color: '#888', marginTop: 8, fontSize: '0.9rem', lineHeight: 1.6 }}>
            Full walkthrough of the BootHop Commander as a regular client — pipeline slots, editing, Revoice Studio, AI voiceover, music, and baking.
          </p>
        </div>

        {/* Video */}
        <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #1e1e30', background: '#080810', marginBottom: 28 }}>
          <video
            src="/demos/demo_ginspired_client_voiced.mp4"
            controls
            autoPlay
            style={{ width: '100%', display: 'block', maxHeight: 540, background: '#000' }}
          />
        </div>

        {/* Steps */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 32 }}>
          {[
            ['01', 'Auto-login as ginspired'],
            ['02', 'Tour overlay starts'],
            ['03', '4 pipeline slot cards with videos'],
            ['04', 'Approve / Post buttons'],
            ['05', 'Edit panel — hook, lesson, captions'],
            ['06', 'Hook text amended'],
            ['07', 'Revoice Studio tab'],
            ['08', 'Slot video + script auto-loaded'],
            ['09', 'Script edited manually'],
            ['10', 'AI voiceover, music, bake ready'],
            ['11', '89 music tracks selector'],
            ['12', 'Bake Video section'],
            ['13', 'Onboard — Business Profile'],
          ].map(([n, label]) => (
            <div key={n} style={{ background: '#0f0f1c', border: '1px solid #1a1a28', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#ff6a00', background: 'rgba(255,106,0,0.12)', border: '1px solid rgba(255,106,0,0.25)', borderRadius: 6, padding: '2px 7px', whiteSpace: 'nowrap', marginTop: 1 }}>{n}</span>
              <span style={{ fontSize: '0.78rem', color: '#bbb', lineHeight: 1.4 }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Links */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a href="/api/commander/demo?admin=0" style={{ padding: '10px 22px', background: '#ff6a00', color: '#fff', borderRadius: 9, fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none' }}>
            Try it live (G-Inspired)
          </a>
          <Link href="/commander/superdemo" style={{ padding: '10px 22px', background: '#141422', color: '#e4e4e8', border: '1px solid #252535', borderRadius: 9, fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none' }}>
            Superadmin Demo →
          </Link>
          <Link href="/commander" style={{ padding: '10px 22px', background: '#141422', color: '#888', border: '1px solid #252535', borderRadius: 9, fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none' }}>
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
