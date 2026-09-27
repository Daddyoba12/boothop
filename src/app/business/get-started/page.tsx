'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Zap, Truck, Star, ArrowRight } from 'lucide-react';
import { BusinessNav } from '@/components/business/BusinessNav';
import BusinessFooter from '@/components/business/BusinessFooter';

const PATHS = [
  {
    icon: <Zap className="h-7 w-7 text-emerald-600" />,
    bg: 'bg-emerald-100',
    border: 'border-emerald-200',
    accent: 'text-emerald-600',
    ring: 'hover:border-emerald-300 focus:ring-emerald-400',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    badgeText: 'Instant',
    title: 'Express Delivery',
    description: 'Book a same-day or international delivery in minutes. No account needed — get a live quote, confirm, and we dispatch.',
    cta: 'Get Instant Quote',
    href: '/business/express',
    detail: 'Prices from £300 · UK & International · 24/7',
  },
  {
    icon: <Truck className="h-7 w-7 text-blue-600" />,
    bg: 'bg-blue-100',
    border: 'border-blue-200',
    accent: 'text-blue-600',
    ring: 'hover:border-blue-300 focus:ring-blue-400',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    badgeText: 'Earn with us',
    title: 'Carrier Partner',
    description: 'Join the BootHop carrier network. Receive job alerts, accept deliveries in your area, and get paid 70% of the job rate.',
    cta: 'Register as Carrier',
    href: '/business/carrier-network',
    detail: 'Earn 70% per job · Weekly payouts · Flexible',
  },
  {
    icon: <Star className="h-7 w-7 text-amber-600" />,
    bg: 'bg-amber-100',
    border: 'border-amber-200',
    accent: 'text-amber-600',
    ring: 'hover:border-amber-300 focus:ring-amber-400',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    badgeText: 'VIP Access',
    title: 'Priority Partnership',
    description: 'For organisations with regular freight needs. Dedicated account management, volume discounts, and priority dispatch.',
    cta: 'Apply for Partnership',
    href: '/business/priority-partner',
    detail: 'Up to 25% discount · 2-hour response · Dedicated AM',
  },
];

export default function GetStartedPage() {
  return (
    <div className="min-h-screen text-slate-900 bg-white">
      <BusinessNav showDefaultNav />

      <div className="min-h-screen flex flex-col items-center justify-center px-6 pt-32 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-3xl"
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black mb-4">
              How do you want to<br />
              <span className="text-emerald-600">work with us?</span>
            </h1>
            <p className="text-slate-600 text-lg max-w-lg mx-auto">
              Choose the path that fits your business. Each is a separate, purpose-built experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {PATHS.map((path, i) => (
              <motion.div
                key={path.title}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
              >
                <Link
                  href={path.href}
                  className={`flex flex-col h-full p-6 rounded-2xl bg-slate-50 border ${path.border} ${path.ring} hover:bg-white hover:shadow-md transition-all focus:outline-none focus:ring-2 group`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${path.bg} border ${path.border} flex items-center justify-center`}>
                      {path.icon}
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${path.badge}`}>
                      {path.badgeText}
                    </span>
                  </div>

                  <h2 className="text-lg font-black mb-2">{path.title}</h2>
                  <p className="text-sm text-slate-600 leading-relaxed mb-5 flex-1">{path.description}</p>

                  <div>
                    <p className="text-xs text-slate-600 mb-3">{path.detail}</p>
                    <div className={`flex items-center gap-1.5 text-sm font-bold ${path.accent} group-hover:gap-2.5 transition-all`}>
                      {path.cta} <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-slate-600 mb-4">Already have an account?</p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <a href="/business/sign-in" className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-semibold">
                ⚡ Business Client Sign In
              </a>
              <span className="text-slate-200">·</span>
              <a href="/business/carrier-sign-in" className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-semibold">
                🚚 Carrier Sign In
              </a>
              <span className="text-slate-200">·</span>
              <a href="/business/priority-partner" className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-semibold">
                🏆 Priority Client Sign In
              </a>
            </div>
          </div>
        </motion.div>
      </div>

      <BusinessFooter />
    </div>
  );
}
