'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck, Zap, CheckCircle, ArrowRight, Loader2,
  Clock, ShieldCheck, ChevronLeft, AlertCircle,
  MapPin, Package,
} from 'lucide-react';
import { BusinessNav } from '@/components/business/BusinessNav';
import BusinessFooter from '@/components/business/BusinessFooter';

const BG = 'linear-gradient(135deg, #020617 0%, #061a10 50%, #020617 100%)';

type Stage = 'form' | 'success';

const URGENCY_OPTIONS = [
  { value: 'same_day',    label: 'Same-day',       sub: 'Collected & delivered today',    hours: '<8h' },
  { value: 'next_day',    label: 'Next-day',        sub: 'Overnight / first thing AM',    hours: '<24h' },
  { value: 'scheduled',   label: 'Scheduled',       sub: 'Specific date & time window',   hours: 'Fixed' },
];

const CARGO_TYPES = [
  'Aircraft part / AOG', 'Industrial component', 'Pharma / clinical', 'Electronics',
  'Automotive part', 'Documents / legal', 'High-value goods', 'Other',
];

interface FormState {
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  from_location: string;
  to_location: string;
  cargo_type: string;
  cargo_description: string;
  cargo_weight: string;
  cargo_value: string;
  urgency: string;
  preferred_date: string;
  special_requirements: string;
}

const INITIAL: FormState = {
  company_name: '', contact_name: '', email: '', phone: '',
  from_location: '', to_location: '',
  cargo_type: '', cargo_description: '',
  cargo_weight: '', cargo_value: '',
  urgency: '', preferred_date: '',
  special_requirements: '',
};

