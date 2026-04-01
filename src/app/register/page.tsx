'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Package, Plane, MapPin, Calendar, ArrowRight, CheckCircle, AlertCircle, Mail, Home, PlusCircle } from 'lucide-react';
import { createSupabaseClient } from '@/lib/supabase';
import BootHopLogo from '@/components/BootHopLogo';

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

  const [mode, setMode]       = useState<'travel' | 'send'>(initialMode as 'travel' | 'send');
  const [form, setForm]       = useState({ from: '', to: '', date: '', weight: '', price: '', email: '' });
  const [step, setStep]       = useState<'trip' | 'email' | 'sent'>('trip');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [currency, setCurrency] = useState('£');

  useEffect(() => {
    const lang = navigator.language || navigator.languages?.[0] || '';
    setCurrency(lang === 'en-GB' || lang.startsWith('en-GB') ? '£' : '$');
  }, []);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const resetForm = () => setForm({ from: '', to: '', date: '', weight: '', price: '', email: '' });

  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const handleTripSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.from || !form.to || !form.date || !form.weight || !form.price) {
      setError('Please fill in all fields including price.');
      return;
    }
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

  const inputCls = 'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 hover:bg-white/10 backdrop-blur-sm';

  return (
    <div className="min-h-screen flex text-white overflow-hidden">

      {/* ── LEFT IMAGE PANEL — wider ── */}
      <div className="hidden lg:flex lg:w-3/5 relative flex-col justify-between overflow-hidden">
        {/* Background image fills entire panel */}
        <div className="absolute inset-0">
          <Image src="/images/Handover.jpg" alt="BootHop" fill className="object-cover object-center" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/20 via-slate-900/30 to-slate-950/80" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/30" />
        </div>

        {/* Animated ping dots */}
        <div className="absolute inset-0 opacity-60 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
          <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '2s' }} />
        </div>

        {/* Logo — top left */}
        <div className="relative z-10 p-10">
          <Link href="/" className="inline-flex group">
            <BootHopLogo size="lg" iconClass="text-white group-hover:scale-110 transition-transform duration-300" textClass="text-white" />
          </Link>
        </div>

        {/* Bottom content */}
        <div className="relative z-10 p-10 pb-14 space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 backdrop-blur-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-white/80 font-medium">Live platform · 10K+ verified users</span>
          </div>
          <h2 className="text-white text-4xl font-black leading-tight">
            Post your trip.<br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
              Earn while you travel.
            </span>
          </h2>
          <div className="space-y-3">
            {[
              { value: '50K+', label: 'successful deliveries' },
              { value: '200+', label: 'cities worldwide' },
              { value: '95%',  label: 'satisfaction rate' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3 group">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CheckCircle className="h-4 w-4 text-cyan-400" />
                </div>
                <span className="text-white/80 text-sm">
                  <strong className="text-white font-bold">{s.value}</strong> {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="flex-1 lg:w-2/5 overflow-y-auto flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative">

        {/* Background blobs on right panel */}
        <div className="fixed inset-0 opacity-20 pointer-events-none z-0" style={{ left: '60%' }}>
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
        </div>

        {/* Mobile top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 lg:hidden relative z-10">
          <Link href="/">
            <BootHopLogo size="sm" iconClass="text-white" textClass="text-white" />
          </Link>
          <Link href="/login" className="text-sm text-slate-400 hover:text-white transition">
            Sign in
          </Link>
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">

            {/* ── SENT STATE ── */}
            {step === 'sent' && (
              <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-xl p-10 text-center shadow-2xl">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="relative">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 shadow-xl shadow-emerald-500/50 animate-bounce">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-black text-white mb-2">Check your email</h2>
                  <p className="text-slate-400 text-sm mb-2">We sent a magic link to</p>
                  <p className="text-cyan-400 font-bold mb-6">{form.email}</p>
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300 mb-8">
                    Click the link to verify — your trip will be posted automatically.
                  </div>
                  {/* Two options */}
                  <div className="flex flex-col gap-3">
                    <Link href="/"
                      className="group flex items-center justify-center gap-2 w-full bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 py-3.5 rounded-xl text-sm font-bold text-white hover:shadow-xl hover:shadow-slate-500/30 transition-all duration-300 hover:scale-[1.02]">
                      <Home className="h-4 w-4" /> Return to Home
                    </Link>
                    <button
                      onClick={() => { setStep('trip'); resetForm(); }}
                      className="group flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-600 to-cyan-500 py-3.5 rounded-xl text-sm font-bold text-white hover:shadow-xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-[1.02]">
                      <PlusCircle className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" /> Post Another Trip
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── EMAIL STEP ── */}
            {step === 'email' && (
              <div className="relative overflow-hidden rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-xl p-8 shadow-2xl">
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

                <button onClick={() => setStep('trip')}
                  className="relative mb-5 text-sm text-slate-400 hover:text-cyan-400 transition flex items-center gap-1 group">
                  <ArrowRight className="h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform" /> Back
                </button>

                <div className="relative mb-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/50">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-white">Almost there</h2>
                  <p className="text-slate-400 text-sm mt-1">Enter your email to confirm and post your trip.</p>
                </div>

                {/* Trip summary */}
                <div className="relative mb-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm space-y-2 backdrop-blur-sm">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${mode === 'travel' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
                    {mode === 'travel' ? <><Plane className="h-3 w-3" /> Travelling</> : <><Package className="h-3 w-3" /> Sending</>}
                  </span>
                  <p className="text-white font-bold text-base">{form.from} → {form.to}</p>
                  <p className="text-slate-400">
                    {new Date(form.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {' · '}{weightOptions.find(w => w.value === form.weight)?.label}
                    {form.price ? ` · ${currency}${form.price}` : ''}
                  </p>
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
                    className="group w-full bg-gradient-to-r from-blue-600 to-cyan-500 py-4 rounded-xl text-sm font-bold text-white hover:shadow-xl hover:shadow-blue-500/50 disabled:opacity-60 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2">
                    {loading ? 'Sending link…' : (<>Send magic link <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" /></>)}
                  </button>
                  <p className="text-xs text-slate-600 text-center">No password needed · Free to join · Cancel anytime</p>
                </form>
              </div>
            )}

            {/* ── TRIP FORM STEP ── */}
            {step === 'trip' && (
              <div className="relative overflow-hidden rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-xl p-8 shadow-2xl hover:border-slate-600/70 hover:shadow-3xl transition-all duration-500">
                {/* Glow corners */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

                {/* Animated ping dot */}
                <div className="absolute top-6 right-6 w-2 h-2 bg-cyan-400 rounded-full animate-ping opacity-60" />

                <div className="relative mb-6">
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-cyan-500/30 rounded-full px-4 py-1.5 mb-4 backdrop-blur-sm">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                    <span className="text-xs text-cyan-300 font-semibold">Register your trip</span>
                  </div>
                  <h1 className="text-3xl font-black text-white mb-1">Post a trip</h1>
                  <p className="text-slate-400 text-sm">
                    Already registered?{' '}
                    <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold transition">Sign in →</Link>
                  </p>
                </div>

                {/* Mode toggle */}
                <div className="relative flex rounded-xl border border-white/10 bg-white/5 p-1 mb-6 backdrop-blur-sm">
                  <button type="button" onClick={() => setMode('travel')}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold transition-all duration-300 ${mode === 'travel' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/40 scale-[1.03]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                    <Plane className="h-4 w-4" /> I&apos;m Travelling
                  </button>
                  <button type="button" onClick={() => setMode('send')}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold transition-all duration-300 ${mode === 'send' ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/40 scale-[1.03]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
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
                    <div className="group relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-cyan-400 pointer-events-none transition-colors" />
                      <input type="text" placeholder="From city" required value={form.from} onChange={set('from')}
                        className={`${inputCls} pl-9`} />
                    </div>
                    <div className="group relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-cyan-400 pointer-events-none transition-colors" />
                      <input type="text" placeholder="To city" required value={form.to} onChange={set('to')}
                        className={`${inputCls} pl-9`} />
                    </div>
                  </div>

                  <div className="group relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-cyan-400 pointer-events-none transition-colors" />
                    <input type="date" required value={form.date} onChange={set('date')}
                      min={tomorrow}
                      className={`${inputCls} pl-9 [color-scheme:dark]`} />
                  </div>

                  <select required value={form.weight} onChange={set('weight')}
                    className={`${inputCls} cursor-pointer`} style={{ colorScheme: 'dark' }}>
                    <option value="" className="bg-slate-900 text-slate-400">Weight / size *</option>
                    {weightOptions.map((o) => (
                      <option key={o.value} value={o.value} className="bg-slate-900 text-white">{o.label}</option>
                    ))}
                  </select>

                  <div className="group relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold pointer-events-none">{currency}</span>
                    <input type="number" required placeholder={mode === 'travel' ? 'Price per delivery' : 'Your budget'}
                      value={form.price} onChange={set('price')} min="1"
                      className={`${inputCls} pl-8`} />
                  </div>

                  <p className="text-xs text-slate-600">Same-day trips cannot be listed — select a future date.</p>

                  <button type="submit"
                    className="group w-full bg-gradient-to-r from-blue-600 to-cyan-500 py-4 rounded-xl text-sm font-bold text-white hover:shadow-xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mt-2">
                    Register <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
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
