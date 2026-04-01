'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Plane, Package, MapPin, Calendar, ArrowRight, CheckCircle, AlertCircle, Mail } from 'lucide-react';
import { createSupabaseClient } from '@/lib/supabase';

const weightOptions = [
  { value: 'letter', label: 'Letter (<1kg)' },
  { value: 'small', label: 'Small (<5kg)' },
  { value: 'medium', label: 'Medium (5–23kg)' },
  { value: 'large', label: 'Large (23–32kg)' },
];

function RegisterForm() {
  const searchParams = useSearchParams();
  const supabase     = createSupabaseClient();

  const initialMode = searchParams.get('type') === 'booter' ? 'travel' : 'send';

  const [mode, setMode]     = useState<'travel' | 'send'>(initialMode as 'travel' | 'send');
  const [form, setForm]     = useState({ from: '', to: '', date: '', weight: '', price: '', email: '' });
  const [step, setStep]     = useState<'trip' | 'email' | 'sent'>('trip');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleTripSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.from || !form.to || !form.date || !form.weight) {
      setError('Please fill in all required fields.');
      return;
    }
    // Block same-day trips
    const today = new Date().toISOString().split('T')[0];
    if (form.date <= today) {
      setError('Please select a future date — same-day trips cannot be listed or matched.');
      return;
    }
    setStep('email');
  };

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.email) { setError('Please enter your email address.'); return; }
    setLoading(true);
    // Save trip details so auth callback can create the record
    localStorage.setItem('pendingTrip', JSON.stringify({
      from: form.from, to: form.to, date: form.date,
      weight: form.weight, price: form.price, mode,
    }));
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: form.email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (otpError) { localStorage.removeItem('pendingTrip'); setError(otpError.message); return; }
    setStep('sent');
  };

  const inputCls = 'w-full rounded-xl border border-white/15 bg-white/8 px-4 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 hover:bg-white/12 backdrop-blur-sm';
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">

      {/* ── LEFT IMAGE PANEL ── */}
      <div className="hidden lg:flex lg:w-5/12 relative flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/images/Handover.jpg" alt="BootHop" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950/85 via-slate-900/75 to-blue-900/60" />
        </div>
        <Link href="/" className="relative z-10 flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50">
            <Plane className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">Boot<span className="text-cyan-400">Hop</span></span>
        </Link>
        <div className="relative z-10 space-y-4">
          <h2 className="text-white text-2xl font-bold leading-snug">Post your trip in seconds</h2>
          {[
            { value: '50K+', label: 'successful deliveries' },
            { value: '200+', label: 'cities worldwide' },
            { value: '95%',  label: 'satisfaction rate' },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-cyan-400 flex-shrink-0" />
              <span className="text-white/80 text-sm"><strong className="text-white font-semibold">{s.value}</strong> {s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 overflow-y-auto flex flex-col">

        {/* Mobile top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
              <Plane className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Boot<span className="text-cyan-400">Hop</span></span>
          </Link>
          <Link href="/login" className="text-sm text-slate-400 hover:text-white transition">
            Have an account? <span className="text-cyan-400 font-semibold">Sign in</span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">

            {/* ── SENT STATE ── */}
            {step === 'sent' && (
              <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-sm p-10 text-center shadow-2xl">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="relative">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/50">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-black text-white mb-2">Check your email</h2>
                  <p className="text-slate-400 mb-4">We sent a magic link to</p>
                  <p className="text-cyan-400 font-semibold mb-6">{form.email}</p>
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                    Click the link to verify and your trip will be posted automatically.
                  </div>
                  <button onClick={() => { setStep('trip'); setForm({ from: '', to: '', date: '', weight: '', price: '', email: '' }); }}
                    className="mt-6 text-sm text-slate-500 hover:text-white transition">
                    Post another trip
                  </button>
                </div>
              </div>
            )}

            {/* ── EMAIL STEP ── */}
            {step === 'email' && (
              <div className="relative overflow-hidden rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm p-8 shadow-2xl">
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                <button onClick={() => setStep('trip')} className="relative mb-5 text-sm text-slate-400 hover:text-white transition flex items-center gap-1">
                  ← Back
                </button>
                <div className="relative mb-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/50">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-white">Almost there</h2>
                  <p className="text-slate-400 text-sm mt-1">Enter your email to confirm and post your trip.</p>
                </div>

                {/* Trip summary */}
                <div className="relative mt-5 mb-5 rounded-xl border border-white/10 bg-white/5 p-4 text-sm space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${mode === 'travel' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                      {mode === 'travel' ? '✈️ Travelling' : '📦 Sending'}
                    </span>
                  </div>
                  <p className="text-white font-semibold">{form.from} → {form.to}</p>
                  <p className="text-slate-400">{new Date(form.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · {weightOptions.find(w => w.value === form.weight)?.label}{form.price ? ` · £${form.price}` : ''}</p>
                </div>

                {error && (
                  <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3">
                    <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSendLink} className="relative space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Email address</label>
                    <input type="email" required value={form.email} onChange={set('email')}
                      placeholder="you@example.com" className={inputCls} />
                  </div>
                  <button type="submit" disabled={loading}
                    className="group w-full bg-gradient-to-r from-blue-600 to-cyan-500 py-4 rounded-xl text-sm font-bold text-white hover:shadow-xl hover:shadow-blue-500/50 disabled:opacity-60 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2">
                    {loading ? 'Sending link…' : (<>Send magic link <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>)}
                  </button>
                  <p className="text-xs text-slate-500 text-center">No password needed · Free to join · Cancel anytime</p>
                </form>
              </div>
            )}

            {/* ── TRIP FORM STEP ── */}
            {step === 'trip' && (
              <div className="relative overflow-hidden rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm p-8 shadow-2xl">
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative mb-6">
                  <h1 className="text-3xl font-black text-white mb-1">Post a trip</h1>
                  <p className="text-slate-400 text-sm">
                    Already registered?{' '}
                    <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">Sign in →</Link>
                  </p>
                </div>

                {/* Mode toggle */}
                <div className="relative flex rounded-xl border border-white/15 bg-white/5 p-1 mb-6 backdrop-blur-sm">
                  <button type="button" onClick={() => setMode('travel')}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold transition-all duration-300 ${mode === 'travel' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/40 scale-[1.02]' : 'text-slate-400 hover:text-white'}`}>
                    <Plane className="h-4 w-4" /> I&apos;m Travelling
                  </button>
                  <button type="button" onClick={() => setMode('send')}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold transition-all duration-300 ${mode === 'send' ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/40 scale-[1.02]' : 'text-slate-400 hover:text-white'}`}>
                    <Package className="h-4 w-4" /> I&apos;m Sending
                  </button>
                </div>

                {error && (
                  <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3">
                    <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                )}

                <form onSubmit={handleTripSubmit} className="relative space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                      <input type="text" placeholder="From city" required value={form.from} onChange={set('from')}
                        className={`${inputCls} pl-9`} />
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                      <input type="text" placeholder="To city" required value={form.to} onChange={set('to')}
                        className={`${inputCls} pl-9`} />
                    </div>
                  </div>

                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                    <input type="date" required value={form.date} onChange={set('date')}
                      min={tomorrow}
                      className={`${inputCls} pl-9 [color-scheme:dark]`} />
                    <p className="mt-1 text-xs text-slate-600">Same-day trips cannot be listed — please select a future date.</p>
                  </div>

                  <select required value={form.weight} onChange={set('weight')}
                    className={`${inputCls} cursor-pointer`} style={{ colorScheme: 'dark' }}>
                    <option value="" className="bg-slate-900 text-slate-400">Weight / size</option>
                    {weightOptions.map((o) => (
                      <option key={o.value} value={o.value} className="bg-slate-900 text-white">{o.label}</option>
                    ))}
                  </select>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">£</span>
                    <input type="number" placeholder={mode === 'travel' ? 'Price per delivery (optional)' : 'Budget (optional)'}
                      value={form.price} onChange={set('price')} min="0"
                      className={`${inputCls} pl-7`} />
                  </div>

                  <button type="submit"
                    className="group w-full bg-gradient-to-r from-blue-600 to-cyan-500 py-4 rounded-xl text-sm font-bold text-white hover:shadow-xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2">
                    Register <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
