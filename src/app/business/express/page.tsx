'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, ArrowRight, ChevronLeft, AlertCircle, Loader2,
  CheckCircle, Package, MapPin, Clock, ShieldCheck, Truck,
} from 'lucide-react';
import { BusinessNav } from '@/components/business/BusinessNav';
import BusinessFooter from '@/components/business/BusinessFooter';

const BG = 'linear-gradient(135deg, #020617 0%, #061a10 50%, #020617 100%)';

// ── Pricing matrix (preserved from business model: client-facing "from" prices) ──
const PRICES: Record<string, Record<string, number>> = {
  uk:            { small: 300,   medium: 550,   large: 850,   pallet: 1400 },
  international: { small: 1000,  medium: 1800,  large: 2800,  pallet: 4500 },
};

const SIZE_LABELS: Record<string, string> = {
  small:  'Small',
  medium: 'Medium',
  large:  'Large',
  pallet: 'Pallet / Oversized',
};

const PERSONAL_DOMAINS = ['gmail.', 'hotmail.', 'yahoo.', 'outlook.com', 'icloud.', 'live.', 'aol.', 'proton.', 'me.com'];

function isPersonalEmail(email: string) {
  return PERSONAL_DOMAINS.some(d => email.toLowerCase().includes(d));
}

type Step = 1 | 2 | 3 | 4 | 5 | 6;

interface QuoteState {
  from: string;
  to: string;
  size: string;
  type: 'uk' | 'international' | '';
}
interface BookingState {
  pickup_address: string;
  pickup_contact: string;
  delivery_address: string;
  delivery_contact: string;
  delivery_phone: string;
  special_instructions: string;
}

