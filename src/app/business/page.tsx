'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Mail, ShieldCheck, CheckCircle, ArrowRight } from 'lucide-react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type Stage = 'loading' | 'email' | 'otp' | 'form' | 'success';

type JobForm = {
  pickup: string;
  dropoff: string;
  description: string;
  weight: string;
  value: string;
  category: string;
  urgency: 'same_day' | 'next_day';
  insurance: boolean;
};

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function BoothopBusiness() {
  const [stage,      setStage]      = useState<Stage>('loading');
  const [bizEmail,   setBizEmail]   = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [otpInput,   setOtpInput]   = useState('');
  const [authError,  setAuthError]  = useState<string | null>(null);
  const [authLoading,setAuthLoading]= useState(false);
  const [jobRef,     setJobRef]     = useState('');

  const [form, setForm] = useState<JobForm>({
    pickup: '', dropoff: '', description: '',
    weight: '', value: '', category: '',
    urgency: 'same_day', insurance: true,
  });
  const [price,       setPrice]       = useState<number | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError,   setFormError]   = useState<string | null>(null);

  // ── Check existing business session on load ──
  useEffect(() => {
    fetch('/api/business/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.authenticated) {
          setBizEmail(d.email);
          setStage('form');
        } else {
          setStage('email');
        }
      })
      .catch(() => setStage('email'));
  }, []);

  // ── Live price estimate ──
  useEffect(() => {
    if (!form.pickup || !form.dropoff) { setPrice(null); return; }
    const from = form.pickup.toLowerCase();
    const to   = form.dropoff.toLowerCase();
    if (from.includes('nottingham') && to.includes('leicester')) setPrice(250);
    else if (to.includes('london')  || from.includes('london'))  setPrice(500);
    else setPrice(300);
  }, [form.pickup, form.dropoff]);

  // ─────────────────────────────────────────────
  // Auth handlers
  // ─────────────────────────────────────────────
  const sendOtp = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      const res = await fetch('/api/business/auth/send-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: emailInput.trim() }),
      });
      const j = await res.json();
      if (!res.ok) { setAuthError(j.error); return; }
      setStage('otp');
    } catch { setAuthError('Could not send code. Please try again.'); }
    finally { setAuthLoading(false); }
  };

  const verifyOtp = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      const res = await fetch('/api/business/auth/verify-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code: otpInput.trim() }),
      });
      const j = await res.json();
      if (!res.ok) { setAuthError(j.error); return; }
      setBizEmail(j.email);
      setStage('form');
    } catch { setAuthError('Verification failed. Please try again.'); }
    finally { setAuthLoading(false); }
  };

  // ─────────────────────────────────────────────
  // Job submission
  // ─────────────────────────────────────────────
  const submitJob = async () => {
    if (!form.insurance) { setFormError('Insurance is compulsory.'); return; }
    if (!form.pickup || !form.dropoff) { setFormError('Pickup and drop-off are required.'); return; }
    setFormError(null);
    setFormLoading(true);
    try {
      const res = await fetch('/api/business/create-job', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...form, price }),
      });
      const j = await res.json();
      if (!res.ok) { setFormError(j.error || 'Something went wrong.'); return; }
      setJobRef(j.jobRef);
      setStage('success');
    } catch { setFormError('Something went wrong. Please try again.'); }
    finally { setFormLoading(false); }
  };

  // ─────────────────────────────────────────────
  // Loading
  // ─────────────────────────────────────────────
  if (stage === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-4xl font-bold">
            BootHop <span className="text-emerald-400">Business</span>
          </h1>
          <p className="text-gray-400 mt-2">Premium logistics for time-sensitive business deliveries</p>
        </motion.div>

        <AnimatePresence mode="wait">

          {/* ── STAGE: EMAIL ── */}
          {stage === 'email' && (
            <motion.div
              key="email"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-xl max-w-md mx-auto"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">Business access only</h2>
                  <p className="text-white/40 text-sm">Enter your company email to continue</p>
                </div>
              </div>

              {authError && (
                <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-300 text-sm">
                  {authError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-white/40 font-semibold uppercase tracking-wider block mb-1.5">
                    Business email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <input
                      type="email"
                      value={emailInput}
                      onChange={e => setEmailInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendOtp()}
                      placeholder="you@yourcompany.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                  <p className="text-xs text-white/25 mt-1.5">Gmail and personal email addresses are not accepted</p>
                </div>

                <button
                  onClick={sendOtp}
                  disabled={authLoading || !emailInput.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-bold text-sm disabled:opacity-40 hover:scale-[1.02] transition-all"
                >
                  {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  {authLoading ? 'Sending code…' : 'Send verification code'}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STAGE: OTP ── */}
          {stage === 'otp' && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-xl max-w-md mx-auto"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">Check your email</h2>
                  <p className="text-white/40 text-sm">We sent a 6-digit code to <span className="text-emerald-400">{emailInput}</span></p>
                </div>
              </div>

              {authError && (
                <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-300 text-sm">
                  {authError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-white/40 font-semibold uppercase tracking-wider block mb-1.5">
                    Verification code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otpInput}
                    onChange={e => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onKeyDown={e => e.key === 'Enter' && verifyOtp()}
                    placeholder="000000"
                    className="w-full text-center text-3xl font-mono tracking-[0.5em] py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  onClick={verifyOtp}
                  disabled={authLoading || otpInput.length < 6}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-bold text-sm disabled:opacity-40 hover:scale-[1.02] transition-all"
                >
                  {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  {authLoading ? 'Verifying…' : 'Verify & continue'}
                </button>

                <button
                  onClick={() => { setStage('email'); setOtpInput(''); setAuthError(null); }}
                  className="w-full text-center text-white/30 hover:text-white/60 text-sm transition-colors"
                >
                  Use a different email
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STAGE: FORM ── */}
          {stage === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            >
              {/* Logged in bar */}
              <div className="flex items-center gap-2 mb-6 text-sm text-white/40">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Logged in as <span className="text-emerald-400 font-semibold">{bizEmail}</span>
              </div>

              <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-xl space-y-6">

                {/* Route */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/40 font-semibold uppercase tracking-wider block mb-1.5">Pickup location</label>
                    <input
                      value={form.pickup}
                      onChange={e => setForm({ ...form, pickup: e.target.value })}
                      placeholder="e.g. Nottingham city centre"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 font-semibold uppercase tracking-wider block mb-1.5">Drop-off location</label>
                    <input
                      value={form.dropoff}
                      onChange={e => setForm({ ...form, dropoff: e.target.value })}
                      placeholder="e.g. London EC2A"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs text-white/40 font-semibold uppercase tracking-wider block mb-1.5">Describe the goods</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="What needs to be delivered?"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none"
                  />
                </div>

                {/* Details */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-white/40 font-semibold uppercase tracking-wider block mb-1.5">Weight (kg)</label>
                    <input
                      value={form.weight}
                      onChange={e => setForm({ ...form, weight: e.target.value })}
                      placeholder="e.g. 5"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 font-semibold uppercase tracking-wider block mb-1.5">Declared value (£)</label>
                    <input
                      value={form.value}
                      onChange={e => setForm({ ...form, value: e.target.value })}
                      placeholder="e.g. 500"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 font-semibold uppercase tracking-wider block mb-1.5">Category</label>
                    <select
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    >
                      <option value="">Select category</option>
                      <option>Documents</option>
                      <option>Medical</option>
                      <option>Parts</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                {/* Urgency */}
                <div>
                  <label className="text-xs text-white/40 font-semibold uppercase tracking-wider block mb-2">Urgency</label>
                  <div className="flex gap-3">
                    {(['same_day', 'next_day'] as const).map(u => (
                      <button
                        key={u}
                        onClick={() => setForm({ ...form, urgency: u })}
                        className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                          form.urgency === u
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black'
                            : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        {u === 'same_day' ? 'Same Day' : 'Next Morning'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Insurance */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${form.insurance ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'}`}>
                    {form.insurance && <CheckCircle className="h-3.5 w-3.5 text-black" />}
                  </div>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={form.insurance}
                    onChange={() => setForm({ ...form, insurance: !form.insurance })}
                  />
                  <span className="text-sm text-white/70">
                    Insurance <span className="text-white/30 text-xs">(compulsory for all business deliveries)</span>
                  </span>
                </label>

                {/* Price */}
                {price && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center justify-between"
                  >
                    <span className="text-white/50 text-sm">Estimated price</span>
                    <span className="text-emerald-400 font-bold text-2xl">£{price}</span>
                  </motion.div>
                )}

                {formError && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-300 text-sm">
                    {formError}
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={submitJob}
                  disabled={formLoading}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 text-black font-bold text-base hover:scale-[1.02] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {formLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                  {formLoading ? 'Submitting…' : 'Submit delivery request'}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STAGE: SUCCESS ── */}
          {stage === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 max-w-md mx-auto"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-emerald-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">Request submitted</h2>
              <p className="text-white/40 mb-6">Your delivery request has been received. We will match a carrier and be in touch shortly.</p>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-6 py-4 inline-block">
                <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">Your job reference</p>
                <p className="text-emerald-400 font-mono font-bold text-2xl tracking-widest">{jobRef}</p>
              </div>
              <p className="text-white/30 text-sm mt-6">A confirmation has been sent to <span className="text-white/50">{bizEmail}</span></p>
              <button
                onClick={() => { setStage('form'); setFormError(null); setForm({ pickup:'', dropoff:'', description:'', weight:'', value:'', category:'', urgency:'same_day', insurance:true }); }}
                className="mt-8 text-emerald-400 hover:text-emerald-300 text-sm font-semibold transition-colors"
              >
                Submit another request →
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
