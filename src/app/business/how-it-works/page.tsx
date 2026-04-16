'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail, MapPin, Truck, CheckCircle,
  Star, ShieldCheck, Plane, Zap, ArrowRight,
} from 'lucide-react';
import { BusinessNav } from '@/components/business/BusinessNav';

const FADE = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

/* ── Airport-board photo strip data ─────────────────────────────────── */
const STRIP_BOXES = [
  {
    images: [
      '/images/businessImage/biz-hero.jpg',
      '/images/businessImage/Office conversation in a modern space.png',
      '/images/businessImage/biz-team.jpg',
    ],
    labels: ['UK · EU · Global', 'Same-Day Routes', 'Global Network'],
  },
  {
    images: [
      '/images/businessImage/biz-handshake.jpg',
      '/images/businessImage/Professional handshake in modern office (1).png',
      '/images/businessImage/biz-hero.jpg',
    ],
    labels: ['Verified Operators', 'Background Checked', 'Insured Carriers'],
  },
  {
    images: [
      '/images/businessImage/biz-team.jpg',
      '/images/businessImage/Boothop homepage banner in a modern office.png',
      '/images/businessImage/biz-handshake.jpg',
    ],
    labels: ['Full Documentation', 'Customs Ready', 'End-to-End Tracked'],
  },
];

