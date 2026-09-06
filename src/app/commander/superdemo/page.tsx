'use client';
import Link from 'next/link';

const CLIENT_STEPS = [
  { n: '01', label: 'Daily pipeline produces fresh video content automatically' },
  { n: '02', label: 'Review slot cards — hook, caption and ready video' },
  { n: '03', label: 'One-click Approve & Post to connected platforms' },
  { n: '04', label: 'Edit hook, lesson and caption before posting' },
  { n: '05', label: 'Revoice Studio — swap the AI voiceover on any video' },
  { n: '06', label: 'Choose from music tracks or import from YouTube' },
  { n: '07', label: 'Create Final Video — voice + music merged in one click' },
  { n: '08', label: 'Send to Telegram or WhatsApp directly from Commander' },
];

const ADMIN_STEPS = [
  { n: '01', label: 'All Clients dashboard — every account at a glance' },
  { n: '02', label: 'Search, filter by status and plan' },
  { n: '03', label: 'Open any client workspace with a single click' },
  { n: '04', label: 'Manage subscriptions, features and account status' },
  { n: '05', label: 'Create new client accounts and send secure invitations' },
  { n: '06', label: 'Switch between client workspaces without logging out' },
  { n: '07', label: 'Context-aware pipeline — always the selected client\'s content' },
  { n: '08', label: 'Revoice and Settings scoped to the active workspace' },
];

function BrowserChrome({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #e5e7eb', background: '#111827', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
      <div style={{ background: '#1e293b', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
        <span style={{ flex: 1, textAlign: 'center', fontSize: '0.72rem', color: '#4b5563' }}>{url}</span>
      </div>
      {children}
    </div>
  );
}

function FeatureGrid({ steps }: { steps: { n: string; label: string }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
      {steps.map(({ n, label }) => (
        <div key={n} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#ff6a00', background: '#fff7ed', border: '1px solid rgba(255,106,0,0.2)', borderRadius: 6, padding: '2px 7px', whiteSpace: 'nowrap', marginTop: 1, flexShrink: 0 }}>{n}</span>
          <span style={{ fontSize: '0.8rem', color: '#374151', lineHeight: 1.45, fontWeight: 500 }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function SuperDemoPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f8', color: '#1e1e2e', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif" }}>

      {/* Top bar */}
      <div style={{ background: '#111827', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>
          <span style={{ color: '#ff6a00' }}>Boot</span>Hop Commander
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: 6, background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.25)' }}>
          Superadmin Walkthrough
        </span>
        <Link href="/commander" style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.08)', color: '#9ca3af', borderRadius: 8, fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)' }}>
          Login
        </Link>
      </div>

      <div style={{ maxWidth: 920, margin: '0 auto', padding: '48px 24px', display: 'flex', flexDirection: 'column', gap: 64 }}>

        {/* ── SECTION 1: Client view ── */}
        <section>
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff7ed', color: '#ff6a00', borderRadius: 20, padding: '4px 14px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14, border: '1px solid rgba(255,106,0,0.2)' }}>
              Client Workspace
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.4px' }}>
              What your clients see
            </h2>
            <p style={{ color: '#6b7280', marginTop: 8, fontSize: '0.9rem', lineHeight: 1.6 }}>
              Each client logs in to their own isolated workspace — pipeline slots, Revoice Studio, and settings scoped to their brand only.
            </p>
          </div>

          <div style={{ marginBottom: 24 }}>
            <BrowserChrome url="boothop.com/commander/dashboard">
              <video
                src="/demos/demo_ginspired_client_voiced.mp4"
                controls
                playsInline
                style={{ width: '100%', display: 'block', maxHeight: 500, background: '#000' }}
              />
            </BrowserChrome>
          </div>

          <FeatureGrid steps={CLIENT_STEPS} />
        </section>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', whiteSpace: 'nowrap' }}>Superadmin Control Centre</span>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
        </div>

        {/* ── SECTION 2: Admin view ── */}
        <section>
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(167,139,250,0.1)', color: '#a78bfa', borderRadius: 20, padding: '4px 14px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14, border: '1px solid rgba(167,139,250,0.25)' }}>
              Admin View
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.4px' }}>
              What you see as superadmin
            </h2>
            <p style={{ color: '#6b7280', marginTop: 8, fontSize: '0.9rem', lineHeight: 1.6 }}>
              The All Clients control centre — manage every account, open any workspace, and switch between clients without logging out.
            </p>
          </div>

          <div style={{ marginBottom: 24 }}>
            <BrowserChrome url="boothop.com/commander/admin/clients">
              <video
                src="/demos/demo_boothop_admin_voiced.mp4"
                controls
                playsInline
                style={{ width: '100%', display: 'block', maxHeight: 500, background: '#000' }}
              />
            </BrowserChrome>
          </div>

          <FeatureGrid steps={ADMIN_STEPS} />
        </section>

        {/* CTA */}
        <div style={{ background: '#111827', borderRadius: 16, padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', margin: 0 }}>Try it live</h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <a href="/api/commander/demo?admin=0" style={{ padding: '12px 24px', background: '#ff6a00', color: '#fff', borderRadius: 9, fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>
              Launch Client Demo
            </a>
            <a href="/api/commander/demo?admin=1" style={{ padding: '12px 24px', background: 'rgba(167,139,250,0.15)', color: '#a78bfa', borderRadius: 9, fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none', border: '1px solid rgba(167,139,250,0.3)' }}>
              Launch Admin Demo →
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
