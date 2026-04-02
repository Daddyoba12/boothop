'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Plane, ArrowRight, Shield, Clock, CheckCircle, Mail, RefreshCw } from 'lucide-react';
import { createSupabaseClient } from '@/lib/supabase';

const bgImages = ['/images/D_login1.jpg', '/images/D_login2.jpg'];

export default function LoginPage() {
  const router   = useRouter();
  const supabase = createSupabaseClient();

  const [email, setEmail]           = useState('');
  const [otp, setOtp]               = useState(['', '', '', '', '', '']);
  const [step, setStep]             = useState<'email' | 'otp'>('email');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [bgIdx, setBgIdx]           = useState(0);
  const inputRefs                   = useRef<(HTMLInputElement | null)[]>([]);

  // Rotate background images
  useEffect(() => {
    const t = setInterval(() => setBgIdx((p) => (p + 1) % bgImages.length), 6000);
    return () => clearInterval(t);
  }, []);

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  const sendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email) { setError('Please enter your email address.'); return; }
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setStep('otp');
    setResendTimer(60);
  };

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
    if (!val && i > 0) inputRefs.current[i - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) {
      setOtp(paste.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = otp.join('');
    if (token.length < 6) { setError('Please enter all 6 digits.'); return; }
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    setLoading(false);
    if (err) { setError('Invalid or expired code. Please try again.'); return; }
    router.push('/intent');
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel: hero ── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden">
        {bgImages.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{ opacity: i === bgIdx ? 1 : 0 }}
          >
            <Image src={src} alt="" fill className="object-cover" priority={i === 0} />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-blue-950/70 to-slate-900/60" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Plane className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">
              Boot<span className="text-blue-400">Hop</span>
            </span>
          </Link>
        </div>

        <div className="relative z-10">
          <blockquote className="text-white text-2xl font-bold leading-snug mb-4">
            &quot;Ship anything, anywhere —<br />with someone already going there.&quot;
          </blockquote>
          <div className="flex items-center gap-4 text-white/60 text-sm">
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-green-400" /> 10K+ verified users</span>
            <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-blue-400" /> Stripe escrow</span>
          </div>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-white">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Link href="/" className="flex items-center gap-2 justify-center">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Plane className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              Boot<span className="text-blue-600">Hop</span>
            </span>
          </Link>
        </div>

        <div className="w-full max-w-sm">
          {step === 'email' ? (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to BootHop</h1>
                <p className="text-slate-500">Enter your email — we&apos;ll send a one-time code. No password needed.</p>
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={sendOtp} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-sm hover:shadow-md"
                >
                  {loading ? 'Sending code…' : 'Send one-time code'}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-8">
                New here? Just enter your email — we&apos;ll create your account automatically.
              </p>
            </>
          ) : (
            <>
              <div className="mb-8">
                <button
                  onClick={() => { setStep('email'); setOtp(['', '', '', '', '', '']); setError(null); }}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mb-4"
                >
                  ← Change email
                </button>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Check your inbox</h1>
                <p className="text-slate-500">
                  We sent a 6-digit code to <span className="font-medium text-slate-700">{email}</span>
                </p>
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={verifyOtp} className="space-y-6">
                {/* 6-digit input */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Verification code
                  </label>
                  <div className="flex gap-2" onPaste={handleOtpPaste}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { inputRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        className="flex-1 h-14 text-center text-xl font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.join('').length < 6}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-sm hover:shadow-md"
                >
                  {loading ? 'Verifying…' : 'Verify & continue'}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>

              <div className="mt-6 text-center">
                {resendTimer > 0 ? (
                  <p className="text-sm text-slate-400 flex items-center justify-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Resend in {resendTimer}s
                  </p>
                ) : (
                  <button
                    onClick={() => sendOtp()}
                    disabled={loading}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1.5 mx-auto"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Resend code
                  </button>
                )}
              </div>
            </>
          )}

          {/* Trust strip */}
          <div className="flex justify-center gap-5 mt-8 text-slate-400 text-xs">
            <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> Secure login</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> 24/7 support</span>
            <span className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}
