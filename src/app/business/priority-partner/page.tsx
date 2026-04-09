'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Clock, ShieldCheck, Zap, User, CheckCircle,
  ArrowRight, Loader2, Send, ChevronLeft, Lock,
  Truck, Plane,
} from 'lucide-react';

// Annual membership fee — update here to change pricing
const FEES: Record<'uk' | 'international', number> = {
  uk:            10000,
  international: 15000,
};

const PERKS = [
  { icon: Clock,       label: '2-hour response guarantee',  sub: 'Every request answered within 2 hours, guaranteed' },
  { icon: User,        label: 'Dedicated account manager',  sub: 'Your own named contact at BootHop' },
  { icon: Zap,         label: 'Priority carrier matching',  sub: 'Your jobs jump to the front of our carrier network' },
  { icon: ShieldCheck, label: 'Volume discounts on delivery', sub: 'Automatic savings applied at invoice — no negotiation' },
];

const STEPS = [
  { icon: Send,  step: '01', title: 'Apply',          body: 'Fill in the short form below. Takes under 60 seconds.' },
  { icon: Lock,  step: '02', title: 'Pay annually',   body: 'Complete your one-off annual membership fee via bank transfer.' },
  { icon: User,  step: '03', title: 'Account active', body: 'We activate your Priority Partner status within 24 hours of payment clearing.' },
  { icon: Zap,   step: '04', title: 'Priority service', body: 'Every job you place is flagged Priority from day one.' },
];

