'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  CheckCircle, ArrowRight, MessageCircle,
  Truck, Users, Building2, ChevronDown,
  ClipboardList, Route, PackageCheck,
} from 'lucide-react';
import { BusinessNav } from '@/components/business/BusinessNav';
import BusinessFooter from '@/components/business/BusinessFooter';

type Stage = 'loading' | 'landing';

const BG = 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)';

const BIZ_HERO_IMAGES = [
  '/images/business/hero-aircraft-grounded.jpg',
  '/images/business/hero-production-stops.jpg',
];

// Used by the separate "Why BootHop Business" crossfading video banner further down the page
const BIZ_VIDEOS = [
  '/videos/onecall/test2/compressed/Planeeoff1.mp4',
  '/videos/onecall/test2/compressed/Planeoff2.mp4',
];

export default function BoothopBusiness() {
  const router = useRouter();

  const [stage,     setStage]     = useState<Stage>('loading');
  const [heroImg,   setHeroImg]   = useState(0);
  const [bizVid,    setBizVid]    = useState(0);
  const [tickerIdx, setTickerIdx] = useState(0);

  const DELIVERIES = [
    { icon: '🚀', route: 'Manchester → London',  time: '3.2 hours' },
    { icon: '✈️', route: 'Bristol → Edinburgh',  time: '4.5 hours' },
    { icon: '⚙️', route: 'Birmingham → Leeds',   time: '2.8 hours' },
    { icon: '🏥', route: 'Glasgow → Newcastle',  time: '3.1 hours' },
  ];

  useEffect(() => {
    const id = setInterval(() => setHeroImg(v => (v + 1) % BIZ_HERO_IMAGES.length), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setBizVid(v => (v + 1) % BIZ_VIDEOS.length), 7000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTickerIdx(v => (v + 1) % 4), 4000);
    return () => clearInterval(id);
  }, []);

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

  if (stage === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="h-8 w-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-900 relative" style={{ background: BG }}>

      <motion.div key="landing" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

        {/* ── NAV ───────────────────────────────────────────────── */}
        <BusinessNav showDefaultNav />

        {/* ── HERO — video framed in a card instead of a full-bleed dark overlay ── */}
        <div className="relative w-full overflow-hidden bg-gradient-to-b from-white to-slate-50 pt-28 pb-20 px-6">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">

            <div className="text-center md:text-left">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold px-4 py-2 rounded-full mb-8 uppercase tracking-widest">
                Business Logistics · UK &amp; International
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.05] mb-8 text-slate-900">
                Keep production running.
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="text-slate-700 text-lg md:text-xl mx-auto md:mx-0 mb-4 leading-relaxed max-w-xl">
                Keep aircraft flying. Keep deals closing. Keep lines moving.
              </motion.p>
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="text-slate-600 text-base md:text-lg mx-auto md:mx-0 mb-10 leading-relaxed max-w-xl">
                When downtime costs thousands per hour, BootHop moves what matters — verified carriers, fully insured, same-day.
              </motion.p>

              {/* Primary CTA — the one place green appears, carrying the main action */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 mb-8">
                <a href="/business/get-started"
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(5,150,105,0.35)] shadow-lg shadow-emerald-600/20 w-full sm:w-auto">
                  Get started <ArrowRight className="h-4 w-4" />
                </a>
                <a href="/business/how-it-works"
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full border-2 border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-900 font-bold text-base transition-all hover:-translate-y-0.5 w-full sm:w-auto">
                  See how it works
                </a>
              </motion.div>

              {/* Stat chips */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                {[
                  { icon: '⚡', label: 'Same-day UK' },
                  { icon: '🛡️', label: 'Insured as standard' },
                  { icon: '✅', label: 'ID-verified carriers' },
                  { icon: '🌍', label: 'International' },
                ].map(({ icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded-full px-4 py-2">
                    {icon} {label}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* Hero photo — framed card, crossfades between two shots every 30s */}
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
              className="rounded-3xl border border-slate-200 bg-white p-3 shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
              <div className="relative overflow-hidden rounded-2xl" style={{ aspectRatio: '4/5' }}>
                {BIZ_HERO_IMAGES.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={src}
                    src={src}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[1200ms] ease-in-out"
                    style={{ opacity: heroImg === i ? 1 : 0 }}
                  />
                ))}
              </div>
            </motion.div>
          </div>

          {/* Scroll cue */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
            className="flex flex-col items-center gap-2 text-slate-600 mt-14">
            <p className="text-xs font-semibold uppercase tracking-widest">Explore your options</p>
            <ChevronDown className="h-5 w-5 animate-bounce" />
          </motion.div>
        </div>

        {/* ── THREE PATHS ───────────────────────────────────────── */}
        <section className="relative z-10 py-24 px-6" style={{ background: BG }}>
          <div className="max-w-6xl mx-auto">

            <div className="text-center mb-16">
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
                className="text-xs font-black text-emerald-600 uppercase tracking-[0.25em] mb-4">
                Three paths. One network.
              </motion.p>
              <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="text-3xl md:text-5xl font-black text-slate-900 mb-4">
                Choose how you work<br />with BootHop
              </motion.h2>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
                className="text-slate-600 text-base max-w-xl mx-auto">
                Whether you&apos;re shipping, carrying, or managing critical logistics at scale — there&apos;s a route built for you.
              </motion.p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 items-stretch">

              {/* ── CARD 1: Express ──────────────────────────────── */}
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="group relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-slate-50 backdrop-blur-sm p-8 flex flex-col transition-all duration-300 hover:border-emerald-500/50 hover:bg-slate-50 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/10">
                <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mb-5">
                    <Truck className="h-6 w-6 text-emerald-600" />
                  </div>
                  <span className="text-[10px] font-black text-emerald-600/70 uppercase tracking-widest">One-off &amp; Urgent</span>
                  <h3 className="text-2xl font-black text-slate-900 mt-1 mb-3">BootHop Express</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    For businesses that need something moved now. No contracts. No minimum commitment. Just fast, reliable same-day delivery.
                  </p>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {[
                    'Instant quote in under 30 seconds',
                    'Same-day UK, airport-to-airport options',
                    'Fully insured up to £10,000',
                    'Pay per delivery — no account required',
                  ].map(b => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      {b}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  <p className="text-emerald-600/70 text-xs font-bold mb-4">From £300 UK · From £1,000 International</p>
                  <a
                    href="/business/express"
                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black text-sm px-5 py-3.5 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/20">
                    Get Instant Quote <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </motion.div>

              {/* ── CARD 2: Carrier Network ───────────────────────── */}
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="group relative overflow-hidden rounded-3xl border-2 border-blue-400/40 bg-blue-500/6 backdrop-blur-sm p-8 flex flex-col transition-all duration-300 hover:border-blue-400/70 hover:bg-blue-500/10 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/20 md:scale-[1.03]">
                <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-56 h-56 bg-blue-500/15 rounded-full blur-3xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="absolute top-6 right-6">
                  <span className="text-[10px] font-black bg-blue-400/20 border border-blue-400/30 text-blue-700 px-3 py-1 rounded-full uppercase tracking-widest">
                    Join the Network
                  </span>
                </div>

                <div className="mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center mb-5">
                    <Users className="h-6 w-6 text-blue-700" />
                  </div>
                  <span className="text-[10px] font-black text-blue-600/70 uppercase tracking-widest">Couriers &amp; Operators</span>
                  <h3 className="text-2xl font-black text-slate-900 mt-1 mb-3">Carrier Network</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    For courier companies, transport operators and logistics providers. Receive urgent delivery requests from businesses across the UK. You choose which jobs to accept.
                  </p>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {[
                    'Receive job alerts in your service area',
                    'Airport, AOG and same-day opportunities',
                    'No lead generation required',
                    'ADR, aviation and specialist roles available',
                    'Build your verified delivery profile',
                  ].map(b => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <CheckCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      {b}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  <p className="text-blue-700/60 text-xs font-semibold mb-4">Free to register · Earn per job accepted</p>
                  <a href="/business/carrier-network"
                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-slate-900 font-black text-sm px-5 py-3.5 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-blue-500/25">
                    Join the Network <ArrowRight className="h-4 w-4" />
                  </a>
                  <p className="text-slate-500 text-xs text-center mt-3">
                    Capability profile required · Certifications verified
                  </p>
                </div>
              </motion.div>

              {/* ── CARD 3: Priority Client ───────────────────────── */}
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="group relative overflow-hidden rounded-3xl border border-amber-500/20 bg-slate-50 backdrop-blur-sm p-8 flex flex-col transition-all duration-300 hover:border-amber-500/50 hover:bg-amber-500/5 hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/10">
                <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center mb-5">
                    <Building2 className="h-6 w-6 text-amber-600" />
                  </div>
                  <span className="text-[10px] font-black text-amber-600/70 uppercase tracking-widest">Enterprise &amp; Critical</span>
                  <h3 className="text-2xl font-black text-slate-900 mt-1 mb-3">Priority Client</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    For organisations where delivery failure is not an option. Dedicated account management, priority carrier assignment, and enterprise-grade service.
                  </p>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {[
                    'Dedicated account manager',
                    '2-hour guaranteed response',
                    'Engineering, aerospace, healthcare & legal',
                    'UK and international coverage',
                    'API & Slack integration available',
                  ].map(b => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <CheckCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      {b}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  <p className="text-amber-600/60 text-xs font-semibold mb-2">Apply takes 2 minutes.</p>
                  <p className="text-amber-600/70 text-xs font-bold mb-4">From £10,000/year · UK &amp; International</p>
                  <a href="/business/priority-partner"
                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-orange-400 text-black font-black text-sm px-5 py-3.5 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-amber-500/20">
                    Apply for Access <ArrowRight className="h-4 w-4" />
                  </a>
                  <p className="text-slate-500 text-xs text-center mt-3">
                    Your account manager calls within 2 hours
                  </p>
                </div>
              </motion.div>

            </div>

          </div>
        </section>

        {/* ── INDUSTRY STRIP ────────────────────────────────────── */}
        <div className="relative z-10 border-y border-slate-100 bg-slate-50 py-10 px-6">
          <div className="max-w-5xl mx-auto">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] text-center mb-6">Serving critical industries</p>
            <div className="flex flex-wrap justify-center gap-3">
              {['⚙️ Engineering & Manufacturing', '✈️ Aerospace & AOG', '⚖️ Legal & Finance', '🎬 Events & Production', '🏥 Healthcare & Pharma'].map(ind => (
                <span key={ind} className="text-xs text-slate-600 font-semibold bg-slate-50 border border-slate-200 rounded-full px-4 py-2">
                  {ind}
                </span>
              ))}
            </div>

            {/* Live delivery ticker */}
            <div className="mt-8 max-w-md mx-auto flex items-center justify-center gap-4 bg-emerald-500/8 border border-emerald-500/20 rounded-2xl px-6 py-4">
              <span className="text-2xl">{DELIVERIES[tickerIdx].icon}</span>
              <div>
                <p className="text-[10px] text-emerald-600/60 uppercase tracking-widest font-bold">Live delivery</p>
                <p className="text-sm font-bold text-slate-900">{DELIVERIES[tickerIdx].route}</p>
              </div>
              <span className="ml-auto text-sm font-black text-emerald-600 bg-emerald-500/15 border border-emerald-500/20 rounded-xl px-3 py-1.5 shrink-0">
                {DELIVERIES[tickerIdx].time}
              </span>
            </div>
          </div>
        </div>

        {/* ── WHY BOOTHOP — crossfading video framed as a banner above a light card ──── */}
        <section className="relative z-10 py-28 px-8 bg-slate-50">
          <div className="relative max-w-5xl mx-auto">

            <div className="relative mb-10 overflow-hidden rounded-3xl border border-slate-200 shadow-[0_30px_70px_rgba(15,23,42,0.12)]" style={{ aspectRatio: '21/9' }}>
              {BIZ_VIDEOS.map((src, i) => (
                <video key={src} autoPlay muted loop playsInline preload={i === 0 ? 'auto' : 'none'}
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[3000ms] ease-in-out"
                  style={{ opacity: i === bizVid ? 1 : 0 }}>
                  <source src={src} type="video/mp4" />
                </video>
              ))}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] overflow-hidden">
              <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
              <div className="p-10 md:p-14">
                <p className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em] mb-6">Why BootHop Business</p>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-[1.08] mb-6">
                  We don&apos;t deliver parcels.<br />
                  <span className="text-emerald-600">We eliminate downtime.</span>
                </h2>
                <p className="text-slate-600 text-lg max-w-2xl leading-relaxed mb-12">
                  Downtime costs £10,000+ per hour. Delays cost contracts. BootHop moves critical items the moment they matter — verified carriers, fully insured, same-day.
                </p>
                <div className="grid md:grid-cols-3 gap-px bg-slate-200 rounded-2xl overflow-hidden mb-12">
                  {[
                    { icon: '⚙️', title: 'Engineering &\nManufacturing', body: 'Spare parts, production line recovery, maintenance components.' },
                    { icon: '✈️', title: 'Aerospace & AOG',              body: 'Aircraft-on-ground parts and time-critical tools under 20 kg.' },
                    { icon: '🌍', title: 'International\n& Customs',     body: 'Hand-carry across borders with full customs coordination.' },
                  ].map(({ icon, title, body }) => (
                    <div key={title} className="bg-white hover:bg-slate-50 transition-colors duration-300 p-7">
                      <div className="text-2xl mb-3">{icon}</div>
                      <h3 className="text-slate-900 font-black mb-2 whitespace-pre-line leading-tight">{title}</h3>
                      <p className="text-slate-600 text-sm leading-relaxed">{body}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-5 border-t border-slate-200 pt-8 text-sm">
                  <span className="text-slate-600"><strong className="text-slate-900 font-black">Instant</strong> quotes</span>
                  <span className="text-slate-600"><strong className="text-slate-900 font-black">Same-day</strong> UK-wide</span>
                  <span className="text-slate-600"><strong className="text-slate-900 font-black">Insured</strong> as standard</span>
                  <span className="text-slate-600"><strong className="text-slate-900 font-black">ID-verified</strong> carriers</span>
                  <a href="/business/pricing"
                    className="inline-flex items-center gap-1.5 text-emerald-600 font-black hover:text-emerald-700 transition-colors group">
                    View pricing <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ──────────────────────────────────────── */}
        <section className="relative z-10 py-20 px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em] mb-3">Simple process</p>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900">From emergency to delivery<br />in 4 simple steps</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { n: '01', title: 'REQUEST',  desc: 'Call, SMS, or instant online quote in 30 seconds',                    Icon: ClipboardList },
                { n: '02', title: 'DISPATCH', desc: 'Verified carrier assigned within 15 minutes',                         Icon: Truck },
                { n: '03', title: 'TRACK',    desc: 'Live GPS tracking + photo proof of pickup & delivery',                Icon: Route },
                { n: '04', title: 'CONFIRM',  desc: 'Automated billing + delivery confirmation email/SMS',                 Icon: PackageCheck },
              ].map(({ n, title, desc, Icon }) => (
                <div key={n} className="relative rounded-2xl border border-slate-200 bg-slate-50 backdrop-blur-sm p-6 hover:border-emerald-500/30 hover:bg-slate-50 transition-all duration-300 hover:-translate-y-1">
                  <div className="w-11 h-11 rounded-full bg-teal-50 flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5 text-teal-600" strokeWidth={2} />
                  </div>
                  <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mb-1">{n}</p>
                  <p className="text-slate-900 font-black text-sm mb-2">{title}</p>
                  <p className="text-slate-600 text-xs leading-relaxed">{desc}</p>
                  {n !== '04' && <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 text-slate-500 text-lg font-black z-10">→</div>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── COMPARISON TABLE ──────────────────────────────────── */}
        <section className="relative z-10 py-12 px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em] mb-3">Why BootHop</p>
              <h2 className="text-3xl font-black text-slate-900">How we compare</h2>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 backdrop-blur-sm overflow-hidden">
              <div className="grid grid-cols-4 border-b border-slate-200">
                <div className="p-4 text-xs font-black text-slate-500 uppercase tracking-wider">Feature</div>
                {['BootHop', 'DHL Same-Day', 'Traditional Courier'].map(h => (
                  <div key={h} className={`p-4 text-xs font-black uppercase tracking-wider text-center ${h === 'BootHop' ? 'text-emerald-600 bg-emerald-500/8' : 'text-slate-500'}`}>{h}</div>
                ))}
              </div>
              {[
                { feature: 'UK same-day',             boothop: '✓',        dhl: '✓',              trad: '△' },
                { feature: 'Instant quote',            boothop: '✓',        dhl: '✗',              trad: '✗' },
                { feature: 'Typical cost',             boothop: '£300',     dhl: '£450+',          trad: '£500+' },
                { feature: 'Insurance included',       boothop: '£10K std', dhl: 'Extra cost',     trad: 'Extra cost' },
                { feature: 'ID-verified carrier',      boothop: '✓',        dhl: '△',              trad: '✗' },
                { feature: 'API / Slack integration',  boothop: '✓',        dhl: 'Enterprise only', trad: '✗' },
                { feature: 'International hand-carry', boothop: '✓',        dhl: '✓',              trad: '✗' },
              ].map(({ feature, boothop, dhl, trad }, i) => (
                <div key={feature} className={`grid grid-cols-4 border-b border-slate-100 ${i % 2 === 0 ? '' : 'bg-slate-50'}`}>
                  <div className="p-4 text-xs text-slate-600 font-medium">{feature}</div>
                  <div className="p-4 text-xs text-center font-bold text-emerald-600 bg-emerald-500/5">{boothop}</div>
                  <div className="p-4 text-xs text-center text-slate-600">{dhl}</div>
                  <div className="p-4 text-xs text-center text-slate-600">{trad}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOOTER LINKS ──────────────────────────────────────── */}
        <div className="relative z-10 max-w-5xl mx-auto px-8 pb-16 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
          <a href="/business/how-it-works"    className="hover:text-slate-600 transition-colors">How It Works</a>
          <a href="/business/carrier-network" className="hover:text-blue-600 transition-colors text-blue-600/40">Carrier Network</a>
          <a href="/business/pricing"         className="hover:text-emerald-600 transition-colors text-emerald-600/40">Pricing</a>
          <a href="/business/priority-partner" className="hover:text-amber-600 transition-colors text-amber-600/40">Priority Client</a>
          <a href="/business/contact"         className="hover:text-slate-600 transition-colors">Contact</a>
          <a href="/"                         className="hover:text-slate-600 transition-colors text-slate-600">← BootHop P2P</a>
        </div>

      </motion.div>

      <BusinessFooter />

      {/* WhatsApp FAB */}
      <a href="/api/whatsapp"
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] text-slate-900 rounded-full shadow-2xl shadow-[#25D366]/40 hover:scale-110 active:scale-95 transition-all"
        aria-label="Chat on WhatsApp">
        <MessageCircle className="h-7 w-7" />
      </a>
    </div>
  );
}
