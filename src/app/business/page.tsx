'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Loader2, Mail, ShieldCheck, CheckCircle, ArrowRight,
  Zap, Lock, Clock, Star, Building2, Truck,
  ChevronLeft, MessageCircle,
} from 'lucide-react';

type Stage = 'loading' | 'landing' | 'email' | 'otp';

const FADE = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -16 } };
const BG   = 'linear-gradient(135deg, #020617 0%, #0c1e3d 50%, #020617 100%)';

export default function BoothopBusiness() {
  const router = useRouter();

  const [stage,       setStage]       = useState<Stage>('loading');
  const [loginIntent, setLoginIntent] = useState<'priority' | 'oneoff' | null>(null);
  const [emailInput,  setEmailInput]  = useState('');
  const [otpInput,    setOtpInput]    = useState('');
  const [authError,   setAuthError]   = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // ── Pre-fill email from last login ────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('boothop_biz_email');
    if (saved) setEmailInput(saved);
  }, []);

  // ── Session check ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/business/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.authenticated) {
          router.replace(d.partner_status === 'active' ? '/business/portal/priority' : '/business/portal');
        } else {
          setStage('landing');
        }
      })
      .catch(() => setStage('landing'));
  }, [router]);

  // ── Auth ───────────────────────────────────────────────────────────────────
  const sendOtp = async () => {
    setAuthError(null); setAuthLoading(true);
    try {
      const res = await fetch('/api/business/auth/send-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.trim() }),
      });
      const j = await res.json();
      if (!res.ok) { setAuthError(j.error); return; }
      localStorage.setItem('boothop_biz_email', emailInput.trim());
      // Trusted returning user — server re-issued session, skip OTP
      if (j.skipOtp) {
        const me = await fetch('/api/business/auth/me').then(r => r.json());
        router.push(me.partner_status === 'active' ? '/business/portal/priority' : loginIntent === 'priority' ? '/business/priority-partner' : '/business/portal');
        return;
      }
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
      // Check partner status to route to the right portal
      const me = await fetch('/api/business/auth/me').then(r => r.json());
      if (me.partner_status === 'active') {
        router.push('/business/portal/priority');
      } else if (loginIntent === 'priority') {
        router.push('/business/priority-partner'); // not yet a partner — take them to apply & pay
      } else {
        router.push('/business/portal');
      }
    } catch { setAuthError('Verification failed. Please try again.'); }
    finally { setAuthLoading(false); }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (stage === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white relative" style={{ background: BG, backgroundAttachment: 'fixed' }}>
      <AnimatePresence mode="wait">

        {/* ══════════════════════════════════════════
            LANDING
        ══════════════════════════════════════════ */}
        {stage === 'landing' && (
          <motion.div key="landing" {...FADE} transition={{ duration: 0.4 }}>

            {/* Nav */}
            <nav className="px-6 py-5 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-4">
                <a href="/" className="text-white/30 hover:text-white/70 text-xs font-semibold transition-colors hidden sm:block">← BootHop</a>
                <div className="text-xl font-black tracking-tight">
                  Boot<span className="text-emerald-400">Hop</span>
                  <span className="ml-2 text-xs font-semibold bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full uppercase tracking-widest">Business</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a href="/business/how-it-works"
                  className="text-sm font-semibold text-white/40 hover:text-white transition-colors hidden sm:block">
                  How It Works
                </a>
                <button onClick={() => { setLoginIntent('priority'); setStage('email'); }}
                  className="text-sm font-semibold text-amber-400/60 hover:text-amber-400 transition-colors hidden sm:block">
                  Priority Partner
                </button>
                <a href="/business/contact"
                  className="text-sm font-semibold text-white/40 hover:text-white transition-colors hidden sm:block">
                  Contact
                </a>
                <button onClick={() => { setLoginIntent('oneoff'); setStage('email'); }}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black text-sm px-5 py-2.5 rounded-xl hover:scale-105 transition-all shadow-lg shadow-emerald-500/20">
                  Book a Delivery
                </button>
              </div>
            </nav>

            {/* Hero */}
            <div className="max-w-5xl mx-auto px-8 pt-24 pb-16 text-center">
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-full mb-8 uppercase tracking-widest">
                <Zap className="h-3.5 w-3.5" /> Premium business logistics
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-6">
                Same-day delivery<br /><span className="text-emerald-400">across the UK.</span>
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="text-white/50 text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
                BootHop Business connects your company to a network of verified carriers.
                Fast, insured, and built for time-critical deliveries.
              </motion.p>

              {/* Dual login cards */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-6">

                <button onClick={() => { setLoginIntent('priority'); setStage('email'); }}
                  className="group relative overflow-hidden bg-amber-500/5 border border-amber-500/25 rounded-2xl p-6 text-left transition-all duration-300 hover:border-amber-500/50 hover:bg-amber-500/8 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/15 active:scale-[0.98]">
                  <div className="pointer-events-none absolute -top-6 right-0 w-24 h-24 bg-amber-500/15 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Star className="h-5 w-5 text-amber-400" />
                  </div>
                  <h3 className="text-white font-black mb-1.5 group-hover:text-amber-300 transition-colors duration-300">Priority Partner</h3>
                  <p className="text-white/40 text-xs leading-relaxed mb-4">Existing member? Sign in for your dedicated portal — 2-hour guaranteed response, volume discounts &amp; account manager.</p>
                  <span className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-black">
                    Sign in <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </button>

                <button onClick={() => { setLoginIntent('oneoff'); setStage('email'); }}
                  className="group relative overflow-hidden bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 text-left transition-all duration-300 hover:border-emerald-500/40 hover:bg-emerald-500/8 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/15 active:scale-[0.98]">
                  <div className="pointer-events-none absolute -top-6 right-0 w-24 h-24 bg-emerald-500/15 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Zap className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h3 className="text-white font-black mb-1.5 group-hover:text-emerald-300 transition-colors duration-300">Book a Delivery</h3>
                  <p className="text-white/40 text-xs leading-relaxed mb-4">New or one-off customer? Sign in with your business email for an instant quote and same-day booking.</p>
                  <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-black">
                    Get started <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </button>

              </motion.div>
              <p className="text-white/20 text-xs">Business email required · Personal accounts not accepted</p>
            </div>

            {/* Stats */}
            <div className="max-w-5xl mx-auto px-8 pb-16">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: '£200+',    label: 'Local from',  sub: 'UK-to-UK distance pricing' },
                  { value: '100%',     label: 'Insured',     sub: 'Every single delivery' },
                  { value: 'Same day', label: 'Delivery',    sub: 'For urgent business needs' },
                ].map(s => (
                  <div key={s.label} className="group relative overflow-hidden bg-white/3 border border-white/8 rounded-2xl p-6 text-center transition-all duration-300 hover:border-emerald-500/30 hover:bg-white/5 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 active:scale-[0.98]">
                    <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 w-20 h-20 bg-emerald-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <p className="text-3xl font-black text-emerald-400 mb-1">{s.value}</p>
                    <p className="text-white font-semibold text-sm group-hover:text-emerald-300 transition-colors duration-300">{s.label}</p>
                    <p className="text-white/30 text-xs mt-0.5">{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Use-case photos */}
            <div className="max-w-5xl mx-auto px-8 pb-16">
              <p className="text-xs font-black text-white/25 uppercase tracking-widest mb-6 text-center">Who uses BootHop Business</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    img: '/images/businessImage/biz-hero.jpg',
                    tag: 'Engineering & Manufacturing',
                    body: 'Urgent spare parts, production line recovery, maintenance components.',
                  },
                  {
                    img: '/images/businessImage/biz-team.jpg',
                    tag: 'Aerospace & AOG',
                    body: 'Aircraft-on-ground parts and time-critical engineering tools under 20 kg.',
                  },
                  {
                    img: '/images/businessImage/biz-handshake.jpg',
                    tag: 'International & Customs',
                    body: 'Hand-carry across borders with full customs declaration support.',
                  },
                ].map(({ img, tag, body }) => (
                  <div key={tag} className="relative overflow-hidden rounded-2xl border border-white/8 group cursor-pointer" onClick={() => { setLoginIntent('oneoff'); setStage('email'); }}>
                    <div className="relative h-44 w-full">
                      <Image src={img} alt={tag} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-1">{tag}</p>
                      <p className="text-white/60 text-xs leading-relaxed">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* "Why not cheap?" callout — video background */}
            <div className="max-w-5xl mx-auto px-8 pb-16">
              <div className="relative overflow-hidden rounded-2xl border border-white/8">
                {/* Branded reel: train + plane + bus */}
                <video
                  autoPlay muted loop playsInline
                  className="w-full h-48 sm:h-64 object-cover"
                  src="/business/biz-reel.mp4"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
                <div className="absolute inset-0 flex items-center px-8 sm:px-12">
                  <div className="max-w-lg">
                    <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-3">Why aren&apos;t we cheap?</p>
                    <p className="text-white font-black text-xl sm:text-2xl leading-tight mb-3">
                      We&apos;re not a courier.<br />We&apos;re a downtime solution.
                    </p>
                    <p className="text-white/50 text-sm leading-relaxed">
                      Factory downtime costs £10,000/hr. An aircraft delay can cost £100,000+.
                      A BootHop delivery costs £500–£1,500. The value is clear.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="max-w-5xl mx-auto px-8 pb-20">
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { icon: ShieldCheck, title: 'Fully insured',         body: 'Every delivery is insured to the declared value of goods.' },
                  { icon: Clock,       title: 'Same-day available',     body: 'Submit before midday for same-day delivery on most routes.' },
                  { icon: Lock,        title: 'Business-only access',   body: 'Verified business accounts only. No personal users on the platform.' },
                  { icon: Star,        title: 'Rated carriers',         body: 'All our carriers are verified, rated, and background-checked.' },
                  { icon: Truck,       title: 'UK-wide + International', body: 'Local UK deliveries and international airport-to-airport routes.' },
                  { icon: Building2,   title: 'Priority Partnership',    body: 'Upgrade to Priority Partner for dedicated support and volume discounts.' },
                ].map(({ icon: Icon, title, body }) => (
                  <div key={title} className="group relative overflow-hidden flex items-start gap-4 bg-white/3 border border-white/8 rounded-2xl p-5 transition-all duration-300 hover:border-emerald-500/30 hover:bg-white/5 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 active:scale-[0.98]">
                    <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 w-20 h-20 bg-emerald-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white font-bold mb-1 group-hover:text-emerald-300 transition-colors duration-300">{title}</p>
                      <p className="text-white/40 text-sm leading-relaxed">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Partner teaser */}
            <div className="max-w-5xl mx-auto px-8 pb-20">
              <div className="group relative overflow-hidden bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/20 rounded-3xl p-10 transition-all duration-300 hover:border-amber-500/35 hover:shadow-2xl hover:shadow-amber-500/10 active:scale-[0.99]">
                <div className="pointer-events-none absolute -top-10 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Star className="h-6 w-6 text-amber-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-black group-hover:text-amber-300 transition-colors duration-300">Priority Partner</h2>
                          <span className="text-xs font-bold bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full uppercase tracking-widest">Exclusive</span>
                        </div>
                        <p className="text-white/40 text-sm mt-0.5">For businesses that deliver regularly</p>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[
                        { icon: Clock,       label: '2-hour response',        sub: 'Guaranteed, every time' },
                        { icon: CheckCircle, label: 'Dedicated account team', sub: 'Named contact at BootHop' },
                        { icon: Zap,         label: 'Priority carrier match', sub: 'Front of the queue' },
                        { icon: ShieldCheck, label: 'Volume discounts',        sub: 'Auto-applied at invoice' },
                      ].map(({ icon: Icon, label, sub }) => (
                        <div key={label} className="flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0 mt-0.5">
                            <Icon className="h-3.5 w-3.5 text-amber-400" />
                          </div>
                          <div>
                            <p className="text-white font-bold text-sm">{label}</p>
                            <p className="text-white/35 text-xs">{sub}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 shrink-0">
                    <button onClick={() => { setLoginIntent('priority'); setStage('email'); }}
                      className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-orange-400 text-black font-black px-8 py-4 rounded-2xl hover:scale-105 active:scale-[0.98] transition-all shadow-2xl shadow-amber-500/25 text-sm whitespace-nowrap">
                      <Star className="h-4 w-4" /> Apply &amp; Pay — sign in first
                    </button>
                    <p className="text-white/20 text-xs text-center">UK £10,000 · International £15,000 · Annual retainer</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer links */}
            <div className="max-w-5xl mx-auto px-8 pb-16 flex flex-wrap items-center justify-center gap-6 text-sm text-white/25">
              <a href="/business/how-it-works" className="hover:text-white/60 transition-colors">How It Works</a>
              <a href="/business/priority-partner" className="hover:text-amber-400 transition-colors text-amber-400/40">Priority Partner</a>
              <a href="/business/contact" className="hover:text-white/60 transition-colors">Contact Us</a>
              <a href="/" className="hover:text-white/60 transition-colors">← BootHop</a>
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
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 ${loginIntent === 'priority' ? 'bg-amber-500/20' : 'bg-emerald-500/20'}`}>
                  {loginIntent === 'priority' ? <Star className="h-7 w-7 text-amber-400" /> : <Zap className="h-7 w-7 text-emerald-400" />}
                </div>
                <p className="text-xl font-black mb-1">Boot<span className="text-emerald-400">Hop</span> <span className="text-white/40 font-normal">Business</span></p>
                <h2 className="text-3xl font-black mt-4 mb-2">
                  {loginIntent === 'priority' ? 'Priority Partner sign-in' : 'Book a delivery'}
                </h2>
                <p className="text-white/40 text-sm">
                  {loginIntent === 'priority'
                    ? 'Enter your registered Priority Partner email'
                    : 'Enter your business email — personal addresses not accepted'}
                </p>
              </div>
              <div className={`group relative overflow-hidden bg-white/5 border rounded-2xl p-8 space-y-4 transition-all duration-300 hover:shadow-lg ${loginIntent === 'priority' ? 'border-amber-500/15 hover:border-amber-500/30 hover:shadow-amber-500/8' : 'border-white/10 hover:border-emerald-500/20 hover:shadow-emerald-500/8'}`}>
                <div className={`pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${loginIntent === 'priority' ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`} />
                {authError && <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-300 text-sm">{authError}</div>}
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <input type="email" value={emailInput} onChange={e => setEmailInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendOtp()}
                    placeholder="you@yourcompany.com" autoFocus
                    className={`w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none text-sm ${loginIntent === 'priority' ? 'focus:ring-2 focus:ring-amber-500' : 'focus:ring-2 focus:ring-emerald-500'}`} />
                </div>
                <button onClick={sendOtp} disabled={authLoading || !emailInput.trim()}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black disabled:opacity-40 hover:scale-[1.02] transition-all ${loginIntent === 'priority' ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-black' : 'bg-gradient-to-r from-emerald-400 to-teal-400 text-black'}`}>
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
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${loginIntent === 'priority' ? 'bg-amber-500/20' : 'bg-emerald-500/20'}`}>
                  <Mail className={`h-8 w-8 ${loginIntent === 'priority' ? 'text-amber-400' : 'text-emerald-400'}`} />
                </div>
                <h2 className="text-3xl font-black mb-2">Check your inbox</h2>
                <p className="text-white/40 text-sm">We sent a 6-digit code to</p>
                <p className={`font-semibold text-sm mt-0.5 ${loginIntent === 'priority' ? 'text-amber-400' : 'text-emerald-400'}`}>{emailInput}</p>
              </div>
              <div className={`group relative overflow-hidden bg-white/5 border rounded-2xl p-8 space-y-4 transition-all duration-300 hover:shadow-lg ${loginIntent === 'priority' ? 'border-amber-500/15 hover:border-amber-500/30 hover:shadow-amber-500/8' : 'border-white/10 hover:border-emerald-500/20 hover:shadow-emerald-500/8'}`}>
                <div className={`pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${loginIntent === 'priority' ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`} />
                {authError && <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-300 text-sm">{authError}</div>}
                <input type="text" inputMode="numeric"
                  value={otpInput} onChange={e => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={e => e.key === 'Enter' && verifyOtp()}
                  placeholder="000000" autoFocus
                  className={`w-full text-center text-4xl font-mono tracking-[0.6em] py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/10 focus:outline-none ${loginIntent === 'priority' ? 'focus:ring-2 focus:ring-amber-500' : 'focus:ring-2 focus:ring-emerald-500'}`} />
                <button onClick={verifyOtp} disabled={authLoading || otpInput.length < 6}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black disabled:opacity-40 hover:scale-[1.02] transition-all ${loginIntent === 'priority' ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-black' : 'bg-gradient-to-r from-emerald-400 to-teal-400 text-black'}`}>
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

      </AnimatePresence>

      {/* WhatsApp FAB */}
      <a href="/api/whatsapp"
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-2xl shadow-[#25D366]/40 hover:scale-110 active:scale-95 transition-all"
        aria-label="Chat on WhatsApp">
        <MessageCircle className="h-7 w-7" />
      </a>
    </div>
  );
}
