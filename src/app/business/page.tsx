'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Loader2, Mail, ShieldCheck, CheckCircle, ArrowRight,
  Zap, Lock, Clock, Star, Building2, Truck,
  MessageCircle,
} from 'lucide-react';
import { BusinessNav } from '@/components/business/BusinessNav';

type Stage = 'loading' | 'landing' | 'email' | 'otp';

const FADE = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -16 } };
const BG   = 'linear-gradient(135deg, #020617 0%, #0c1e3d 50%, #020617 100%)';

const BIZ_VIDEOS = [
  '/videos/onecall/test2/compressed/Planeeoff1.mp4',
  '/videos/onecall/test2/compressed/Planeoff2.mp4',
];


export default function BoothopBusiness() {
  const router = useRouter();

  const [stage,       setStage]       = useState<Stage>('loading');
  const [loginIntent, setLoginIntent] = useState<'priority' | 'oneoff' | null>(null);
  const [emailInput,  setEmailInput]  = useState('');
  const [otpInput,    setOtpInput]    = useState('');
  const [authError,   setAuthError]   = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [bizVid,      setBizVid]      = useState(0);

  // Apple-style slow video crossfade — 7s interval
  useEffect(() => {
    const id = setInterval(() => setBizVid(v => (v + 1) % BIZ_VIDEOS.length), 7000);
    return () => clearInterval(id);
  }, []);

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
    <div className="min-h-screen text-white relative" style={{ background: BG }}>
      <AnimatePresence mode="wait">

        {/* ══════════════════════════════════════════
            LANDING
        ══════════════════════════════════════════ */}
        {stage === 'landing' && (
          <motion.div key="landing" {...FADE} transition={{ duration: 0.4 }}>

            {/* ── FULL-SCREEN VIDEO HERO ───────────────────────────── */}
            <div className="relative h-screen w-full overflow-hidden" style={{ background: BG }}>

              {/* Background video */}
              <video
                autoPlay muted loop playsInline preload="auto"
                className="absolute inset-0 w-full h-full object-cover brightness-[0.65]"
                src="/videos/onecall/test2/compressed/Planeeoff1.mp4"
              />

              {/* Layer 1 — solid dark base (matches HeroV2 bg-black/60) */}
              <div className="absolute inset-0 bg-black/60" />

              {/* Layer 2 — directional gradient: readable centre, pitch black at edges */}
              <div className="absolute inset-0" style={{
                background: `
                  linear-gradient(to bottom,
                    rgba(2,6,35,0.75) 0%,
                    rgba(2,6,35,0.20) 28%,
                    rgba(2,6,35,0.20) 58%,
                    rgba(2,6,35,0.90) 88%,
                    #020617 100%
                  )`
              }} />

              {/* Nav — float over video */}
              <div className="absolute top-0 left-0 right-0 z-20">
                <BusinessNav
                  transparent
                  rightSlot={
                    <>
                      <a href="/" className="text-sm font-semibold text-white/35 hover:text-white/70 transition-colors hidden sm:flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                        BootHop
                      </a>
                      <span className="text-white/15 hidden sm:block">|</span>
                      <a href="/business/how-it-works" className="text-sm font-semibold text-white/50 hover:text-white transition-colors hidden sm:block">How It Works</a>
                      <button onClick={() => { setLoginIntent('priority'); setStage('email'); }} className="text-sm font-semibold text-amber-400/70 hover:text-amber-400 transition-colors hidden sm:block">Priority Partner</button>
                      <a href="/business/contact" className="text-sm font-semibold text-white/50 hover:text-white transition-colors hidden sm:block">Contact</a>
                      <button onClick={() => { setLoginIntent('oneoff'); setStage('email'); }}
                        className="inline-flex items-center gap-2 bg-emerald-400 hover:bg-emerald-300 text-black font-black text-sm px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-400/40 hover:scale-105 active:scale-95">
                        Book a Delivery
                      </button>
                    </>
                  }
                />
              </div>

              {/* Centred hero content */}
              <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6 pb-20">

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-full mb-8 uppercase tracking-widest backdrop-blur-sm">
                  <Zap className="h-3.5 w-3.5" /> Premium business logistics
                </motion.div>

                <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-6 drop-shadow-2xl">
                  Same-day delivery<br /><span className="text-emerald-400">across the UK.</span>
                </motion.h1>

                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                  className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
                  Verified carriers. Time-critical delivery. Built for businesses where delays are not acceptable.
                </motion.p>

                {/* Dual login cards */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                  className="grid sm:grid-cols-2 gap-4 w-full max-w-2xl mb-4">

                  {/* Priority Partner card — glass */}
                  <button onClick={() => { setLoginIntent('priority'); setStage('email'); }}
                    className="group relative overflow-hidden bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-6 text-left transition-all duration-300 hover:border-amber-400/50 hover:bg-white/15 hover:-translate-y-1 hover:shadow-amber-500/20 active:scale-[0.98]">
                    <div className="pointer-events-none absolute -top-6 right-0 w-24 h-24 bg-amber-500/25 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent" />
                    <div className="w-10 h-10 rounded-xl bg-amber-500/25 border border-amber-400/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Star className="h-5 w-5 text-amber-400" />
                    </div>
                    <h3 className="text-white font-black mb-1.5 group-hover:text-amber-300 transition-colors">Priority Partner</h3>
                    <p className="text-white/50 text-xs leading-relaxed mb-4">Existing member? Sign in for your dedicated portal — 2-hour guaranteed response, volume discounts &amp; account manager.</p>
                    <span className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-black">Sign in <ArrowRight className="h-3.5 w-3.5" /></span>
                  </button>

                  {/* Book a Delivery card — glass */}
                  <button onClick={() => { setLoginIntent('oneoff'); setStage('email'); }}
                    className="group relative overflow-hidden bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-6 text-left transition-all duration-300 hover:border-emerald-400/50 hover:bg-white/15 hover:-translate-y-1 hover:shadow-emerald-500/20 active:scale-[0.98]">
                    <div className="pointer-events-none absolute -top-6 right-0 w-24 h-24 bg-emerald-500/25 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent" />
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/25 border border-emerald-400/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Zap className="h-5 w-5 text-emerald-400" />
                    </div>
                    <h3 className="text-white font-black mb-1.5 group-hover:text-emerald-300 transition-colors">Book a Delivery</h3>
                    <p className="text-white/50 text-xs leading-relaxed mb-4">New or one-off customer? Sign in with your business email for an instant quote and same-day booking.</p>
                    <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-black">Get started <ArrowRight className="h-3.5 w-3.5" /></span>
                  </button>

                </motion.div>
                <p className="text-white/25 text-xs">Business email required · Personal accounts not accepted</p>
              </div>

              {/* Scroll cue */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 z-10">
                <p className="text-xs font-semibold uppercase tracking-widest">Scroll</p>
                <div className="w-px h-10 bg-gradient-to-b from-white/30 to-transparent" />
              </motion.div>
            </div>

            {/* ── Premium ambient glow layer — fixed so it never adds scroll height ── */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
              {/* Emerald glow — top left */}
              <div className="absolute top-[5%]  left-[2%]  w-[560px] h-[560px] bg-emerald-500/10 rounded-full blur-[160px]" />
              {/* Blue glow — top right */}
              <div className="absolute top-[12%] right-[3%] w-[440px] h-[440px] bg-blue-600/10  rounded-full blur-[140px]" />
              {/* Violet glow — mid */}
              <div className="absolute top-[38%] left-[40%] w-[380px] h-[380px] bg-violet-500/7  rounded-full blur-[130px]" />
              {/* Teal glow — lower left */}
              <div className="absolute top-[62%] left-[8%]  w-[320px] h-[320px] bg-teal-500/8   rounded-full blur-[120px]" />
              {/* Rose glow — lower right */}
              <div className="absolute top-[75%] right-[8%] w-[300px] h-[300px] bg-rose-500/5    rounded-full blur-[110px]" />
            </div>

            {/* ── BOTTOM SECTION — Crossfading plane videos + premium glass panel ── */}
            <section className="relative z-10 py-28 px-8 overflow-hidden">

              {/* Two plane videos — slow opacity crossfade */}
              <div className="absolute inset-0">
                {BIZ_VIDEOS.map((src, i) => (
                  <video
                    key={src}
                    autoPlay muted loop playsInline
                    preload={i === 0 ? 'auto' : 'none'}
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[3000ms] ease-in-out"
                    style={{ opacity: i === bizVid ? 1 : 0 }}
                  >
                    <source src={src} type="video/mp4" />
                  </video>
                ))}
                {/* Dark scrim — enough to read text without killing the planes */}
                <div className="absolute inset-0 bg-black/55" />
                {/* Fade into adjacent sections */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-transparent to-[#020617]" />
                {/* Edge vignette */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(2,6,23,0.50)_100%)]" />
              </div>

              {/* ── GLASS PANEL — premium frosted card over the video ── */}
              <div className="relative max-w-5xl mx-auto">
                <div className="rounded-3xl border border-white/[0.12] bg-white/[0.05] backdrop-blur-2xl shadow-[0_40px_120px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.1)] overflow-hidden">

                  {/* Top accent line */}
                  <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />

                  <div className="p-10 md:p-14">

                    {/* Label */}
                    <p className="text-xs font-black text-emerald-400 uppercase tracking-[0.2em] mb-6">
                      Why BootHop Business
                    </p>

                    {/* Headline */}
                    <h2 className="text-4xl md:text-5xl font-black text-white leading-[1.08] mb-6">
                      We don&apos;t deliver parcels.<br />
                      <span className="text-emerald-400">We eliminate downtime.</span>
                    </h2>

                    {/* Sub-copy */}
                    <p className="text-white/65 text-lg max-w-2xl leading-relaxed mb-12">
                      Downtime costs £10,000+ per hour. Delays cost more.
                      BootHop moves critical items the moment they matter —
                      verified carriers, fully insured, same-day.
                    </p>

                    {/* Use cases — frosted inner grid */}
                    <div className="grid md:grid-cols-3 gap-px bg-white/[0.07] rounded-2xl overflow-hidden mb-12">
                      {[
                        { icon: '⚙️', title: 'Engineering &\nManufacturing', body: 'Spare parts, production line recovery, maintenance components.' },
                        { icon: '✈️', title: 'Aerospace & AOG',              body: 'Aircraft-on-ground parts and time-critical tools under 20 kg.' },
                        { icon: '🌍', title: 'International\n& Customs',     body: 'Hand-carry across borders with full customs coordination.' },
                      ].map(({ icon, title, body }) => (
                        <div key={title} className="bg-white/[0.04] hover:bg-white/[0.08] transition-colors duration-300 p-7">
                          <div className="text-2xl mb-3">{icon}</div>
                          <h3 className="text-white font-black mb-2 whitespace-pre-line leading-tight">{title}</h3>
                          <p className="text-white/50 text-sm leading-relaxed">{body}</p>
                        </div>
                      ))}
                    </div>

                    {/* Metrics strip */}
                    <div className="flex flex-wrap items-center justify-between gap-5 border-t border-white/10 pt-8 text-sm">
                      <span className="text-white/60"><strong className="text-white font-black">£200+</strong> local from</span>
                      <span className="text-white/60"><strong className="text-white font-black">Same-day</strong> delivery</span>
                      <span className="text-white/60"><strong className="text-white font-black">Fully</strong> insured</span>
                      <span className="text-white/60"><strong className="text-white font-black">Business-only</strong> verified</span>
                      <a href="/business/pricing"
                        className="inline-flex items-center gap-1.5 text-emerald-400 font-black hover:text-emerald-300 transition-colors group">
                        View pricing <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </a>
                    </div>

                  </div>

                  {/* Bottom accent line */}
                  <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
              </div>
            </section>

            {/* Footer links */}
            <div className="relative z-10 max-w-5xl mx-auto px-8 pb-16 flex flex-wrap items-center justify-center gap-6 text-sm text-white/25">
              <a href="/business/how-it-works" className="hover:text-white/60 transition-colors">How It Works</a>
              <a href="/business/pricing" className="hover:text-emerald-400 transition-colors text-emerald-400/40">Pricing</a>
              <a href="/business/priority-partner" className="hover:text-amber-400 transition-colors text-amber-400/40">Priority Partner</a>
              <a href="/business/contact" className="hover:text-white/60 transition-colors">Contact Us</a>
              <a href="/" className="hover:text-white/70 transition-colors text-white/40">← Back to BootHop</a>
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
              <div className={`group relative overflow-hidden bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-8 space-y-4 transition-all duration-300 ${loginIntent === 'priority' ? 'hover:border-amber-400/40 hover:shadow-amber-500/15' : 'hover:border-emerald-400/40 hover:shadow-emerald-500/15'}`}>
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent" />
                <div className={`pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${loginIntent === 'priority' ? 'bg-amber-500/15' : 'bg-emerald-500/15'}`} />
                {authError && <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-300 text-sm">{authError}</div>}
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <input type="email" value={emailInput} onChange={e => setEmailInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendOtp()}
                    placeholder="you@yourcompany.com" autoFocus
                    className={`w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/20 border border-white/20 text-white placeholder-white/30 focus:outline-none text-sm ${loginIntent === 'priority' ? 'focus:ring-2 focus:ring-amber-400' : 'focus:ring-2 focus:ring-emerald-400'}`} />
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
              <div className={`group relative overflow-hidden bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-8 space-y-4 transition-all duration-300 ${loginIntent === 'priority' ? 'hover:border-amber-400/40 hover:shadow-amber-500/15' : 'hover:border-emerald-400/40 hover:shadow-emerald-500/15'}`}>
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent" />
                <div className={`pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${loginIntent === 'priority' ? 'bg-amber-500/15' : 'bg-emerald-500/15'}`} />
                {authError && <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-300 text-sm">{authError}</div>}
                <input type="text" inputMode="numeric"
                  value={otpInput} onChange={e => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={e => e.key === 'Enter' && verifyOtp()}
                  placeholder="000000" autoFocus
                  className={`w-full text-center text-4xl font-mono tracking-[0.6em] py-4 rounded-xl bg-white/20 border border-white/20 text-white placeholder-white/20 focus:outline-none ${loginIntent === 'priority' ? 'focus:ring-2 focus:ring-amber-400' : 'focus:ring-2 focus:ring-emerald-400'}`} />
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
