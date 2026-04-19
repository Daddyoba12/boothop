'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle, Users, Globe, Shield, Package, TrendingUp, Heart } from 'lucide-react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const STATS = [
  { value: '50K+',  label: 'Deliveries made'       },
  { value: '200+',  label: 'City corridors'         },
  { value: '95%',   label: 'Satisfaction rate'      },
  { value: '£80',   label: 'Avg. saved vs courier'  },
];

const CARRY_ITEMS = [
  { icon: <Package className="h-5 w-5" />,  title: 'Gifts & personal effects', desc: 'Clothes, shoes, homemade food, family gifts — things that carry meaning.' },
  { icon: <CheckCircle className="h-5 w-5" />, title: 'Documents & letters',  desc: 'Passports, certificates, legal papers — delivered securely by hand.' },
  { icon: <Globe className="h-5 w-5" />,    title: 'Small parcels',            desc: 'Hand-luggage sized items within standard airline weight limits.' },
  { icon: <Shield className="h-5 w-5" />,   title: 'Not accepted',             desc: "No cash, no prohibited items — nothing that wouldn't clear customs.", muted: true },
];

const VALUES = [
  {
    icon: <Users className="h-6 w-6" />,
    title: 'Community first',
    body: "People helping people on journeys they're already making. Verified identities, real connections — no strangers.",
    color: 'from-blue-500/15 to-blue-600/5 border-blue-500/15 hover:border-blue-500/35',
    iconBg: 'bg-blue-500/15 text-blue-400',
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: 'Safety & escrow',
    body: 'Funds are held securely until the recipient confirms delivery. No money changes hands until the job is done.',
    color: 'from-emerald-500/15 to-emerald-600/5 border-emerald-500/15 hover:border-emerald-500/35',
    iconBg: 'bg-emerald-500/15 text-emerald-400',
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    title: 'Efficient & affordable',
    body: 'We use space that already exists on existing journeys — better for your wallet, better for the planet.',
    color: 'from-violet-500/15 to-violet-600/5 border-violet-500/15 hover:border-violet-500/35',
    iconBg: 'bg-violet-500/15 text-violet-400',
  },
];

