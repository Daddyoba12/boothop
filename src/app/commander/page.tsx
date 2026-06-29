'use client';

import { useState } from 'react';
import Link from 'next/link';
import BootHopLogo from '@/components/BootHopLogo';

export default function CommanderLoginPage() {
  const [slug, setSlug]         = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!slug.trim() || !password) { setError('Please enter your Company ID and password.'); return; }
    setError('');
    setLoading(true);

    try {
      // POST to Oracle via commander subdomain — Oracle sets the session cookie there
      // and redirects to /dashboard. We use a hidden form submit so the browser
      // follows the redirect and the cookie lands on commander.boothop.com correctly.
      const form = document.createElement('form');
      form.method  = 'POST';
      form.action  = 'https://commander.boothop.com/login';

      const slugInput     = document.createElement('input');
      slugInput.name      = 'slug';
      slugInput.value     = slug.trim().toLowerCase();
      form.appendChild(slugInput);

      const passInput     = document.createElement('input');
      passInput.name      = 'password';
      passInput.value     = password;
      form.appendChild(passInput);

      document.body.appendChild(form);
      form.submit();
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#07111f] flex flex-col items-center justify-center px-4">

      {/* Back to main site */}
      <div className="absolute top-6 left-6">
        <Link href="/" className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm">
          ← Back to BootHop
        </Link>
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

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 shadow-[0_32px_80px_rgba(0,0,0,0.5)]">
          <h1 className="text-xl font-bold text-white mb-1">Sign in to Commander</h1>
          <p className="text-sm text-white/40 mb-7">
            Enter your Company ID and password to access your pipeline dashboard.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">
                Company ID
              </label>
              <input
                type="text"
                value={slug}
                onChange={e => setSlug(e.target.value)}
                placeholder="e.g. acme-corp"
                autoComplete="username"
                className="w-full rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/40 transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
                className="w-full rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/40 transition-all text-sm"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-bold text-sm transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(249,115,22,0.4)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? 'Signing in…' : 'Sign in to Commander →'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/[0.06] text-center">
            <p className="text-xs text-white/25">
              New client?{' '}
              <Link href="/client-onboarding" className="text-orange-400 hover:text-orange-300 transition-colors font-medium">
                Get set up →
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-white/20">
          Having trouble?{' '}
          <a href="/api/whatsapp" className="text-white/35 hover:text-white/55 transition-colors underline underline-offset-2">
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
