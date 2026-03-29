'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plane, Package, Send, User, Shield, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { createSupabaseClient } from '@/lib/supabase';

function RegisterForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const supabase     = createSupabaseClient();

  const [userType, setUserType] = useState<'booter' | 'hooper'>(
    (searchParams.get('type') as 'booter' | 'hooper') || 'hooper',
  );
  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
  });
  const [showPassword, setShowPassword]         = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms]       = useState(false);
  const [acceptedCustoms, setAcceptedCustoms]   = useState(false);
  const [loading, setLoading]                   = useState(false);
  const [error, setError]                       = useState<string | null>(null);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((p) => ({ ...p, [field]: e.target.value }));

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

        router.push(userType === 'booter' ? '/booter-dashboard' : '/hooper-dashboard');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    {
      key:   'hooper' as const,
      icon:  <Package className="h-6 w-6" />,
      title: 'Send an Item',
      label: 'Hooper',
      desc:  'Send items worldwide through verified travelers at up to 80% less than courier rates.',
    },
    {
      key:   'booter' as const,
      icon:  <Send className="h-6 w-6" />,
      title: 'Travel & Earn',
      label: 'Booter',
      desc:  'Monetise your spare luggage space. Earn money on trips you\'re already taking.',
    },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left: image panel */}
      <div className="hidden lg:flex lg:w-5/12 relative flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/images/Handover.jpg" alt="BootHop delivery handover" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950/85 via-slate-900/75 to-blue-900/60" />
        </div>

        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-2">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Plane className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">
            Boot<span className="text-blue-400">Hop</span>
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
              <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
              <span className="text-white/80 text-sm">
                <strong className="text-white font-semibold">{s.value}</strong> {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 overflow-y-auto bg-white flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
              <Plane className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">Boot<span className="text-blue-600">Hop</span></span>
          </Link>
          <Link href="/login" className="text-sm text-slate-500">
            Have an account? <span className="text-blue-600 font-semibold">Sign in</span>
          </Link>
        </div>

        <div className="flex-1 flex items-start justify-center px-6 py-10">
          <div className="w-full max-w-lg">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Create your account</h1>
              <p className="text-slate-500">
                Already have one?{' '}
                <Link href="/login" className="text-blue-600 font-medium hover:text-blue-700">Sign in →</Link>
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">I want to…</label>
                <div className="grid grid-cols-2 gap-3">
                  {roles.map((r) => (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => setUserType(r.key)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        userType === r.key
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className={`mb-2 ${userType === r.key ? 'text-blue-600' : 'text-slate-400'}`}>
                        {r.icon}
                      </div>
                      <p className="font-semibold text-slate-900 text-sm">{r.title}</p>
                      <p className="text-xs text-slate-500 mt-1 leading-snug">{r.desc}</p>
                      {userType === r.key && (
                        <span className="inline-block mt-2 text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                          {r.label}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Full name
                </label>
                <input
                  id="fullName" type="text" value={formData.fullName}
                  onChange={set('fullName')} required placeholder="Jane Smith"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email address
                </label>
                <input
                  id="email" type="email" value={formData.email}
                  onChange={set('email')} required placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                />
              </div>

              {/* Password row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password" type={showPassword ? 'text' : 'password'}
                      value={formData.password} onChange={set('password')}
                      required minLength={8} placeholder="Min. 8 chars"
                      className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Confirm
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword} onChange={set('confirmPassword')}
                      required minLength={8} placeholder="Repeat password"
                      className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Verification notice */}
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
                <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-0.5">Identity Verification</p>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    We use secure KYC verification for international deliveries to keep all users safe.
                  </p>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={acceptedCustoms}
                    onChange={(e) => setAcceptedCustoms(e.target.checked)} required
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-slate-600 leading-relaxed">
                    I understand I am responsible for customs compliance. BootHop handles{' '}
                    <strong className="text-slate-800">personal effects, letters, and small parcels only</strong> and is not
                    liable for transported items.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)} required
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-slate-600">
                    I agree to the{' '}
                    <Link href="/terms" className="text-blue-600 underline">Terms of Service</Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-blue-600 underline">Privacy Policy</Link>
                  </span>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 px-4 rounded-xl transition-all shadow-sm hover:shadow-md"
              >
                {loading ? 'Creating account…' : 'Create Free Account'}
              </button>

              <p className="text-center text-xs text-slate-400">
                Free to join · No subscription · Cancel anytime
              </p>
            </form>
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
