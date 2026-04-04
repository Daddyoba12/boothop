'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, Shield, Clock, CheckCircle, Mail, RefreshCw } from 'lucide-react';
import BootHopLogo from '@/components/BootHopLogo';

const bgImages = ['/images/D_login1.jpg', '/images/D_login2.jpg'];

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail]             = useState('');
  const [code, setCode]               = useState('');
  const [step, setStep]               = useState<'email' | 'code'>('email');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [bgIdx, setBgIdx]             = useState(0);
  const codeRef                       = useRef<HTMLInputElement>(null);

  // Rotate background images
  useEffect(() => {
    const t = setInterval(() => setBgIdx((p) => (p + 1) % bgImages.length), 6000);
    return () => clearInterval(t);
  }, []);

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  // Focus code input when step changes
  useEffect(() => {
    if (step === 'code') codeRef.current?.focus();
  }, [step]);

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email) { setError('Please enter your email address.'); return; }
    setLoading(true);
    setError(null);

    const res = await fetch('/api/auth/request-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error || 'Unable to send code.'); return; }
    setStep('code');
    setResendTimer(60);
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 5) { setError('Please enter the full 5-character code.'); return; }
    setLoading(true);
    setError(null);

    const res = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code: trimmed }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error || 'Invalid or expired code. Please try again.'); return; }
    router.push(data.redirectTo || '/intent');
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel: hero ── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden">
        {bgImages.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{ opacity: i === bgIdx ? 1 : 0 }}
          >
            <Image src={src} alt="" fill className="object-cover" priority={i === 0} />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-blue-950/70 to-slate-900/60" />

        <div className="relative z-10">
          <Link href="/">
            <BootHopLogo iconClass="text-white" textClass="text-white" />
          </Link>
        </div>

        <div className="relative z-10">
          <blockquote className="text-white text-2xl font-bold leading-snug mb-4">
            &quot;Ship anything, anywhere —<br />with someone already going there.&quot;
          </blockquote>
          <div className="flex items-center gap-4 text-white/60 text-sm">
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-green-400" /> 10K+ verified users</span>
            <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-blue-400" /> Stripe escrow</span>
          </div>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-white">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Link href="/">
            <BootHopLogo iconClass="text-slate-800" textClass="text-slate-900" />
          </Link>
        </div>

        <div className="w-full max-w-sm">
          {step === 'email' ? (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to BootHop</h1>
                <p className="text-slate-500">Enter your email — we&apos;ll send a one-time code. No password needed.</p>
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={sendCode} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-sm hover:shadow-md"
                >
                  {loading ? 'Sending code…' : 'Send one-time code'}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-8">
                New here? Just enter your email — we&apos;ll create your account automatically.
              </p>
            </>
          ) : (
            <>
              <div className="mb-8">
                <button
                  onClick={() => { setStep('email'); setCode(''); setError(null); }}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mb-4"
                >
                  ← Change email
                </button>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Check your inbox</h1>
                <p className="text-slate-500">
                  We sent a 5-character code to <span className="font-medium text-slate-700">{email}</span>
                </p>
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={verifyCode} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Verification code
                  </label>
                  <input
                    ref={codeRef}
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    maxLength={5}
                    placeholder="4827A"
                    className="w-full h-16 text-center text-2xl font-bold tracking-[0.35em] uppercase rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder-slate-300"
                  />
                  <p className="text-xs text-slate-400 mt-2 text-center">4 digits + 1 letter, e.g. 4827A</p>
                </div>

                <button
                  type="submit"
                  disabled={loading || code.trim().length < 5}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-sm hover:shadow-md"
                >
                  {loading ? 'Verifying…' : 'Verify & continue'}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>

              <div className="mt-6 text-center">
                {resendTimer > 0 ? (
                  <p className="text-sm text-slate-400 flex items-center justify-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Resend in {resendTimer}s
                  </p>
                ) : (
                  <button
                    onClick={() => sendCode()}
                    disabled={loading}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1.5 mx-auto"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Resend code
                  </button>
                )}
              </div>
            </>
          )}

          {/* Trust strip */}
          <div className="flex justify-center gap-5 mt-8 text-slate-400 text-xs">
            <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> Secure login</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> 24/7 support</span>
            <span className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}
