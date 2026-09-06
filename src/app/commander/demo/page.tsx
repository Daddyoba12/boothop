'use client';
import Link from 'next/link';

const STEPS = [
  { n: '01', label: 'Daily pipeline produces fresh video content automatically' },
  { n: '02', label: 'Review slot cards — each with hook, caption and ready video' },
  { n: '03', label: 'One-click Approve & Post to connected platforms' },
  { n: '04', label: 'Edit hook, lesson and caption before posting' },
  { n: '05', label: 'Revoice Studio — swap the AI voiceover on any video' },
  { n: '06', label: 'Choose from music tracks or import from YouTube' },
  { n: '07', label: 'Create Final Video — voice + music merged in one click' },
  { n: '08', label: 'Send to Telegram or WhatsApp directly from Commander' },
];

export default function DemoPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f8', color: '#1e1e2e', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif" }}>

      {/* Top bar */}
      <div style={{ background: '#111827', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>
          <span style={{ color: '#ff6a00' }}>Boot</span>Hop Commander
        </div>
        <div style={{ flex: 1 }} />
        <a href="/api/commander/demo?admin=0" style={{ padding: '8px 18px', background: '#ff6a00', color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: '0.83rem', textDecoration: 'none' }}>
          Launch Commander
        </a>
        <Link href="/commander" style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.08)', color: '#9ca3af', borderRadius: 8, fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)' }}>
          Login
        </Link>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff7ed', color: '#ff6a00', borderRadius: 20, padding: '4px 14px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 20, border: '1px solid rgba(255,106,0,0.2)' }}>
            Commander Demo
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#111827', margin: 0, lineHeight: 1.2, letterSpacing: '-0.5px' }}>
            Your content operation,<br />controlled from one place.
          </h1>
          <p style={{ color: '#6b7280', marginTop: 16, fontSize: '1rem', lineHeight: 1.7, maxWidth: 560, margin: '16px auto 0' }}>
            Commander automates daily video production for your brand — AI-generated content, voiceover, music, and publishing across every platform.
          </p>
        </div>

        {/* Video */}
        <div style={{ borderRadius: 18, overflow: 'hidden', border: '1px solid #e5e7eb', background: '#111827', marginBottom: 36, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
          <div style={{ background: '#1e293b', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ flex: 1, textAlign: 'center', fontSize: '0.72rem', color: '#4b5563' }}>boothop.com/commander</span>
          </div>
          <video
            src="/demos/demo_ginspired_client_voiced.mp4"
            controls
            autoPlay
            playsInline
            style={{ width: '100%', display: 'block', maxHeight: 540, background: '#000' }}
          />
        </div>

        {/* Feature grid */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>
            What you just saw
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {STEPS.map(({ n, label }) => (
              <div key={n} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#ff6a00', background: '#fff7ed', border: '1px solid rgba(255,106,0,0.2)', borderRadius: 6, padding: '2px 7px', whiteSpace: 'nowrap', marginTop: 1, flexShrink: 0 }}>{n}</span>
                <span style={{ fontSize: '0.8rem', color: '#374151', lineHeight: 1.45, fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ background: '#111827', borderRadius: 16, padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', margin: 0 }}>Ready to automate your content?</h2>
          <p style={{ color: '#6b7280', fontSize: '0.88rem', margin: 0, maxWidth: 380 }}>
            Launch Commander now with a demo account, or contact us for a live walkthrough with your own brand.
          </p>
          <a href="/api/commander/demo?admin=0" style={{ padding: '12px 24px', background: '#ff6a00', color: '#fff', borderRadius: 9, fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none', boxShadow: '0 2px 8px rgba(255,106,0,0.4)' }}>
            Launch Commander Demo
          </a>
        </div>

      </div>
    </div>
  );
}
