'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Clock, ShieldCheck, Zap, User, CheckCircle,
  ArrowRight, Loader2, Send, ChevronLeft, Lock,
} from 'lucide-react';

const TIERS = [
  {
    key: '2-5',
    label: 'Partner',
    deliveries: '2–5 deliveries/year',
    discount: '5%',
    price: null,
    perks: ['2-hour response guarantee', 'Dedicated account manager', 'Priority carrier matching', '5% discount on every delivery'],
  },
  {
    key: '10+',
    label: 'Elite Partner',
    deliveries: '6+ deliveries/year',
    discount: '10%',
    price: null,
    perks: ['2-hour response guarantee', 'Dedicated account manager', 'Priority carrier matching', '10% discount on every delivery', 'Monthly consolidated invoicing', 'VIP support line'],
    featured: true,
  },
];

export default function PriorityPartnerPage() {
  const [form, setForm]     = useState({ email: '', company_name: '', phone: '', delivery_volume: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [status, setStatus]   = useState<'idle' | 'ok' | 'err'>('idle');

  const submit = async () => {
    if (!form.email || !form.company_name || !form.phone) return;
    setLoading(true);
    try {
      const res = await fetch('/api/business/priority-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setStatus(res.ok ? 'ok' : 'err');
    } catch {
      setStatus('err');
    } finally {
      setLoading(false);
    }
  };

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
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold px-4 py-2 rounded-full mb-8 uppercase tracking-widest">
            <Star className="h-3.5 w-3.5" /> Exclusive membership programme
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-6">
            Priority Partner<br /><span className="text-amber-400">Programme.</span>
          </h1>
          <p className="text-white/50 text-xl max-w-2xl mx-auto leading-relaxed">
            For businesses that ship regularly. Lock in guaranteed 2-hour responses, a dedicated account team, and automatic volume discounts on every delivery.
          </p>
        </motion.div>

        {/* Tiers */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="grid md:grid-cols-2 gap-6 mb-16">
          {TIERS.map(tier => (
            <div
              key={tier.key}
              onClick={() => setForm(p => ({ ...p, delivery_volume: tier.key }))}
              className={`group relative overflow-hidden rounded-2xl p-8 cursor-pointer transition-all duration-300 ${
                form.delivery_volume === tier.key
                  ? 'border-2 border-amber-400/60 bg-amber-500/8 shadow-2xl shadow-amber-500/20 scale-[1.02]'
                  : tier.featured
                    ? 'border border-amber-500/25 bg-amber-500/5 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/10 hover:-translate-y-1'
                    : 'border border-white/8 bg-white/3 hover:border-amber-500/25 hover:shadow-lg hover:shadow-amber-500/8 hover:-translate-y-1'
              }`}
            >
              {tier.featured && (
                <div className="absolute top-4 right-4 text-xs font-black bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full uppercase tracking-widest">
                  Most popular
                </div>
              )}
              <div className="pointer-events-none absolute -top-8 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-5">
                <Star className="h-6 w-6 text-amber-400" />
              </div>
              <h2 className="text-2xl font-black mb-1">{tier.label}</h2>
              <p className="text-white/40 text-sm mb-1">{tier.deliveries}</p>
              <p className="text-amber-400 font-black text-3xl mb-6">{tier.discount} <span className="text-sm font-semibold text-white/40">off every delivery</span></p>
              <ul className="space-y-2.5">
                {tier.perks.map(perk => (
                  <li key={perk} className="flex items-center gap-2.5 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-amber-400 shrink-0" />
                    {perk}
                  </li>
                ))}
              </ul>
              {form.delivery_volume === tier.key && (
                <div className="mt-5 text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" /> Selected
                </div>
              )}
            </div>
          ))}
        </motion.div>

        {/* How it works */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-16">
          <h2 className="text-2xl font-black text-center mb-10">How it works</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { icon: Send,        step: '01', title: 'Apply',           body: 'Fill in the form below. Takes under a minute.' },
              { icon: User,        step: '02', title: 'Team review',      body: 'Our team reviews your application within 24h and contacts you.' },
              { icon: Lock,        step: '03', title: 'Account setup',    body: 'We set up your priority account and confirm your discount tier.' },
              { icon: Zap,         step: '04', title: 'Priority service',  body: 'All your jobs are flagged as Priority from your first booking.' },
            ].map(({ icon: Icon, step, title, body }) => (
              <div key={step} className="group relative overflow-hidden bg-white/3 border border-white/8 rounded-2xl p-5 transition-all duration-300 hover:border-amber-500/30 hover:bg-white/5 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10">
                <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 w-20 h-20 bg-amber-500/15 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
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

        {/* Application form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="max-w-2xl mx-auto">
          <div className="group relative overflow-hidden bg-white/3 border border-white/8 rounded-3xl p-10 transition-all duration-300 hover:border-amber-500/25 hover:shadow-xl hover:shadow-amber-500/8">
            <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/8 rounded-full blur-3xl" />
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Star className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black">Apply now</h2>
                <p className="text-white/40 text-sm">Our team will be in touch within 24h to complete your enrolment</p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {status === 'ok' ? (
                <motion.div
                  key="ok"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-5">
                    <CheckCircle className="h-9 w-9 text-amber-400" />
                  </div>
                  <h3 className="text-2xl font-black mb-3">Application submitted!</h3>
                  <p className="text-white/50 text-sm leading-relaxed max-w-sm mx-auto mb-6">
                    Our team will review your application and contact you within 24 hours to finalise your Priority Partner account and payment details.
                  </p>
                  <div className="bg-amber-500/8 border border-amber-500/20 rounded-2xl px-6 py-5 text-left space-y-2 text-sm mb-8">
                    <p className="text-amber-400 font-bold mb-3">What happens next</p>
                    <p className="text-white/50 flex items-start gap-2"><CheckCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" /> We review your application and confirm your volume tier</p>
                    <p className="text-white/50 flex items-start gap-2"><CheckCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" /> We send you account setup details and payment instructions</p>
                    <p className="text-white/50 flex items-start gap-2"><CheckCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" /> Your priority status is activated from your first booking</p>
                  </div>
                  <a href="/business"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-400 text-black font-black px-6 py-3 rounded-xl hover:scale-105 transition-all text-sm">
                    Back to portal <ArrowRight className="h-4 w-4" />
                  </a>
                </motion.div>
              ) : (
                <motion.div key="form" className="space-y-4">
                  {status === 'err' && (
                    <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-300 text-sm">
                      Something went wrong. Please try again or email us at business@boothop.com.
                    </div>
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
                    <div>
                      <label className="text-xs text-white/40 block mb-1.5">Phone number *</label>
                      <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                        type="tel" placeholder="+44 7700 000000"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 block mb-1.5">Expected deliveries/year</label>
                      <select value={form.delivery_volume} onChange={e => setForm(p => ({ ...p, delivery_volume: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm">
                        <option value="" className="bg-[#0a1628]">Select volume</option>
                        <option value="2-5" className="bg-[#0a1628]">2–5 deliveries (Partner — 5%)</option>
                        <option value="6-10" className="bg-[#0a1628]">6–10 deliveries (Elite — 10%)</option>
                        <option value="10+" className="bg-[#0a1628]">10+ deliveries (Elite — 10%)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-white/40 block mb-1.5">Anything else we should know?</label>
                    <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                      rows={3} placeholder="Routes you need, goods types, timing requirements…"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm resize-none" />
                  </div>
                  <button
                    onClick={submit}
                    disabled={loading || !form.email || !form.company_name || !form.phone}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 text-black font-black disabled:opacity-40 hover:scale-[1.02] transition-all">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Star className="h-5 w-5" />}
                    {loading ? 'Submitting application…' : 'Apply for Priority Partner'}
                  </button>
                  <div className="flex items-center justify-center gap-4 pt-1">
                    <p className="text-white/20 text-xs flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400/50" /> No payment taken now
                    </p>
                    <p className="text-white/20 text-xs">·</p>
                    <p className="text-white/20 text-xs">Our team contacts you within 24h</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Footer note */}
        <p className="text-center text-white/15 text-xs mt-12">
          Priority Partner discounts apply automatically to all deliveries once your account is activated. Discounts are applied at invoice stage and are not visible during booking.
        </p>
      </div>
    </div>
  );
}
