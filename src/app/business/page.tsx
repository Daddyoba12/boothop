'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  CheckCircle, ArrowRight, MessageCircle,
  Truck, Users, Building2, ChevronDown,
} from 'lucide-react';
import { BusinessNav } from '@/components/business/BusinessNav';
import BusinessFooter from '@/components/business/BusinessFooter';

type Stage = 'loading' | 'landing';

const BG = 'linear-gradient(135deg, #020617 0%, #0c1e3d 50%, #020617 100%)';

const BIZ_VIDEOS = [
  '/videos/onecall/test2/compressed/Planeeoff1.mp4',
  '/videos/onecall/test2/compressed/Planeoff2.mp4',
];

export default function BoothopBusiness() {
  const router = useRouter();

  const [stage,     setStage]     = useState<Stage>('loading');
  const [bizVid,    setBizVid]    = useState(0);
  const [tickerIdx, setTickerIdx] = useState(0);

  const DELIVERIES = [
    { icon: '🚀', route: 'Manchester → London',  time: '3.2 hours' },
    { icon: '✈️', route: 'Bristol → Edinburgh',  time: '4.5 hours' },
    { icon: '⚙️', route: 'Birmingham → Leeds',   time: '2.8 hours' },
    { icon: '🏥', route: 'Glasgow → Newcastle',  time: '3.1 hours' },
  ];

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
    <div className="min-h-screen text-white relative" style={{ background: BG }}>

      <motion.div key="landing" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

        {/* ── NAV ───────────────────────────────────────────────── */}
        <BusinessNav showDefaultNav />

        {/* ── HERO ──────────────────────────────────────────────── */}
        <div className="relative min-h-screen w-full overflow-hidden" style={{ background: BG }}>
          <video
            autoPlay muted loop playsInline preload="auto"
            className="absolute inset-0 w-full h-full object-cover brightness-[0.55]"
            src="/videos/onecall/test2/compressed/Planeeoff1.mp4"
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0" style={{
            background: `linear-gradient(to bottom,
              rgba(2,6,35,0.70) 0%,
              rgba(2,6,35,0.10) 30%,
              rgba(2,6,35,0.10) 60%,
              rgba(2,6,35,0.95) 100%)`
          }} />

          <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-6 pt-28 pb-32">

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="inline-flex items-center gap-2 bg-white/8 border border-white/15 backdrop-blur-xl text-white/70 text-xs font-semibold px-4 py-2 rounded-full mb-8 uppercase tracking-widest">
              Business Logistics · UK &amp; International
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tight leading-[1.05] mb-8 drop-shadow-2xl max-w-5xl">
              Keep production<br />
              <span className="text-emerald-400">running.</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="text-white/55 text-lg md:text-xl max-w-2xl mx-auto mb-4 leading-relaxed">
              Keep aircraft flying. Keep deals closing. Keep lines moving.
            </motion.p>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="text-white/80 text-base md:text-lg max-w-xl mx-auto mb-12 leading-relaxed font-medium">
              When downtime costs thousands per hour, BootHop moves what matters — verified carriers, fully insured, same-day.
            </motion.p>

            {/* Stat chips */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-3 mb-16">
              {[
                { icon: '⚡', label: 'Same-day UK' },
                { icon: '🛡️', label: 'Insured as standard' },
                { icon: '✅', label: 'ID-verified carriers' },
                { icon: '🌍', label: 'International' },
              ].map(({ icon, label }) => (
                <span key={label} className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/70 bg-white/8 border border-white/12 backdrop-blur-xl rounded-full px-4 py-2">
                  {icon} {label}
                </span>
              ))}
            </motion.div>

            {/* Scroll cue */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
              className="flex flex-col items-center gap-2 text-white/30">
              <p className="text-xs font-semibold uppercase tracking-widest">Explore your options</p>
              <ChevronDown className="h-5 w-5 animate-bounce" />
            </motion.div>
          </div>
        </div>

        {/* ── THREE PATHS ───────────────────────────────────────── */}
        <section className="relative z-10 py-24 px-6" style={{ background: BG }}>
          <div className="max-w-6xl mx-auto">

            <div className="text-center mb-16">
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
                className="text-xs font-black text-emerald-400 uppercase tracking-[0.25em] mb-4">
                Three paths. One network.
              </motion.p>
              <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="text-3xl md:text-5xl font-black text-white mb-4">
                Choose how you work<br />with BootHop
              </motion.h2>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
                className="text-white/40 text-base max-w-xl mx-auto">
                Whether you're shipping, carrying, or managing critical logistics at scale — there's a route built for you.
              </motion.p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 items-stretch">

              {/* ── CARD 1: Express ──────────────────────────────── */}
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="group relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-white/3 backdrop-blur-sm p-8 flex flex-col transition-all duration-300 hover:border-emerald-500/50 hover:bg-white/5 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/10">
                <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mb-5">
                    <Truck className="h-6 w-6 text-emerald-400" />
                  </div>
                  <span className="text-[10px] font-black text-emerald-400/70 uppercase tracking-widest">One-off &amp; Urgent</span>
                  <h3 className="text-2xl font-black text-white mt-1 mb-3">BootHop Express</h3>
                  <p className="text-white/45 text-sm leading-relaxed">
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
                    <li key={b} className="flex items-start gap-2.5 text-sm text-white/60">
                      <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      {b}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  <p className="text-emerald-400/70 text-xs font-bold mb-4">From £300 UK · From £1,000 International</p>
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
                  <span className="text-[10px] font-black bg-blue-400/20 border border-blue-400/30 text-blue-300 px-3 py-1 rounded-full uppercase tracking-widest">
                    Join the Network
                  </span>
                </div>

                <div className="mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center mb-5">
                    <Users className="h-6 w-6 text-blue-300" />
                  </div>
                  <span className="text-[10px] font-black text-blue-400/70 uppercase tracking-widest">Couriers &amp; Operators</span>
                  <h3 className="text-2xl font-black text-white mt-1 mb-3">Carrier Network</h3>
                  <p className="text-white/45 text-sm leading-relaxed">
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
                    <li key={b} className="flex items-start gap-2.5 text-sm text-white/60">
                      <CheckCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                      {b}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  <p className="text-blue-300/60 text-xs font-semibold mb-4">Free to register · Earn per job accepted</p>
                  <a href="/business/carrier-network"
                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-black text-sm px-5 py-3.5 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-blue-500/25">
                    Join the Network <ArrowRight className="h-4 w-4" />
                  </a>
                  <p className="text-white/20 text-xs text-center mt-3">
                    Capability profile required · Certifications verified
                  </p>
                </div>
              </motion.div>

              {/* ── CARD 3: Priority Client ───────────────────────── */}
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="group relative overflow-hidden rounded-3xl border border-amber-500/20 bg-white/3 backdrop-blur-sm p-8 flex flex-col transition-all duration-300 hover:border-amber-500/50 hover:bg-amber-500/5 hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/10">
                <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center mb-5">
                    <Building2 className="h-6 w-6 text-amber-400" />
                  </div>
                  <span className="text-[10px] font-black text-amber-400/70 uppercase tracking-widest">Enterprise &amp; Critical</span>
                  <h3 className="text-2xl font-black text-white mt-1 mb-3">Priority Client</h3>
                  <p className="text-white/45 text-sm leading-relaxed">
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
                    <li key={b} className="flex items-start gap-2.5 text-sm text-white/60">
                      <CheckCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      {b}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  <p className="text-amber-400/60 text-xs font-semibold mb-2">Apply takes 2 minutes.</p>
                  <p className="text-amber-400/70 text-xs font-bold mb-4">From £10,000/year · UK &amp; International</p>
                  <a href="/business/priority-partner"
                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-orange-400 text-black font-black text-sm px-5 py-3.5 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-amber-500/20">
                    Apply for Access <ArrowRight className="h-4 w-4" />
                  </a>
                  <p className="text-white/20 text-xs text-center mt-3">
                    Your account manager calls within 2 hours
                  </p>
                </div>
              </motion.div>

            </div>

          </div>
        </section>

        {/* ── INDUSTRY STRIP ────────────────────────────────────── */}
        <div className="relative z-10 border-y border-white/5 bg-white/2 py-10 px-6">
          <div className="max-w-5xl mx-auto">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em] text-center mb-6">Serving critical industries</p>
            <div className="flex flex-wrap justify-center gap-3">
              {['⚙️ Engineering & Manufacturing', '✈️ Aerospace & AOG', '⚖️ Legal & Finance', '🎬 Events & Production', '🏥 Healthcare & Pharma'].map(ind => (
                <span key={ind} className="text-xs text-white/60 font-semibold bg-white/5 border border-white/10 rounded-full px-4 py-2">
                  {ind}
                </span>
              ))}
            </div>

            {/* Live delivery ticker */}
            <div className="mt-8 max-w-md mx-auto flex items-center justify-center gap-4 bg-emerald-500/8 border border-emerald-500/20 rounded-2xl px-6 py-4">
              <span className="text-2xl">{DELIVERIES[tickerIdx].icon}</span>
              <div>
                <p className="text-[10px] text-emerald-400/60 uppercase tracking-widest font-bold">Live delivery</p>
                <p className="text-sm font-bold text-white">{DELIVERIES[tickerIdx].route}</p>
              </div>
              <span className="ml-auto text-sm font-black text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 rounded-xl px-3 py-1.5 shrink-0">
                {DELIVERIES[tickerIdx].time}
              </span>
            </div>
          </div>
        </div>

        {/* ── WHY BOOTHOP — glass panel over crossfading video ──── */}
        <section className="relative z-10 py-28 px-8 overflow-hidden">
          <div className="absolute inset-0">
            {BIZ_VIDEOS.map((src, i) => (
              <video key={src} autoPlay muted loop playsInline preload={i === 0 ? 'auto' : 'none'}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[3000ms] ease-in-out"
                style={{ opacity: i === bizVid ? 1 : 0 }}>
                <source src={src} type="video/mp4" />
              </video>
            ))}
            <div className="absolute inset-0 bg-black/60" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-transparent to-[#020617]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(2,6,23,0.55)_100%)]" />
          </div>

          <div className="relative max-w-5xl mx-auto">
            <div className="rounded-3xl border border-white/[0.12] bg-white/[0.05] backdrop-blur-2xl shadow-[0_40px_120px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.1)] overflow-hidden">
              <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
              <div className="p-10 md:p-14">
                <p className="text-xs font-black text-emerald-400 uppercase tracking-[0.2em] mb-6">Why BootHop Business</p>
                <h2 className="text-4xl md:text-5xl font-black text-white leading-[1.08] mb-6">
                  We don&apos;t deliver parcels.<br />
                  <span className="text-emerald-400">We eliminate downtime.</span>
                </h2>
                <p className="text-white/65 text-lg max-w-2xl leading-relaxed mb-12">
                  Downtime costs £10,000+ per hour. Delays cost contracts. BootHop moves critical items the moment they matter — verified carriers, fully insured, same-day.
                </p>
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
                <div className="flex flex-wrap items-center justify-between gap-5 border-t border-white/10 pt-8 text-sm">
                  <span className="text-white/60"><strong className="text-white font-black">Instant</strong> quotes</span>
                  <span className="text-white/60"><strong className="text-white font-black">Same-day</strong> UK-wide</span>
                  <span className="text-white/60"><strong className="text-white font-black">Insured</strong> as standard</span>
                  <span className="text-white/60"><strong className="text-white font-black">ID-verified</strong> carriers</span>
                  <a href="/business/pricing"
                    className="inline-flex items-center gap-1.5 text-emerald-400 font-black hover:text-emerald-300 transition-colors group">
                    View pricing <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                </div>
              </div>
              <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ──────────────────────────────────────── */}
        <section className="relative z-10 py-20 px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs font-black text-emerald-400 uppercase tracking-[0.2em] mb-3">Simple process</p>
              <h2 className="text-3xl md:text-4xl font-black text-white">From emergency to delivery<br />in 4 simple steps</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { n: '01', title: 'REQUEST',  desc: 'Call, SMS, or instant online quote in 30 seconds',                    icon: '📋' },
                { n: '02', title: 'DISPATCH', desc: 'Verified carrier assigned within 15 minutes',                         icon: '🚗' },
                { n: '03', title: 'TRACK',    desc: 'Live GPS tracking + photo proof of pickup & delivery',                icon: '📍' },
                { n: '04', title: 'CONFIRM',  desc: 'Automated billing + delivery confirmation email/SMS',                 icon: '✅' },
              ].map(({ n, title, desc, icon }) => (
                <div key={n} className="relative rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-6 hover:border-emerald-500/30 hover:bg-white/[0.07] transition-all duration-300 hover:-translate-y-1">
                  <div className="text-2xl mb-3">{icon}</div>
                  <p className="text-[10px] font-black text-emerald-400/60 uppercase tracking-widest mb-1">{n}</p>
                  <p className="text-white font-black text-sm mb-2">{title}</p>
                  <p className="text-white/45 text-xs leading-relaxed">{desc}</p>
                  {n !== '04' && <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 text-white/20 text-lg font-black z-10">→</div>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── COMPARISON TABLE ──────────────────────────────────── */}
        <section className="relative z-10 py-12 px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-xs font-black text-emerald-400 uppercase tracking-[0.2em] mb-3">Why BootHop</p>
              <h2 className="text-3xl font-black text-white">How we compare</h2>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden">
              <div className="grid grid-cols-4 border-b border-white/10">
                <div className="p-4 text-xs font-black text-white/30 uppercase tracking-wider">Feature</div>
                {['BootHop', 'DHL Same-Day', 'Traditional Courier'].map(h => (
                  <div key={h} className={`p-4 text-xs font-black uppercase tracking-wider text-center ${h === 'BootHop' ? 'text-emerald-400 bg-emerald-500/8' : 'text-white/30'}`}>{h}</div>
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
                <div key={feature} className={`grid grid-cols-4 border-b border-white/5 ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
                  <div className="p-4 text-xs text-white/50 font-medium">{feature}</div>
                  <div className="p-4 text-xs text-center font-bold text-emerald-400 bg-emerald-500/5">{boothop}</div>
                  <div className="p-4 text-xs text-center text-white/35">{dhl}</div>
                  <div className="p-4 text-xs text-center text-white/35">{trad}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOOTER LINKS ──────────────────────────────────────── */}
        <div className="relative z-10 max-w-5xl mx-auto px-8 pb-16 flex flex-wrap items-center justify-center gap-6 text-sm text-white/25">
          <a href="/business/how-it-works"    className="hover:text-white/60 transition-colors">How It Works</a>
          <a href="/business/carrier-network" className="hover:text-blue-400 transition-colors text-blue-400/40">Carrier Network</a>
          <a href="/business/pricing"         className="hover:text-emerald-400 transition-colors text-emerald-400/40">Pricing</a>
          <a href="/business/priority-partner" className="hover:text-amber-400 transition-colors text-amber-400/40">Priority Client</a>
          <a href="/business/contact"         className="hover:text-white/60 transition-colors">Contact</a>
          <a href="/"                         className="hover:text-white/70 transition-colors text-white/40">← BootHop P2P</a>
        </div>

      </motion.div>

      <BusinessFooter />

      {/* WhatsApp FAB */}
      <a href="/api/whatsapp"
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-2xl shadow-[#25D366]/40 hover:scale-110 active:scale-95 transition-all"
        aria-label="Chat on WhatsApp">
        <MessageCircle className="h-7 w-7" />
      </a>
    </div>
  );
}
