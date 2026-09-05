'use client';
import Link from 'next/link';

export default function SuperDemoPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0d0d18', color: '#e4e4e8', fontFamily: 'system-ui, sans-serif', padding: '40px 24px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 1 }}>
              BootHop · Superadmin Walkthrough
            </div>
            <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 9px', borderRadius: 10, background: 'rgba(167,139,250,0.12)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.25)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Admin</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Commander Superadmin Demo</h1>
          <p style={{ color: '#888', marginTop: 8, fontSize: '0.9rem', lineHeight: 1.6 }}>
            Full walkthrough as the superadmin — managing all clients, viewing any pipeline, editing content on behalf of clients, and onboarding new accounts.
          </p>
        </div>

        {/* Video */}
        <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #2a1e40', background: '#080810', marginBottom: 28 }}>
          <video
            src="/demos/demo_boothop_admin_voiced.mp4"
            controls
            autoPlay
            style={{ width: '100%', display: 'block', maxHeight: 540, background: '#000' }}
          />
        </div>

        {/* Steps */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 32 }}>
          {[
            ['01', 'Auto-login as boothop superadmin'],
            ['02', 'Admin tour overlay starts'],
            ['03', 'All Clients — 3 accounts'],
            ['04', 'Navigate to G-Inspired pipeline'],
            ['05', 'G-Inspired: 4 slot cards with videos'],
            ['06', 'Editing slot on behalf of client'],
            ['07', 'Revoice Studio for G-Inspired'],
            ['08', 'Back to BootHop pipeline'],
            ['09', 'All Clients list view'],
            ['10', 'Onboard — new client setup'],
            ['11', 'Tour complete'],
            ['12', 'Final pipeline overview'],
          ].map(([n, label]) => (
            <div key={n} style={{ background: '#0f0f1c', border: '1px solid #1a1a28', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 6, padding: '2px 7px', whiteSpace: 'nowrap', marginTop: 1 }}>{n}</span>
              <span style={{ fontSize: '0.78rem', color: '#bbb', lineHeight: 1.4 }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Links */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a href="/api/commander/demo?admin=1" style={{ padding: '10px 22px', background: '#7c3aed', color: '#fff', borderRadius: 9, fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none' }}>
            Try it live (Superadmin)
          </a>
          <Link href="/commander/demo" style={{ padding: '10px 22px', background: '#141422', color: '#e4e4e8', border: '1px solid #252535', borderRadius: 9, fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none' }}>
            ← Client Demo
          </Link>
          <Link href="/commander" style={{ padding: '10px 22px', background: '#141422', color: '#888', border: '1px solid #252535', borderRadius: 9, fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none' }}>
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
