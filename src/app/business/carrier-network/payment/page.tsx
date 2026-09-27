'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Truck, CheckCircle, ChevronLeft, Copy,
  Clock, ShieldCheck, CreditCard,
} from 'lucide-react';
import { BusinessNav } from '@/components/business/BusinessNav';
import BusinessFooter from '@/components/business/BusinessFooter';

function PaymentContent() {
  const params  = useSearchParams();
  const email   = params.get('email')   || '';
  const company = params.get('company') || '';
  const ref     = `CN-${company.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 6) || 'BHCAR'}-REG`;

  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const bankDetails = [
    { label: 'Account name',   value: 'BootHop Ltd', key: 'name' },
    { label: 'Sort code',      value: '23-08-01',    key: 'sort' },
    { label: 'Account number', value: '44947453',    key: 'acc'  },
    { label: 'Reference',      value: ref,           key: 'ref'  },
    { label: 'Amount',         value: '£250',        key: 'amt'  },
  ];

  return (
    <div className="min-h-screen text-slate-900 bg-white">

      <BusinessNav
        rightSlot={
          <>
            <a href="/business/carrier-network"
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-sm font-semibold transition-colors">
              <ChevronLeft className="h-4 w-4" /> Back
            </a>
            <span className="text-xs font-semibold bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1 rounded-full uppercase tracking-widest">
              Carrier Network
            </span>
          </>
        }
      />

      <div className="max-w-3xl mx-auto px-6 pt-24 pb-16">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-6">
            <Truck className="h-9 w-9 text-blue-600" />
          </div>
          <h1 className="text-4xl font-black mb-3">Complete your registration</h1>
          <p className="text-slate-600 text-lg">
            Profile received{company ? ` for ${company}` : ''}. Pay the one-time £250 registration fee to activate your carrier account.
          </p>
        </motion.div>

        {/* Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-slate-900 font-bold">Carrier Network — One-time Registration Fee</p>
                {email && <p className="text-slate-600 text-xs mt-0.5">{email}</p>}
              </div>
            </div>
            <p className="text-blue-600 font-black text-3xl">£250</p>
          </div>
        </motion.div>

        {/* Bank transfer details */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-slate-50 border border-slate-200 rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-black mb-6">Bank transfer details</h2>
          <div className="space-y-4">
            {bankDetails.map(({ label, value, key }) => (
              <div key={key} className="flex items-center justify-between py-3 border-b border-slate-200 last:border-0">
                <div>
                  <p className="text-slate-600 text-xs uppercase tracking-widest mb-0.5">{label}</p>
                  <p className={`font-bold ${
                    key === 'ref' ? 'text-blue-600 font-mono'
                    : key === 'amt' ? 'text-blue-600 text-xl'
                    : 'text-slate-900'
                  }`}>{value}</p>
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
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
            <strong>Important:</strong> Use reference{' '}
            <span className="font-mono font-bold text-blue-600">{ref}</span>{' '}
            exactly as shown so we can match your payment to your application.
          </div>
        </motion.div>

        {/* What happens next */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-slate-50 border border-slate-200 rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-black mb-6">What happens next</h2>
          <div className="space-y-4">
            {[
              { icon: Truck,       text: 'Your carrier profile has been received and is pending payment confirmation.' },
              { icon: CheckCircle, text: 'Once your £250 bank transfer clears, our team will verify your profile and certifications.' },
              { icon: Clock,       text: 'Carrier account activated within 2 working days. You\'ll receive a confirmation email.' },
              { icon: ShieldCheck, text: 'Once active, you\'ll start receiving job requests matched to your capabilities. Earnings paid within 1 week of each completed delivery.' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="text-center">
          <a href="/business"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-black px-8 py-4 rounded-2xl hover:scale-105 active:scale-[0.98] transition-all shadow-xl shadow-blue-500/20 text-sm">
            Back to BootHop Business
          </a>
          <p className="text-slate-500 text-xs mt-4">
            Questions? Email <span className="text-slate-600">carriers@boothop.com</span>
          </p>
        </motion.div>

      </div>

      <BusinessFooter />
    </div>
  );
}

export default function CarrierPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Truck className="h-8 w-8 text-blue-500 animate-pulse" />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
