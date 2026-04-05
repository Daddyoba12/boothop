'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight, Shield, Clock, CheckCircle, Mail,
  RefreshCw, Package, Plane, PlusCircle, AlertCircle, MapPin,
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
  const [email, setEmail]           = useState('');
  const [code, setCode]             = useState('');
  // step: 'email' → 'verify' (shows listings + code input) → done
  const [step, setStep]             = useState<'email' | 'verify'>('email');
  const [trips, setTrips]           = useState<Trip[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [bgIdx, setBgIdx]           = useState(0);
  const codeRef                     = useRef<HTMLInputElement>(null);

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
    if (step === 'verify') setTimeout(() => codeRef.current?.focus(), 300);
  }, [step]);

  // ── 1. Send OTP + fetch listings in parallel ──────────────────────────
  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email) { setError('Please enter your email address.'); return; }
    setLoading(true);
    setError(null);

    const [codeRes, tripsRes] = await Promise.all([
      fetch('/api/auth/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }),
      fetch('/api/auth/user-trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }),
    ]);

    const codeData = await codeRes.json();
    const tripsData = tripsRes.ok ? await tripsRes.json() : { trips: [] };

    setLoading(false);

    if (!codeRes.ok) {
      setError(codeData.error || 'Unable to send code.');
      return;
    }

    setTrips(tripsData.trips || []);
    setStep('verify');
    setResendTimer(60);
  };

  // ── 2. Verify OTP — use window.location for hard redirect so
  //       the new session cookie is picked up immediately ──────────────────
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

    // Hard navigate so the browser picks up the new session cookie
    window.location.href = data.redirectTo || '/intent';
  };

  const resetToEmail = () => {
    setStep('email');
    setCode('');
    setError(null);
    setTrips([]);
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel: rotating hero images ── */}
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
          <Link href="/"><BootHopLogo iconClass="text-white" textClass="text-white" /></Link>
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

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-white">

        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Link href="/"><BootHopLogo iconClass="text-slate-800" textClass="text-slate-900" /></Link>
        </div>

        <div className="w-full max-w-sm">

          {/* ════════════════════════════════
              STEP 1 — Email entry
          ════════════════════════════════ */}
          {step === 'email' && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to BootHop</h1>
                <p className="text-slate-500 text-sm">Enter your email — we&apos;ll show your listings and send a one-time code.</p>
              </div>

              {error && (
                <div className="mb-4 flex items-start gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{error}
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
                      autoFocus
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
                  {loading ? 'Checking…' : 'Continue'}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-6">
                New here?{' '}
                <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                  Create a journey →
                </Link>
              </p>
            </>
          )}

          {/* ════════════════════════════════
              STEP 2 — Listings + code entry
          ════════════════════════════════ */}
          {step === 'verify' && (
            <>
              <button
                onClick={resetToEmail}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mb-6"
              >
                ← Change email
              </button>

              {/* ── Listings section ── */}
              {trips.length > 0 ? (
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
                    Your listings ({trips.length})
                  </p>
                  <div className="space-y-2">
                    {trips.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                      >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          t.type === 'travel' || t.type === 'booter'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-emerald-100 text-emerald-600'
                        }`}>
                          {t.type === 'travel' || t.type === 'booter'
                            ? <Plane className="h-4 w-4" />
                            : <Package className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {t.from_city} → {t.to_city}
                          </p>
                          <p className="text-xs text-slate-500">
                            {t.travel_date
                              ? new Date(t.travel_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                              : 'Date TBC'}
                            {t.weight ? ` · ${t.weight}` : ''}
                            {' · '}
                            <span className={`font-medium ${
                              t.status === 'active' ? 'text-green-600' :
                              t.status === 'matched' ? 'text-blue-600' :
                              t.status === 'completed' ? 'text-slate-500' :
                              'text-amber-600'
                            }`}>{t.status}</span>
                          </p>
                        </div>
                        <MapPin className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
                  <p className="text-sm font-semibold text-slate-700 mb-1">No listings found</p>
                  <p className="text-xs text-slate-500 mb-3">
                    There are no journeys or delivery requests associated with{' '}
                    <span className="font-medium text-slate-700">{email}</span>.
                  </p>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                  >
                    <PlusCircle className="h-3.5 w-3.5" /> Create a journey
                  </Link>
                </div>
              )}

              {/* ── Code entry ── */}
              <div className="mb-1">
                <h2 className="text-xl font-bold text-slate-900 mb-1">Enter your code</h2>
                <p className="text-sm text-slate-500">
                  We sent a 5-character code to{' '}
                  <span className="font-medium text-slate-700">{email}</span>
                </p>
              </div>

              {error && (
                <div className="my-3 flex items-start gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{error}
                </div>
              )}

              <form onSubmit={verifyCode} className="space-y-4 mt-4">
                <div>
                  <input
                    ref={codeRef}
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    maxLength={5}
                    placeholder="4827A"
                    className="w-full h-14 text-center text-2xl font-bold tracking-[0.35em] uppercase rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder-slate-300"
                  />
                  <p className="text-xs text-slate-400 mt-1.5 text-center">4 digits + 1 letter · e.g. 4827A</p>
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

              <div className="mt-5 text-center">
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
