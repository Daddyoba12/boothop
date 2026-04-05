'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Package, Shield, ArrowRight, CheckCircle, Users, Globe } from 'lucide-react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const VIDEOS = [
  '/videos/Aboutus_train.mp4',
  '/videos/planex.mp4',
  '/videos/AboutusMov.mp4',
];
const SLIDES = ['/images/Customs1.jpg', '/images/Handover.jpg', '/images/GoingonHolsz.jpg'];

export default function AboutPage() {
  useScrollReveal();
  const [leftIdx, setLeftIdx]   = useState(0);
  const [rightIdx, setRightIdx] = useState(2);
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setLeftIdx(p  => (p + 1) % 3);
      setRightIdx(p => (p + 1) % 3);
    }, 6000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSlideIdx(p => (p + 1) % 3), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#07111f] text-white overflow-x-hidden">
      <NavBar />

      {/* ── HERO ── */}
      <section className="relative pt-28 pb-10 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.15),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.08),transparent_35%)]" />

        <div className="mx-auto max-w-7xl px-6 md:px-8">
          {/* Label + headline */}
          <div className="mb-10 text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur">
              <span className="text-xs font-medium text-white/60">About BootHop</span>
            </div>
            <h1 className="mb-4 text-4xl font-semibold tracking-tight text-white md:text-6xl md:leading-[1.05]">
              Keeping families connected,<br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">one journey at a time</span>
            </h1>
            <p className="mx-auto max-w-2xl text-base text-white/50 md:text-lg">
              We started BootHop because sending things home shouldn&apos;t cost a fortune or take weeks.
              There are already thousands of people making the same journey — we just connect them.
            </p>
          </div>

          {/* Three media boxes
              Mobile: stacked (1 col), Tablet+: 3 columns
              Centre image is featured (larger on mobile)                */}
          <div className="flex flex-col gap-4 md:grid md:grid-cols-3 md:gap-5">

            {/* CENTRE — image slideshow (shown first and larger on mobile) */}
            <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-slate-900/60 aspect-video md:aspect-square order-first md:order-none">
              {SLIDES.map((src, i) => (
                <img key={src} src={src} alt="" loading={i === 0 ? 'eager' : 'lazy'}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  style={{ opacity: i === slideIdx ? 1 : 0, transition: 'opacity 1.4s cubic-bezier(0.4,0,0.2,1)' }}
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
                {SLIDES.map((_, i) => (
                  <div key={i} className={`h-1 rounded-full transition-all duration-700 ${i === slideIdx ? 'w-5 bg-white/70' : 'w-1 bg-white/25'}`} />
                ))}
              </div>
            </div>

            {/* TWO VIDEOS — side by side on mobile, split left/right on desktop */}
            <div className="grid grid-cols-2 gap-4 md:contents">

              {/* LEFT — active video only */}
              <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-slate-900/60 aspect-square md:order-first">
                <video
                  key={VIDEOS[leftIdx]}
                  autoPlay muted loop playsInline preload="auto"
                  className="absolute inset-0 w-full h-full object-cover video-fade-in"
                >
                  <source src={VIDEOS[leftIdx]} type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>

              {/* RIGHT — active video (offset index) */}
              <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-slate-900/60 aspect-square md:order-last">
                <video
                  key={VIDEOS[rightIdx]}
                  autoPlay muted loop playsInline preload="auto"
                  className="absolute inset-0 w-full h-full object-cover video-fade-in"
                >
                  <source src={VIDEOS[rightIdx]} type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── OUR STORY + MISSION (combined) ── */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <div className="grid gap-12 md:grid-cols-2 md:gap-20 items-center">

            {/* Left — the story */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-blue-400">Our Story</p>
              <h2 className="mb-6 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                Born from a real problem
              </h2>
              <div className="space-y-4 text-base text-white/55 leading-relaxed">
                <p>
                  Sending a parcel from London to Lagos could cost £80–£200 with a courier. It could take weeks.
                  And there was no guarantee it would arrive safely.
                </p>
                <p>
                  Meanwhile, thousands of people were flying that exact route every week — with empty luggage space
                  and no way to connect with people who needed things sent.
                </p>
                <p className="text-white/80 font-medium">
                  BootHop closes that gap. We match senders with verified travellers already making the journey,
                  so packages move faster, cheaper, and with someone who cares.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                {['London → Lagos', 'Manchester → Lagos', 'Birmingham → Accra', 'UK → Nigeria'].map((route) => (
                  <span key={route} className="rounded-full border border-blue-500/20 bg-blue-500/8 px-3 py-1.5 text-xs font-medium text-blue-300">
                    {route}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — what we carry */}
            <div className="space-y-3">
              <p className="mb-5 text-sm font-medium text-white/40">What people send with BootHop</p>
              {[
                { icon: <Package className="h-5 w-5" />, title: 'Personal effects & gifts', desc: 'Clothes, shoes, homemade food, family gifts — things that matter.' },
                { icon: <CheckCircle className="h-5 w-5" />, title: 'Documents & letters', desc: 'Passports, certificates, legal papers — delivered securely by hand.' },
                { icon: <Globe className="h-5 w-5" />, title: 'Small parcels', desc: 'Anything hand-luggage sized that fits within airline weight limits.' },
                { icon: <Shield className="h-5 w-5" />, title: 'Not accepted', desc: 'No cash, no prohibited items, no anything that wouldn\'t clear customs.', muted: true },
              ].map((item, i) => (
                <div key={item.title} className={`reveal d${i+1} group flex items-start gap-5 p-5 rounded-2xl border transition-all duration-300 cursor-pointer
                  ${item.muted
                    ? 'border-white/5 bg-gradient-to-br from-slate-800/20 to-slate-900/20 hover:border-red-500/20'
                    : 'border-slate-700/50 bg-gradient-to-br from-slate-800/30 to-slate-900/30 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/15 hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 touch-blue'
                  }`}>
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-110
                    ${item.muted
                      ? 'bg-red-500/10 text-red-400/60'
                      : 'bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-blue-500/40'}`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold transition-colors duration-300
                      ${item.muted ? 'text-white/30' : 'text-white group-hover:text-cyan-400'}`}>{item.title}</p>
                    <p className={`text-xs mt-1 leading-relaxed ${item.muted ? 'text-white/20' : 'text-slate-400'}`}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section className="py-20 md:py-28 bg-white/2 border-y border-white/5">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-blue-400">What We Stand For</p>
            <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Built on trust</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: <Users className="h-6 w-6" />, title: 'Community first', body: 'People helping people on journeys they\'re already making. No strangers — verified identities, real connections.' },
              { icon: <Shield className="h-6 w-6" />, title: 'Safety & escrow', body: 'Funds are held securely until the recipient confirms delivery. No money changes hands until the job is done.' },
              { icon: <Globe className="h-6 w-6" />, title: 'Efficient & affordable', body: 'Use the space that already exists on existing journeys. Better for your wallet, better for the environment.' },
            ].map((item, i) => (
              <div key={item.title} className={`reveal d${i+1} group rounded-3xl border border-white/8 bg-white/3 p-7 transition-all duration-300 hover:border-blue-500/20 hover:bg-white/5 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 active:scale-[0.98] cursor-pointer touch-blue`}>
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-400 group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <h3 className="mb-3 text-base font-semibold text-white group-hover:text-cyan-400 transition-colors duration-300">{item.title}</h3>
                <p className="text-sm leading-relaxed text-white/50">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.12),transparent_60%)]" />
        <div className="mx-auto max-w-2xl px-6 text-center md:px-8">
          <h2 className="mb-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Ready to send something home?
          </h2>
          <p className="mb-10 text-base text-white/50">
            Register your trip or delivery in under 2 minutes. Free to join.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-7 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_48px_rgba(59,130,246,0.4)]">
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/how-it-works"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition-all duration-200 hover:bg-white/10 hover:border-white/25 hover:-translate-y-0.5">
              How It Works
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
