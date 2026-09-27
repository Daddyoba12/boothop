'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Star, CheckCircle, ChevronLeft, Copy, Truck, Plane,
  Clock, ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import { BusinessNav } from '@/components/business/BusinessNav';
import BusinessFooter from '@/components/business/BusinessFooter';

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
    { label: 'Sort code',     value: '23-08-01',        key: 'sort' },
    { label: 'Account number',value: '44947453',        key: 'acc'  },
    { label: 'Reference',     value: ref,               key: 'ref'  },
    { label: 'Amount',        value: `£${fee.toLocaleString()}`, key: 'amt' },
  ];

  return (
    <div className="min-h-screen text-slate-900 bg-white">
      <BusinessNav
        rightSlot={
          <>
            <a href="/business/priority-partner" className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-sm font-semibold transition-colors">
              <ChevronLeft className="h-4 w-4" /> Back
            </a>
            <span className="text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1 rounded-full uppercase tracking-widest">
              Priority Partner
            </span>
          </>
        }
      />

      <div className="max-w-3xl mx-auto px-6 pt-24 pb-16">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-6">
            <Star className="h-9 w-9 text-amber-600" />
          </div>
          <h1 className="text-4xl font-black mb-3">Complete your membership</h1>
          <p className="text-slate-600 text-lg">
            Application received{company ? ` for ${company}` : ''}. Transfer your annual fee to activate your Priority Partner status.
          </p>
        </motion.div>

        {/* Summary card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="group relative overflow-hidden bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8 transition-all duration-300 hover:border-amber-300 hover:shadow-lg active:scale-[0.99]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {type === 'uk'
                ? <Truck className="h-5 w-5 text-amber-600" />
                : <Plane className="h-5 w-5 text-amber-600" />}
              <div>
                <p className="text-slate-900 font-bold">{type === 'uk' ? 'UK Partner' : 'International Partner'} — Annual Membership</p>
                {email && <p className="text-slate-600 text-xs mt-0.5">{email}</p>}
              </div>
            </div>
            <p className="text-amber-600 font-black text-3xl">£{fee.toLocaleString()}</p>
          </div>
        </motion.div>

        {/* Bank details */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="group relative overflow-hidden bg-slate-50 border border-slate-200 rounded-2xl p-8 mb-8 transition-all duration-300 hover:border-amber-200 hover:bg-white hover:shadow-lg active:scale-[0.99]">
          <h2 className="text-xl font-black mb-6">Bank transfer details</h2>
          <div className="space-y-4">
            {bankDetails.map(({ label, value, key }) => (
              <div key={key} className="flex items-center justify-between py-3 border-b border-slate-200 last:border-0">
                <div>
                  <p className="text-slate-600 text-xs uppercase tracking-widest mb-0.5">{label}</p>
                  <p className={`font-bold ${key === 'ref' ? 'text-amber-600 font-mono' : key === 'amt' ? 'text-amber-600 text-xl' : 'text-slate-900'}`}>{value}</p>
                </div>
                <button
                  onClick={() => copy(value, key)}
                  className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-700 transition-colors border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-1.5">
                  <Copy className="h-3 w-3" />
                  {copied === key ? 'Copied!' : 'Copy'}
                </button>
              </div>
            ))}
          </div>
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
            <strong>Important:</strong> Use the reference <span className="font-mono font-bold text-amber-600">{ref}</span> exactly as shown so we can match your payment to your application.
          </div>
        </motion.div>

        {/* What happens next */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="group relative overflow-hidden bg-slate-50 border border-slate-200 rounded-2xl p-8 mb-8 transition-all duration-300 hover:border-amber-200 hover:bg-white hover:shadow-lg active:scale-[0.99]">
          <h2 className="text-xl font-black mb-6">What happens next</h2>
          <div className="space-y-4">
            {[
              { icon: Star,        text: 'Your application has been received and is pending payment confirmation.' },
              { icon: CheckCircle, text: 'Once your bank transfer clears (usually same day), our team will activate your Priority Partner status.' },
              { icon: Clock,       text: 'Account activation within 1 week of payment clearing. You\'ll receive a confirmation email.' },
              { icon: ShieldCheck, text: 'From your first booking after activation, all jobs will be flagged as Priority.' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-amber-600" />
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="text-center">
          <a href="/business"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black px-8 py-4 rounded-2xl hover:scale-105 active:scale-[0.98] transition-all shadow-xl shadow-amber-500/20 text-sm">
            Back to BootHop Business
          </a>
          <p className="text-slate-500 text-xs mt-4">Questions? Email <span className="text-slate-600">business@boothop.com</span></p>
        </motion.div>

      </div>

      <BusinessFooter />
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Star className="h-8 w-8 text-amber-500 animate-pulse" />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
