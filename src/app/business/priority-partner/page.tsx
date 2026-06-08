'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Star, Clock, ShieldCheck, Zap, User, CheckCircle,
  ArrowRight, Loader2, Send, Lock, Mail,
  Truck, Plane, Briefcase,
} from 'lucide-react';
import { BusinessNav } from '@/components/business/BusinessNav';
import BusinessFooter from '@/components/business/BusinessFooter';

const FEES: Record<'uk' | 'international', number> = {
  uk:            10000,
  international: 15000,
};

const PERKS = [
  { icon: Clock,       label: '2-hour response guarantee',    sub: 'Every request answered within 2 hours, guaranteed' },
  { icon: User,        label: 'Dedicated account manager',    sub: 'Your own named contact at BootHop' },
  { icon: Zap,         label: 'Priority carrier matching',    sub: 'Your jobs jump to the front of our carrier network' },
  { icon: ShieldCheck, label: 'Volume discounts on delivery', sub: 'Automatic savings applied at invoice — no negotiation' },
];

const STEPS = [
  { icon: Send,  step: '01', title: 'Apply',           body: 'Fill in the short form below. Takes under 2 minutes.' },
  { icon: Lock,  step: '02', title: 'Pay annually',    body: 'Complete your annual membership fee via bank transfer.' },
  { icon: User,  step: '03', title: 'Account active',  body: 'We activate your Priority Partner status within 1 week of payment clearing.' },
  { icon: Zap,   step: '04', title: 'Priority service', body: 'Every job you place is flagged Priority from day one.' },
];

const INDUSTRY_OPTIONS = [
  'Aerospace & Aviation',
  'Engineering & Manufacturing',
  'Healthcare & Pharma',
  'Legal & Finance',
  'Events & Production',
  'Other',
];

const WHAT_MOVING_OPTIONS = [
  { key: 'Aerospace / AOG parts',    sub: 'Aircraft components, tooling' },
  { key: 'Pharma & clinical',        sub: 'Temperature-sensitive, specimens' },
  { key: 'Legal documents',          sub: 'Confidential, time-critical' },
  { key: 'Luxury goods',             sub: 'High-value, white-glove handling' },
  { key: 'Tech & electronics',       sub: 'ESD-sensitive, fragile' },
  { key: 'Other specialist cargo',   sub: 'Anything not listed above' },
];

const PERSONAL_DOMAINS = ['gmail.', 'hotmail.', 'yahoo.', 'outlook.com', 'icloud.', 'live.', 'aol.', 'proton.', 'me.com'];
const isPersonalEmail = (e: string) => PERSONAL_DOMAINS.some(d => e.toLowerCase().includes(d));

interface FormState {
  email: string;
  company_name: string;
  phone: string;
  job_title: string;
  industry_sector: string;
  delivery_type: '' | 'uk' | 'international';
  delivery_frequency: string;
  typical_destinations: string;
  what_moving: string[];
  notes: string;
}

const INITIAL: FormState = {
  email: '', company_name: '', phone: '',
  job_title: '', industry_sector: '',
  delivery_type: '',
  delivery_frequency: '', typical_destinations: '',
  what_moving: [],
  notes: '',
};

