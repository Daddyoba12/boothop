'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Star, CheckCircle, ChevronLeft, Copy, Truck, Plane,
  Clock, ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';

const FEES: Record<string, number> = {
  uk:            10000,
  international: 15000,
};

function PaymentContent() {
  const params      = useSearchParams();
  const type        = params.get('type') || 'uk';
  const email       = params.get('email') || '';
  const company     = params.get('company') || '';
  const fee         = FEES[type] ?? 15000;
  const ref         = `PP-${company.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 6) || 'BHOOD'}-${new Date().getFullYear()}`;

  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const bankDetails = [
    { label: 'Account name',  value: 'BootHop Ltd',    key: 'name' },
    { label: 'Sort code',     value: '20-00-00',        key: 'sort' },
    { label: 'Account number',value: '12345678',        key: 'acc'  },
    { label: 'Reference',     value: ref,               key: 'ref'  },
    { label: 'Amount',        value: `£${fee.toLocaleString()}`, key: 'amt' },
  ];

  return (
    <div
      className="min-h-screen text-white"
      style={{ background: 'linear-gradient(135deg, #020617 0%, #0c1e3d 50%, #020617 100%)', backgroundAttachment: 'fixed' }}
    >
      {/* Nav */}
      <nav className="px-6 py-5 flex items-center justify-between border-b border-white/5 max-w-3xl mx-auto">
        <a href="/business/priority-partner" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm font-semibold transition-colors">
          <ChevronLeft className="h-4 w-4" /> Back
        </a>
        <div className="text-xl font-black tracking-tight">
          Boot<span className="text-emerald-400">Hop</span>
          <span className="ml-2 text-xs font-semibold bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full uppercase tracking-widest">Priority Partner</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
            <Star className="h-9 w-9 text-amber-400" />
          </div>
          <h1 className="text-4xl font-black mb-3">Complete your membership</h1>
          <p className="text-white/40 text-lg">
            Application received{company ? ` for ${company}` : ''}. Transfer your annual fee to activate your Priority Partner status.
          </p>
        </motion.div>

        {/* Summary card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="group relative overflow-hidden bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 mb-8 transition-all duration-300 hover:border-amber-500/35 hover:shadow-xl hover:shadow-amber-500/10 active:scale-[0.99]">
          <div className="pointer-events-none absolute -top-8 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {type === 'uk'
                ? <Truck className="h-5 w-5 text-amber-400" />
                : <Plane className="h-5 w-5 text-amber-400" />}
              <div>
                <p className="text-white font-bold">{type === 'uk' ? 'UK Partner' : 'International Partner'} — Annual Membership</p>
                {email && <p className="text-white/40 text-xs mt-0.5">{email}</p>}
              </div>
            </div>
            <p className="text-amber-400 font-black text-3xl">£{fee.toLocaleString()}</p>
          </div>
        </motion.div>

        {/* Bank details */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="group relative overflow-hidden bg-white/3 border border-white/8 rounded-2xl p-8 mb-8 transition-all duration-300 hover:border-amber-500/25 hover:bg-white/5 hover:shadow-xl hover:shadow-amber-500/8 active:scale-[0.99]">
          <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <h2 className="text-xl font-black mb-6">Bank transfer details</h2>
          <div className="space-y-4">
            {bankDetails.map(({ label, value, key }) => (
              <div key={key} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-widest mb-0.5">{label}</p>
                  <p className={`font-bold ${key === 'ref' ? 'text-amber-400 font-mono' : key === 'amt' ? 'text-amber-400 text-xl' : 'text-white'}`}>{value}</p>
                </div>
                <button
                  onClick={() => copy(value, key)}
                  className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/70 transition-colors border border-white/10 hover:border-white/20 rounded-lg px-3 py-1.5">
                  <Copy className="h-3 w-3" />
                  {copied === key ? 'Copied!' : 'Copy'}
                </button>
              </div>
            ))}
          </div>
          <div className="mt-6 bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-3 text-sm text-amber-400/80">
            <strong>Important:</strong> Use the reference <span className="font-mono font-bold text-amber-400">{ref}</span> exactly as shown so we can match your payment to your application.
          </div>
        </motion.div>

        {/* What happens next */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="group relative overflow-hidden bg-white/3 border border-white/8 rounded-2xl p-8 mb-8 transition-all duration-300 hover:border-amber-500/25 hover:bg-white/5 hover:shadow-xl hover:shadow-amber-500/8 active:scale-[0.99]">
          <div className="pointer-events-none absolute -top-8 right-0 w-40 h-40 bg-amber-500/8 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <h2 className="text-xl font-black mb-6">What happens next</h2>
          <div className="space-y-4">
            {[
              { icon: Star,        text: 'Your application has been received and is pending payment confirmation.' },
              { icon: CheckCircle, text: 'Once your bank transfer clears (usually same day), our team will activate your Priority Partner status.' },
              { icon: Clock,       text: 'Account activation within 24 hours of payment clearing. You\'ll receive a confirmation email.' },
              { icon: ShieldCheck, text: 'From your first booking after activation, all jobs will be flagged as Priority.' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-amber-400" />
                </div>
                <p className="text-white/60 text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="text-center">
          <a href="/business"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-400 text-black font-black px-8 py-4 rounded-2xl hover:scale-105 active:scale-[0.98] transition-all shadow-2xl shadow-amber-500/25 text-sm">
            Back to BootHop Business
          </a>
          <p className="text-white/20 text-xs mt-4">Questions? Email <span className="text-white/40">business@boothop.com</span></p>
        </motion.div>

      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #020617 0%, #0c1e3d 50%, #020617 100%)' }}>
        <Star className="h-8 w-8 text-amber-400 animate-pulse" />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