function ProgressBar({ step }: { step: Step }) {
  const labels = ['Quote', 'Price', 'Email', 'Verify', 'Details', 'Done'];
  return (
    <div className="flex items-center gap-1 mb-10">
      {labels.map((label, i) => {
        const n = (i + 1) as Step;
        const done = step > n;
        const active = step === n;
        return (
          <div key={label} className="flex items-center gap-1 flex-1 last:flex-none">
            <div className={`flex flex-col items-center gap-1 ${active ? 'opacity-100' : done ? 'opacity-70' : 'opacity-30'}`}>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-black transition-all ${
                done ? 'bg-emerald-400 border-emerald-400 text-black' :
                active ? 'border-emerald-400 text-emerald-400' :
                'border-white/20 text-white/40'
              }`}>
                {done ? '✓' : n}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/50 hidden sm:block">{label}</span>
            </div>
            {i < labels.length - 1 && (
              <div className={`flex-1 h-px mx-1 transition-all ${done ? 'bg-emerald-400/60' : 'bg-white/10'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ExpressPage() {
  const [step, setStep]     = useState<Step>(1);
  const [quote, setQuote]   = useState<QuoteState>({ from: '', to: '', size: '', type: '' });
  const [email, setEmail]   = useState('');
  const [otp, setOtp]       = useState('');
  const [booking, setBooking] = useState<BookingState>({
    pickup_address: '', pickup_contact: '',
    delivery_address: '', delivery_contact: '', delivery_phone: '',
    special_instructions: '',
  });
  const [refNumber, setRefNumber] = useState('');
  const [error, setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const price = quote.type && quote.size ? PRICES[quote.type][quote.size] : null;

  // ── Helpers ──────────────────────────────────────────────────────────────
  const setQ = (k: keyof QuoteState, v: string) => setQuote(q => ({ ...q, [k]: v }));
  const setB = (k: keyof BookingState, v: string) => setBooking(b => ({ ...b, [k]: v }));

  const quoteValid = quote.from && quote.to && quote.size && quote.type;

  const sendOtp = async () => {
    if (isPersonalEmail(email)) {
      setError('Personal email addresses are not accepted. Please use your company email.');
      return;
    }
    setError(null); setLoading(true);
    try {
      const res = await fetch('/api/business/auth/send-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error || 'Could not send code.'); return; }
      if (j.skipOtp) { setStep(5); return; }
      setStep(4);
    } catch { setError('Could not send code. Please try again.'); }
    finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    setError(null); setLoading(true);
    try {
      const res = await fetch('/api/business/auth/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: otp.trim() }),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error || 'Invalid code.'); return; }
      setStep(5);
    } catch { setError('Verification failed. Try again.'); }
    finally { setLoading(false); }
  };

  const submitBooking = async () => {
    if (!booking.pickup_address || !booking.delivery_address) {
      setError('Please fill in pickup and delivery addresses.'); return;
    }
    setError(null); setLoading(true);
    try {
      const res = await fetch('/api/business/express-quote', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          from_location: quote.from,
          to_location: quote.to,
          cargo_type: SIZE_LABELS[quote.size],
          urgency: quote.type === 'uk' ? 'same_day' : 'international',
          estimated_price: price,
          pickup_address: booking.pickup_address,
          pickup_contact: booking.pickup_contact,
          delivery_address: booking.delivery_address,
          delivery_contact: booking.delivery_contact,
          delivery_phone: booking.delivery_phone,
          special_requirements: booking.special_instructions,
        }),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error || 'Something went wrong.'); return; }
      const ref = `BH-EXP-${Math.floor(1000 + Math.random() * 9000)}`;
      setRefNumber(ref);
      setStep(6);
    } catch { setError('Could not submit booking. Please try again.'); }
    finally { setLoading(false); }
  };

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-400/50 focus:bg-white/8 transition-all';

  return (
    <div className="min-h-screen text-white" style={{ background: BG }}>

      <BusinessNav
        rightSlot={
          <>
            {step > 1 && step < 6 && (
              <button onClick={() => setStep(s => (s - 1) as Step)}
                className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm font-semibold transition-colors">
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
            )}
            <a href="/business" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm font-semibold transition-colors hidden sm:flex">
              <ChevronLeft className="h-4 w-4" /> Business
            </a>
            <span className="text-xs font-semibold bg-emerald-500/15 border border-emerald-400/25 text-emerald-400 px-2.5 py-1 rounded-full uppercase tracking-widest">
              Express
            </span>
          </>
        }
      />

      <div className="max-w-2xl mx-auto px-6 pt-28 pb-24">

        {/* Hero */}
        {step === 1 && (
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-emerald-500/12 border border-emerald-400/25 text-emerald-400 text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
              <Zap className="h-3.5 w-3.5" /> One-off &amp; Urgent
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.05] mb-4">
              Get an instant quote.<br />
              <span className="text-emerald-400">No account. No contracts.</span>
            </h1>
            <p className="text-white/45 text-base max-w-xl mx-auto">
              Tell us where it needs to go and we'll give you a price in under 30 seconds.
            </p>
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ── STEP 1: Instant Quote ─────────────────────────────────── */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <ProgressBar step={1} />
              <div className="bg-white/3 border border-white/8 rounded-3xl p-8">
                <h2 className="text-xl font-black mb-6 flex items-center gap-2">
                  <Package className="h-5 w-5 text-emerald-400" /> Your quote
                </h2>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-widest font-bold mb-2 block">From (City or Postcode)</label>
                    <input value={quote.from} onChange={e => setQ('from', e.target.value)} placeholder="Manchester, M1 1AA" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-widest font-bold mb-2 block">To (City or Postcode / Country)</label>
                    <input value={quote.to} onChange={e => setQ('to', e.target.value)} placeholder="London, EC1A / Hamburg, Germany" className={inputCls} />
                  </div>

                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-widest font-bold mb-2 block">Delivery type</label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['uk', 'international'] as const).map(t => (
                        <button key={t} type="button" onClick={() => setQ('type', t)}
                          className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                            quote.type === t ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-300' : 'bg-white/3 border-white/10 text-white/50 hover:border-white/25'
                          }`}>
                          {t === 'uk' ? '🇬🇧 UK' : '🌍 International'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-widest font-bold mb-2 block">Package size</label>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(SIZE_LABELS).map(([val, lbl]) => (
                        <button key={val} type="button" onClick={() => setQ('size', val)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            quote.size === val ? 'bg-emerald-500/15 border-emerald-400/50' : 'bg-white/3 border-white/10 hover:border-white/25'
                          }`}>
                          <p className={`text-sm font-bold ${quote.size === val ? 'text-emerald-300' : 'text-white/70'}`}>{lbl}</p>
                          {quote.type && (
                            <p className="text-xs text-white/30 mt-0.5">From £{PRICES[quote.type][val].toLocaleString()}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-white/40 mb-6">
                  {['✅ Insured to £10,000', '✅ Same-day UK · Airport options', '✅ No account required'].map(t => (
                    <span key={t}>{t}</span>
                  ))}
                </div>

                <button onClick={() => quoteValid && setStep(2)} disabled={!quoteValid}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black text-base px-8 py-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100">
                  See My Price <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Price Shown ───────────────────────────────────── */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <ProgressBar step={2} />
              <div className="bg-white/3 border border-emerald-400/25 rounded-3xl p-8 text-center">
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4">Your estimate</p>
                <p className="text-white/60 text-sm mb-6">
                  {quote.from} → {quote.to} · {SIZE_LABELS[quote.size]} package
                </p>
                <p className="text-6xl font-black text-emerald-400 mb-2">
                  From £{price?.toLocaleString()}
                </p>
                <p className="text-white/40 text-sm mb-8">
                  {quote.type === 'uk' ? 'Same-day UK' : 'International'} · Fully insured
                </p>

                <div className="flex flex-wrap justify-center gap-4 text-xs text-white/40 mb-8">
                  {[
                    { icon: <ShieldCheck className="h-3.5 w-3.5" />, label: 'Insured to £10,000' },
                    { icon: <Clock className="h-3.5 w-3.5" />,       label: 'Carrier in 15 mins' },
                    { icon: <Truck className="h-3.5 w-3.5" />,       label: 'ID-verified carrier' },
                  ].map(({ icon, label }) => (
                    <span key={label} className="flex items-center gap-1.5">{icon} {label}</span>
                  ))}
                </div>

                <button onClick={() => setStep(3)}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black text-base px-8 py-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-emerald-500/25 mb-4">
                  Confirm &amp; Book <ArrowRight className="h-5 w-5" />
                </button>
                <button onClick={() => setStep(1)} className="text-white/30 text-sm hover:text-white/60 transition-colors">
                  ← Change details
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: Business Email Gate ───────────────────────────── */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <ProgressBar step={3} />
              <div className="bg-white/3 border border-white/8 rounded-3xl p-8">
                <div className="text-center mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-400/25 flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-7 w-7 text-emerald-400" />
                  </div>
                  <h2 className="text-2xl font-black mb-2">Enter your business email</h2>
                  <p className="text-white/40 text-sm">to confirm your booking.</p>
                  <p className="text-white/25 text-xs mt-2">Personal addresses not accepted.</p>
                </div>

                <input
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(null); }}
                  type="email"
                  placeholder="you@yourcompany.com"
                  className={`${inputCls} text-center text-base mb-4`}
                />

                {error && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 mb-4 text-sm text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                  </div>
                )}

                <button onClick={sendOtp} disabled={!email || loading}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black text-base px-8 py-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 mb-4">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                  {loading ? 'Sending…' : 'Send Verification Code →'}
                </button>
                <p className="text-center text-white/25 text-xs">
                  Already have an account? <a href="/business" className="text-white/50 hover:text-white underline">Sign in here →</a>
                </p>
              </div>
            </motion.div>
          )}

          {/* ── STEP 4: OTP Verification ──────────────────────────────── */}
          {step === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <ProgressBar step={4} />
              <div className="bg-white/3 border border-white/8 rounded-3xl p-8 text-center">
                <h2 className="text-2xl font-black mb-2">Check your inbox</h2>
                <p className="text-white/40 text-sm mb-8">
                  We've sent a 6-digit code to<br />
                  <span className="text-white font-semibold">{email}</span>
                </p>

                <input
                  value={otp}
                  onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(null); }}
                  placeholder="_ _ _ _ _ _"
                  className={`${inputCls} text-center text-2xl font-black tracking-[0.5em] mb-4`}
                  maxLength={6}
                />

                {error && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 mb-4 text-sm text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                  </div>
                )}

                <button onClick={verifyOtp} disabled={otp.length < 6 || loading}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black text-base px-8 py-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 mb-4">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                  {loading ? 'Verifying…' : 'Confirm Code →'}
                </button>
                <button onClick={() => { setStep(3); setOtp(''); }} className="text-white/30 text-sm hover:text-white/60 transition-colors block mx-auto">
                  ← Back
                </button>
                <button onClick={sendOtp} className="text-white/25 text-xs hover:text-white/50 transition-colors mt-3 block mx-auto">
                  Didn't get it? Resend code
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 5: Booking Details ───────────────────────────────── */}
          {step === 5 && (
            <motion.div key="s5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <ProgressBar step={5} />
              <div className="bg-white/3 border border-white/8 rounded-3xl p-8">
                <h2 className="text-xl font-black mb-2">Almost done.</h2>
                <p className="text-white/40 text-sm mb-6">Tell us a bit more.</p>

                {/* Pickup */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-emerald-400" />
                    <p className="text-xs font-black text-white/40 uppercase tracking-widest">Pickup details</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-white/40 mb-1.5 block">Full address *</label>
                      <input value={booking.pickup_address} onChange={e => setB('pickup_address', e.target.value)}
                        placeholder="123 Example Street, Manchester, M1 1AA" className={inputCls} />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 mb-1.5 block">Contact name at pickup</label>
                      <input value={booking.pickup_contact} onChange={e => setB('pickup_contact', e.target.value)}
                        placeholder="James Walsh" className={inputCls} />
                    </div>
                  </div>
                </div>

                {/* Delivery */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-white/40" />
                    <p className="text-xs font-black text-white/40 uppercase tracking-widest">Delivery details</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-white/40 mb-1.5 block">Full address *</label>
                      <input value={booking.delivery_address} onChange={e => setB('delivery_address', e.target.value)}
                        placeholder="45 Marina Road, Hamburg, Germany" className={inputCls} />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 mb-1.5 block">Contact name at delivery</label>
                      <input value={booking.delivery_contact} onChange={e => setB('delivery_contact', e.target.value)}
                        placeholder="Klaus Fischer" className={inputCls} />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 mb-1.5 block">Contact phone (recipient)</label>
                      <input value={booking.delivery_phone} onChange={e => setB('delivery_phone', e.target.value)}
                        placeholder="+49 40 5070 0" className={inputCls} />
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="text-xs text-white/40 mb-1.5 block">Special instructions (optional)</label>
                  <textarea value={booking.special_instructions} onChange={e => setB('special_instructions', e.target.value)}
                    placeholder="Fragile — handle with care. Airside access required." rows={3}
                    className={`${inputCls} resize-none`} />
                </div>

                {error && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 mb-4 text-sm text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                  </div>
                )}

                <button onClick={submitBooking} disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black text-base px-8 py-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                  {loading ? 'Submitting…' : 'Confirm Booking →'}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 6: Confirmation ──────────────────────────────────── */}
          {step === 6 && (
            <motion.div key="s6" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-center py-8">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto mb-8">
                <CheckCircle className="h-10 w-10 text-emerald-400" />
              </div>
              <h1 className="text-4xl font-black mb-3">Booking confirmed.</h1>
              <div className="inline-block bg-white/5 border border-white/10 rounded-2xl px-6 py-3 mb-6">
                <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Your reference</p>
                <p className="text-2xl font-black text-emerald-400 font-mono">{refNumber}</p>
              </div>
              <p className="text-white/50 text-base max-w-sm mx-auto mb-6">
                A verified carrier will be assigned within 15 minutes.
              </p>
              <div className="bg-white/3 border border-white/8 rounded-2xl p-5 text-left max-w-sm mx-auto mb-8">
                <p className="text-xs font-black text-white/30 uppercase tracking-widest mb-3">You'll receive</p>
                {['SMS confirmation shortly', 'Live tracking link by email', 'Delivery confirmation when done'].map(t => (
                  <div key={t} className="flex items-center gap-2 text-sm text-white/60 mb-2">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> {t}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                <a href="/business/express"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black px-6 py-3 rounded-xl text-sm hover:scale-105 transition-all shadow-xl shadow-emerald-500/20">
                  Book Another →
                </a>
                <a href="/business"
                  className="inline-flex items-center gap-2 bg-white/8 border border-white/15 text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-white/12 transition-all">
                  Back to Business
                </a>
              </div>
              <p className="text-white/20 text-xs mt-6">
                Need to speak to someone? <a href="tel:+441156612825" className="text-white/40 hover:text-white/60 underline">+44 115 661 2825</a>
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <BusinessFooter />
    </div>
  );
}