function CBox({ checked, onChange, label, sub }: { checked: boolean; onChange: () => void; label: string; sub: string }) {
  return (
    <button type="button" onClick={onChange}
      className={`text-left p-4 rounded-2xl border transition-all ${
        checked ? 'bg-amber-500/10 border-amber-400/45' : 'bg-white/3 border-white/8 hover:border-white/20 hover:bg-white/5'
      }`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 w-5 h-5 rounded-md border flex-shrink-0 flex items-center justify-center transition-all ${
          checked ? 'bg-amber-400 border-amber-400' : 'border-white/25'
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

const inputCls = 'w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm transition-all';

export default function PriorityPartnerPage() {
  const router = useRouter();
  const [gate, setGate]           = useState<'check' | 'email' | 'otp' | 'form'>('check');
  const [gateEmail, setGateEmail] = useState('');
  const [gateOtp, setGateOtp]     = useState('');
  const [gateError, setGateError] = useState<string | null>(null);
  const [gateLoading, setGateLoading] = useState(false);
  const [form, setForm]   = useState<FormState>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/business/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.authenticated && d.partner_status === 'active') {
          router.replace('/business/portal/priority');
        } else if (d.authenticated) {
          setGate('form');
        } else {
          setGate('email');
        }
      })
      .catch(() => setGate('email'));
  }, [router]);

  const routeAfterAuth = async (email: string) => {
    const me = await fetch('/api/business/auth/me').then(r => r.json());
    if (me.partner_status === 'active') {
      router.replace('/business/portal/priority');
    } else {
      setForm(f => ({ ...f, email: email.trim() }));
      setGate('form');
    }
  };

  const sendGateOtp = async () => {
    if (PERSONAL_DOMAINS.some(d => gateEmail.toLowerCase().includes(d))) {
      setGateError('Personal email not accepted. Please use your company email.');
      return;
    }
    setGateError(null); setGateLoading(true);
    try {
      const res = await fetch('/api/business/auth/send-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: gateEmail.trim() }),
      });
      const j = await res.json();
      if (!res.ok) { setGateError(j.error || 'Could not send code.'); return; }
      if (j.skipOtp) {
        await routeAfterAuth(gateEmail);
        return;
      }
      setGate('otp');
    } catch { setGateError('Could not send code. Please try again.'); }
    finally { setGateLoading(false); }
  };

  const verifyGateOtp = async () => {
    setGateError(null); setGateLoading(true);
    try {
      const res = await fetch('/api/business/auth/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: gateOtp.trim() }),
      });
      const j = await res.json();
      if (!res.ok) { setGateError(j.error || 'Invalid code.'); return; }
      await routeAfterAuth(gateEmail);
    } catch { setGateError('Verification failed. Try again.'); }
    finally { setGateLoading(false); }
  };

  const fee = form.delivery_type ? FEES[form.delivery_type] : null;

  const toggleWhat = (k: string) =>
    setForm(f => ({
      ...f,
      what_moving: f.what_moving.includes(k)
        ? f.what_moving.filter(x => x !== k)
        : [...f.what_moving, k],
    }));

  const canSubmit = !!(
    form.email && !isPersonalEmail(form.email) &&
    form.company_name && form.phone &&
    form.job_title && form.industry_sector &&
    form.delivery_type && form.delivery_frequency &&
    form.typical_destinations
  );

  const submit = async () => {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/business/priority-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) { setError('Something went wrong — please try again.'); return; }
      router.push(
        `/business/priority-partner/payment?type=${form.delivery_type}&email=${encodeURIComponent(form.email)}&company=${encodeURIComponent(form.company_name)}`
      );
    } catch {
      setError('Something went wrong — please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (gate === 'check') return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #020617 0%, #0c1e3d 50%, #020617 100%)' }}>
      <Star className="h-8 w-8 text-amber-400 animate-pulse" />
    </div>
  );

  if (gate === 'email' || gate === 'otp') return (
    <div className="min-h-screen text-white"
      style={{ background: 'linear-gradient(135deg, #020617 0%, #0c1e3d 50%, #020617 100%)' }}>
      <BusinessNav />
      <div className="min-h-screen flex items-center justify-center px-6 py-24">
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">

          {/* Left — perks panel */}
          <div className="hidden md:block">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 uppercase tracking-widest">
              <Star className="h-3 w-3" /> Exclusive membership
            </div>
            <h2 className="text-3xl font-black mb-2">
              BootHop <span className="text-amber-400">Priority</span>
            </h2>
            <p className="text-white/45 text-sm leading-relaxed mb-8">
              Dedicated account management, guaranteed 2-hour responses, and automatic volume discounts — from day one of your membership.
            </p>
            <ul className="space-y-4">
              {PERKS.map(({ icon: Icon, label, sub }) => (
                <li key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{label}</p>
                    <p className="text-xs text-white/35 mt-0.5">{sub}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex gap-4 text-center">
              <div className="flex-1 bg-white/4 border border-white/8 rounded-xl p-3">
                <p className="text-xl font-black text-amber-400">£10k</p>
                <p className="text-xs text-white/35">UK annual</p>
              </div>
              <div className="flex-1 bg-white/4 border border-white/8 rounded-xl p-3">
                <p className="text-xl font-black text-amber-400">£15k</p>
                <p className="text-xs text-white/35">International</p>
              </div>
              <div className="flex-1 bg-white/4 border border-white/8 rounded-xl p-3">
                <p className="text-xl font-black text-amber-400">2hr</p>
                <p className="text-xs text-white/35">Response SLA</p>
              </div>
            </div>
          </div>

          {/* Right — auth form */}
          <div>
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-5">
                <Star className="h-7 w-7 text-amber-400" />
              </div>
              <h2 className="text-2xl font-black mb-2">
                {gate === 'otp' ? 'Check your inbox' : 'Sign in or apply'}
              </h2>
              <p className="text-white/40 text-sm max-w-xs mx-auto">
                {gate === 'otp'
                  ? `We sent a 6-digit code to ${gateEmail}`
                  : 'Existing Priority Clients will be taken straight to your portal. New applications take 2 minutes.'}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-8 space-y-4">
              {gateError && <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-300 text-sm">{gateError}</div>}
              {gate === 'email' ? (
                <>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <input type="email" value={gateEmail}
                      onChange={e => { setGateEmail(e.target.value); setGateError(null); }}
                      onKeyDown={e => e.key === 'Enter' && sendGateOtp()}
                      placeholder="you@yourcompany.com" autoFocus
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/20 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm" />
                  </div>
                  <p className="text-white/25 text-xs text-center">Business email only — personal addresses not accepted.</p>
                  <button onClick={sendGateOtp} disabled={gateLoading || !gateEmail.trim()}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black bg-gradient-to-r from-amber-400 to-orange-400 text-black disabled:opacity-40 hover:scale-[1.02] transition-all">
                    {gateLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    {gateLoading ? 'Checking…' : 'Continue →'}
                  </button>
                </>
              ) : (
                <>
                  <input type="text" inputMode="numeric" value={gateOtp}
                    onChange={e => { setGateOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setGateError(null); }}
                    onKeyDown={e => e.key === 'Enter' && verifyGateOtp()}
                    placeholder="_ _ _ _ _ _" autoFocus maxLength={6}
                    className="w-full text-center text-3xl font-mono tracking-[0.4em] py-4 rounded-xl bg-white/20 border border-white/20 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  <button onClick={verifyGateOtp} disabled={gateLoading || gateOtp.length < 6}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black bg-gradient-to-r from-amber-400 to-orange-400 text-black disabled:opacity-40 hover:scale-[1.02] transition-all">
                    {gateLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    {gateLoading ? 'Verifying…' : 'Verify & Continue'}
                  </button>
                  <button onClick={() => { setGate('email'); setGateOtp(''); setGateError(null); }}
                    className="w-full text-center text-white/25 hover:text-white/50 text-sm transition-colors">
                    ← Use a different email
                  </button>
                  <button onClick={sendGateOtp}
                    className="w-full text-center text-white/20 text-xs hover:text-white/40 transition-colors">
                    Didn't get it? Resend code
                  </button>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
      <BusinessFooter />
    </div>
  );

  return (
    <div className="min-h-screen text-white"
      style={{ background: 'linear-gradient(135deg, #020617 0%, #0c1e3d 50%, #020617 100%)', backgroundAttachment: 'fixed' }}>

      <BusinessNav
        rightSlot={
          <span className="text-xs font-semibold bg-amber-500/20 border border-amber-500/30 text-amber-400 px-2.5 py-1 rounded-full uppercase tracking-widest">
            Priority Partner
          </span>
        }
      />

      <div className="max-w-5xl mx-auto px-6 pt-24 pb-16">

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold px-4 py-2 rounded-full mb-8 uppercase tracking-widest">
            <Star className="h-3.5 w-3.5" /> Exclusive annual membership
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-6">
            Priority Partner<br /><span className="text-amber-400">Programme.</span>
          </h1>
          <p className="text-white/50 text-xl max-w-2xl mx-auto leading-relaxed">
            Guaranteed 2-hour responses, a dedicated account team, and automatic delivery discounts —
            activated the moment your annual membership is confirmed.
          </p>
        </motion.div>

        {/* How it works */}
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

        {/* Annual membership fee / plan selection */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-16">
          <h2 className="text-2xl font-black text-center mb-3">Annual membership fee</h2>
          <p className="text-white/40 text-center text-sm mb-10">One payment per year. Your discount applies automatically to every delivery.</p>
          <div className="grid md:grid-cols-2 gap-6">

            {/* UK */}
            <div onClick={() => setForm(p => ({ ...p, delivery_type: 'uk' }))}
              className={`group relative overflow-hidden rounded-2xl p-8 cursor-pointer transition-all duration-300 active:scale-[0.97] ${
                form.delivery_type === 'uk'
                  ? 'border-2 border-amber-400/60 bg-amber-500/8 shadow-2xl shadow-amber-500/20'
                  : 'border border-white/8 bg-white/3 hover:border-amber-500/30 hover:bg-white/5 hover:-translate-y-1'
              }`}>
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
              <p className="text-white/40 text-sm mb-4">For UK delivery accounts</p>
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
            <div onClick={() => setForm(p => ({ ...p, delivery_type: 'international' }))}
              className={`group relative overflow-hidden rounded-2xl p-8 cursor-pointer transition-all duration-300 active:scale-[0.97] ${
                form.delivery_type === 'international'
                  ? 'border-2 border-amber-400/60 bg-amber-500/8 shadow-2xl shadow-amber-500/20'
                  : 'border border-amber-500/20 bg-amber-500/4 hover:border-amber-500/40 hover:bg-amber-500/8 hover:-translate-y-1'
              }`}>
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

        {/* Perks detail */}
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

        {/* Application form */}
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

            <div className="space-y-5">
              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-300 text-sm">{error}</div>
              )}

              {/* Contact fields */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/40 block mb-1.5">Business email <span className="text-amber-400">*</span></label>
                  <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    type="email" placeholder="you@company.com" className={inputCls} />
                  {form.email && isPersonalEmail(form.email) && (
                    <p className="text-xs text-red-400 mt-1">Personal email not accepted</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-white/40 block mb-1.5">Company name <span className="text-amber-400">*</span></label>
                  <input value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))}
                    placeholder="Acme Ltd" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-white/40 block mb-1.5">Phone number <span className="text-amber-400">*</span></label>
                  <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    type="tel" placeholder="+44 7700 000000" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-white/40 block mb-1.5">Job title <span className="text-amber-400">*</span></label>
                  <input value={form.job_title} onChange={e => setForm(p => ({ ...p, job_title: e.target.value }))}
                    placeholder="Head of Operations" className={inputCls} />
                </div>
              </div>

              {/* Industry sector */}
              <div>
                <label className="text-xs text-white/40 block mb-2">Industry sector <span className="text-amber-400">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRY_OPTIONS.map(opt => (
                    <button key={opt} type="button" onClick={() => setForm(p => ({ ...p, industry_sector: opt }))}
                      className={`text-sm px-4 py-2 rounded-xl border font-semibold transition-all ${
                        form.industry_sector === opt
                          ? 'bg-amber-400/20 border-amber-400/50 text-amber-300'
                          : 'bg-white/4 border-white/12 text-white/50 hover:text-white/80 hover:border-white/25'
                      }`}>{opt}</button>
                  ))}
                </div>
              </div>

              {/* Delivery frequency */}
              <div>
                <label className="text-xs text-white/40 block mb-2">How often do you need deliveries? <span className="text-amber-400">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {['Daily', 'Weekly', 'Monthly', 'Emergency only'].map(opt => (
                    <button key={opt} type="button" onClick={() => setForm(p => ({ ...p, delivery_frequency: opt }))}
                      className={`text-sm px-4 py-2 rounded-xl border font-semibold transition-all ${
                        form.delivery_frequency === opt
                          ? 'bg-amber-400/20 border-amber-400/50 text-amber-300'
                          : 'bg-white/4 border-white/12 text-white/50 hover:text-white/80 hover:border-white/25'
                      }`}>{opt}</button>
                  ))}
                </div>
              </div>

              {/* Typical destinations */}
              <div>
                <label className="text-xs text-white/40 block mb-2">Typical destinations <span className="text-amber-400">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {['UK only', 'UK & Europe', 'International'].map(opt => (
                    <button key={opt} type="button" onClick={() => setForm(p => ({ ...p, typical_destinations: opt }))}
                      className={`text-sm px-4 py-2 rounded-xl border font-semibold transition-all ${
                        form.typical_destinations === opt
                          ? 'bg-amber-400/20 border-amber-400/50 text-amber-300'
                          : 'bg-white/4 border-white/12 text-white/50 hover:text-white/80 hover:border-white/25'
                      }`}>{opt}</button>
                  ))}
                </div>
              </div>

              {/* What are they moving */}
              <div>
                <label className="text-xs text-white/40 block mb-2 flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" /> What are you typically moving?
                  <span className="text-white/25 normal-case">Select all that apply</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {WHAT_MOVING_OPTIONS.map(({ key, sub }) => (
                    <CBox key={key} checked={form.what_moving.includes(key)}
                      onChange={() => toggleWhat(key)} label={key} sub={sub} />
                  ))}
                </div>
              </div>

              {/* Plan confirmation */}
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
                  <button onClick={() => setForm(p => ({ ...p, delivery_type: '' }))}
                    className="text-white/30 hover:text-white/60 text-xs transition-colors">Change</button>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-xs text-white/40 block mb-1.5">Anything else we should know?</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  rows={2} placeholder="Routes you need, goods types, timing requirements…"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm resize-none" />
              </div>

              <button onClick={submit} disabled={loading || !canSubmit}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 text-black font-black text-sm disabled:opacity-40 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-amber-500/25">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                {loading ? 'Processing…' : fee ? `Proceed to payment — £${fee.toLocaleString()}` : 'Proceed to payment'}
              </button>

              <p className="text-white/20 text-xs text-center">
                Payment via bank transfer on the next step · Account activated within 1 week of payment clearing
              </p>
            </div>
          </div>
        </motion.div>

        <p className="text-center text-white/15 text-xs mt-12 max-w-xl mx-auto">
          Volume discounts are applied automatically at invoice stage. Membership renews annually.
          Cancel any time before renewal to stop the next charge.
        </p>
      </div>

      <BusinessFooter />
    </div>
  );
}
