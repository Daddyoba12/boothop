'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BootHopLogo from '@/components/BootHopLogo';

type Tab = 'login' | 'reset';

export default function CommanderPage() {
  const router    = useRouter();
  const [tab, setTab]       = useState<Tab>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');

  // Login state
  const [slug, setSlug]         = useState('');
  const [password, setPassword] = useState('');

  // Reset state
  const [resetEmail, setResetEmail] = useState('');

  function switchTab(t: Tab) { setTab(t); setError(''); setSuccess(''); }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    const res = await fetch('/api/commander/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: slug.trim().toLowerCase(), password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? 'Login failed'); return; }
    router.push('/commander/dashboard');
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    await fetch('/api/commander/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: resetEmail }),
    });
    setLoading(false);
    setSuccess('If that email is registered, a reset link has been sent.');
  }

  const input = "w-full rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/40 transition-all text-sm";
  const label = "block text-[10px] font-bold text-white/35 uppercase tracking-wider mb-1.5";

  return (
    <div className="min-h-screen bg-[#07111f] flex flex-col items-center justify-center px-4">
      <div className="absolute top-6 left-6">
        <Link href="/" className="text-white/30 hover:text-white/60 transition-colors text-sm">← BootHop</Link>
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <BootHopLogo size="md" />
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/25">Pipeline</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-orange-400">Commander</span>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex bg-white/[0.04] border border-white/8 rounded-xl p-1 mb-6">
          {(['login', 'reset'] as Tab[]).map(t => (
            <button key={t} onClick={() => switchTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all capitalize ${
                tab === t ? 'bg-orange-500 text-black shadow-md' : 'text-white/35 hover:text-white/60'
              }`}>
              {t === 'reset' ? 'Reset Password' : 'Sign In'}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 shadow-[0_32px_80px_rgba(0,0,0,0.5)]">

          {/* ── LOGIN ── */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className={label}>Company ID</label>
                <input type="text" value={slug} onChange={e => setSlug(e.target.value)}
                  placeholder="e.g. acme-corp" autoComplete="username" className={input} required />
              </div>
              <div>
                <label className={label}>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Your password" autoComplete="current-password" className={input} required />
              </div>
              {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-bold text-sm transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(249,115,22,0.4)] disabled:opacity-60">
                {loading ? 'Signing in…' : 'Sign in →'}
              </button>
            </form>
          )}

          {/* ── RESET ── */}
          {tab === 'reset' && (
            <form onSubmit={handleReset} className="space-y-4">
              <p className="text-sm text-white/45 mb-2">
                Enter the email address on your account and we&apos;ll send a password reset link.
              </p>
              <div>
                <label className={label}>Email Address</label>
                <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                  placeholder="john@acme.com" autoComplete="email" className={input} required />
              </div>
              {error   && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}
              {success && <p className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">{success}</p>}
              {!success && (
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-bold text-sm transition-all hover:-translate-y-0.5 disabled:opacity-60">
                  {loading ? 'Sending…' : 'Send Reset Link →'}
                </button>
              )}
            </form>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-white/20">
          Need help?{' '}
          <a href="/api/whatsapp" className="text-white/35 hover:text-white/55 underline underline-offset-2 transition-colors">
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
