'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BootHopLogo from '@/components/BootHopLogo';

type Tab = 'login' | 'register' | 'reset';

export default function CommanderPage() {
  const router = useRouter();
  const [tab, setTab]         = useState<Tab>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  const [slug, setSlug]         = useState('');
  const [password, setPassword] = useState('');

  const [regCompany,     setRegCompany]     = useState('');
  const [regSlug,        setRegSlug]        = useState('');
  const [regEmail,       setRegEmail]       = useState('');
  const [regContactName, setRegContactName] = useState('');
  const [regPassword,    setRegPassword]    = useState('');
  const [regPlan,        setRegPlan]        = useState<'basic' | 'pro'>('basic');

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

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    const res = await fetch('/api/commander/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company:      regCompany.trim(),
        slug:         regSlug.trim().toLowerCase(),
        email:        regEmail.trim(),
        contact_name: regContactName.trim(),
        password:     regPassword,
        plan:         regPlan,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? 'Registration failed'); return; }
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
    setSuccess('If that email matches an account, a reset link is on its way.');
  }

  const input  = "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all text-sm";
  const label  = "block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5";
  const select = "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all text-sm appearance-none";

  const tabs: { key: Tab; label: string }[] = [
    { key: 'login',    label: 'Sign In' },
    { key: 'register', label: 'Create Account' },
    { key: 'reset',    label: 'Reset Password' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="absolute top-6 left-6">
        <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors text-sm font-medium">← BootHop</Link>
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <BootHopLogo size="md" />
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Pipeline</span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-orange-500">Commander</span>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex bg-gray-100 border border-gray-200 rounded-xl p-1 mb-6 gap-1">
          {tabs.map(({ key, label: lbl }) => (
            <button key={key} onClick={() => switchTab(key)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}>
              {lbl}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-200/60 p-8">

          {/* ── SIGN IN ── */}
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
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
              )}
              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold text-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-200 disabled:opacity-60 disabled:translate-y-0">
                {loading ? 'Signing in…' : 'Sign in →'}
              </button>
              <p className="text-center text-xs text-gray-400 pt-1">
                Forgot password?{' '}
                <button type="button" onClick={() => switchTab('reset')}
                  className="text-orange-500 hover:text-orange-600 font-semibold transition-colors">
                  Reset it →
                </button>
              </p>
            </form>
          )}

          {/* ── CREATE ACCOUNT ── */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className={label}>Company Name</label>
                <input type="text" value={regCompany} onChange={e => setRegCompany(e.target.value)}
                  placeholder="e.g. Acme Media" autoComplete="organization" className={input} required />
              </div>
              <div>
                <label className={label}>Company ID <span className="normal-case text-gray-400 font-normal">(your login username)</span></label>
                <input type="text" value={regSlug}
                  onChange={e => setRegSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  placeholder="e.g. acme-media" autoComplete="username" className={input} required />
                <p className="mt-1 text-[10px] text-gray-400">Lowercase letters, numbers and hyphens only</p>
              </div>
              <div>
                <label className={label}>Email</label>
                <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)}
                  placeholder="you@company.com" autoComplete="email" className={input} />
              </div>
              <div>
                <label className={label}>Contact Name</label>
                <input type="text" value={regContactName} onChange={e => setRegContactName(e.target.value)}
                  placeholder="e.g. John Smith" autoComplete="name" className={input} />
              </div>
              <div>
                <label className={label}>Password <span className="normal-case text-gray-400 font-normal">(min 8 characters)</span></label>
                <input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)}
                  placeholder="Min 8 characters" autoComplete="new-password" className={input} required />
              </div>
              <div>
                <label className={label}>Plan</label>
                <select value={regPlan} onChange={e => setRegPlan(e.target.value as 'basic' | 'pro')} className={select}>
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                </select>
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
              )}
              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold text-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-200 disabled:opacity-60 disabled:translate-y-0">
                {loading ? 'Creating account…' : 'Create Account →'}
              </button>
            </form>
          )}

          {/* ── RESET PASSWORD ── */}
          {tab === 'reset' && (
            <form onSubmit={handleReset} className="space-y-4">
              <p className="text-sm text-gray-500 mb-2">
                Enter the email address on your account and we&apos;ll send a password reset link.
              </p>
              <div>
                <label className={label}>Email Address</label>
                <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                  placeholder="john@acme.com" autoComplete="email" className={input} required />
              </div>
              {error   && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}
              {success && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">{success}</p>}
              {!success && (
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold text-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-200 disabled:opacity-60 disabled:translate-y-0">
                  {loading ? 'Sending…' : 'Send Reset Link →'}
                </button>
              )}
            </form>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-gray-400">
          Need help?{' '}
          <a href="/contact" className="text-gray-500 hover:text-gray-700 underline underline-offset-2 transition-colors">
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
