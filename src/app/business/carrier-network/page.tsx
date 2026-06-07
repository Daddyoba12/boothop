'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, CheckCircle, ArrowRight, Loader2,
  Truck, Plane, Shield, Award, Clock, ChevronLeft,
  AlertCircle,
} from 'lucide-react';
import { BusinessNav } from '@/components/business/BusinessNav';
import BusinessFooter from '@/components/business/BusinessFooter';

const BG = 'linear-gradient(135deg, #020617 0%, #061230 50%, #020617 100%)';

type Stage = 'form' | 'success';

interface FormState {
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  base_location: string;
  fleet_size: string;
  // Certifications
  cert_adr: boolean;
  cert_iata_dg: boolean;
  cert_gdp: boolean;
  cert_aviation_security: boolean;
  cert_iso9001: boolean;
  cert_tapa: boolean;
  cert_medical: boolean;
  // Cargo categories
  cargo_aog: boolean;
  cargo_industrial: boolean;
  cargo_pharma: boolean;
  cargo_electronics: boolean;
  cargo_automotive: boolean;
  cargo_general: boolean;
  // Service capabilities
  svc_sameday_uk: boolean;
  svc_international: boolean;
  svc_airport: boolean;
  svc_ooh: boolean;
  svc_refrigerated: boolean;
  svc_hazmat: boolean;
  notes: string;
}

const INITIAL: FormState = {
  company_name: '', contact_name: '', email: '', phone: '',
  base_location: '', fleet_size: '',
  cert_adr: false, cert_iata_dg: false, cert_gdp: false,
  cert_aviation_security: false, cert_iso9001: false, cert_tapa: false, cert_medical: false,
  cargo_aog: false, cargo_industrial: false, cargo_pharma: false,
  cargo_electronics: false, cargo_automotive: false, cargo_general: false,
  svc_sameday_uk: false, svc_international: false, svc_airport: false,
  svc_ooh: false, svc_refrigerated: false, svc_hazmat: false,
  notes: '',
};

const CERT_OPTIONS = [
  { key: 'cert_adr',              label: 'ADR',                      sub: 'Dangerous goods by road' },
  { key: 'cert_iata_dg',         label: 'IATA DG',                  sub: 'Air dangerous goods' },
  { key: 'cert_gdp',             label: 'GDP Pharma',                sub: 'Good distribution practice' },
  { key: 'cert_aviation_security',label: 'Aviation Security (DBS)', sub: 'AVSEC cleared personnel' },
  { key: 'cert_iso9001',         label: 'ISO 9001',                  sub: 'Quality management' },
  { key: 'cert_tapa',            label: 'TAPA FSR / TSR',            sub: 'Transported asset protection' },
  { key: 'cert_medical',         label: 'Medical / Clinical',        sub: 'Clinical waste & specimens' },
];

const CARGO_OPTIONS = [
  { key: 'cargo_aog',        label: 'Aircraft parts / AOG',    sub: 'Airside delivery capability' },
  { key: 'cargo_industrial', label: 'Industrial machinery',    sub: 'Heavy & oversized freight' },
  { key: 'cargo_pharma',     label: 'Pharma & healthcare',     sub: 'Temperature-sensitive' },
  { key: 'cargo_electronics',label: 'Electronics & high-value',sub: 'ESD-safe handling' },
  { key: 'cargo_automotive', label: 'Automotive parts',        sub: 'JIT manufacturing supply' },
  { key: 'cargo_general',    label: 'General freight',         sub: 'Any palletised / boxed cargo' },
];

const SERVICE_OPTIONS = [
  { key: 'svc_sameday_uk',     label: 'Same-day UK',           sub: 'Collect & deliver within 24h' },
  { key: 'svc_international',  label: 'International',         sub: 'Cross-border capability' },
  { key: 'svc_airport',        label: 'Airport-to-airport',    sub: 'Airside & cargo terminal access' },
  { key: 'svc_ooh',            label: 'Night / OOH',           sub: 'Out-of-hours available' },
  { key: 'svc_refrigerated',   label: 'Refrigerated',          sub: 'Temp-controlled vehicles' },
  { key: 'svc_hazmat',         label: 'Hazmat capable',        sub: 'Hazardous materials handling' },
];