export default function PriorityPartnerPage() {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [form, setForm]       = useState({ email: '', company_name: '', phone: '', delivery_type: '' as '' | 'uk' | 'international', notes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/business/auth/me')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) router.replace('/business');
        else setAuthChecked(true);
      })
      .catch(() => router.replace('/business'));
  }, [router]);

  const fee = form.delivery_type ? FEES[form.delivery_type] : null;

  const submit = async () => {
    if (!form.email || !form.company_name || !form.phone || !form.delivery_type) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/business/priority-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) { setError('Something went wrong — please try again.'); return; }
      // Redirect to payment page
      router.push(`/business/priority-partner/payment?type=${form.delivery_type}&email=${encodeURIComponent(form.email)}&company=${encodeURIComponent(form.company_name)}`);
    } catch {
      setError('Something went wrong — please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!authChecked) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #020617 0%, #0c1e3d 50%, #020617 100%)' }}>
      <Star className="h-8 w-8 text-amber-400 animate-pulse" />
    </div>
  );

  return (
    <div
      className="min-h-screen text-white"
      style={{ background: 'linear-gradient(135deg, #020617 0%, #0c1e3d 50%, #020617 100%)', backgroundAttachment: 'fixed' }}
    >
      {/* Nav */}
      <nav className="px-6 py-5 flex items-center justify-between border-b border-white/5 max-w-5xl mx-auto">
        <a href="/business" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm font-semibold transition-colors">
          <ChevronLeft className="h-4 w-4" /> BootHop Business
        </a>
        <div className="text-xl font-black tracking-tight">
          Boot<span className="text-emerald-400">Hop</span>
          <span className="ml-2 text-xs font-semibold bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full uppercase tracking-widest">Priority Partner</span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold px-4 py-2 rounded-full mb-8 uppercase tracking-widest">
            <Star className="h-3.5 w-3.5" /> Exclusive annual membership
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-6">
            Priority Partner<br /><span className="text-amber-400">Programme.</span>
          </h1>
          <p className="text-white/50 text-xl max-w-2xl mx-auto leading-relaxed">
            Guaranteed 2-hour responses, a dedicated account team, and automatic delivery discounts — activated the moment your annual membership is confirmed.
          </p>
        </motion.div>

        {/* ── 1. HOW IT WORKS ──────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-16">
          <h2 className="text-2xl font-black text-center mb-10">How it works</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {STEPS.map(({ icon: Icon, step, title, body }) => (
              <div key={step}
                className="group relative overflow-hidden bg-white/3 border border-white/8 rounded-2xl p-5 transition-all duration-300 hover:border-amber-500/30 hover:bg-white/5 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10 active:scale-[0.97]">
                <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 w-20 h-20 bg-amber-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-amber-400" />
                  </div>
                  <span className="text-amber-400/60 text-xs font-black tracking-widest">{step}</span>
                </div>
                <p className="text-white font-bold text-sm mb-2">{title}</p>
                <p className="text-white/40 text-xs leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── 2. BOOK A DELIVERY / PRICING TIERS ──────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-16">
          <h2 className="text-2xl font-black text-center mb-3">Annual membership fee</h2>
          <p className="text-white/40 text-center text-sm mb-10">One payment per year. Your discount applies automatically to every delivery.</p>
          <div className="grid md:grid-cols-2 gap-6">
            {/* UK */}
            <div
              onClick={() => setForm(p => ({ ...p, delivery_type: 'uk' }))}
              className={`group relative overflow-hidden rounded-2xl p-8 cursor-pointer transition-all duration-300 active:scale-[0.97] ${
                form.delivery_type === 'uk'
                  ? 'border-2 border-amber-400/60 bg-amber-500/8 shadow-2xl shadow-amber-500/20'
                  : 'border border-white/8 bg-white/3 hover:border-amber-500/30 hover:bg-white/5 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10'
              }`}
            >
              <div className="pointer-events-none absolute -top-8 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Truck className="h-6 w-6 text-amber-400" />
                </div>
                {form.delivery_type === 'uk' && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <CheckCircle className="h-4 w-4" /> Selected
                  </div>
                )}
              </div>
              <h3 className="text-2xl font-black mb-1">UK Partner</h3>
              <p className="text-white/40 text-sm mb-4">For local UK delivery accounts</p>
              <p className="text-amber-400 font-black text-4xl mb-1">£{FEES.uk.toLocaleString()}</p>
              <p className="text-white/30 text-sm mb-6">per year</p>
              <ul className="space-y-2">
                {PERKS.map(p => (
                  <li key={p.label} className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" /> {p.label}
                  </li>
                ))}
              </ul>
            </div>

            {/* International */}
            <div
              onClick={() => setForm(p => ({ ...p, delivery_type: 'international' }))}
              className={`group relative overflow-hidden rounded-2xl p-8 cursor-pointer transition-all duration-300 active:scale-[0.97] ${
                form.delivery_type === 'international'
                  ? 'border-2 border-amber-400/60 bg-amber-500/8 shadow-2xl shadow-amber-500/20'
                  : 'border border-amber-500/20 bg-amber-500/4 hover:border-amber-500/40 hover:bg-amber-500/8 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10'
              }`}
            >
              <div className="pointer-events-none absolute -top-8 right-0 w-40 h-40 bg-amber-500/15 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Plane className="h-6 w-6 text-amber-400" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full uppercase tracking-widest">Most popular</span>
                  {form.delivery_type === 'international' && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                      <CheckCircle className="h-4 w-4" /> Selected
                    </div>
                  )}
                </div>
              </div>
              <h3 className="text-2xl font-black mb-1">International Partner</h3>
              <p className="text-white/40 text-sm mb-4">For accounts shipping internationally</p>
              <p className="text-amber-400 font-black text-4xl mb-1">£{FEES.international.toLocaleString()}</p>
              <p className="text-white/30 text-sm mb-6">per year</p>
              <ul className="space-y-2">
                {PERKS.map(p => (
                  <li key={p.label} className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" /> {p.label}
                  </li>
                ))}
                <li className="flex items-center gap-2 text-sm text-amber-400/80">
                  <CheckCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" /> International route priority
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* ── 3. PERKS DETAIL ─────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-16">
          <div className="grid md:grid-cols-2 gap-4">
            {PERKS.map(({ icon: Icon, label, sub }) => (
              <div key={label}
                className="group relative overflow-hidden flex items-start gap-4 bg-white/3 border border-white/8 rounded-2xl p-5 transition-all duration-300 hover:border-amber-500/30 hover:bg-white/5 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10 active:scale-[0.97]">
                <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 w-20 h-20 bg-amber-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-white font-bold mb-1">{label}</p>
                  <p className="text-white/40 text-sm leading-relaxed">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── 4. APPLICATION FORM ─────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="max-w-2xl mx-auto">
          <div className="group relative overflow-hidden bg-white/3 border border-white/8 rounded-3xl p-10 transition-all duration-300 hover:border-amber-500/25 hover:bg-white/5 hover:shadow-2xl hover:shadow-amber-500/10 active:scale-[0.99]">
            <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Star className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black">Apply now</h2>
                <p className="text-white/40 text-sm">
                  {fee
                    ? <span>Annual fee: <span className="text-amber-400 font-bold">£{fee.toLocaleString()}</span> · payment on next step</span>
                    : 'Select a plan above, then complete the form'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-300 text-sm">{error}</div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/40 block mb-1.5">Business email *</label>
                  <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    type="email" placeholder="you@company.com"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-white/40 block mb-1.5">Company name *</label>
                  <input value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))}
                    placeholder="Acme Ltd"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-white/40 block mb-1.5">Phone number *</label>
                  <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    type="tel" placeholder="+44 7700 000000"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
                </div>
              </div>

              {/* Delivery type selector (inline fallback if not selected via cards above) */}
              {!form.delivery_type && (
                <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 px-4 py-3 text-amber-400/70 text-sm">
                  ↑ Please select a plan (UK or International) above before applying
                </div>
              )}
              {form.delivery_type && (
                <div className="rounded-xl bg-amber-500/8 border border-amber-500/20 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    {form.delivery_type === 'uk' ? <Truck className="h-4 w-4 text-amber-400" /> : <Plane className="h-4 w-4 text-amber-400" />}
                    <span className="text-white font-semibold">{form.delivery_type === 'uk' ? 'UK Partner' : 'International Partner'}</span>
                    <span className="text-white/40">— £{fee?.toLocaleString()}/year</span>
                  </div>
                  <button onClick={() => setForm(p => ({ ...p, delivery_type: '' }))} className="text-white/30 hover:text-white/60 text-xs transition-colors">Change</button>
                </div>
              )}

              <div>
                <label className="text-xs text-white/40 block mb-1.5">Anything else we should know?</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  rows={2} placeholder="Routes you need, goods types, timing requirements…"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm resize-none" />
              </div>

              <button
                onClick={submit}
                disabled={loading || !form.email || !form.company_name || !form.phone || !form.delivery_type}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 text-black font-black text-sm disabled:opacity-40 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-amber-500/25">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                {loading ? 'Processing…' : fee ? `Proceed to payment — £${fee.toLocaleString()}` : 'Proceed to payment'}
              </button>

              <p className="text-white/20 text-xs text-center">Payment via bank transfer on the next step · Account activated within 24h of payment clearing</p>
            </div>
          </div>
        </motion.div>

        <p className="text-center text-white/15 text-xs mt-12 max-w-xl mx-auto">
          Volume discounts are applied automatically at invoice stage and are not visible during booking. Membership renews annually. Cancel any time before renewal to stop the next charge.
        </p>
      </div>
    </div>
  );
}
