'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { trackEvent } from '@/lib/analytics';
import {
  Users, CheckCircle, ArrowRight, ArrowLeft, Loader2,
  Truck, Shield, Clock, ChevronLeft, AlertCircle,
  Building2, CreditCard, Upload, X, FileText,
} from 'lucide-react';
import { BusinessNav } from '@/components/business/BusinessNav';
import BusinessFooter from '@/components/business/BusinessFooter';

const BG = 'linear-gradient(135deg, #020617 0%, #061230 50%, #020617 100%)';

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS = ['Company', 'Fleet', 'Capabilities', 'Banking'];

const PERSONAL_DOMAINS = ['gmail.', 'hotmail.', 'yahoo.', 'outlook.com', 'icloud.', 'live.', 'aol.', 'proton.', 'me.com'];
const isPersonalEmail = (e: string) => PERSONAL_DOMAINS.some(d => e.toLowerCase().includes(d));
const isValidCompanyReg = (r: string) => /^([A-Z]{2}\d{6}|\d{8})$/i.test(r.replace(/\s/g, ''));

interface FormData {
  company_name: string;
  company_reg_number: string;
  vat_number: string;
  email: string;
  phone: string;
  contact_name: string;
  your_role: string;
  base_location: string;
  fleet_size: string;
  vehicle_types: string[];
  operating_hours: string;
  coverage_area: string;
  cert_adr: boolean;
  cert_iata_dg: boolean;
  cert_gdp: boolean;
  cert_aviation_security: boolean;
  cert_iso9001: boolean;
  cert_tapa: boolean;
  cert_medical: boolean;
  cargo_aog: boolean;
  cargo_industrial: boolean;
  cargo_pharma: boolean;
  cargo_electronics: boolean;
  cargo_automotive: boolean;
  cargo_general: boolean;
  svc_sameday_uk: boolean;
  svc_international: boolean;
  svc_airport: boolean;
  svc_ooh: boolean;
  svc_refrigerated: boolean;
  svc_hazmat: boolean;
  bank_account_name: string;
  sort_code: string;
  account_number: string;
  how_did_you_hear: string;
  notes: string;
  agreed_to_terms: boolean;
}

const INITIAL: FormData = {
  company_name: '', company_reg_number: '', vat_number: '',
  email: '', phone: '', contact_name: '', your_role: '', base_location: '',
  fleet_size: '', vehicle_types: [], operating_hours: '', coverage_area: '',
  cert_adr: false, cert_iata_dg: false, cert_gdp: false,
  cert_aviation_security: false, cert_iso9001: false, cert_tapa: false, cert_medical: false,
  cargo_aog: false, cargo_industrial: false, cargo_pharma: false,
  cargo_electronics: false, cargo_automotive: false, cargo_general: false,
  svc_sameday_uk: false, svc_international: false, svc_airport: false,
  svc_ooh: false, svc_refrigerated: false, svc_hazmat: false,
  bank_account_name: '', sort_code: '', account_number: '',
  how_did_you_hear: '', notes: '', agreed_to_terms: false,
};

