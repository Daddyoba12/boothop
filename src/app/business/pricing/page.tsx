'use client';

import { motion } from 'framer-motion';
import {
  Truck, Plane, ShieldCheck, Star, ArrowRight, Zap,
} from 'lucide-react';
import { BusinessNav } from '@/components/business/BusinessNav';

const FADE = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

export default function BusinessPricingPage() {
  return (
    <div
      className="min-h-screen text-white"
      style={{ background: 'linear-gradient(135deg, #020617 0%, #0c1e3d 50%, #020617 100%)', backgroundAttachment: 'fixed' }}
    >
      <BusinessNav />

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-8 pt-20 pb-12 text-center">
        <motion.div {...FADE} transition={{ delay: 0.05 }}
          className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-full mb-8 uppercase tracking-widest">
          <Zap className="h-3.5 w-3.5" /> Transparent Pricing
        </motion.div>
        <motion.h1 {...FADE} transition={{ delay: 0.1 }}
          className="text-5xl md:text-6xl font-black tracking-tight leading-none mb-5">
          Simple, honest<br /><span className="text-emerald-400">pricing</span>
        </motion.h1>
        <motion.p {...FADE} transition={{ delay: 0.15 }}
          className="text-white/50 text-xl max-w-2xl mx-auto leading-relaxed">
          All prices are estimates. Final price confirmed on job assignment.
        </motion.p>
      </div>

      {/* Pricing cards */}
      <div className="max-w-5xl mx-auto px-8 pb-12">
        <div className="grid md:grid-cols-2 gap-6 mb-8">

          {/* UK card */}
          <motion.div {...FADE} transition={{ delay: 0.2 }}
            className="group relative overflow-hidden bg-white/3 border border-white/8 rounded-2xl p-8 transition-all duration-300 hover:border-emerald-500/40 hover:bg-white/5 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/10">
            <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Truck className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-black group-hover:text-emerald-300 transition-colors">🇬🇧 Local UK</p>
                <p className="text-white/35 text-xs">Distance-based pricing</p>
              </div>
            </div>
            <p className="text-emerald-400 font-black text-4xl mb-1">
              £200 <span className="text-base font-semibold text-white/40">per 30km</span>
            </p>
            <p className="text-white/40 text-sm mb-6 leading-relaxed">
              Charged per 30km band (or part thereof) of direct route distance. Minimum £200.
            </p>
            <div className="space-y-2.5 text-sm">
              {[
                ['Up to 30km',          '£200'],
                ['31 – 60km',           '£400'],
                ['61 – 90km',           '£600'],
                ['91 – 120km',          '£800'],
                ['Each additional 30km', '+£200'],
              ].map(([range, price]) => (
                <div key={range} className="flex items-center justify-between border-b border-white/5 pb-2.5 last:border-0">
                  <span className="text-white/50">{range}</span>
                  <span className="text-emerald-400 font-black">{price}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* International card */}
          <motion.div {...FADE} transition={{ delay: 0.25 }}
            className="group relative overflow-hidden bg-white/3 border border-white/8 rounded-2xl p-8 transition-all duration-300 hover:border-blue-500/40 hover:bg-white/5 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10">
            <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Plane className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-white font-black group-hover:text-blue-300 transition-colors">✈️ International</p>
                <p className="text-white/35 text-xs">Airport-to-airport</p>
              </div>
            </div>
            <p className="text-blue-400 font-black text-4xl mb-1">
              From £1,000 <span className="text-base font-semibold text-white/40">per consignment</span>
            </p>
            <p className="text-white/40 text-sm mb-6 leading-relaxed">
              All international routes priced from £1,000. Exact quote confirmed on assignment.
            </p>
            <div className="space-y-2.5 text-sm">
              {[
                ['UK → Lagos (LHR → LOS)',    'From £1,000'],
                ['UK → Dubai (LHR → DXB)',    'From £1,000'],
                ['Other international routes', 'Quote on request'],
              ].map(([route, price]) => (
                <div key={route} className="flex items-center justify-between border-b border-white/5 pb-2.5 last:border-0">
                  <span className="text-white/50">{route}</span>
                  <span className="text-blue-400 font-black">{price}</span>
                </div>
              ))}
            </div>
            <p className="text-white/25 text-xs mt-4">
              UK→Lagos direct flight: approx. 6 hours. Carrier checks in at departure airport.
            </p>
          </motion.div>
        </div>

        {/* Insurance */}
        <motion.div {...FADE} transition={{ delay: 0.3 }}
          className="group relative overflow-hidden bg-white/3 border border-white/8 rounded-2xl p-8 mb-8 transition-all duration-300 hover:border-emerald-500/30 hover:bg-white/5 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/10">
          <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-white font-black group-hover:text-emerald-300 transition-colors">Insurance</p>
              <p className="text-white/35 text-xs">Included on every delivery</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-5">
              <p className="text-emerald-400 font-black mb-2">Goods valued up to £1,000</p>
              <p className="text-white/50 text-sm leading-relaxed">
                Standard coverage included in all delivery prices. No additional fee — every delivery is insured.
              </p>
            </div>
            <div className="bg-orange-500/5 border border-orange-500/15 rounded-xl p-5">
              <p className="text-orange-400 font-black mb-2">Goods valued over £1,000</p>
              <p className="text-white/50 text-sm leading-relaxed">
                A mandatory insurance premium of{' '}
                <span className="text-orange-400 font-black">8% of the declared value</span>{' '}
                is applied and non-waivable. Added to your total delivery fee.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Priority Partner pricing callout */}
        <motion.div {...FADE} transition={{ delay: 0.35 }}
          className="group relative overflow-hidden bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/20 rounded-2xl p-8 transition-all duration-300 hover:border-amber-500/35 hover:shadow-2xl hover:shadow-amber-500/10">
          <div className="pointer-events-none absolute -top-10 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
              <Star className="h-5 w-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-white font-black group-hover:text-amber-300 transition-colors">Priority Partner</p>
                <span className="text-xs font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full uppercase tracking-widest">Exclusive</span>
              </div>
              <p className="text-white/40 text-sm mb-4 leading-relaxed">
                Annual retainer held on account, drawn down against delivery fees. Includes dedicated account manager, 2-hour response guarantee, and volume discounts.
              </p>
              <div className="flex flex-wrap gap-4 text-sm mb-5">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2">
                  <span className="text-amber-400 font-black">£10,000</span>
                  <span className="text-white/40 ml-1.5">UK annual</span>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2">
                  <span className="text-amber-400 font-black">£15,000</span>
                  <span className="text-white/40 ml-1.5">International annual</span>
                </div>
              </div>
              <a href="/business/priority-partner"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-400 text-black font-black px-6 py-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-amber-500/25 text-sm">
                <Star className="h-4 w-4" /> Apply for Priority Partner <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>

      {/* CTA */}
      <div className="max-w-2xl mx-auto px-8 pb-24 text-center">
        <motion.div {...FADE} transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-3xl p-10">
          <h2 className="text-3xl font-black mb-3">Ready to ship?</h2>
          <p className="text-white/40 mb-8 leading-relaxed">
            Sign in with your business email to get an instant quote and book.
          </p>
          <a href="/business"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black px-8 py-4 rounded-xl hover:scale-105 transition-all shadow-2xl shadow-emerald-500/25">
            Book a Delivery <ArrowRight className="h-4 w-4" />
          </a>
        </motion.div>
      </div>
    </div>
  );
}