function AirportPhotoStrip() {
  const [imgIdx,      setImgIdx]      = useState([0, 0, 0]);
  const [flipping,    setFlipping]    = useState<number | null>(null);
  const activeBoxRef                  = useRef(0);

  useEffect(() => {
    const tick = () => {
      const box = activeBoxRef.current;
      // Phase 1 — fold out (set flipping → CSS transitions scaleY to 0)
      setFlipping(box);
      setTimeout(() => {
        // Swap image at midpoint (invisible)
        setImgIdx(prev => {
          const next = [...prev];
          next[box] = (next[box] + 1) % STRIP_BOXES[box].images.length;
          return next;
        });
        // Phase 2 — fold in (clear flipping → CSS transitions scaleY back to 1)
        setTimeout(() => {
          setFlipping(null);
          activeBoxRef.current = (box + 1) % 3;
        }, 50);
      }, 280);
    };

    const id = setInterval(tick, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <style>{`
        @keyframes boardClack {
          0%   { filter: brightness(1); }
          40%  { filter: brightness(2.5); }
          60%  { filter: brightness(2.5); }
          100% { filter: brightness(1); }
        }
        .board-clack { animation: boardClack 0.32s ease; }
      `}</style>

      <div className="grid grid-cols-3 gap-3 rounded-2xl overflow-hidden">
        {STRIP_BOXES.map((box, i) => {
          const isFlipping = flipping === i;
          return (
            <div key={i} className="relative h-36 sm:h-52 rounded-xl overflow-hidden"
              style={{ perspective: '800px' }}>

              {/* Image wrapper — this is what scales (the "board tile") */}
              <div
                className={isFlipping ? '' : 'board-clack'}
                style={{
                  position: 'absolute', inset: 0,
                  transform: isFlipping ? 'scaleY(0.04)' : 'scaleY(1)',
                  transformOrigin: 'center center',
                  transition: isFlipping
                    ? 'transform 0.28s cubic-bezier(0.4, 0, 1, 1)'
                    : 'transform 0.26s cubic-bezier(0, 0, 0.2, 1)',
                }}
              >
                <Image
                  src={box.images[imgIdx[i]]}
                  alt={box.labels[imgIdx[i]]}
                  fill
                  className="object-cover"
                />
                {/* Dark tint */}
                <div className="absolute inset-0 bg-black/35" />

                {/* Scanline shimmer — gives premium CRT/board feel */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)',
                  }} />
              </div>

              {/* Label — outside the flip so it stays visible */}
              <div className="absolute bottom-3 left-3 z-10">
                <p className={`text-xs font-black uppercase tracking-widest drop-shadow transition-colors duration-300 ${i === 0 ? 'text-emerald-400' : 'text-white/80'}`}>
                  {box.labels[imgIdx[i]]}
                </p>
              </div>

              {/* Corner dot — active indicator */}
              <div className={`absolute top-3 right-3 z-10 w-2 h-2 rounded-full transition-colors duration-300 ${isFlipping ? 'bg-white' : 'bg-emerald-400/70'}`} />
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function HowItWorksPage() {
  return (
    <div
      className="min-h-screen text-white"
      style={{
        background: 'linear-gradient(135deg, #020617 0%, #0c1e3d 50%, #020617 100%)',
        backgroundAttachment: 'fixed',
      }}
    >
      <BusinessNav />

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-8 pt-20 pb-12 text-center">
        <motion.div {...FADE} transition={{ delay: 0.05 }}
          className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-full mb-8 uppercase tracking-widest">
          <Zap className="h-3.5 w-3.5" /> Premium Business Logistics
        </motion.div>
        <motion.h1 {...FADE} transition={{ delay: 0.1 }}
          className="text-5xl md:text-6xl font-black tracking-tight leading-none mb-5">
          How BootHop Business<br />
          <span className="text-emerald-400">Works</span>
        </motion.h1>
        <motion.p {...FADE} transition={{ delay: 0.15 }}
          className="text-white/50 text-xl max-w-2xl mx-auto leading-relaxed">
          Verified carriers, same-day delivery, full insurance — built for businesses
          that need goods moved fast and reliably.
        </motion.p>
      </div>

      {/* ── Airport-board photo strip ── */}
      <div className="max-w-5xl mx-auto px-8 pb-16">
        <AirportPhotoStrip />
      </div>

      {/* ── For Businesses: booking flow ── */}
      <div className="max-w-5xl mx-auto px-8 pb-20">
        <motion.div {...FADE} transition={{ delay: 0.18 }} className="mb-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Truck className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black">For Businesses</h2>
              <p className="text-white/40 text-sm mt-0.5">How to book a delivery — four simple steps</p>
            </div>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { step: '01', title: 'Sign in',            body: 'Verify your business email. Business accounts only — no personal addresses accepted.',                    icon: Mail },
              { step: '02', title: 'Submit a job',       body: 'Enter the route, goods details, and dates. Get an instant price estimate before you commit.',            icon: MapPin },
              { step: '03', title: 'We assign a carrier',body: 'A vetted, insured carrier is matched to your job. You receive their details on confirmation.',           icon: ShieldCheck },
              { step: '04', title: 'Delivered & invoiced',body: 'Carrier delivers directly to the recipient. Invoice issued on net terms upon confirmed delivery.',       icon: CheckCircle },
            ].map(({ step, title, body, icon: Icon }) => (
              <div key={step}
                className="group relative overflow-hidden bg-white/3 border border-white/8 rounded-2xl p-6 transition-all duration-300 hover:border-emerald-500/30 hover:bg-white/5 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 active:scale-[0.98]">
                <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 w-20 h-20 bg-emerald-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-4 w-4 text-emerald-400" />
                  </div>
                  <span className="text-emerald-400/60 text-xs font-black tracking-widest">{step}</span>
                </div>
                <p className="text-white font-bold text-sm mb-2 group-hover:text-emerald-300 transition-colors duration-300">{title}</p>
                <p className="text-white/40 text-xs leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── For Priority Partners ── */}
      <div className="max-w-5xl mx-auto px-8 pb-20">
        <motion.div {...FADE} transition={{ delay: 0.22 }} className="mb-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Star className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black">For Priority Partners</h2>
              <p className="text-white/40 text-sm mt-0.5">Elevated service for businesses that ship regularly</p>
            </div>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { step: '01', title: 'Apply & pay retainer',  body: 'One-off annual retainer: UK £10,000 / International £15,000. Held on account, drawn down against fees.',      icon: Star },
              { step: '02', title: 'Account activated',     body: 'Within 24 hours of payment clearing your Priority Partner account is live and ready to use.',                  icon: CheckCircle },
              { step: '03', title: 'Priority matching',     body: 'Your jobs jump to the front of the carrier network. Faster assignment, faster delivery.',                       icon: Zap },
              { step: '04', title: 'Dedicated team',        body: '2-hour guaranteed response on every request, plus a named account manager at BootHop.',                        icon: ShieldCheck },
            ].map(({ step, title, body, icon: Icon }) => (
              <div key={step}
                className="group relative overflow-hidden bg-white/3 border border-white/8 rounded-2xl p-6 transition-all duration-300 hover:border-amber-500/30 hover:bg-white/5 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10 active:scale-[0.98]">
                <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 w-20 h-20 bg-amber-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-4 w-4 text-amber-400" />
                  </div>
                  <span className="text-amber-400/60 text-xs font-black tracking-widest">{step}</span>
                </div>
                <p className="text-white font-bold text-sm mb-2 group-hover:text-amber-300 transition-colors duration-300">{title}</p>
                <p className="text-white/40 text-xs leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Pricing link banner ── */}
      <div className="max-w-5xl mx-auto px-8 pb-20">
        <motion.div {...FADE} transition={{ delay: 0.26 }}>
          <a href="/business/pricing"
            className="group flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/25 rounded-2xl p-6 hover:border-emerald-500/50 hover:from-emerald-500/15 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/15">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Truck className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-black group-hover:text-emerald-300 transition-colors">View full pricing</p>
                <p className="text-white/40 text-sm">UK local, international routes, insurance &amp; Priority Partner rates</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-emerald-400 font-black text-sm shrink-0">
              See pricing <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </a>
        </motion.div>
      </div>

      {/* ── Bottom CTA ── */}
      <div className="max-w-2xl mx-auto px-8 pb-24 text-center">
        <motion.div {...FADE} transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-3xl p-10">
          <h2 className="text-3xl font-black mb-3">Ready to ship?</h2>
          <p className="text-white/40 mb-8 leading-relaxed">
            Sign in to book a delivery or become a Priority Partner for dedicated enterprise logistics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/business"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black px-7 py-3.5 rounded-xl hover:scale-105 transition-all">
              Book a Delivery <ArrowRight className="h-4 w-4" />
            </a>
            <a href="/business/priority-partner"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-orange-400 text-black font-black px-7 py-3.5 rounded-xl hover:scale-105 transition-all">
              <Star className="h-4 w-4" /> Priority Partner
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