export default function ExpressPage() {
  const [stage, setStage] = useState<Stage>('form');
  const [form, setForm]   = useState<FormState>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const set = (k: keyof FormState, v: string) =>
    setForm(f => ({ ...f, [k]: v }));

  const canSubmit = form.company_name && form.email && form.phone &&
    form.from_location && form.to_location && form.urgency;

  const submit = async () => {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/business/express-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error || 'Something went wrong. Please try again.'); return; }
      setStage('success');
    } catch {
      setError('Could not submit. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white" style={{ background: BG }}>

      <BusinessNav
        rightSlot={
          <>
            <a href="/business" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm font-semibold transition-colors">
              <ChevronLeft className="h-4 w-4" /> Business
            </a>
            <span className="text-xs font-semibold bg-emerald-500/15 border border-emerald-400/25 text-emerald-400 px-2.5 py-1 rounded-full uppercase tracking-widest">
              Express
            </span>
          </>
        }
      />

      <AnimatePresence mode="wait">

        {/* ══════════════════════════════════════
            SUCCESS
        ══════════════════════════════════════ */}
        {stage === 'success' && (
          <motion.div key="success"
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mb-8">
              <CheckCircle className="h-10 w-10 text-emerald-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4">Request received.</h1>
            <p className="text-white/50 text-lg max-w-md mb-3">
              Our team will call you back within <strong className="text-white">30 minutes</strong> to confirm carrier availability and pricing.
            </p>
            <p className="text-white/30 text-sm mb-10">For urgent AOG or critical requests, call us directly.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a href="tel:+441156612825"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black px-8 py-4 rounded-2xl hover:scale-105 active:scale-[0.98] transition-all shadow-2xl shadow-emerald-500/25 text-sm">
                Call +44 115 661 2825
              </a>
              <a href="/business"
                className="inline-flex items-center gap-2 bg-white/8 border border-white/15 text-white font-bold px-6 py-4 rounded-2xl hover:bg-white/12 transition-all text-sm">
                Back to Business
              </a>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════
            FORM
        ══════════════════════════════════════ */}
        {stage === 'form' && (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

            {/* ── HERO ────────────────────────────────────────── */}
            <div className="relative pt-32 pb-16 px-6 text-center overflow-hidden">
              <div className="pointer-events-none absolute inset-0"
                style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(16,185,129,0.10) 0%, transparent 70%)' }} />

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 bg-emerald-500/12 border border-emerald-400/25 text-emerald-400 text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
                <Zap className="h-3.5 w-3.5" /> One-off &amp; urgent deliveries
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6 max-w-4xl mx-auto">
                Move it <span className="text-emerald-400">today.</span>
              </motion.h1>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                className="text-white/50 text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
                Same-day deliveries across the UK and airport-to-airport. No contract, no minimum commitment. Tell us what you need — we&apos;ll have a carrier ready.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="flex flex-wrap items-center justify-center gap-4 mb-4">
                {[
                  { icon: <Clock className="h-4 w-4" />,       label: '30-min call-back' },
                  { icon: <ShieldCheck className="h-4 w-4" />, label: 'Insured up to £10k' },
                  { icon: <Truck className="h-4 w-4" />,       label: 'ID-verified carriers' },
                  { icon: <Zap className="h-4 w-4" />,         label: 'Same-day UK-wide' },
                ].map(({ icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-2 text-xs font-semibold text-white/60 bg-white/6 border border-white/10 rounded-full px-4 py-2">
                    <span className="text-emerald-400">{icon}</span> {label}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* ── FORM ────────────────────────────────────────── */}
            <div className="max-w-3xl mx-auto px-6 pb-24">

              {/* Contact */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="bg-white/3 border border-white/8 rounded-3xl p-8 mb-6">
                <h2 className="text-xl font-black mb-6">Your details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'company_name',  label: 'Company name',  placeholder: 'Rolls-Royce plc',         span: 2 },
                    { key: 'contact_name',  label: 'Contact name',  placeholder: 'Alex Johnson',            span: 1 },
                    { key: 'phone',         label: 'Best number',   placeholder: '+44 7700 900000',         span: 1 },
                    { key: 'email',         label: 'Email address', placeholder: 'ops@example.com',         span: 2 },
                  ].map(({ key, label, placeholder, span }) => (
                    <div key={key} className={span === 2 ? 'sm:col-span-2' : ''}>
                      <label className="text-xs text-white/40 uppercase tracking-widest font-bold mb-2 block">{label}</label>
                      <input
                        value={form[key as keyof FormState]}
                        onChange={e => set(key as keyof FormState, e.target.value)}
                        placeholder={placeholder}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-400/50 focus:bg-white/8 transition-all"
                      />
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Route */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-white/3 border border-white/8 rounded-3xl p-8 mb-6">
                <h2 className="text-xl font-black mb-6 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-emerald-400" /> Collection &amp; delivery
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-widest font-bold mb-2 block">Collect from</label>
                    <input
                      value={form.from_location}
                      onChange={e => set('from_location', e.target.value)}
                      placeholder="Birmingham, UK / BHX Airport"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-400/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-widest font-bold mb-2 block">Deliver to</label>
                    <input
                      value={form.to_location}
                      onChange={e => set('to_location', e.target.value)}
                      placeholder="London, UK / LHR Airport"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-400/50 transition-all"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Cargo */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="bg-white/3 border border-white/8 rounded-3xl p-8 mb-6">
                <h2 className="text-xl font-black mb-6 flex items-center gap-2">
                  <Package className="h-5 w-5 text-emerald-400" /> Cargo
                </h2>

                {/* Type pills */}
                <div className="mb-4">
                  <label className="text-xs text-white/40 uppercase tracking-widest font-bold mb-2 block">Cargo type</label>
                  <div className="flex flex-wrap gap-2">
                    {CARGO_TYPES.map(opt => (
                      <button
                        key={opt} type="button"
                        onClick={() => set('cargo_type', opt)}
                        className={`text-sm px-4 py-2 rounded-xl border font-semibold transition-all ${
                          form.cargo_type === opt
                            ? 'bg-emerald-400/20 border-emerald-400/50 text-emerald-300'
                            : 'bg-white/4 border-white/12 text-white/50 hover:text-white/80 hover:border-white/25'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/40 uppercase tracking-widest font-bold mb-2 block">Brief description</label>
                  <textarea
                    value={form.cargo_description}
                    onChange={e => set('cargo_description', e.target.value)}
                    placeholder="e.g. Fan blade assembly, 12kg, packed in foam case. Fragile."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-400/50 transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-widest font-bold mb-2 block">Approx weight</label>
                    <input
                      value={form.cargo_weight}
                      onChange={e => set('cargo_weight', e.target.value)}
                      placeholder="12 kg"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-400/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-widest font-bold mb-2 block">Declared value</label>
                    <input
                      value={form.cargo_value}
                      onChange={e => set('cargo_value', e.target.value)}
                      placeholder="£4,500"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-400/50 transition-all"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Urgency */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="bg-white/3 border border-white/8 rounded-3xl p-8 mb-6">
                <h2 className="text-xl font-black mb-6 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-emerald-400" /> Urgency
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  {URGENCY_OPTIONS.map(({ value, label, sub, hours }) => (
                    <button
                      key={value} type="button"
                      onClick={() => set('urgency', value)}
                      className={`text-left p-4 rounded-2xl border transition-all ${
                        form.urgency === value
                          ? 'bg-emerald-500/12 border-emerald-400/50'
                          : 'bg-white/3 border-white/8 hover:border-white/20'
                      }`}
                    >
                      <div className={`text-xs font-black mb-1 ${form.urgency === value ? 'text-emerald-400' : 'text-white/40'}`}>{hours}</div>
                      <p className="text-sm font-bold text-white">{label}</p>
                      <p className="text-xs text-white/35 mt-0.5">{sub}</p>
                    </button>
                  ))}
                </div>
                {form.urgency === 'scheduled' && (
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-widest font-bold mb-2 block">Preferred date / time</label>
                    <input
                      type="datetime-local"
                      value={form.preferred_date}
                      onChange={e => set('preferred_date', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-400/50 transition-all"
                    />
                  </div>
                )}
              </motion.div>

              {/* Special requirements */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="bg-white/3 border border-white/8 rounded-3xl p-8 mb-8">
                <h2 className="text-xl font-black mb-4">Special requirements</h2>
                <textarea
                  value={form.special_requirements}
                  onChange={e => set('special_requirements', e.target.value)}
                  placeholder="Airside access needed, ADR certification required, temperature-sensitive, etc."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-emerald-400/50 transition-all resize-none"
                />
              </motion.div>

              {/* Error */}
              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-3 bg-red-500/10 border border-red-500/25 rounded-2xl px-5 py-4 mb-6 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                </motion.div>
              )}

              {/* Submit */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <button
                  onClick={submit}
                  disabled={!canSubmit || loading}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black text-base px-8 py-4 rounded-2xl transition-all shadow-2xl shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 mb-4">
                  {loading
                    ? <><Loader2 className="h-5 w-5 animate-spin" /> Submitting…</>
                    : <>Request a Carrier <ArrowRight className="h-5 w-5" /></>
                  }
                </button>
                <p className="text-white/25 text-xs text-center">
                  We&apos;ll call you back within 30 minutes to confirm availability and pricing. For AOG, call us directly: <span className="text-white/40">+44 115 661 2825</span>
                </p>
              </motion.div>

            </div>
          </motion.div>
        )}

      </AnimatePresence>

      <BusinessFooter />
    </div>
  );
}
