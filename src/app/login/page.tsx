'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight, Shield, Clock, CheckCircle, Mail,
  RefreshCw, PlusCircle, AlertCircle,
  X, Home, Sparkles,
} from 'lucide-react';
import BootHopLogo from '@/components/BootHopLogo';

const bgImages = ['/images/D_login1.jpg', '/images/D_login2.jpg'];

type Trip = {
  id: string;
  type: string;
  from_city: string;
  to_city: string;
  travel_date: string | null;
  status: string;
  weight: string | null;
};

export default function LoginPage() {
  const [email, setEmail]             = useState('');
  const [code, setCode]               = useState('');
  const [step, setStep]               = useState<'email' | 'verify'>('email');
  const [trips, setTrips]             = useState<Trip[]>([]);
  const [showNoListingModal, setShowNoListingModal] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [bgIdx, setBgIdx]             = useState(0);
  const codeRef                       = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setInterval(() => setBgIdx((p) => (p + 1) % bgImages.length), 6000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  useEffect(() => {
    if (step === 'verify') setTimeout(() => codeRef.current?.focus(), 300);
  }, [step]);

  // ── Step 1: check listings first. Only send OTP if listings exist. ──────
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email address.'); return; }
    setLoading(true);
    setError(null);

    const tripsRes = await fetch('/api/auth/user-trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const tripsData = tripsRes.ok ? await tripsRes.json() : { trips: [] };
    const found: Trip[] = tripsData.trips || [];

    if (found.length === 0) {
      setLoading(false);
      setShowNoListingModal(true);
      return;
    }

    const codeRes = await fetch('/api/auth/request-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const codeData = await codeRes.json();
    setLoading(false);

    if (!codeRes.ok) {
      setError(codeData.error || 'Unable to send code. Please try again.');
      return;
    }

    setTrips(found);
    setStep('verify');
    setResendTimer(60);
  };

  const resendCode = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch('/api/auth/request-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || 'Unable to resend code.'); return; }
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

    if (!res.ok) {
      setError(data.error || 'Invalid or expired code. Please try again.');
      return;
    }

    window.location.href = data.redirectTo || '/dashboard';
  };

  const resetToEmail = () => {
    setStep('email');
    setCode('');
    setError(null);
    setTrips([]);
  };

  const inputCls = "w-full py-3 rounded-xl border border-slate-700/50 bg-slate-800/50 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-transparent backdrop-blur-sm transition text-sm";

  return (
    <div className="min-h-screen flex bg-slate-950">

      {/* ── Left panel — image carousel ── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden">
        {bgImages.map((src, i) => (
          <div key={src} className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: i === bgIdx ? 1 : 0 }}>
            <Image src={src} alt="" fill className="object-cover" priority={i === 0} />
          </div>
        ))}
        {/* Multi-layer overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-blue-950/70 to-slate-900/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

        {/* Floating accent orbs */}
        <div className="absolute top-1/4 right-1/4 w-56 h-56 bg-blue-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '5s' }} />
        <div className="absolute bottom-1/3 left-1/4 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '7s', animationDelay: '2s' }} />

        <div className="relative z-10">
          <Link href="/"><BootHopLogo iconClass="text-white" textClass="text-white" /></Link>
        </div>

        <div className="relative z-10 space-y-5">
          {/* Live indicator */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-2 backdrop-blur-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-white/80 font-medium">Live platform · 10K+ verified users</span>
          </div>

          <blockquote className="text-white text-2xl font-black leading-snug">
            &quot;Ship anything, anywhere —<br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              with someone already going.
            </span>&quot;
          </blockquote>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <CheckCircle className="h-4 w-4 text-emerald-400" />, text: '10K+ verified users' },
              { icon: <Shield className="h-4 w-4 text-blue-400" />, text: 'Stripe escrow' },
              { icon: <Sparkles className="h-4 w-4 text-cyan-400" />, text: '95% success rate' },
              { icon: <Clock className="h-4 w-4 text-amber-400" />, text: '1–2 day delivery' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-white/65 text-sm">
                {icon} {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — dark luxury form ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">

        {/* Background glow blobs */}
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.06),transparent_40%)]" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/6 rounded-full blur-3xl pointer-events-none" />

        {/* Mobile logo */}
        <div className="lg:hidden mb-8 relative z-10">
          <Link href="/"><BootHopLogo iconClass="text-white" textClass="text-white" /></Link>
        </div>

        <div className="w-full max-w-sm relative z-10">

          {/* ══════════════════════════
              STEP 1 — Email
          ══════════════════════════ */}
          {step === 'email' && (
            <>
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-cyan-500/25 rounded-full px-4 py-1.5 mb-4 backdrop-blur-sm">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                  <span className="text-xs text-cyan-300 font-semibold">Sign in to BootHop</span>
                </div>
                <h1 className="text-3xl font-black text-white mb-2">Welcome back</h1>
                <p className="text-slate-400 text-sm">Enter your email to access your listings.</p>
              </div>

              {error && (
                <div className="mb-4 flex items-start gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{error}
                </div>
              )}

              <form onSubmit={handleEmailSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      id="email" type="email" value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required autoFocus placeholder="you@example.com"
                      className={`${inputCls} pl-10`}
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="group w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold py-3 px-4 rounded-xl transition-all hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Checking…
                    </span>
                  ) : (
                    <>Continue <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" /></>
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-6">
                Don&apos;t have a listing?{' '}
                <Link href="/register" className="text-cyan-400 hover:text-cyan-300 font-medium transition">Create one →</Link>
              </p>
            </>
          )}

          {/* ══════════════════════════
              STEP 2 — OTP only
          ══════════════════════════ */}
          {step === 'verify' && (
            <>
              <button onClick={resetToEmail} className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1 mb-6 transition">
                ← Change email
              </button>

              <div className="mb-6">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-cyan-500/25 rounded-full px-4 py-1.5 mb-4 backdrop-blur-sm">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                  <span className="text-xs text-cyan-300 font-semibold">Code sent</span>
                </div>
                <h2 className="text-2xl font-black text-white mb-1">Check your email</h2>
                <p className="text-sm text-slate-400">
                  We sent a 5-character code to <span className="font-medium text-cyan-400">{email}</span>
                </p>
              </div>

              {error && (
                <div className="my-3 flex items-start gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{error}
                </div>
              )}

              <form onSubmit={verifyCode} className="space-y-4 mt-4">
                <div>
                  <input ref={codeRef} type="text" value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    maxLength={5} placeholder="4827A"
                    className="w-full h-14 text-center text-2xl font-bold tracking-[0.35em] uppercase rounded-xl border border-slate-700/50 bg-slate-800/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-transparent transition placeholder:text-slate-700 backdrop-blur-sm"
                  />
                  <p className="text-xs text-slate-600 mt-1.5 text-center">4 digits + 1 letter · e.g. 4827A</p>
                </div>
                <button type="submit" disabled={loading || code.trim().length < 5}
                  className="group w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold py-3 px-4 rounded-xl transition-all hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60">
                  {loading ? 'Verifying…' : 'Verify & continue'}
                  {!loading && <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />}
                </button>
              </form>

              <div className="mt-5 text-center">
                {resendTimer > 0 ? (
                  <p className="text-sm text-slate-500 flex items-center justify-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Resend in {resendTimer}s
                  </p>
                ) : (
                  <button onClick={resendCode} disabled={loading}
                    className="text-sm text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1.5 mx-auto transition">
                    <RefreshCw className="h-3.5 w-3.5" /> Resend code
                  </button>
                )}
              </div>
            </>
          )}

          {/* Trust strip */}
          <div className="flex justify-center gap-5 mt-8 text-slate-600 text-xs">
            <span className="flex items-center gap-1 text-slate-500"><Shield className="h-3.5 w-3.5 text-blue-500/70" /> Secure login</span>
            <span className="flex items-center gap-1 text-slate-500"><Clock className="h-3.5 w-3.5 text-cyan-500/70" /> 24/7 support</span>
            <span className="flex items-center gap-1 text-slate-500"><CheckCircle className="h-3.5 w-3.5 text-emerald-500/70" /> Verified</span>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            NO-LISTING MODAL — luxury dark theme
        ══════════════════════════════════════════════════════ */}
        {showNoListingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              onClick={() => setShowNoListingModal(false)}
            />

            {/* Modal card */}
            <div className="relative w-full max-w-sm bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-700/50 rounded-3xl shadow-2xl shadow-black/50 overflow-hidden">

              {/* Top gradient accent bar */}
              <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-400" />

              {/* Glow blob */}
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />

              {/* Close button */}
              <button
                onClick={() => setShowNoListingModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition z-10"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative px-7 py-7">
                {/* Gradient icon */}
                <div className="flex h-13 w-13 mb-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-400 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/40">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                </div>

                <h2 className="text-xl font-black text-white mb-2">No listings found</h2>
                <p className="text-sm text-slate-400 leading-relaxed mb-1">
                  We couldn&apos;t find any journeys or delivery requests linked to
                </p>
                <p className="text-sm font-bold text-cyan-400 mb-4 break-all">{email}</p>

                <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                  To log in, you need an active listing. Would you like to create one?
                </p>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                  <Link
                    href="/register"
                    className="group flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] text-white font-semibold py-3 px-4 rounded-xl transition-all text-sm"
                  >
                    <PlusCircle className="h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
                    Create a journey
                  </Link>
                  <Link
                    href="/"
                    className="flex items-center justify-center gap-2 border border-slate-700/60 text-slate-300 hover:bg-slate-800/60 hover:border-slate-600 hover:text-white font-medium py-3 px-4 rounded-xl transition text-sm"
                  >
                    <Home className="h-4 w-4" /> Go to home page
                  </Link>
                  <button
                    onClick={() => setShowNoListingModal(false)}
                    className="text-sm text-slate-600 hover:text-slate-400 transition py-1"
                  >
                    Try a different email
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
