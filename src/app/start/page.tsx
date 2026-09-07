'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import BootHopLogo from '@/components/BootHopLogo';

const FlightTicker = dynamic(() => import('@/components/bfi/FlightTicker'), { ssr: false });

type Role = 'sender' | 'traveller';

interface Journey {
  from: string;
  to: string;
  size: string;
  date: string;
  price: string;
}

const SENDER_SIZES = [
  { value: 'letter', label: 'Letter or document', sub: 'Under 1 kg' },
  { value: 'small',  label: 'Small parcel',       sub: 'Under 5 kg' },
  { value: 'medium', label: 'Medium parcel',      sub: '5 – 23 kg'  },
  { value: 'large',  label: 'Large item',         sub: '23 – 32 kg' },
];

const TRAVELLER_LUGGAGE = [
  { value: 'small',  label: 'Small',  sub: 'Up to 5 kg spare'  },
  { value: 'medium', label: 'Medium', sub: '5 – 15 kg spare'   },
  { value: 'large',  label: 'Large',  sub: '15 – 32 kg spare'  },
];

const SIZE_TO_KG: Record<string, number> = { letter: 0.5, small: 3, medium: 10, large: 25 };

// Logged-in users get a price step; guests go through the email gate instead
const SENDER_STEPS_AUTH    = ['from', 'to', 'size', 'date', 'price'] as const;
const TRAVELLER_STEPS_AUTH = ['from', 'to', 'date', 'size', 'price'] as const;
const SENDER_STEPS_GUEST   = ['from', 'to', 'size', 'date'] as const;
const TRAVELLER_STEPS_GUEST= ['from', 'to', 'date', 'size'] as const;

function StartContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [role, setRole]       = useState<Role | null>(null);
  const [step, setStep]       = useState(0);
  const [journey, setJourney] = useState<Journey>({ from: '', to: '', size: '', date: '', price: '' });
  const [fieldError, setFieldError] = useState('');

  // Auth state — checked once on mount
  const [authenticated, setAuthenticated] = useState(false);
  const [authChecked,   setAuthChecked]   = useState(false);
  const [posting,       setPosting]       = useState(false);
  const [postError,     setPostError]     = useState('');

  // City autocomplete
  const [fromQuery, setFromQuery]           = useState('');
  const [toQuery, setToQuery]               = useState('');
  const [fromSuggestions, setFromSuggestions] = useState<string[]>([]);
  const [toSuggestions, setToSuggestions]   = useState<string[]>([]);
  const [fromLocked, setFromLocked]         = useState(false);
  const [toLocked, setToLocked]             = useState(false);
  const [mapsReady, setMapsReady]           = useState(false);
  const [sessionToken, setSessionToken]     = useState<any>(null);

  // Guest auth state (email/OTP gate)
  const [email, setEmail]         = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [otp, setOtp]             = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [otpError, setOtpError]   = useState('');

  // Check if already logged in
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        setAuthenticated(!!(d?.authenticated && d?.user?.email));
        setAuthChecked(true);
      })
      .catch(() => setAuthChecked(true));
  }, []);

  // Pre-select role from ?role= param (only once auth is known)
  useEffect(() => {
    if (!authChecked) return;
    const r = searchParams.get('role') as Role | null;
    if (r === 'sender' || r === 'traveller') {
      setRole(r);
      setStep(1);
    }
  }, [searchParams, authChecked]);

  // Google Maps Places
  useEffect(() => {
    const init = () => {
      setMapsReady(true);
      setSessionToken(new (window as any).google.maps.places.AutocompleteSessionToken());
    };
    if ((window as any).google?.maps?.places) { init(); return; }
    const iv = setInterval(() => {
      if ((window as any).google?.maps?.places) { init(); clearInterval(iv); }
    }, 300);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (fromLocked || !mapsReady || fromQuery.length < 3) { setFromSuggestions([]); return; }
    const t = setTimeout(() => {
      new (window as any).google.maps.places.AutocompleteService().getPlacePredictions(
        { input: fromQuery, types: ['(cities)'], sessionToken },
        (p: any) => setFromSuggestions(p ? p.map((x: any) => x.description) : [])
      );
    }, 300);
    return () => clearTimeout(t);
  }, [fromQuery, fromLocked, mapsReady, sessionToken]);

  useEffect(() => {
    if (toLocked || !mapsReady || toQuery.length < 3) { setToSuggestions([]); return; }
    const t = setTimeout(() => {
      new (window as any).google.maps.places.AutocompleteService().getPlacePredictions(
        { input: toQuery, types: ['(cities)'], sessionToken },
        (p: any) => setToSuggestions(p ? p.map((x: any) => x.description) : [])
      );
    }, 300);
    return () => clearTimeout(t);
  }, [toQuery, toLocked, mapsReady, sessionToken]);

  const STEPS = role === 'sender'
    ? (authenticated ? SENDER_STEPS_AUTH    : SENDER_STEPS_GUEST)
    : (authenticated ? TRAVELLER_STEPS_AUTH : TRAVELLER_STEPS_GUEST);
  const TOTAL   = STEPS.length;
  const isGate  = step > TOTAL;
  const currentKey = (!isGate && step > 0) ? STEPS[step - 1] : null;

  const progressPct = step === 0 ? 0 : isGate ? 90 : Math.round((step / TOTAL) * 80);

  const chooseRole = (r: Role) => { setRole(r); setStep(1); setFieldError(''); };

  const back = () => {
    setFieldError('');
    setPostError('');
    if (step <= 1) { setStep(0); setRole(null); } else setStep(s => s - 1);
  };

  const advance = () => {
    if (!currentKey) return;
    const val = journey[currentKey as keyof Journey];

    if (currentKey === 'price') {
      const n = parseFloat(val.replace(/[^0-9.]/g, ''));
      if (!n || n <= 0) { setFieldError('Please enter an amount greater than £0.'); return; }
    } else {
      if (!val || !val.trim()) { setFieldError('Please answer this question to continue.'); return; }
      if (currentKey === 'from' && !fromLocked) { setFieldError('Please select a city from the dropdown.'); return; }
      if (currentKey === 'to'   && !toLocked)   { setFieldError('Please select a city from the dropdown.'); return; }
    }

    setFieldError('');

    // Logged-in user finishing last step → post trip directly
    if (authenticated && step === TOTAL) {
      postTrip();
      return;
    }

    setStep(s => s >= TOTAL ? TOTAL + 1 : s + 1);
  };

  const postTrip = async () => {
    setPosting(true);
    setPostError('');
    try {
      const price = parseFloat(journey.price.replace(/[^0-9.]/g, ''));
      const res = await fetch('/api/trips/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          from:   journey.from,
          to:     journey.to,
          date:   journey.date,
          weight: SIZE_TO_KG[journey.size] ?? 5,
          price:  String(price),
          mode:   role === 'sender' ? 'send' : 'travel',
        }),
      });
      const data = await res.json();
      if (!res.ok) { setPostError(data.error || 'Could not publish. Please try again.'); return; }
      router.push('/dashboard');
    } catch {
      setPostError('Network error — please try again.');
    } finally {
      setPosting(false);
    }
  };

  const minDate = (() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();

  const fmtDate = (s: string) => s
    ? new Date(s + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  const sizeLabel = (role === 'sender' ? SENDER_SIZES : TRAVELLER_LUGGAGE)
    .find(o => o.value === journey.size)?.label ?? journey.size;

  // Guest: save journey to localStorage then request OTP
  const sendCode = async () => {
    if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setEmailError('');
    setSubmitting(true);

    try {
      localStorage.setItem('boothop_pending_journey', JSON.stringify({
        role, from: journey.from, to: journey.to, size: journey.size, date: journey.date,
      }));
    } catch { /* private browsing */ }

    const res = await fetch('/api/auth/request-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const d = await res.json();
      setEmailError(d.error || 'Unable to send code. Try again.');
      return;
    }
    const data = await res.json();
    // Server recognised this device via remember-me and refreshed the session —
    // no OTP was sent. Re-check auth so the price step appears and they can post.
    if (data.skipOtp) {
      const meRes = await fetch('/api/auth/me', { credentials: 'include' });
      if (meRes.ok) {
        setAuthenticated(true);
        // Roll back to the last question step (price) so they can fill it in
        setStep(TOTAL);
        return;
      }
      // Fallback: go to dashboard (session cookie was set server-side)
      router.push('/dashboard');
      return;
    }
    setEmailSent(true);
  };

  const verifyOtp = async () => {
    const trimmed = otp.trim().toUpperCase();
    if (trimmed.length < 5) { setOtpError('Please enter the full 5-character code.'); return; }
    setOtpError('');
    setSubmitting(true);
    const res = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code: trimmed }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { setOtpError(data.error || 'Invalid code. Try again.'); return; }

    (window as any).ttq?.track('CompleteRegistration', { description: `start_${role}` });
    router.push('/dashboard');
  };

  const inputCls = 'w-full rounded-xl border border-white/15 bg-white/[0.06] px-5 py-4 text-white text-base placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all';

  // Show a spinner while we confirm auth status (avoids flicker)
  if (!authChecked) {
    return <div className="min-h-screen bg-[#07111f]" />;
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-white flex flex-col">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-lg mx-auto w-full">
        <Link href="/"><BootHopLogo size="sm" /></Link>
        {authenticated
          ? <Link href="/dashboard" className="text-sm text-white/40 hover:text-white/70 transition-colors">Dashboard</Link>
          : <Link href="/login"     className="text-sm text-white/40 hover:text-white/70 transition-colors">Log in</Link>
        }
      </nav>

      {/* Progress bar */}
      {step > 0 && (
        <div className="w-full h-1 bg-white/8">
          <div
            className="h-1 bg-blue-500 rounded-r-full transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">

          {/* ── STEP 0 — Role picker ── */}
          {step === 0 && (
            <>
              <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                  {authenticated ? 'Add a new listing' : 'Welcome to BootHop'}
                </h1>
                <p className="text-white/45 text-base">How can we help you today?</p>
              </div>

              <div className="space-y-4">
                {([
                  { r: 'sender'    as Role, emoji: '📦', title: 'Send a Package',  sub: 'Find someone already travelling your route' },
                  { r: 'traveller' as Role, emoji: '✈️', title: "I'm Travelling",  sub: 'Earn money from your spare luggage space'    },
                ] as const).map(({ r, emoji, title, sub }) => (
                  <button key={r} onClick={() => chooseRole(r)}
                    className="w-full rounded-2xl border border-white/12 bg-white/[0.03] hover:border-blue-500/35 hover:bg-blue-500/5 transition-all duration-200 p-6 text-left group">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-lg">{title}</p>
                        <p className="text-white/40 text-sm mt-0.5">{sub}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-white/20 group-hover:text-white/55 transition-colors shrink-0" />
                    </div>
                  </button>
                ))}
              </div>

              {!authenticated && (
                <p className="text-center text-xs text-white/25 mt-8">
                  Already have an account?{' '}
                  <Link href="/login" className="text-white/45 underline underline-offset-2 hover:text-white/65 transition-colors">Log in</Link>
                </p>
              )}
            </>
          )}

          {/* ── STEPS 1–N — Questions ── */}
          {step > 0 && !isGate && currentKey && (
            <>
              <button onClick={back} className="flex items-center gap-1.5 text-white/35 hover:text-white/65 text-sm mb-10 transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/25 mb-4">
                Step {step} of {TOTAL}
              </p>

              <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 leading-snug">
                {currentKey === 'from'  && (role === 'sender' ? 'Where are you sending from?'             : 'Where are you travelling from?')}
                {currentKey === 'to'    && (role === 'sender' ? 'Where is it going?'                      : 'Where are you going?')}
                {currentKey === 'size'  && (role === 'sender' ? 'Package size?'                           : 'How much luggage space do you have spare?')}
                {currentKey === 'date'  && (role === 'sender' ? 'Preferred delivery date?'               : 'When are you travelling?')}
                {currentKey === 'price' && (role === 'sender' ? 'What\'s your budget?'                   : 'How much do you want to charge?')}
              </h2>

              {/* From */}
              {currentKey === 'from' && (
                <div className="relative">
                  <input type="text" placeholder="e.g. London" value={fromQuery} autoFocus
                    onChange={e => { setFromQuery(e.target.value); setJourney(j => ({ ...j, from: e.target.value })); setFromLocked(false); setFieldError(''); }}
                    onKeyDown={e => e.key === 'Enter' && advance()}
                    className={inputCls}
                  />
                  {fromSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 z-50 mt-1 rounded-xl border border-white/10 bg-slate-900/98 backdrop-blur-xl shadow-2xl overflow-hidden">
                      {fromSuggestions.map((s, i) => (
                        <div key={i}
                          onClick={() => { setJourney(j => ({ ...j, from: s })); setFromQuery(s); setFromSuggestions([]); setFromLocked(true); setFieldError(''); if (mapsReady) setSessionToken(new (window as any).google.maps.places.AutocompleteSessionToken()); }}
                          className="px-4 py-3 text-sm text-white/80 hover:bg-white/8 hover:text-white cursor-pointer transition-colors">{s}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* To */}
              {currentKey === 'to' && (
                <div className="relative">
                  <input type="text" placeholder="e.g. Lagos" value={toQuery} autoFocus
                    onChange={e => { setToQuery(e.target.value); setJourney(j => ({ ...j, to: e.target.value })); setToLocked(false); setFieldError(''); }}
                    onKeyDown={e => e.key === 'Enter' && advance()}
                    className={inputCls}
                  />
                  {toSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 z-50 mt-1 rounded-xl border border-white/10 bg-slate-900/98 backdrop-blur-xl shadow-2xl overflow-hidden">
                      {toSuggestions.map((s, i) => (
                        <div key={i}
                          onClick={() => { setJourney(j => ({ ...j, to: s })); setToQuery(s); setToSuggestions([]); setToLocked(true); setFieldError(''); if (mapsReady) setSessionToken(new (window as any).google.maps.places.AutocompleteSessionToken()); }}
                          className="px-4 py-3 text-sm text-white/80 hover:bg-white/8 hover:text-white cursor-pointer transition-colors">{s}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Size */}
              {currentKey === 'size' && (
                <div className="space-y-3">
                  {(role === 'sender' ? SENDER_SIZES : TRAVELLER_LUGGAGE).map(opt => (
                    <button key={opt.value}
                      onClick={() => { setJourney(j => ({ ...j, size: opt.value })); setFieldError(''); }}
                      className={`w-full rounded-xl border px-5 py-4 text-left transition-all duration-150 ${
                        journey.size === opt.value
                          ? 'border-blue-500 bg-blue-500/12 text-white'
                          : 'border-white/12 bg-white/[0.03] text-white/60 hover:border-white/22 hover:bg-white/[0.05] hover:text-white'
                      }`}>
                      <p className="font-semibold text-sm">{opt.label}</p>
                      <p className="text-xs text-white/40 mt-0.5">{opt.sub}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Date */}
              {currentKey === 'date' && (
                <input type="date" min={minDate} value={journey.date} autoFocus
                  onChange={e => { setJourney(j => ({ ...j, date: e.target.value })); setFieldError(''); }}
                  className={`${inputCls} [color-scheme:dark]`}
                />
              )}

              {/* Price — logged-in users only */}
              {currentKey === 'price' && (
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 font-semibold text-base">£</span>
                  <input
                    type="number" min="1" placeholder="e.g. 40" autoFocus
                    value={journey.price}
                    onChange={e => { setJourney(j => ({ ...j, price: e.target.value })); setFieldError(''); setPostError(''); }}
                    onKeyDown={e => e.key === 'Enter' && advance()}
                    className={`${inputCls} pl-10`}
                  />
                </div>
              )}

              {fieldError && <p className="mt-3 text-sm text-red-400">{fieldError}</p>}
              {postError  && <p className="mt-3 text-sm text-red-400">{postError}</p>}

              {/* Continue button — hidden for size until something selected */}
              {(currentKey !== 'size' || journey.size) && (
                <button onClick={advance} disabled={posting}
                  className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white font-bold py-4 text-base transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(59,130,246,0.4)]">
                  {posting
                    ? 'Publishing…'
                    : (authenticated && step === TOTAL)
                      ? <>Publish now <ArrowRight className="h-4 w-4" /></>
                      : <>Continue <ArrowRight className="h-4 w-4" /></>
                  }
                </button>
              )}
            </>
          )}

          {/* ── GATE — guest only (step > TOTAL when not authenticated) ── */}
          {isGate && !authenticated && (
            <>
              <div className="flex justify-between text-xs text-white/35 mb-2">
                <span>Almost there</span>
                <span className="font-semibold text-white/55">90% complete</span>
              </div>
              <div className="w-full bg-white/8 rounded-full h-2 mb-10">
                <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" style={{ width: '90%' }} />
              </div>

              {/* Summary card */}
              <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-5 mb-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30 mb-3">
                  {role === 'sender' ? 'Your delivery request' : 'Your trip'}
                </p>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white font-bold text-xl">{journey.from.split(',')[0]}</span>
                  <ArrowRight className="h-4 w-4 text-white/30 shrink-0" />
                  <span className="text-white font-bold text-xl">{journey.to.split(',')[0]}</span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-white/45">
                  <span>{fmtDate(journey.date)}</span>
                  {journey.size && <span>· {sizeLabel}</span>}
                </div>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {role === 'sender' ? 'Your request is ready to publish.' : 'Your trip is ready to publish.'}
              </h2>
              <p className="text-white/45 text-sm mb-7 leading-relaxed">
                Create your FREE BootHop account to publish it to verified{' '}
                {role === 'sender' ? 'travellers' : 'senders'}.
              </p>

              <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 mb-8">
                {['Less than 30 seconds', '£20 welcome credit', 'ID verified community', 'Escrow protected'].map(t => (
                  <div key={t} className="flex items-center gap-2 text-sm text-white/50">
                    <CheckCircle className="h-3.5 w-3.5 text-green-400 shrink-0" />
                    {t}
                  </div>
                ))}
              </div>

              {!emailSent ? (
                <>
                  <input type="email" placeholder="Your email address" value={email} autoFocus
                    onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                    onKeyDown={e => e.key === 'Enter' && sendCode()}
                    className={`${inputCls} mb-2`}
                  />
                  {emailError && <p className="text-sm text-red-400 mb-3">{emailError}</p>}
                  <button onClick={sendCode} disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white font-bold py-4 text-base transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(59,130,246,0.4)]">
                    {submitting ? 'Sending...' : <> Continue <ArrowRight className="h-4 w-4" /></>}
                  </button>
                  <p className="text-center text-xs text-white/25 mt-4">
                    Already have an account?{' '}
                    <Link href="/login" className="text-white/45 underline underline-offset-2 hover:text-white/65 transition-colors">Log in</Link>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-white/50 mb-4">
                    We sent a 5-character code to{' '}
                    <span className="text-blue-400 font-medium">{email}</span>
                  </p>
                  <input type="text" value={otp} onChange={e => setOtp(e.target.value.toUpperCase())}
                    maxLength={5} placeholder="4827A" autoFocus
                    className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-5 py-4 text-center text-2xl font-bold tracking-[0.35em] uppercase text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-blue-500/50 mb-2"
                  />
                  {otpError && <p className="text-sm text-red-400 mb-3 text-center">{otpError}</p>}
                  <button onClick={verifyOtp} disabled={submitting || otp.trim().length < 5}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white font-bold py-4 text-base transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(59,130,246,0.4)]">
                    {submitting ? 'Verifying...' : <>Publish my {role === 'sender' ? 'request' : 'trip'} <ArrowRight className="h-4 w-4" /></>}
                  </button>
                  <button onClick={() => { setEmailSent(false); setOtp(''); setOtpError(''); }}
                    className="w-full mt-2 text-sm text-white/30 hover:text-white/55 transition-colors py-2">
                    ← Resend code
                  </button>
                </>
              )}
            </>
          )}

        </div>
      </div>

      <FlightTicker fixed />
    </div>
  );
}

export default function StartPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07111f]" />}>
      <StartContent />
    </Suspense>
  );
}
