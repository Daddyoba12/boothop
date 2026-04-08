'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, Mail, ShieldCheck, CheckCircle, ArrowRight,
  Zap, Lock, Clock, MapPin, Package, Star, Building2, Truck,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Pricing engine — no external API needed
// ─────────────────────────────────────────────────────────────────────────────
const UK_CITIES: Record<string, [number, number]> = {
  london:       [51.5074, -0.1278],
  'central london': [51.5074, -0.1278],
  birmingham:   [52.4862, -1.8904],
  manchester:   [53.4808, -2.2426],
  leeds:        [53.8008, -1.5491],
  sheffield:    [53.3811, -1.4701],
  liverpool:    [53.4084, -2.9916],
  bristol:      [51.4545, -2.5879],
  nottingham:   [52.9548, -1.1581],
  leicester:    [52.6369, -1.1398],
  derby:        [52.9225, -1.4746],
  coventry:     [52.4068, -1.5197],
  edinburgh:    [55.9533, -3.1883],
  glasgow:      [55.8642, -4.2518],
  cardiff:      [51.4816, -3.1791],
  cambridge:    [52.2053,  0.1218],
  oxford:       [51.7520, -1.2577],
  norwich:      [52.6309,  1.2974],
  southampton:  [50.9097, -1.4044],
  portsmouth:   [50.8198, -1.0880],
  reading:      [51.4543, -0.9781],
  newcastle:    [54.9783, -1.6178],
  sunderland:   [54.9069, -1.3838],
  middlesbrough:[54.5743, -1.2350],
  hull:         [53.7457, -0.3367],
  york:         [53.9600, -1.0873],
  bradford:     [53.7960, -1.7594],
  stoke:        [53.0027, -2.1794],
  exeter:       [50.7184, -3.5339],
  brighton:     [50.8229, -0.1363],
  ipswich:      [52.0567,  1.1482],
  peterborough: [52.5695, -0.2405],
  northampton:  [52.2405, -0.9027],
};

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function detectCity(text: string): [number, number] | null {
  const lower = text.toLowerCase();
  // Try longest match first so "central london" beats "london"
  const sorted = Object.keys(UK_CITIES).sort((a, b) => b.length - a.length);
  for (const city of sorted) {
    if (lower.includes(city)) return UK_CITIES[city];
  }
  return null;
}

// Nottingham→Leicester ≈ 27 miles = £250 base unit
// London from Notts ≈ 125 miles → £500
// Every additional 35 miles beyond 130 = +£250
function priceFromMiles(miles: number): number {
  if (miles <= 35)  return 250;
  if (miles <= 130) return 500;
  const extra = Math.ceil((miles - 130) / 35);
  return 500 + extra * 250;
}