const VEHICLE_TYPES = [
  'Motorcycle', 'Car', 'Van (<3.5t)', 'HGV (7.5t+)', 'Articulated (HGV)',
  'Refrigerated HGV', 'Hazmat vehicle', 'Airside-certified vehicle',
];
const FLEET_SIZES = ['1–3 vehicles', '4–10 vehicles', '11–25 vehicles', '26–50 vehicles', '50+ vehicles'];
const OPERATING_HOURS_OPTIONS = [
  { value: 'standard', label: 'Standard hours',      sub: 'Mon–Fri, 8am–6pm' },
  { value: 'extended', label: 'Extended hours',      sub: 'Mon–Sat, 7am–9pm' },
  { value: '24_7',     label: '24/7 including OOH',  sub: 'Nights, weekends, bank holidays' },
  { value: 'on_call',  label: 'On-call basis',       sub: 'Available by prior arrangement' },
];
const COVERAGE_OPTIONS = [
  { value: 'local',         label: 'Local',                sub: 'Within 50 miles of base' },
  { value: 'regional',      label: 'Regional UK',          sub: 'UK-wide coverage' },
  { value: 'national_irl',  label: 'National + Ireland',   sub: 'UK, ROI & NI' },
  { value: 'international', label: 'International',        sub: 'Cross-border / air freight capable' },
];
const CERT_OPTIONS = [
  { key: 'cert_adr',               label: 'ADR',                     sub: 'Dangerous goods by road' },
  { key: 'cert_iata_dg',          label: 'IATA DG',                 sub: 'Air dangerous goods' },
  { key: 'cert_gdp',              label: 'GDP Pharma',               sub: 'Good distribution practice' },
  { key: 'cert_aviation_security', label: 'Aviation Security (DBS)', sub: 'AVSEC cleared personnel' },
  { key: 'cert_iso9001',          label: 'ISO 9001',                 sub: 'Quality management' },
  { key: 'cert_tapa',             label: 'TAPA FSR / TSR',           sub: 'Transported asset protection' },
  { key: 'cert_medical',          label: 'Medical / Clinical',       sub: 'Clinical waste & specimens' },
];
const CARGO_OPTIONS = [
  { key: 'cargo_aog',         label: 'Aircraft parts / AOG',     sub: 'Airside delivery capability' },
  { key: 'cargo_industrial',  label: 'Industrial machinery',     sub: 'Heavy & oversized freight' },
  { key: 'cargo_pharma',      label: 'Pharma & healthcare',      sub: 'Temperature-sensitive' },
  { key: 'cargo_electronics', label: 'Electronics & high-value', sub: 'ESD-safe handling' },
  { key: 'cargo_automotive',  label: 'Automotive parts',         sub: 'JIT manufacturing supply' },
  { key: 'cargo_general',     label: 'General freight',          sub: 'Any palletised / boxed cargo' },
];
const SERVICE_OPTIONS = [
  { key: 'svc_sameday_uk',    label: 'Same-day UK',         sub: 'Collect & deliver within 24h' },
  { key: 'svc_international', label: 'International',       sub: 'Cross-border capability' },
  { key: 'svc_airport',       label: 'Airport-to-airport',  sub: 'Airside & cargo terminal access' },
  { key: 'svc_ooh',           label: 'Night / OOH',         sub: 'Out-of-hours available' },
  { key: 'svc_refrigerated',  label: 'Refrigerated',        sub: 'Temp-controlled vehicles' },
  { key: 'svc_hazmat',        label: 'Hazmat capable',      sub: 'Hazardous materials handling' },
];
const HOW_HEARD = [
  'Google search', 'LinkedIn', 'Referred by existing client',
  'Industry event / trade show', 'Word of mouth', 'Other',
];

// ── Sub-components ────────────────────────────────────────────────────