export default function AboutPage() {
  useScrollReveal();

  return (
    <div className="min-h-screen bg-[#07111f] text-white overflow-x-hidden">
      <NavBar />

      {/* ── CINEMATIC HERO ── */}
      <section className="relative min-h-screen overflow-hidden flex items-end">

        {/* Person at airport — muted, no music */}
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover object-[center_20%]"
          poster="/images/drealboothop.jpg"
        >
          <source src="/videos/aboutuspart1.mp4" type="video/mp4" />
        </video>

        {/* Layered overlays — dark bottom for text, lighter at top so her face shows */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07111f] via-[#07111f]/40 to-[#07111f]/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07111f]/60 via-transparent to-transparent" />

        {/* Soft blue ambient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_80%,rgba(59,130,246,0.12),transparent_55%)]" />

        {/* Content — anchored to bottom */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-8 pb-20 pt-32">
          <div className="max-w-2xl">

            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 backdrop-blur-sm px-4 py-2 text-xs font-semibold text-white/60 uppercase tracking-widest mb-7">
              <Heart className="h-3 w-3 text-blue-400" />
              About BootHop
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-[1.05] tracking-tight mb-6">
              Keeping families<br />
              connected,{' '}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                one journey<br />at a time.
              </span>
            </h1>

            <p className="text-white/60 text-lg leading-relaxed max-w-xl mb-10">
              We started BootHop because sending things home shouldn&apos;t cost a fortune or take weeks.
              There are thousands of people making the same journey — we just connect them.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-white text-black font-bold px-7 py-3.5 text-sm hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(255,255,255,0.18)] transition-all">
                Start sending <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 text-white/80 font-medium px-7 py-3.5 text-sm hover:bg-white/8 hover:border-white/35 transition-all">
                How it works
              </Link>
            </div>
          </div>
        </div>

        {/* Smooth fade into next section */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-[#07111f]" />
      </section>

      {/* ── STATS BAR ── */}
      <section className="bg-[#07111f] border-y border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6 md:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x md:divide-white/[0.07]">
            {STATS.map((s) => (
              <div key={s.label} className="text-center md:px-8">
                <p className="text-3xl md:text-4xl font-extrabold text-white mb-1 tracking-tight">{s.value}</p>
                <p className="text-xs text-white/40 font-medium uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OUR STORY + WHAT WE CARRY ── */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <div className="grid gap-16 md:grid-cols-2 md:gap-24 items-start">

            {/* Left — the story */}
            <div className="reveal">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400 mb-4">Our Story</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight mb-8">
                Born from a<br />real problem.
              </h2>

              <div className="space-y-5 text-[15px] text-white/55 leading-[1.85]">
                <p>
                  Sending a parcel from London to Lagos could cost £80–£200 with a courier.
                  It could take weeks. And there was no guarantee it would arrive safely.
                </p>
                <p>
                  Meanwhile, thousands of people were flying that exact route every week —
                  with empty luggage space and no way to connect with people who needed things sent.
                </p>
                <p className="text-white/80 font-semibold">
                  BootHop closes that gap. We match senders with verified travellers already
                  making the journey, so packages move faster, cheaper, and with someone who cares.
                </p>
              </div>

              {/* Route pills */}
              <div className="mt-9 flex flex-wrap gap-2">
                {['London → Lagos', 'Manchester → Lagos', 'Birmingham → Accra', 'UK → Nigeria'].map((r) => (
                  <span key={r}
                    className="rounded-full border border-blue-500/20 bg-blue-500/8 px-4 py-1.5 text-xs font-semibold text-blue-300">
                    {r}
                  </span>
                ))}
              </div>

              {/* Mini trust bar */}
              <div className="mt-10 grid grid-cols-2 gap-3">
                {[
                  { icon: '🔐', t: 'End-to-end encrypted'    },
                  { icon: '✅', t: 'ID verified travellers'  },
                  { icon: '💰', t: 'Secure payment escrow'   },
                  { icon: '🌍', t: '200+ city corridors'     },
                ].map(({ icon, t }) => (
                  <div key={t} className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                    <span className="text-base">{icon}</span>
                    <span className="text-xs text-white/50 font-medium">{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — what we carry */}
            <div className="reveal d2">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/35 mb-6">What people send with BootHop</p>
              <div className="space-y-3">
                {CARRY_ITEMS.map((item, i) => (
                  <div key={item.title}
                    className={`group flex items-start gap-5 p-5 rounded-2xl border transition-all duration-300
                      ${item.muted
                        ? 'border-white/5 bg-white/[0.02] opacity-50'
                        : 'border-white/8 bg-white/[0.03] hover:border-blue-500/30 hover:bg-blue-500/5 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/10 cursor-pointer'
                      }`}>
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110
                      ${item.muted
                        ? 'bg-white/5 text-white/20'
                        : 'bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/25'
                      }`}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold mb-1 transition-colors duration-300
                        ${item.muted ? 'text-white/25' : 'text-white group-hover:text-cyan-300'}`}>
                        {item.title}
                      </p>
                      <p className={`text-xs leading-relaxed ${item.muted ? 'text-white/20' : 'text-white/45'}`}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section className="py-24 md:py-32 border-t border-white/[0.05]">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <div className="mb-14 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400 mb-4">What We Stand For</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Built on trust.</h2>
            <p className="mt-4 text-white/45 text-base max-w-lg mx-auto">
              Every decision we make comes back to one question: would we trust this with our own family&apos;s package?
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {VALUES.map((v, i) => (
              <div key={v.title}
                className={`reveal d${i+1} group rounded-3xl border bg-gradient-to-br p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer ${v.color}`}>
                <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 ${v.iconBg}`}>
                  {v.icon}
                </div>
                <h3 className="mb-3 text-base font-bold text-white">{v.title}</h3>
                <p className="text-sm leading-relaxed text-white/50">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA — video background ── */}
      <section className="relative py-36 px-6 text-center overflow-hidden">
        <video autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover scale-105">
          <source src="/videos/onecall/plane2.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/58" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.15),transparent_65%)]" />

        <div className="relative z-10 max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300/80 mb-5">Someone is flying that route today</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5 tracking-tight leading-tight">
            Ready to send<br />
            <span className="text-white/50">something home?</span>
          </h2>
          <p className="text-white/50 text-base mb-10 max-w-sm mx-auto leading-relaxed">
            Register your trip or delivery in under 2 minutes. Free to join — no subscription.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register"
              className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-extrabold text-sm hover:bg-white/90 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(255,255,255,0.18)]">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/how-it-works"
              className="inline-flex items-center gap-2 border border-white/25 text-white/80 px-8 py-4 rounded-full text-sm font-semibold hover:border-white/50 hover:text-white transition-all">
              How It Works
            </Link>
          </div>
          <p className="mt-6 text-xs text-white/25">🎁 New members get £20 delivery credit</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
