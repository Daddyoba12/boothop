'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import BootHopLogo from '@/components/BootHopLogo';

function CommanderResetContent() {
  const params  = useSearchParams();
  const router  = useRouter();
  const token   = params.get('token') ?? '';

  const [password,  setPassword]  = useState('');
  const [password2, setPassword2] = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState(false);

  const input = "w-full rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-orange-500/40 text-sm";
  const label = "block text-[10px] font-bold text-white/35 uppercase tracking-wider mb-1.5";

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

  if (!token) {
    return (
      <div className="min-h-screen bg-[#07111f] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-white/50 mb-4">Invalid reset link.</p>
          <Link href="/commander" className="text-orange-400 hover:underline text-sm">Back to login →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07111f] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <BootHopLogo size="md" />
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/25">Pipeline</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-orange-400">Commander</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          {success ? (
            <div className="text-center">
              <div className="text-4xl mb-3">✓</div>
              <p className="text-white font-semibold mb-1">Password updated</p>
              <p className="text-sm text-white/40">Redirecting to login…</p>
            </div>
          ) : (
            <>
              <h1 className="text-base font-bold text-white mb-5">Set new password</h1>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={label}>New Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Min 8 characters" autoComplete="new-password" className={input} required />
                </div>
                <div>
                  <label className={label}>Confirm Password</label>
                  <input type="password" value={password2} onChange={e => setPassword2(e.target.value)}
                    placeholder="Repeat password" autoComplete="new-password" className={input} required />
                </div>
                {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-bold text-sm disabled:opacity-60">
                  {loading ? 'Saving…' : 'Update Password →'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-white/20">
          <Link href="/commander" className="hover:text-white/40 transition-colors">← Back to login</Link>
        </p>
      </div>
    </div>
  );
}

export default function CommanderResetConfirmPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07111f]" />}>
      <CommanderResetContent />
    </Suspense>
  );
}
