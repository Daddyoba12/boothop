'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Mail, MapPin, Truck, CheckCircle,
  Star, ShieldCheck, Plane, Zap, ArrowRight,
} from 'lucide-react';
import { BusinessNav } from '@/components/business/BusinessNav';

const FADE = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

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
        <motion.div
          {...FADE}
          transition={{ delay: 0.05 }}
          className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-full mb-8 uppercase tracking-widest"
        >
          <Zap className="h-3.5 w-3.5" /> Premium Business Logistics
        </motion.div>
        <motion.h1
          {...FADE}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-6xl font-black tracking-tight leading-none mb-5"
        >
          How BootHop Business<br />
          <span className="text-emerald-400">Works</span>
        </motion.h1>
        <motion.p
          {...FADE}
          transition={{ delay: 0.15 }}
          className="text-white/50 text-xl max-w-2xl mx-auto leading-relaxed"
        >
          Verified carriers, same-day delivery, full insurance — built for businesses
          that need goods moved fast and reliably.
        </motion.p>
      </div>

      {/* Hero photo strip */}
      <div className="max-w-5xl mx-auto px-8 pb-16">
        <div className="grid grid-cols-3 gap-3 rounded-2xl overflow-hidden">
          <div className="relative h-36 sm:h-48 rounded-xl overflow-hidden">
            <Image src="/images/businessImage/biz-hero.jpg" alt="Time-critical delivery" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute bottom-3 left-3">
              <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">UK · EU · Global</p>
            </div>
          </div>
          <div className="relative h-36 sm:h-48 rounded-xl overflow-hidden">
            <Image src="/images/businessImage/biz-handshake.jpg" alt="Verified handover" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute bottom-3 left-3">
              <p className="text-xs font-black text-white/80 uppercase tracking-widest">Verified operators</p>
            </div>
          </div>
          <div className="relative h-36 sm:h-48 rounded-xl overflow-hidden">
            <Image src="/images/businessImage/biz-team.jpg" alt="Business team coordination" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute bottom-3 left-3">
              <p className="text-xs font-black text-white/80 uppercase tracking-widest">Full documentation</p>
            </div>
          </div>
        </div>
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
              {
                step: '01',
                title: 'Sign in',
                body: 'Verify your business email. Business accounts only — no personal addresses accepted.',
                icon: Mail,
              },
              {
                step: '02',
                title: 'Submit a job',
                body: 'Enter the route, goods details, and dates. Get an instant price estimate before you commit.',
                icon: MapPin,
              },
              {
                step: '03',
                title: 'We assign a carrier',
                body: 'A vetted, insured carrier is matched to your job. You receive their details on confirmation.',
                icon: ShieldCheck,
              },
              {
                step: '04',
                title: 'Delivered & invoiced',
                body: 'Carrier delivers directly to the recipient. Invoice issued on net terms upon confirmed delivery.',
                icon: CheckCircle,
              },
            ].map(({ step, title, body, icon: Icon }) => (
              <div
                key={step}
                className="group relative overflow-hidden bg-white/3 border border-white/8 rounded-2xl p-6 transition-all duration-300 hover:border-emerald-500/30 hover:bg-white/5 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 active:scale-[0.98]"
              >
                <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 w-20 h-20 bg-emerald-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-4 w-4 text-emerald-400" />
                  </div>
                  <span className="text-emerald-400/60 text-xs font-black tracking-widest">{step}</span>
                </div>
                <p className="text-white font-bold text-sm mb-2 group-hover:text-emerald-300 transition-colors duration-300">
                  {title}
                </p>
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
              {
                step: '01',
                title: 'Apply & pay retainer',
                body: 'One-off annual retainer: UK £10,000 / International £15,000. Held on account, drawn down against fees.',
                icon: Star,
              },
              {
                step: '02',
                title: 'Account activated',
                body: 'Within 24 hours of payment clearing your Priority Partner account is live and ready to use.',
                icon: CheckCircle,
              },
              {
                step: '03',
                title: 'Priority matching',
                body: 'Your jobs jump to the front of the carrier network. Faster assignment, faster delivery.',
                icon: Zap,
              },
              {
                step: '04',
                title: 'Dedicated team',
                body: '2-hour guaranteed response on every request, plus a named account manager at BootHop.',
                icon: ShieldCheck,
              },
            ].map(({ step, title, body, icon: Icon }) => (
              <div
                key={step}
                className="group relative overflow-hidden bg-white/3 border border-white/8 rounded-2xl p-6 transition-all duration-300 hover:border-amber-500/30 hover:bg-white/5 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10 active:scale-[0.98]"
              >
                <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 w-20 h-20 bg-amber-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-4 w-4 text-amber-400" />
                  </div>
                  <span className="text-amber-400/60 text-xs font-black tracking-widest">{step}</span>
                </div>
                <p className="text-white font-bold text-sm mb-2 group-hover:text-amber-300 transition-colors duration-300">
                  {title}
                </p>
                <p className="text-white/40 text-xs leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Pricing grid ── */}
      <div className="max-w-5xl mx-auto px-8 pb-20">
        <motion.div {...FADE} transition={{ delay: 0.26 }}>
          <h2 className="text-2xl font-black mb-2">Pricing</h2>
          <p className="text-white/40 text-sm mb-8">
            All prices are estimates. Final price confirmed on job assignment.
          </p>
          <div className="grid md:grid-cols-2 gap-6 mb-8">

            {/* UK card */}
            <div className="group relative overflow-hidden bg-white/3 border border-white/8 rounded-2xl p-6 transition-all duration-300 hover:border-emerald-500/30 hover:bg-white/5 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 active:scale-[0.98]">
              <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 w-20 h-20 bg-emerald-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Truck className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="text-white font-bold group-hover:text-emerald-300 transition-colors duration-300">
                  🇬🇧 Local UK
                </p>
              </div>
              <p className="text-emerald-400 font-black text-3xl mb-1">
                £200 <span className="text-sm font-semibold text-white/40">per 30km</span>
              </p>
              <p className="text-white/40 text-xs mb-4 leading-relaxed">
                Charged per 30km band (or part thereof) of direct route distance. Minimum £200.
              </p>
              <div className="space-y-2 text-xs">
                {[
                  ['Up to 30km', '£200'],
                  ['31 – 60km', '£400'],
                  ['61 – 90km', '£600'],
                  ['91 – 120km', '£800'],
                  ['Each additional 30km', '+£200'],
                ].map(([range, price]) => (
                  <div key={range} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
                    <span className="text-white/40">{range}</span>
                    <span className="text-emerald-400 font-bold">{price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* International card */}
            <div className="group relative overflow-hidden bg-white/3 border border-white/8 rounded-2xl p-6 transition-all duration-300 hover:border-emerald-500/30 hover:bg-white/5 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 active:scale-[0.98]">
              <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 w-20 h-20 bg-emerald-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Plane className="h-4 w-4 text-blue-400" />
                </div>
                <p className="text-white font-bold group-hover:text-emerald-300 transition-colors duration-300">
                  ✈️ International
                </p>
              </div>
              <p className="text-blue-400 font-black text-3xl mb-1">
                From £1,000 <span className="text-sm font-semibold text-white/40">airport-to-airport</span>
              </p>
              <p className="text-white/40 text-xs mb-4 leading-relaxed">
                All international routes priced from £1,000 per consignment. Exact quote confirmed on assignment.
              </p>
              <div className="space-y-2 text-xs">
                {[
                  ['UK → Lagos (LHR → LOS)', 'From £1,000'],
                  ['UK → Dubai (LHR → DXB)', 'From £1,000'],
                  ['Other international routes', 'Quote on request'],
                ].map(([route, price]) => (
                  <div key={route} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
                    <span className="text-white/40">{route}</span>
                    <span className="text-blue-400 font-bold">{price}</span>
                  </div>
                ))}
              </div>
              <p className="text-white/25 text-xs mt-4">
                UK→Lagos direct flight: approx. 6 hours. Carrier checks in at departure airport.
              </p>
            </div>
          </div>

          {/* Insurance section */}
          <div className="group relative overflow-hidden bg-white/3 border border-white/8 rounded-2xl p-6 transition-all duration-300 hover:border-emerald-500/30 hover:bg-white/5 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 active:scale-[0.98]">
            <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 w-20 h-20 bg-emerald-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-white font-bold group-hover:text-emerald-300 transition-colors duration-300">
                Insurance
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4">
                <p className="text-emerald-400 font-bold text-sm mb-1.5">Goods valued up to £1,000</p>
                <p className="text-white/40 text-xs leading-relaxed">
                  Standard coverage is included in all delivery prices. No additional fee — every delivery is insured.
                </p>
              </div>
              <div className="bg-orange-500/5 border border-orange-500/15 rounded-xl p-4">
                <p className="text-orange-400 font-bold text-sm mb-1.5">Goods valued over £1,000</p>
                <p className="text-white/40 text-xs leading-relaxed">
                  A mandatory insurance premium of{' '}
                  <span className="text-orange-400 font-bold">8% of the declared value</span>{' '}
                  is applied and non-waivable. This is added to your total delivery fee.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Bottom CTA ── */}
      <div className="max-w-2xl mx-auto px-8 pb-24 text-center">
        <motion.div
          {...FADE}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-3xl p-10"
        >
          <h2 className="text-3xl font-black mb-3">Ready to ship?</h2>
          <p className="text-white/40 mb-8 leading-relaxed">
            Sign in to book a delivery or become a Priority Partner for dedicated enterprise logistics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/business"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black px-7 py-3.5 rounded-xl hover:scale-105 transition-all"
            >
              Book a Delivery <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/business/priority-partner"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-orange-400 text-black font-black px-7 py-3.5 rounded-xl hover:scale-105 transition-all"
            >
              <Star className="h-4 w-4" /> Priority Partner
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
