'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import BootHopLogo from '@/components/BootHopLogo';

function VerifyContent() {
  const router = useRouter(); // kept (structure preserved)
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasRunRef = useRef(false); // 🔥 PATCH: prevent duplicate autoVerify

  useEffect(() => {
    const queryEmail = searchParams.get('email') || '';
    const queryCode = searchParams.get('code') || '';
    if (queryEmail) setEmail(queryEmail);
    if (queryCode) setCode(queryCode.toUpperCase());
  }, [searchParams]);

  useEffect(() => {
    async function autoVerify() {
      if (!email || !code) return;
      if (hasRunRef.current) return; // 🔥 PATCH

      hasRunRef.current = true; // 🔥 PATCH

      setLoading(true);
      setError(null);
      setMessage('Verifying your email...');

      try {
        const res = await fetch('/api/auth/verify-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code }),
        });

        const data = await res.json();
        console.log('VERIFY RESPONSE:', data);

        setLoading(false);

        if (!res.ok) {
          setError(data.error || 'Verification failed.');
          setMessage(null);
          hasRunRef.current = false; // 🔥 PATCH: allow retry
          return;
        }

        setMessage('Email verified! Redirecting...');

        // allow cookie to settle
        await new Promise((r) => setTimeout(r, 100));

        const target = data?.redirectTo || '/dashboard';

        // 🔥 FULL reload (CRITICAL FIX)
        if (typeof window !== 'undefined') {
          window.location.href = target;
        }

      } catch (err) {
        setLoading(false);
        setError('Something went wrong. Please try again.');
        hasRunRef.current = false; // 🔥 PATCH
      }
    }

    if (email && code) {
      void autoVerify();
    }
  }, [email, code, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: code.toUpperCase() }),
      });

      const data = await res.json();
      console.log('VERIFY RESPONSE:', data);

      setLoading(false);

      if (!res.ok) {
        setError(data.error || 'Verification failed.');
        return;
      }

      await new Promise((r) => setTimeout(r, 100));

      const target = data?.redirectTo || '/dashboard';

      // 🔥 FULL reload (CRITICAL FIX)
      if (typeof window !== 'undefined') {
        window.location.href = target;
      }

    } catch (err) {
      setLoading(false);
      setError('Something went wrong. Please try again.');
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link href="/">
            <BootHopLogo iconClass="text-white" textClass="text-white" />
          </Link>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl backdrop-blur">
          <h1 className="text-2xl font-bold text-white mb-2">Verify your email</h1>
          <p className="text-sm text-slate-400 mb-8">
            Enter the 5-character code we sent to your email.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500 transition"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Verification code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-center text-2xl font-bold tracking-[0.35em] uppercase text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-blue-500 transition"
                placeholder="4827A"
                maxLength={5}
                required
              />
            </div>

            {message && (
              <div className="flex items-center gap-2 rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-3 text-sm text-blue-300">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                ) : (
                  <CheckCircle className="h-4 w-4 shrink-0" />
                )}
                {message}
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-xl transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Confirm and continue'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Didn&apos;t get a code?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  );
}