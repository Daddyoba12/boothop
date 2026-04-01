'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plane, Package, Send, Shield, AlertCircle, Eye, EyeOff, CheckCircle, ArrowRight, MapPin, Calendar } from 'lucide-react';
import { createSupabaseClient } from '@/lib/supabase';

const weightOptions = [
  { value: 'letter', label: 'Letter (<1kg)' },
  { value: 'small', label: 'Small (<5kg)' },
  { value: 'medium', label: 'Medium (5–23kg)' },
  { value: 'large', label: 'Large (23–32kg)' },
];

function RegisterForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const supabase     = createSupabaseClient();

  const initialType = (searchParams.get('type') as 'booter' | 'hooper') || 'hooper';

  const [userType, setUserType] = useState<'booter' | 'hooper'>(initialType);
  const [tripMode, setTripMode]   = useState<'travel' | 'send'>(initialType === 'booter' ? 'travel' : 'send');

  const [tripForm, setTripForm] = useState({ from: '', to: '', date: '', weight: '', price: '' });

  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
  });
  const [showPassword, setShowPassword]               = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms]             = useState(false);
  const [acceptedCustoms, setAcceptedCustoms]         = useState(false);
  const [loading, setLoading]                         = useState(false);
  const [error, setError]                             = useState<string | null>(null);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((p) => ({ ...p, [field]: e.target.value }));

  const setTrip = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setTripForm((p) => ({ ...p, [field]: e.target.value }));

  // Keep tripMode in sync with userType
  const handleUserType = (t: 'booter' | 'hooper') => {
    setUserType(t);
    setTripMode(t === 'booter' ? 'travel' : 'send');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.fullName || !formData.email || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!acceptedCustoms) {
      setError('You must acknowledge customs responsibilities.');
      return;
    }
    if (!acceptedTerms) {
      setError('You must accept the Terms of Service.');
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { full_name: formData.fullName, user_type: userType } },
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: authData.user.id,
          email: formData.email,
          full_name: formData.fullName,
          user_type: userType,
        });
        if (profileError) throw profileError;

        // Save trip if any trip fields filled
        if (tripForm.from && tripForm.to && tripForm.date) {
          await supabase.from('trips').insert([{
            from_city: tripForm.from,
            to_city: tripForm.to,
            travel_date: tripForm.date,
            weight: tripForm.weight || null,
            price: tripForm.price ? Number(tripForm.price) : null,
            user_id: authData.user.id,
            type: tripMode,
          }]);
        }

        router.push(userType === 'booter' ? '/booter-dashboard' : '/hooper-dashboard');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full rounded-xl border border-white/15 bg-white/8 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 hover:bg-white/12 backdrop-blur-sm';
  const lightInputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm';

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">

      {/* ── LEFT IMAGE PANEL ── */}
      <div className="hidden lg:flex lg:w-5/12 relative flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/images/Handover.jpg" alt="BootHop delivery handover" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950/85 via-slate-900/75 to-blue-900/60" />
        </div>

        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50">
            <Plane className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">
            Boot<span className="text-cyan-400">Hop</span>
          </span>
        </Link>

        {/* Bottom stats */}
        <div className="relative z-10 space-y-4">
          <h2 className="text-white text-2xl font-bold leading-snug">
            Join 10,000+ people already shipping smarter
          </h2>
          {[
            { value: '50K+', label: 'successful deliveries' },
            { value: '200+', label: 'cities worldwide' },
            { value: '95%',  label: 'satisfaction rate' },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-cyan-400 flex-shrink-0" />
              <span className="text-white/80 text-sm">
                <strong className="text-white font-semibold">{s.value}</strong> {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
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

        <div className="flex-1 flex items-start justify-center px-6 py-10">
          <div className="w-full max-w-lg space-y-8">

            {/* ── TRIP CREATION FORM (above account) ── */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm p-6 shadow-2xl">
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative mb-5">
                <h2 className="text-lg font-black text-white">Tell us about your trip</h2>
                <p className="text-sm text-slate-400 mt-0.5">Optional — we'll create your listing automatically after sign-up.</p>
              </div>

              {/* Mode toggle */}
              <div className="relative flex rounded-xl border border-white/15 bg-white/5 p-1 mb-5 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => setTripMode('travel')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all duration-300 ${tripMode === 'travel' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/40 scale-[1.02]' : 'text-slate-400 hover:text-white'}`}
                >
                  <Plane className="h-4 w-4" /> I&apos;m Travelling
                </button>
                <button
                  type="button"
                  onClick={() => setTripMode('send')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all duration-300 ${tripMode === 'send' ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/40 scale-[1.02]' : 'text-slate-400 hover:text-white'}`}
                >
                  <Package className="h-4 w-4" /> I&apos;m Sending
                </button>
              </div>

              {/* Trip fields */}
              <div className="relative grid grid-cols-2 gap-3">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="From city"
                    value={tripForm.from}
                    onChange={setTrip('from')}
                    className={`${inputCls} pl-9`}
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="To city"
                    value={tripForm.to}
                    onChange={setTrip('to')}
                    className={`${inputCls} pl-9`}
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                  <input
                    type="date"
                    value={tripForm.date}
                    onChange={setTrip('date')}
                    min={new Date().toISOString().split('T')[0]}
                    className={`${inputCls} pl-9 [color-scheme:dark]`}
                  />
                </div>
                <select
                  value={tripForm.weight}
                  onChange={setTrip('weight')}
                  className={`${inputCls} cursor-pointer`}
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="" className="bg-slate-900 text-slate-400">Weight / size</option>
                  {weightOptions.map((o) => (
                    <option key={o.value} value={o.value} className="bg-slate-900 text-white">{o.label}</option>
                  ))}
                </select>
                <div className="col-span-2 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">£</span>
                  <input
                    type="number"
                    placeholder={tripMode === 'travel' ? 'Price per delivery (optional)' : 'Budget (optional)'}
                    value={tripForm.price}
                    onChange={setTrip('price')}
                    className={`${inputCls} pl-7`}
                  />
                </div>
              </div>
            </div>

            {/* ── ACCOUNT CREATION FORM ── */}
            <div>
              <div className="mb-6">
                <h1 className="text-3xl font-black text-white mb-1">Create your account</h1>
                <p className="text-slate-400 text-sm">
                  Already have one?{' '}
                  <Link href="/login" className="text-cyan-400 font-medium hover:text-cyan-300">Sign in →</Link>
                </p>
              </div>

              {error && (
                <div className="mb-6 flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Role selector */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">I want to…</label>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { key: 'hooper' as const, icon: <Package className="h-5 w-5" />, title: 'Send an Item', label: 'Hooper', desc: 'Send items worldwide through verified travelers.' },
                      { key: 'booter' as const, icon: <Send className="h-5 w-5" />, title: 'Travel & Earn', label: 'Booter', desc: 'Monetise your spare luggage space.' },
                    ]).map((r) => (
                      <button
                        key={r.key}
                        type="button"
                        onClick={() => handleUserType(r.key)}
                        className={`p-4 rounded-2xl border-2 text-left transition-all duration-300 ${
                          userType === r.key
                            ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/20'
                            : 'border-white/15 bg-white/5 hover:border-white/25'
                        }`}
                      >
                        <div className={`mb-2 ${userType === r.key ? 'text-cyan-400' : 'text-slate-500'}`}>{r.icon}</div>
                        <p className="font-semibold text-white text-sm">{r.title}</p>
                        <p className="text-xs text-slate-500 mt-1 leading-snug">{r.desc}</p>
                        {userType === r.key && (
                          <span className="inline-block mt-2 text-xs font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                            {r.label}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-slate-300 mb-1.5">Full name</label>
                  <input
                    id="fullName" type="text" value={formData.fullName}
                    onChange={set('fullName')} required placeholder="Jane Smith"
                    className={lightInputCls}
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">Email address</label>
                  <input
                    id="email" type="email" value={formData.email}
                    onChange={set('email')} required placeholder="you@example.com"
                    className={lightInputCls}
                  />
                </div>

                {/* Password row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        id="password" type={showPassword ? 'text' : 'password'}
                        value={formData.password} onChange={set('password')}
                        required minLength={8} placeholder="Min. 8 chars"
                        className={`${lightInputCls} pr-10`}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1.5">Confirm</label>
                    <div className="relative">
                      <input
                        id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword} onChange={set('confirmPassword')}
                        required minLength={8} placeholder="Repeat password"
                        className={`${lightInputCls} pr-10`}
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* KYC notice */}
                <div className="flex items-start gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4 backdrop-blur-sm">
                  <Shield className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-white mb-0.5">Identity Verification</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      We use secure KYC verification for international deliveries to keep all users safe.
                    </p>
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={acceptedCustoms}
                      onChange={(e) => setAcceptedCustoms(e.target.checked)} required
                      className="mt-0.5 w-4 h-4 rounded border-slate-600 text-cyan-500 focus:ring-cyan-500 bg-slate-800" />
                    <span className="text-sm text-slate-400 leading-relaxed">
                      I understand I am responsible for customs compliance. BootHop handles{' '}
                      <strong className="text-white">personal effects, letters, and small parcels only</strong> and is not
                      liable for transported items.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)} required
                      className="mt-0.5 w-4 h-4 rounded border-slate-600 text-cyan-500 focus:ring-cyan-500 bg-slate-800" />
                    <span className="text-sm text-slate-400">
                      I agree to the{' '}
                      <Link href="/terms" className="text-cyan-400 underline hover:text-cyan-300">Terms of Service</Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-cyan-400 underline hover:text-cyan-300">Privacy Policy</Link>
                    </span>
                  </label>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  {loading ? 'Creating account…' : (
                    <>Create Free Account <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></>
                  )}
                </button>

                <p className="text-center text-xs text-slate-500">
                  Free to join · No subscription · Cancel anytime
                </p>
              </form>
            </div>

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
