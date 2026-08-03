'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BootHopLogo from '@/components/BootHopLogo';

export default function AdminChangePasswordPage() {
  const router = useRouter();
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
    const res = await fetch('/api/admin/auth/change-password', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ newPassword: password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? 'Failed to update password'); return; }
    setSuccess(true);
    setTimeout(() => router.push('/admin'), 2000);
  }

  return (
    <div className="min-h-screen bg-[#07111f] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <BootHopLogo size="md" />
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/25">BootHop</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-orange-400">Admin</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 shadow-[0_32px_80px_rgba(0,0,0,0.5)]">
          {success ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">✓</div>
              <p className="text-white font-semibold mb-1">Password updated</p>
              <p className="text-sm text-white/40">Taking you to admin…</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-base font-bold text-white">Set your password</h1>
                <p className="text-xs text-white/40 mt-1">
                  You signed in with a temporary password. Please set a new one to continue.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={label}>New Password <span className="normal-case text-white/20">(min 8 characters)</span></label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Choose a strong password" autoComplete="new-password" className={input} required />
                </div>
                <div>
                  <label className={label}>Confirm Password</label>
                  <input type="password" value={password2} onChange={e => setPassword2(e.target.value)}
                    placeholder="Repeat password" autoComplete="new-password" className={input} required />
                </div>
                {error && (
                  <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
                )}
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-bold text-sm transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(249,115,22,0.4)] disabled:opacity-60">
                  {loading ? 'Saving…' : 'Save Password →'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
