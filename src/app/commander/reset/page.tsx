'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition-all"
      style={{ background: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', caretColor: '#ff6a00' }}
      onFocus={e => { e.currentTarget.style.borderColor = '#ff6a00'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,106,0,0.12)'; }}
      onBlur={e =>  { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
    />
  );
}

function CommanderResetContent() {
  const params  = useSearchParams();
  const router  = useRouter();
  const token   = params.get('token') ?? '';

  const [password,  setPassword]  = useState('');
  const [password2, setPassword2] = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== password2) { setError('Passwords do not match'); return; }
    if (password.length < 8)    { setError('Password must be at least 8 characters'); return; }
    setError(''); setLoading(true);
    const res = await fetch('/api/commander/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword: password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? 'Reset failed'); return; }
    setSuccess(true);
    setTimeout(() => router.push('/commander'), 3000);
  }

  const shell = (
    <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>

      <div style={{ position: 'absolute', top: 20, left: 24 }}>
        <Link href="/" style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'none', fontWeight: 500 }}>← BootHop.com</Link>
      </div>

      <div style={{ width: '100%', maxWidth: 460 }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <img src="/images/boothopimage-transparent.png" alt="BootHop"
            style={{ height: 72, width: 'auto', objectFit: 'contain', display: 'block' }} draggable={false} />
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#94a3b8' }}>Pipeline</span>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#cbd5e1', display: 'inline-block' }} />
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#ff6a00' }}>Commander</span>
          </div>
        </div>

        {/* Card */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 32,
          boxShadow: '0 20px 60px rgba(15,23,42,0.08)' }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 36, color: '#22c55e', marginBottom: 12 }}>✓</div>
              <p style={{ color: '#0f172a', fontWeight: 700, marginBottom: 6 }}>Password updated successfully</p>
              <p style={{ fontSize: 13, color: '#64748b' }}>Redirecting to sign in…</p>
            </div>
          ) : !token ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ color: '#64748b', marginBottom: 16 }}>This reset link is invalid or has expired.</p>
              <Link href="/commander" style={{ color: '#ff6a00', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>← Back to sign in</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Heading */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#ff6a00', marginBottom: 4 }}>
                <ShieldIcon />
                <div>
                  <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>Set new password</h1>
                  <p style={{ fontSize: 13, color: '#64748b', margin: '3px 0 0', lineHeight: 1.4 }}>Choose a strong password for your Commander workspace.</p>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.06em', color: '#64748b', marginBottom: 6 }}>New Password</label>
                <StyledInput type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Min 8 characters" autoComplete="new-password" required />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.06em', color: '#64748b', marginBottom: 6 }}>Confirm Password</label>
                <StyledInput type="password" value={password2} onChange={e => setPassword2(e.target.value)}
                  placeholder="Repeat password" autoComplete="new-password" required />
              </div>

              {error && (
                <p style={{ fontSize: 13, color: '#dc2626', background: '#fef2f2',
                  border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', margin: 0 }}>
                  {error}
                </p>
              )}

              <button type="submit" disabled={loading}
                style={{ width: '100%', padding: '14px', borderRadius: 9, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  background: '#ff6a00', color: '#fff', fontWeight: 700, fontSize: 14, opacity: loading ? 0.6 : 1, transition: 'background .15s' }}
                onMouseEnter={e => !loading && (e.currentTarget.style.background = '#e55a00')}
                onMouseLeave={e => (e.currentTarget.style.background = '#ff6a00')}>
                {loading ? 'Saving…' : 'Update Password →'}
              </button>

              <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', margin: 0 }}>
                For your security, reset links expire after 30 minutes.
              </p>
            </form>
          )}
        </div>

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <Link href="/commander"
            style={{ fontSize: 13, color: '#64748b', textDecoration: 'none', fontWeight: 500 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#334155')}
            onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>
            ← Back to sign in
          </Link>
          <span style={{ margin: '0 10px', color: '#e2e8f0' }}>·</span>
          <a href="mailto:info@boothop.com"
            style={{ fontSize: 13, color: '#64748b', textDecoration: 'none', fontWeight: 500 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#334155')}
            onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>
            Need help?
          </a>
        </div>
      </div>
    </div>
  );

  return shell;
}

export default function CommanderResetConfirmPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#ffffff' }} />}>
      <CommanderResetContent />
    </Suspense>
  );
}