function ProgressBar({ step }: { step: Step }) {
  return (
    <div className="flex items-center justify-center gap-1 mb-10">
      {STEP_LABELS.map((label, i) => {
        const num = (i + 1) as Step;
        const done   = step > num;
        const active = step === num;
        return (
          <div key={label} className="flex items-center gap-1">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                done   ? 'bg-blue-400 text-black'
                : active ? 'bg-blue-400/20 border-2 border-blue-400 text-blue-300'
                         : 'bg-white/6 border border-white/12 text-white/30'
              }`}>
                {done ? <CheckCircle className="h-4 w-4" /> : num}
              </div>
              <span className={`text-[10px] mt-1 font-bold uppercase tracking-wider ${
                active ? 'text-blue-300' : done ? 'text-blue-300/60' : 'text-white/25'
              }`}>{label}</span>
            </div>
            {i < 3 && <div className={`w-10 h-px mb-5 transition-all ${done ? 'bg-blue-400/50' : 'bg-white/8'}`} />}
          </div>
        );
      })}
    </div>
  );
}

function CBox({ checked, onChange, label, sub }: { checked: boolean; onChange: () => void; label: string; sub: string }) {
  return (
    <button type="button" onClick={onChange}
      className={`text-left p-4 rounded-2xl border transition-all ${
        checked ? 'bg-blue-500/12 border-blue-400/50' : 'bg-white/3 border-white/8 hover:border-white/20 hover:bg-white/5'
      }`}>
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

function RadioGrid({ options, value, onChange }: {
  options: { value: string; label: string; sub?: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {options.map(opt => (
        <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
          className={`text-left p-3.5 rounded-xl border transition-all ${
            value === opt.value
              ? 'bg-blue-500/15 border-blue-400/50 text-blue-300'
              : 'bg-white/3 border-white/8 text-white/60 hover:border-white/20 hover:bg-white/5'
          }`}>
          <p className="text-sm font-bold">{opt.label}</p>
          {opt.sub && <p className="text-xs text-white/35 mt-0.5">{opt.sub}</p>}
        </button>
      ))}
    </div>
  );
}

function Field({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="text-xs text-white/40 uppercase tracking-widest font-bold mb-2 block">
        {label}{required && <span className="text-blue-400 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-white/25 mt-1.5">{hint}</p>}
    </div>
  );
}

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-blue-400/50 focus:bg-white/8 transition-all';

// ── Main page ─────────────────────────────────────────────────────────

export default function CarrierNetworkPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof FormData, v: string | boolean | string[]) =>
    setForm(f => ({ ...f, [k]: v }));
  const toggleBool = (k: keyof FormData) =>
    setForm(f => ({ ...f, [k]: !f[k as keyof FormData] }));
  const toggleVehicle = (v: string) =>
    setForm(f => ({
      ...f,
      vehicle_types: f.vehicle_types.includes(v)
        ? f.vehicle_types.filter(t => t !== v)
        : [...f.vehicle_types, v],
    }));

  const step1Valid = !!(
    form.company_name.trim() &&
    form.company_reg_number.trim() && isValidCompanyReg(form.company_reg_number) &&
    form.email.trim() && !isPersonalEmail(form.email) &&
    form.phone.trim() && form.contact_name.trim() &&
    form.your_role && form.base_location.trim()
  );
  const step2Valid = !!(
    form.fleet_size && form.vehicle_types.length > 0 &&
    form.operating_hours && form.coverage_area
  );
  const step3Valid = true;
  const step4Valid = !!(
    form.bank_account_name.trim() &&
    /^\d{6}$/.test(form.sort_code.replace(/[-\s]/g, '')) &&
    /^\d{8}$/.test(form.account_number.replace(/\s/g, '')) &&
    form.how_did_you_hear && form.agreed_to_terms
  );

  const currentStepValid = [step1Valid, step2Valid, step3Valid, step4Valid][step - 1];

  const goNext = () => setStep(s => Math.min(4, s + 1) as Step);
  const goBack = () => setStep(s => Math.max(1, s - 1) as Step);

  const submit = async () => {
    if (!step4Valid) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/business/carrier-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          sort_code: form.sort_code.replace(/[-\s]/g, ''),
          account_number: form.account_number.replace(/\s/g, ''),
          insurance_filename: insuranceFile?.name ?? null,
        }),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error || 'Something went wrong. Please try again.'); return; }
      trackEvent('business_applied', { type: 'carrier' });
      router.push(
        `/business/carrier-network/payment?email=${encodeURIComponent(form.email)}&company=${encodeURIComponent(form.company_name)}`
      );
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

      {/* Hero */}
      <div className="relative pt-32 pb-12 px-6 text-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(59,130,246,0.12) 0%, transparent 70%)' }} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 bg-blue-500/12 border border-blue-400/25 text-blue-300 text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
          <Users className="h-3.5 w-3.5" /> Couriers &amp; Transport Operators
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6 max-w-4xl mx-auto">
          More jobs.<br /><span className="text-blue-300">Less searching.</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-white/50 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-4">
          Join the BootHop Carrier Network — AOG, same-day, specialist cargo. Earn per job.
          Paid within <strong className="text-white">1 week</strong> of each delivery.
          One-time registration fee: <span className="text-blue-300 font-bold">£250</span>.
        </motion.p>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
          className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400/80 text-xs font-semibold px-4 py-2 rounded-full">
          Registered companies only · No sole traders · Business email required
        </motion.div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-6 pb-28">
        <ProgressBar step={step} />

        <AnimatePresence mode="wait">

          {/* ── STEP 1: Company Identity ─────────────────────── */}
          {step === 1 && (
            <motion.div key="s1"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="bg-white/3 border border-white/8 rounded-3xl p-8 space-y-5">

              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-300" />
                </div>
                <div>
                  <h2 className="text-xl font-black">Company Identity</h2>
                  <p className="text-white/35 text-sm">Registered businesses only — no sole traders</p>
                </div>
              </div>

              <Field label="Company name" required>
                <input value={form.company_name} onChange={e => set('company_name', e.target.value)}
                  placeholder="Apex Logistics Ltd" className={inputCls} />
              </Field>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Companies House number" required
                  hint={form.company_reg_number && !isValidCompanyReg(form.company_reg_number)
                    ? '⚠ 8 digits or 2 letters + 6 digits (e.g. SC123456)'
                    : 'e.g. 12345678 or SC123456'}>
                  <input value={form.company_reg_number}
                    onChange={e => set('company_reg_number', e.target.value.toUpperCase())}
                    placeholder="12345678" className={inputCls} />
                </Field>
                <Field label="VAT number" hint="Optional">
                  <input value={form.vat_number} onChange={e => set('vat_number', e.target.value)}
                    placeholder="GB 123 4567 89" className={inputCls} />
                </Field>
              </div>

              <Field label="Business email" required
                hint={form.email && isPersonalEmail(form.email)
                  ? '⚠ Personal email not accepted — use your company email'
                  : 'No Gmail, Hotmail, Yahoo etc.'}>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  placeholder="ops@apexlogistics.co.uk" className={inputCls} />
              </Field>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Phone number" required>
                  <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                    placeholder="+44 7700 900000" className={inputCls} />
                </Field>
                <Field label="Your full name" required>
                  <input value={form.contact_name} onChange={e => set('contact_name', e.target.value)}
                    placeholder="James Walsh" className={inputCls} />
                </Field>
              </div>

              <Field label="Your role" required>
                <div className="flex flex-wrap gap-2">
                  {['Director', 'Operations Manager', 'Owner', 'Transport Manager', 'Other'].map(r => (
                    <button key={r} type="button" onClick={() => set('your_role', r)}
                      className={`text-sm px-4 py-2 rounded-xl border font-semibold transition-all ${
                        form.your_role === r
                          ? 'bg-blue-400/20 border-blue-400/50 text-blue-300'
                          : 'bg-white/4 border-white/12 text-white/50 hover:text-white/80 hover:border-white/25'
                      }`}>{r}</button>
                  ))}
                </div>
              </Field>

              <Field label="HQ / Base location" required>
                <input value={form.base_location} onChange={e => set('base_location', e.target.value)}
                  placeholder="Birmingham, UK" className={inputCls} />
              </Field>
            </motion.div>
          )}

          {/* ── STEP 2: Fleet & Operations ─────────────────────── */}
          {step === 2 && (
            <motion.div key="s2"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="bg-white/3 border border-white/8 rounded-3xl p-8 space-y-7">

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Truck className="h-5 w-5 text-blue-300" />
                </div>
                <h2 className="text-xl font-black">Fleet &amp; Operations</h2>
              </div>

              <div>
                <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-3">Fleet size <span className="text-blue-400">*</span></p>
                <div className="flex flex-wrap gap-2">
                  {FLEET_SIZES.map(s => (
                    <button key={s} type="button" onClick={() => set('fleet_size', s)}
                      className={`text-sm px-4 py-2 rounded-xl border font-semibold transition-all ${
                        form.fleet_size === s
                          ? 'bg-blue-400/20 border-blue-400/50 text-blue-300'
                          : 'bg-white/4 border-white/12 text-white/50 hover:text-white/80 hover:border-white/25'
                      }`}>{s}</button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-3">
                  Vehicle types <span className="text-blue-400">*</span>
                  <span className="text-white/25 normal-case ml-2">Select all that apply</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {VEHICLE_TYPES.map(v => (
                    <button key={v} type="button" onClick={() => toggleVehicle(v)}
                      className={`text-sm px-4 py-2 rounded-xl border font-semibold transition-all ${
                        form.vehicle_types.includes(v)
                          ? 'bg-blue-400/20 border-blue-400/50 text-blue-300'
                          : 'bg-white/4 border-white/12 text-white/50 hover:text-white/80 hover:border-white/25'
                      }`}>{v}</button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-3">Operating hours <span className="text-blue-400">*</span></p>
                <RadioGrid options={OPERATING_HOURS_OPTIONS} value={form.operating_hours} onChange={v => set('operating_hours', v)} />
              </div>

              <div>
                <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-3">Coverage area <span className="text-blue-400">*</span></p>
                <RadioGrid options={COVERAGE_OPTIONS} value={form.coverage_area} onChange={v => set('coverage_area', v)} />
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: Certifications & Capabilities ─────────── */}
          {step === 3 && (
            <motion.div key="s3"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-6">

              <div className="bg-white/3 border border-white/8 rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-blue-300" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black">Certifications</h2>
                    <p className="text-white/35 text-sm">These determine your specialist job matches</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                  {CERT_OPTIONS.map(({ key, label, sub }) => (
                    <CBox key={key} checked={form[key as keyof FormData] as boolean}
                      onChange={() => toggleBool(key as keyof FormData)} label={label} sub={sub} />
                  ))}
                </div>
              </div>

              <div className="bg-white/3 border border-white/8 rounded-3xl p-8">
                <h2 className="text-xl font-black mb-2 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-blue-300" /> Cargo types
                </h2>
                <p className="text-white/35 text-sm mb-6">What do you regularly move?</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CARGO_OPTIONS.map(({ key, label, sub }) => (
                    <CBox key={key} checked={form[key as keyof FormData] as boolean}
                      onChange={() => toggleBool(key as keyof FormData)} label={label} sub={sub} />
                  ))}
                </div>
              </div>

              <div className="bg-white/3 border border-white/8 rounded-3xl p-8">
                <h2 className="text-xl font-black mb-2 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-300" /> Service capabilities
                </h2>
                <p className="text-white/35 text-sm mb-6">What service types can you offer?</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SERVICE_OPTIONS.map(({ key, label, sub }) => (
                    <CBox key={key} checked={form[key as keyof FormData] as boolean}
                      onChange={() => toggleBool(key as keyof FormData)} label={label} sub={sub} />
                  ))}
                </div>
              </div>

              {/* Insurance upload */}
              <div className="bg-white/3 border border-white/8 rounded-3xl p-8">
                <h2 className="text-xl font-black mb-2 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-300" /> Insurance certificate
                </h2>
                <p className="text-white/35 text-sm mb-6">
                  Public liability minimum £1,000,000. PDF only, max 5MB.
                </p>
                <input ref={fileRef} type="file" accept="application/pdf" className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    if (f.size > 5 * 1024 * 1024) { alert('File must be under 5MB'); return; }
                    setInsuranceFile(f);
                  }} />
                {insuranceFile ? (
                  <div className="flex items-center justify-between bg-blue-500/10 border border-blue-400/25 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-300 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-white">{insuranceFile.name}</p>
                        <p className="text-xs text-white/40">{(insuranceFile.size / 1024).toFixed(0)} KB</p>
                      </div>
                    </div>
                    <button onClick={() => setInsuranceFile(null)} className="text-white/30 hover:text-white/60 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/12 hover:border-blue-400/30 rounded-2xl py-8 text-white/30 hover:text-blue-300 transition-all">
                    <Upload className="h-8 w-8" />
                    <span className="text-sm font-semibold">Click to upload insurance certificate</span>
                    <span className="text-xs">PDF only · Max 5MB</span>
                  </button>
                )}
                <p className="text-xs text-white/20 mt-3">
                  Don&apos;t have it to hand? Email it to{' '}
                  <span className="text-white/35">carriers@boothop.com</span> after registering — use your company name as the subject.
                </p>
              </div>
            </motion.div>
          )}

          {/* ── STEP 4: Banking & Finalise ─────────────────────── */}
          {step === 4 && (
            <motion.div key="s4"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-6">

              {/* Banking */}
              <div className="bg-white/3 border border-white/8 rounded-3xl p-8 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-blue-300" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black">Banking details</h2>
                    <p className="text-white/35 text-sm">For receiving earnings — paid within 1 week of each job completion</p>
                  </div>
                </div>
                <Field label="Account holder name" required>
                  <input value={form.bank_account_name} onChange={e => set('bank_account_name', e.target.value)}
                    placeholder="Apex Logistics Ltd" className={inputCls} />
                </Field>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Sort code" required
                    hint={form.sort_code && !/^\d{6}$/.test(form.sort_code.replace(/[-\s]/g, '')) ? '⚠ Must be 6 digits' : '6 digits — e.g. 12-34-56'}>
                    <input value={form.sort_code}
                      onChange={e => set('sort_code', e.target.value.replace(/[^\d-]/g, ''))}
                      placeholder="12-34-56" maxLength={8} className={inputCls} />
                  </Field>
                  <Field label="Account number" required
                    hint={form.account_number && !/^\d{8}$/.test(form.account_number.replace(/\s/g, '')) ? '⚠ Must be 8 digits' : '8 digits'}>
                    <input value={form.account_number}
                      onChange={e => set('account_number', e.target.value.replace(/\D/g, '').slice(0, 8))}
                      placeholder="12345678" className={inputCls} />
                  </Field>
                </div>
              </div>

              {/* How did you hear */}
              <div className="bg-white/3 border border-white/8 rounded-3xl p-8">
                <h2 className="text-xl font-black mb-4">How did you hear about us?</h2>
                <div className="flex flex-wrap gap-2">
                  {HOW_HEARD.map(o => (
                    <button key={o} type="button" onClick={() => set('how_did_you_hear', o)}
                      className={`text-sm px-4 py-2 rounded-xl border font-semibold transition-all ${
                        form.how_did_you_hear === o
                          ? 'bg-blue-400/20 border-blue-400/50 text-blue-300'
                          : 'bg-white/4 border-white/12 text-white/50 hover:text-white/80 hover:border-white/25'
                      }`}>{o}</button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white/3 border border-white/8 rounded-3xl p-8">
                <h2 className="text-xl font-black mb-4">Anything else?</h2>
                <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                  placeholder="Specialist capabilities, geographic coverage, anything else we should know…"
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-blue-400/50 transition-all resize-none" />
              </div>

              {/* Registration fee notice */}
              <div className="bg-amber-500/8 border border-amber-500/25 rounded-3xl p-8">
                <p className="text-xs font-black text-amber-400/60 uppercase tracking-widest mb-2">Registration fee</p>
                <p className="text-3xl font-black text-amber-400 mb-3">£250 <span className="text-lg text-amber-400/60">one-time</span></p>
                <p className="text-white/50 text-sm leading-relaxed mb-4">
                  Bank transfer details provided on the next screen. Your carrier profile will be reviewed and activated within 2 working days of payment clearing.
                </p>
                <div className="flex flex-wrap gap-4 text-xs text-white/40">
                  {[
                    'No exclusivity required',
                    'You choose the jobs you accept',
                    'Paid within 1 week of job completion',
                    '70% of the client rate per job',
                  ].map(t => (
                    <span key={t} className="flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 text-blue-300" /> {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Carrier Agreement */}
              <button type="button" onClick={() => toggleBool('agreed_to_terms')}
                className={`w-full flex items-start gap-4 p-5 rounded-2xl border text-left transition-all ${
                  form.agreed_to_terms
                    ? 'bg-blue-500/10 border-blue-400/40'
                    : 'bg-white/3 border-white/8 hover:border-white/20'
                }`}>
                <div className={`w-6 h-6 rounded-lg border flex-shrink-0 flex items-center justify-center transition-all mt-0.5 ${
                  form.agreed_to_terms ? 'bg-blue-400 border-blue-400' : 'border-white/25'
                }`}>
                  {form.agreed_to_terms && <CheckCircle className="h-4 w-4 text-black" strokeWidth={3} />}
                </div>
                <p className="text-sm text-white/70 leading-relaxed">
                  I confirm the information above is accurate and I agree to the{' '}
                  <span className="text-blue-300 underline">BootHop Carrier Agreement</span>.
                  I understand BootHop operates a 70/30 model — I receive 70% of the client rate for each completed job,
                  paid within 1 week of verified delivery.
                </p>
              </button>

              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-3 bg-red-500/10 border border-red-500/25 rounded-2xl px-5 py-4 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                </motion.div>
              )}
            </motion.div>
          )}

        </AnimatePresence>

        {/* Nav buttons */}
        <div className={`flex gap-3 mt-6 ${step > 1 ? 'justify-between' : 'justify-end'}`}>
          {step > 1 && (
            <button onClick={goBack}
              className="inline-flex items-center gap-2 bg-white/6 border border-white/12 text-white/70 font-bold text-sm px-6 py-3 rounded-xl hover:bg-white/10 transition-all">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          )}
          {step < 4 ? (
            <button onClick={goNext} disabled={!currentStepValid}
              className="inline-flex items-center gap-2 bg-blue-400 hover:bg-blue-300 text-black font-black text-sm px-8 py-3 rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100">
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={submit} disabled={!step4Valid || loading}
              className="inline-flex items-center gap-2 bg-blue-400 hover:bg-blue-300 text-black font-black text-sm px-8 py-3 rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100">
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                : <>Submit &amp; Pay £250 <ArrowRight className="h-4 w-4" /></>}
            </button>
          )}
        </div>
      </div>

      <BusinessFooter />
    </div>
  );
}