const FLEET_OPTIONS = ['1–3 vehicles', '4–10 vehicles', '11–25 vehicles', '26–50 vehicles', '50+ vehicles'];

function CheckBox({
  checked, onChange, label, sub,
}: { checked: boolean; onChange: () => void; label: string; sub: string }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`group relative text-left p-4 rounded-2xl border transition-all duration-200 ${
        checked
          ? 'bg-blue-500/12 border-blue-400/50'
          : 'bg-white/3 border-white/8 hover:border-white/20 hover:bg-white/5'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 w-5 h-5 rounded-md border flex-shrink-0 flex items-center justify-center transition-all ${
          checked ? 'bg-blue-400 border-blue-400' : 'border-white/25'
        }`}>
          {checked && <CheckCircle className="h-3.5 w-3.5 text-black" strokeWidth={3} />}
        </div>
        <div>
          <p className={`text-sm font-bold leading-tight ${checked ? 'text-white' : 'text-white/70'}`}>{label}</p>
          <p className="text-xs text-white/35 mt-0.5">{sub}</p>
        </div>
      </div>
    </button>
  );
}

export default function CarrierNetworkPage() {
  const [stage, setStage] = useState<Stage>('form');
  const [form, setForm]   = useState<FormState>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const set = (k: keyof FormState, v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  const toggle = (k: keyof FormState) =>
    setForm(f => ({ ...f, [k]: !f[k as keyof FormState] }));

  const canSubmit = form.company_name && form.contact_name && form.email && form.phone && form.base_location && form.fleet_size;

  const submit = async () => {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/business/carrier-apply', {
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
            <span className="text-xs font-semibold bg-blue-500/15 border border-blue-400/25 text-blue-300 px-2.5 py-1 rounded-full uppercase tracking-widest">
              Carrier Network
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
            <div className="w-20 h-20 rounded-3xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center mb-8">
              <CheckCircle className="h-10 w-10 text-blue-300" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4">Application received.</h1>
            <p className="text-white/50 text-lg max-w-md mb-10">
              Our team will review your capability profile and be in touch within 2 working days to complete your onboarding.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a href="/business"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-400 to-indigo-400 text-black font-black px-8 py-4 rounded-2xl hover:scale-105 active:scale-[0.98] transition-all shadow-2xl shadow-blue-500/25 text-sm">
                Back to BootHop Business
              </a>
              <a href="/business/contact"
                className="inline-flex items-center gap-2 bg-white/8 border border-white/15 text-white font-bold px-6 py-4 rounded-2xl hover:bg-white/12 transition-all text-sm">
                Contact us
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
            <div className="relative pt-32 pb-20 px-6 text-center overflow-hidden">
              <div className="pointer-events-none absolute inset-0"
                style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(59,130,246,0.12) 0%, transparent 70%)' }} />

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 bg-blue-500/12 border border-blue-400/25 text-blue-300 text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
                <Users className="h-3.5 w-3.5" /> Couriers &amp; Transport Operators
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6 max-w-4xl mx-auto">
                More jobs.<br />
                <span className="text-blue-300">Less searching.</span>
              </motion.h1>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                className="text-white/50 text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
                Join the BootHop Carrier Network. Receive urgent delivery requests from UK businesses — AOG, same-day, specialist cargo. You choose the jobs you take.
              </motion.p>

              {/* Stats */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="flex flex-wrap items-center justify-center gap-4 mb-4">
                {[
                  { icon: <Truck className="h-4 w-4" />,   label: 'No exclusivity required' },
                  { icon: <Plane className="h-4 w-4" />,   label: 'AOG & airport jobs' },
                  { icon: <Shield className="h-4 w-4" />,  label: 'Verified platform' },
                  { icon: <Clock className="h-4 w-4" />,   label: 'No minimum jobs' },
                ].map(({ icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-2 text-xs font-semibold text-white/60 bg-white/6 border border-white/10 rounded-full px-4 py-2">
                    <span className="text-blue-300">{icon}</span> {label}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* ── FORM ────────────────────────────────────────── */}
            <div className="max-w-3xl mx-auto px-6 pb-24">

              {/* Company details */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="bg-white/3 border border-white/8 rounded-3xl p-8 mb-6">
                <h2 className="text-xl font-black mb-6 flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-300" /> Company details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'company_name',  label: 'Company name',    placeholder: 'Apex Logistics Ltd',         span: 2 },
                    { key: 'contact_name',  label: 'Your name',       placeholder: 'James Walsh',                span: 1 },
                    { key: 'phone',         label: 'Phone number',    placeholder: '+44 7700 900000',            span: 1 },
                    { key: 'email',         label: 'Email address',   placeholder: 'ops@apexlogistics.co.uk',   span: 1 },
                    { key: 'base_location', label: 'Base / HQ location', placeholder: 'Birmingham, UK',         span: 1 },
                  ].map(({ key, label, placeholder, span }) => (
                    <div key={key} className={span === 2 ? 'sm:col-span-2' : ''}>
                      <label className="text-xs text-white/40 uppercase tracking-widest font-bold mb-2 block">{label}</label>
                      <input
                        value={form[key as keyof FormState] as string}
                        onChange={e => set(key as keyof FormState, e.target.value)}
                        placeholder={placeholder}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-blue-400/50 focus:bg-white/8 transition-all"
                      />
                    </div>
                  ))}

                  {/* Fleet size */}
                  <div className="sm:col-span-2">
                    <label className="text-xs text-white/40 uppercase tracking-widest font-bold mb-2 block">Fleet size</label>
                    <div className="flex flex-wrap gap-2">
                      {FLEET_OPTIONS.map(opt => (
                        <button
                          key={opt} type="button"
                          onClick={() => set('fleet_size', opt)}
                          className={`text-sm px-4 py-2 rounded-xl border font-semibold transition-all ${
                            form.fleet_size === opt
                              ? 'bg-blue-400/20 border-blue-400/50 text-blue-300'
                              : 'bg-white/4 border-white/12 text-white/50 hover:text-white/80 hover:border-white/25'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Certifications */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-white/3 border border-white/8 rounded-3xl p-8 mb-6">
                <h2 className="text-xl font-black mb-2 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-300" /> Certifications &amp; accreditations
                </h2>
                <p className="text-white/35 text-sm mb-6">Select all that apply. These determine which specialist job types you'll be matched to.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CERT_OPTIONS.map(({ key, label, sub }) => (
                    <CheckBox
                      key={key}
                      checked={form[key as keyof FormState] as boolean}
                      onChange={() => toggle(key as keyof FormState)}
                      label={label}
                      sub={sub}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Cargo categories */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="bg-white/3 border border-white/8 rounded-3xl p-8 mb-6">
                <h2 className="text-xl font-black mb-2 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-blue-300" /> Cargo categories
                </h2>
                <p className="text-white/35 text-sm mb-6">What types of cargo do you regularly move?</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CARGO_OPTIONS.map(({ key, label, sub }) => (
                    <CheckBox
                      key={key}
                      checked={form[key as keyof FormState] as boolean}
                      onChange={() => toggle(key as keyof FormState)}
                      label={label}
                      sub={sub}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Service capabilities */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="bg-white/3 border border-white/8 rounded-3xl p-8 mb-6">
                <h2 className="text-xl font-black mb-2 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-300" /> Service capabilities
                </h2>
                <p className="text-white/35 text-sm mb-6">What service types can you offer?</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SERVICE_OPTIONS.map(({ key, label, sub }) => (
                    <CheckBox
                      key={key}
                      checked={form[key as keyof FormState] as boolean}
                      onChange={() => toggle(key as keyof FormState)}
                      label={label}
                      sub={sub}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Notes */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="bg-white/3 border border-white/8 rounded-3xl p-8 mb-8">
                <h2 className="text-xl font-black mb-4">Anything else?</h2>
                <textarea
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                  placeholder="Specialist capabilities, geographic coverage, anything else we should know…"
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-blue-400/50 transition-all resize-none"
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
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="flex flex-col items-center gap-4">
                <button
                  onClick={submit}
                  disabled={!canSubmit || loading}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-400 to-indigo-400 text-black font-black text-base px-8 py-4 rounded-2xl transition-all shadow-2xl shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100">
                  {loading
                    ? <><Loader2 className="h-5 w-5 animate-spin" /> Submitting…</>
                    : <>Join the Carrier Network <ArrowRight className="h-5 w-5" /></>
                  }
                </button>
                <p className="text-white/25 text-xs text-center max-w-sm">
                  No fees. No exclusivity. We&apos;ll review your profile and be in touch within 2 working days.
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