function calculatePrice(pickup: string, dropoff: string): { price: number; miles: number } | null {
  const from = detectCity(pickup);
  const to   = detectCity(dropoff);
  if (!from || !to) return null;
  const miles = Math.round(haversine(from[0], from[1], to[0], to[1]));
  return { price: priceFromMiles(miles), miles };
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type Stage = 'loading' | 'landing' | 'email' | 'otp' | 'portal' | 'form' | 'success';

type JobForm = {
  pickup: string; dropoff: string; description: string;
  weight: string; value: string; category: string;
  urgency: 'same_day' | 'next_day'; insurance: boolean;
};

const FADE = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -16 } };

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function BoothopBusiness() {
  const [stage,       setStage]       = useState<Stage>('loading');
  const [bizEmail,    setBizEmail]    = useState('');
  const [emailInput,  setEmailInput]  = useState('');
  const [otpInput,    setOtpInput]    = useState('');
  const [authError,   setAuthError]   = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [jobRef,      setJobRef]      = useState('');

  const [form, setForm] = useState<JobForm>({
    pickup: '', dropoff: '', description: '',
    weight: '', value: '', category: '',
    urgency: 'same_day', insurance: true,
  });
  const [estimate,    setEstimate]    = useState<{ price: number; miles: number } | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError,   setFormError]   = useState<string | null>(null);

  // Check existing session
  useEffect(() => {
    fetch('/api/business/auth/me')
      .then(r => r.json())
      .then(d => { if (d.authenticated) { setBizEmail(d.email); setStage('portal'); } else { setStage('landing'); } })
      .catch(() => setStage('landing'));
  }, []);

  // Live price estimate
  useEffect(() => {
    if (form.pickup && form.dropoff) setEstimate(calculatePrice(form.pickup, form.dropoff));
    else setEstimate(null);
  }, [form.pickup, form.dropoff]);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const sendOtp = async () => {
    setAuthError(null); setAuthLoading(true);
    try {
      const res = await fetch('/api/business/auth/send-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.trim() }),
      });
      const j = await res.json();
      if (!res.ok) { setAuthError(j.error); return; }
      setStage('otp');
    } catch { setAuthError('Could not send code. Please try again.'); }
    finally { setAuthLoading(false); }
  };

  const verifyOtp = async () => {
    setAuthError(null); setAuthLoading(true);
    try {
      const res = await fetch('/api/business/auth/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: otpInput.trim() }),
      });
      const j = await res.json();
      if (!res.ok) { setAuthError(j.error); return; }
      setBizEmail(j.email); setStage('portal');
    } catch { setAuthError('Verification failed. Please try again.'); }
    finally { setAuthLoading(false); }
  };

  // ── Submit job ────────────────────────────────────────────────────────────
  const submitJob = async () => {
    if (!form.insurance) { setFormError('Insurance is compulsory.'); return; }
    if (!form.pickup || !form.dropoff) { setFormError('Pickup and drop-off are required.'); return; }
    setFormError(null); setFormLoading(true);
    try {
      const res = await fetch('/api/business/create-job', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, price: estimate?.price ?? 250, miles: estimate?.miles ?? 0 }),
      });
      const j = await res.json();
      if (!res.ok) { setFormError(j.error || 'Something went wrong.'); return; }
      setJobRef(j.jobRef); setStage('success');
    } catch { setFormError('Something went wrong.'); }
    finally { setFormLoading(false); }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (stage === 'loading') {
    return (
      <div className="min-h-screen bg-[#050a05] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050a05] text-white">
      <AnimatePresence mode="wait">

        {/* ══════════════════════════════════════════
            LANDING PAGE
        ══════════════════════════════════════════ */}
        {stage === 'landing' && (
          <motion.div key="landing" {...FADE} transition={{ duration: 0.4 }}>

            {/* Nav */}
            <nav className="px-8 py-5 flex items-center justify-between border-b border-white/5">
              <div className="text-xl font-black tracking-tight">
                Boot<span className="text-emerald-400">Hop</span>
                <span className="ml-2 text-xs font-semibold bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full uppercase tracking-widest">Business</span>
              </div>
              <button
                onClick={() => setStage('email')}
                className="text-sm font-semibold text-white/60 hover:text-white transition-colors"
              >
                Sign in →
              </button>
            </nav>

            {/* Hero */}
            <div className="max-w-5xl mx-auto px-8 pt-24 pb-16 text-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-full mb-8 uppercase tracking-widest"
              >
                <Zap className="h-3.5 w-3.5" /> Premium business logistics
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-6"
              >
                Same-day delivery<br />
                <span className="text-emerald-400">across the UK.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="text-white/50 text-xl max-w-2xl mx-auto mb-12 leading-relaxed"
              >
                BootHop Business connects your company to a network of verified carriers.
                Fast, insured, and built for time-critical deliveries.
              </motion.p>

              <motion.button
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 }}
                onClick={() => setStage('email')}
                className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black text-lg px-10 py-4 rounded-2xl hover:scale-105 transition-all shadow-2xl shadow-emerald-500/30"
              >
                Request a delivery <ArrowRight className="h-5 w-5" />
              </motion.button>
              <p className="text-white/20 text-sm mt-4">Business email required · No personal accounts accepted</p>
            </div>

            {/* Stats */}
            <div className="max-w-5xl mx-auto px-8 pb-16">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: '£250', label: 'Starting from', sub: 'Nottingham ↔ Leicester range' },
                  { value: '100%', label: 'Insured', sub: 'Every single delivery' },
                  { value: 'Same day', label: 'Delivery', sub: 'For urgent business needs' },
                ].map(s => (
                  <div key={s.label} className="bg-white/3 border border-white/8 rounded-2xl p-6 text-center">
                    <p className="text-3xl font-black text-emerald-400 mb-1">{s.value}</p>
                    <p className="text-white font-semibold text-sm">{s.label}</p>
                    <p className="text-white/30 text-xs mt-0.5">{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* How it works */}
            <div className="max-w-5xl mx-auto px-8 pb-20">
              <h2 className="text-2xl font-black text-center mb-10">How it works</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { icon: Building2, step: '01', title: 'Verify your business', body: 'Sign in with your company email. No Gmail or personal accounts — business only.' },
                  { icon: MapPin,    step: '02', title: 'Submit your request', body: 'Tell us the route, what needs delivering, and when. Get an instant price estimate.' },
                  { icon: Zap,       step: '03', title: 'We handle the rest', body: 'We match a verified carrier to your job and keep you updated every step of the way.' },
                ].map(({ icon: Icon, step, title, body }) => (
                  <div key={step} className="bg-white/3 border border-white/8 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-emerald-400" />
                      </div>
                      <span className="text-white/20 font-black text-2xl">{step}</span>
                    </div>
                    <h3 className="text-white font-bold mb-2">{title}</h3>
                    <p className="text-white/40 text-sm leading-relaxed">{body}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="max-w-5xl mx-auto px-8 pb-20">
              <h2 className="text-2xl font-black text-center mb-4">Transparent pricing</h2>
              <p className="text-white/40 text-center text-sm mb-10">Fixed rates based on distance. No hidden fees.</p>
              <div className="grid md:grid-cols-4 gap-4">
                {[
                  { range: 'Up to 35 miles',    price: '£250', example: 'Nottingham ↔ Leicester' },
                  { range: '36 – 130 miles',    price: '£500', example: 'Nottingham ↔ London' },
                  { range: '131 – 165 miles',   price: '£750', example: 'London ↔ Manchester' },
                  { range: '165+ miles',        price: '£1,000+', example: 'Cross-country routes' },
                ].map(p => (
                  <div key={p.range} className="bg-white/3 border border-white/8 rounded-2xl p-5">
                    <p className="text-2xl font-black text-emerald-400 mb-1">{p.price}</p>
                    <p className="text-white/60 text-xs font-semibold mb-2">{p.range}</p>
                    <p className="text-white/25 text-xs">{p.example}</p>
                  </div>
                ))}
              </div>
              <p className="text-white/20 text-xs text-center mt-4">All prices include insurance. +£250 per additional 35-mile band beyond 165 miles.</p>
            </div>

            {/* Features */}
            <div className="max-w-5xl mx-auto px-8 pb-20">
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { icon: ShieldCheck, title: 'Fully insured',       body: 'Every delivery is insured to the declared value of goods.' },
                  { icon: Clock,       title: 'Same-day available',   body: 'Submit before midday for same-day delivery on most routes.' },
                  { icon: Lock,        title: 'Business-only access', body: 'Verified business accounts only. No personal users on the platform.' },
                  { icon: Star,        title: 'Rated carriers',       body: 'All our carriers are verified, rated, and background-checked.' },
                ].map(({ icon: Icon, title, body }) => (
                  <div key={title} className="flex items-start gap-4 bg-white/3 border border-white/8 rounded-2xl p-5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white font-bold mb-1">{title}</p>
                      <p className="text-white/40 text-sm leading-relaxed">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="max-w-2xl mx-auto px-8 pb-24 text-center">
              <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-3xl p-10">
                <h2 className="text-3xl font-black mb-3">Ready to get started?</h2>
                <p className="text-white/40 mb-8">Enter your business email to access the portal.</p>
                <button
                  onClick={() => setStage('email')}
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black px-8 py-4 rounded-2xl hover:scale-105 transition-all"
                >
                  Get access <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>

          </motion.div>
        )}

        {/* ══════════════════════════════════════════
            EMAIL INPUT
        ══════════════════════════════════════════ */}
        {stage === 'email' && (
          <motion.div key="email" {...FADE} className="min-h-screen flex flex-col items-center justify-center px-6">
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <p className="text-xl font-black mb-1">Boot<span className="text-emerald-400">Hop</span> <span className="text-white/40 font-normal">Business</span></p>
                <h2 className="text-3xl font-black mt-4 mb-2">Enter your business email</h2>
                <p className="text-white/40 text-sm">Personal email addresses are not accepted</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-4">
                {authError && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-300 text-sm">{authError}</div>
                )}
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendOtp()}
                    placeholder="you@yourcompany.com"
                    autoFocus
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
                <button
                  onClick={sendOtp}
                  disabled={authLoading || !emailInput.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black disabled:opacity-40 hover:scale-[1.02] transition-all"
                >
                  {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  {authLoading ? 'Sending code…' : 'Send verification code'}
                </button>
                <button onClick={() => setStage('landing')} className="w-full text-center text-white/25 hover:text-white/50 text-sm transition-colors pt-1">
                  ← Back
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════
            OTP
        ══════════════════════════════════════════ */}
        {stage === 'otp' && (
          <motion.div key="otp" {...FADE} className="min-h-screen flex flex-col items-center justify-center px-6">
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-emerald-400" />
                </div>
                <h2 className="text-3xl font-black mb-2">Check your inbox</h2>
                <p className="text-white/40 text-sm">We sent a 6-digit code to</p>
                <p className="text-emerald-400 font-semibold text-sm mt-0.5">{emailInput}</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-4">
                {authError && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-300 text-sm">{authError}</div>
                )}
                <input
                  type="text" inputMode="numeric"
                  value={otpInput}
                  onChange={e => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={e => e.key === 'Enter' && verifyOtp()}
                  placeholder="000000"
                  autoFocus
                  className="w-full text-center text-4xl font-mono tracking-[0.6em] py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={verifyOtp}
                  disabled={authLoading || otpInput.length < 6}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black disabled:opacity-40 hover:scale-[1.02] transition-all"
                >
                  {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  {authLoading ? 'Verifying…' : 'Verify & continue'}
                </button>
                <button onClick={() => { setStage('email'); setOtpInput(''); setAuthError(null); }}
                  className="w-full text-center text-white/25 hover:text-white/50 text-sm transition-colors">
                  Use a different email
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════
            POST-LOGIN PORTAL / ABOUT PAGE
        ══════════════════════════════════════════ */}
        {stage === 'portal' && (
          <motion.div key="portal" {...FADE} transition={{ duration: 0.4 }}>
            {/* Nav */}
            <nav className="px-8 py-5 flex items-center justify-between border-b border-white/5">
              <div className="text-xl font-black tracking-tight">
                Boot<span className="text-emerald-400">Hop</span>
                <span className="ml-2 text-xs font-semibold bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full uppercase tracking-widest">Business</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-white/40 text-sm hidden md:block">{bizEmail}</span>
                <button
                  onClick={() => setStage('form')}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black text-sm px-5 py-2.5 rounded-xl hover:scale-105 transition-all"
                >
                  Book a delivery <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </nav>

            <div className="max-w-5xl mx-auto px-8 py-16">
              {/* Welcome */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="mb-16">
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
                  <CheckCircle className="h-3.5 w-3.5" /> Verified business account
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-4">
                  Welcome back,<br /><span className="text-emerald-400">let's move something.</span>
                </h1>
                <p className="text-white/40 text-lg max-w-2xl">
                  You're signed in as <span className="text-white/70 font-semibold">{bizEmail}</span>. Everything below tells you exactly how BootHop works before you place your first job.
                </p>
              </motion.div>

              {/* About BootHop */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="mb-12 bg-white/3 border border-white/8 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h2 className="text-xl font-black">About BootHop</h2>
                </div>
                <p className="text-white/60 leading-relaxed mb-4">
                  BootHop was founded in Nottingham with a simple idea: people already travelling between cities shouldn't be empty-handed while businesses and individuals struggle to move parcels quickly and affordably.
                </p>
                <p className="text-white/60 leading-relaxed mb-4">
                  We built a peer-to-peer platform that connects everyday travellers — people driving, taking the train, or flying — with those who need packages moved urgently. Every carrier on our platform is verified, every delivery is insured, and every route is tracked end-to-end.
                </p>
                <p className="text-white/60 leading-relaxed">
                  BootHop Business brings this model to companies. Whether you need samples delivered same-day between Nottingham and Leicester, documents couriered to London, or goods moved anywhere across the UK, we handle the logistics so you can focus on your business.
                </p>
              </motion.div>

              {/* How it works */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="mb-12">
                <h2 className="text-2xl font-black mb-8">How it works</h2>
                <div className="grid md:grid-cols-4 gap-4">
                  {[
                    { icon: Mail,        step: '01', title: 'You submit a job',       body: 'Tell us what needs moving, from where, to where, and when. Our system calculates a price instantly based on distance.' },
                    { icon: ShieldCheck, step: '02', title: 'We verify & assign',     body: 'Our team reviews your job and assigns a vetted carrier. You receive an email confirmation with their details.' },
                    { icon: Truck,       step: '03', title: 'Collection & delivery',  body: 'The carrier collects from your pickup address and delivers directly. You can track status in real time.' },
                    { icon: CheckCircle, step: '04', title: 'Confirmed & invoiced',   body: 'Once delivered, you receive a delivery confirmation. An invoice is issued and payment is collected on net terms.' },
                  ].map(({ icon: Icon, step, title, body }) => (
                    <div key={step} className="bg-white/3 border border-white/8 rounded-2xl p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-4 w-4 text-emerald-400" />
                        </div>
                        <span className="text-emerald-400/60 text-xs font-black tracking-widest">{step}</span>
                      </div>
                      <p className="text-white font-bold text-sm mb-2">{title}</p>
                      <p className="text-white/40 text-xs leading-relaxed">{body}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Pricing */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="mb-12 bg-white/3 border border-white/8 rounded-2xl p-8">
                <h2 className="text-xl font-black mb-2">Transparent pricing</h2>
                <p className="text-white/40 text-sm mb-6">All prices include insurance. No hidden fees.</p>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { route: 'Short haul',  distance: 'Up to 35 miles',       price: '£250', example: 'e.g. Nottingham → Leicester' },
                    { route: 'Mid haul',    distance: '36 – 130 miles',        price: '£500', example: 'e.g. Nottingham → London'    },
                    { route: 'Long haul',   distance: '+35 miles per band',    price: '+£250', example: 'Beyond 130 miles'          },
                  ].map(r => (
                    <div key={r.route} className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-5">
                      <p className="text-3xl font-black text-emerald-400 mb-1">{r.price}</p>
                      <p className="text-white font-bold text-sm">{r.route}</p>
                      <p className="text-white/40 text-xs mt-1">{r.distance}</p>
                      <p className="text-white/25 text-xs mt-2 italic">{r.example}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Commitments */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="mb-16 grid md:grid-cols-3 gap-4">
                {[
                  { icon: Lock,   title: 'Fully insured',      body: 'Every single delivery is covered. Declare your item value and we handle the rest.' },
                  { icon: Clock,  title: 'Same-day available', body: 'Need it there today? Mark your job as same-day and we\'ll prioritise matching a carrier.' },
                  { icon: Star,   title: 'Rated carriers',     body: 'All carriers are rated by senders after every delivery. Only top-rated carriers stay on the platform.' },
                ].map(({ icon: Icon, title, body }) => (
                  <div key={title} className="bg-white/3 border border-white/8 rounded-2xl p-6">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4">
                      <Icon className="h-5 w-5 text-emerald-400" />
                    </div>
                    <p className="text-white font-bold text-sm mb-2">{title}</p>
                    <p className="text-white/40 text-xs leading-relaxed">{body}</p>
                  </div>
                ))}
              </motion.div>

              {/* CTA */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="text-center">
                <button
                  onClick={() => setStage('form')}
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black text-xl px-12 py-5 rounded-2xl hover:scale-105 transition-all shadow-2xl shadow-emerald-500/30"
                >
                  Book a delivery <ArrowRight className="h-6 w-6" />
                </button>
                <p className="text-white/20 text-sm mt-4">Insured · Same-day available · UK-wide coverage</p>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════
            DELIVERY FORM
        ══════════════════════════════════════════ */}
        {stage === 'form' && (
          <motion.div key="form" {...FADE} className="px-6 py-10">
            <div className="max-w-3xl mx-auto">

              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-black">Boot<span className="text-emerald-400">Hop</span> Business</h1>
                  <p className="text-white/30 text-sm mt-0.5">Premium logistics portal</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/30 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">{bizEmail}</span>
                </div>
              </div>

              <div className="bg-white/3 border border-white/8 rounded-3xl p-8 space-y-6">

                {/* Route */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3 flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" /> Route
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-white/40 block mb-1.5">Pickup location</label>
                      <input value={form.pickup} onChange={e => setForm({ ...form, pickup: e.target.value })}
                        placeholder="e.g. Nottingham city centre"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 block mb-1.5">Drop-off location</label>
                      <input value={form.dropoff} onChange={e => setForm({ ...form, dropoff: e.target.value })}
                        placeholder="e.g. London EC2A"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
                    </div>
                  </div>
                  {form.pickup && form.dropoff && !estimate && (
                    <p className="text-amber-400/60 text-xs mt-2">Enter recognised city names for an instant quote (e.g. "Nottingham", "London")</p>
                  )}
                </div>

                {/* Goods */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3 flex items-center gap-2">
                    <Package className="h-3.5 w-3.5" /> Goods
                  </p>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe what needs to be delivered"
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none mb-4" />
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-white/40 block mb-1.5">Weight (kg)</label>
                      <input value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })}
                        placeholder="e.g. 5"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 block mb-1.5">Declared value (£)</label>
                      <input value={form.value} onChange={e => setForm({ ...form, value: e.target.value })}
                        placeholder="e.g. 500"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 block mb-1.5">Category</label>
                      <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm">
                        <option value="">Select category</option>
                        <option>Documents</option>
                        <option>Medical</option>
                        <option>Parts / Components</option>
                        <option>Electronics</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Urgency */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3 flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" /> Urgency
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {(['same_day', 'next_day'] as const).map(u => (
                      <button key={u} onClick={() => setForm({ ...form, urgency: u })}
                        className={`py-3.5 rounded-xl text-sm font-bold transition-all ${form.urgency === u ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-black' : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'}`}>
                        {u === 'same_day' ? '⚡ Same Day' : '🌅 Next Morning'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Insurance */}
                <label className="flex items-center gap-3 cursor-pointer bg-white/3 border border-white/8 rounded-xl px-5 py-4">
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${form.insurance ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'}`}>
                    {form.insurance && <CheckCircle className="h-3.5 w-3.5 text-black" />}
                  </div>
                  <input type="checkbox" className="sr-only" checked={form.insurance} onChange={() => setForm({ ...form, insurance: !form.insurance })} />
                  <div>
                    <p className="text-white font-semibold text-sm">Insurance included</p>
                    <p className="text-white/30 text-xs">Compulsory for all business deliveries · Covers declared goods value</p>
                  </div>
                </label>

                {/* Price estimate */}
                {estimate && (
                  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                    className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-6 py-5 flex items-center justify-between">
                    <div>
                      <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-0.5">Estimated price</p>
                      <p className="text-white/30 text-xs">{estimate.miles} miles · fixed rate</p>
                    </div>
                    <p className="text-emerald-400 font-black text-3xl">£{estimate.price}</p>
                  </motion.div>
                )}

                {formError && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-300 text-sm">{formError}</div>
                )}

                <button onClick={submitJob} disabled={formLoading}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black text-base hover:scale-[1.02] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {formLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                  {formLoading ? 'Submitting…' : 'Submit delivery request'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════
            SUCCESS
        ══════════════════════════════════════════ */}
        {stage === 'success' && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            className="min-h-screen flex items-center justify-center px-6">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-emerald-400" />
              </div>
              <h2 className="text-4xl font-black mb-3">Request submitted</h2>
              <p className="text-white/40 mb-8 leading-relaxed">
                Your delivery request has been received. Our team will match a carrier and be in touch shortly with confirmation and payment details.
              </p>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-8 py-5 inline-block mb-6">
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Job reference</p>
                <p className="text-emerald-400 font-mono font-black text-2xl tracking-widest">{jobRef}</p>
              </div>
              <p className="text-white/25 text-sm mb-8">Confirmation sent to <span className="text-white/40">{bizEmail}</span></p>
              <button
                onClick={() => { setStage('form'); setFormError(null); setForm({ pickup:'', dropoff:'', description:'', weight:'', value:'', category:'', urgency:'same_day', insurance:true }); setEstimate(null); }}
                className="text-emerald-400 hover:text-emerald-300 text-sm font-bold transition-colors">
                Submit another request →
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
