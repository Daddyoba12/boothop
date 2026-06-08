'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Mail, ShieldCheck, ArrowRight, Zap, Package, MapPin, Bell, FileText } from 'lucide-react';
import { BusinessNav } from '@/components/business/BusinessNav';
import BusinessFooter from '@/components/business/BusinessFooter';

const BG = 'linear-gradient(135deg, #020617 0%, #0c1e3d 50%, #020617 100%)';
const FADE = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -16 } };

const PERSONAL_DOMAINS = ['gmail.', 'hotmail.', 'yahoo.', 'outlook.com', 'icloud.', 'live.', 'aol.', 'proton.', 'me.com'];

const FEATURES = [
  { icon: Zap,      label: 'Adhoc express booking',      sub: 'Send goods on the network — no contract needed' },
  { icon: MapPin,   label: 'Live job tracking',           sub: 'Know where your shipment is at every stage' },
  { icon: FileText, label: 'Document management',        sub: 'Upload and access job documents in one place' },
  { icon: Bell,     label: 'Status notifications',       sub: 'Automatic email updates at every milestone' },
];

export default function ExpressSignInPage() {
  const router = useRouter();
  const [stage, setStage]     = useState<'email' | 'otp'>('email');
  const [email, setEmail]     = useState('');
  const [otp, setOtp]         = useState('');
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (PERSONAL_DOMAINS.some(d => email.toLowerCase().includes(d))) {
      setError('Personal email not accepted. Please use your company email.');
      return;
    }
    setError(null); setLoading(true);
    try {
      const res = await fetch('/api/business/auth/send-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error || 'Could not send code.'); return; }
      if (j.skipOtp) {
        const me = await fetch('/api/business/auth/me').then(r => r.json());
        router.push(me.partner_status === 'active' ? '/business/portal/priority' : '/business/portal');
        return;
      }
      setStage('otp');
    } catch { setError('Could not send code. Please try again.'); }
    finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    setError(null); setLoading(true);
    try {
      const res = await fetch('/api/business/auth/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: otp.trim() }),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error || 'Invalid code.'); return; }
      const me = await fetch('/api/business/auth/me').then(r => r.json());
      router.push(me.partner_status === 'active' ? '/business/portal/priority' : '/business/portal');
    } catch { setError('Verification failed. Try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen text-white" style={{ background: BG }}>
      <BusinessNav />

      <div className="min-h-screen flex items-center justify-center px-6 py-24">
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">

          {/* Left — feature panel */}
          <div className="hidden md:block">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 uppercase tracking-widest">
              <Zap className="h-3 w-3" /> Express Delivery
            </div>
            <h2 className="text-3xl font-black mb-2">
              BootHop <span className="text-emerald-400">Express</span>
            </h2>
            <p className="text-white/45 text-sm leading-relaxed mb-8">
              For clients sending goods on the BootHop network. Book one-off deliveries, track your shipments, and manage your account — no long-term contract required.
            </p>
            <ul className="space-y-4">
              {FEATURES.map(({ icon: Icon, label, sub }) => (
                <li key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{label}</p>
                    <p className="text-xs text-white/35 mt-0.5">{sub}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex gap-3 text-center">
              <div className="flex-1 bg-white/4 border border-white/8 rounded-xl p-3">
                <p className="text-lg font-black text-emerald-400">24/7</p>
                <p className="text-xs text-white/35">Service</p>
              </div>
              <div className="flex-1 bg-white/4 border border-white/8 rounded-xl p-3">
                <p className="text-lg font-black text-emerald-400">UK</p>
                <p className="text-xs text-white/35">& International</p>
              </div>
              <div className="flex-1 bg-white/4 border border-white/8 rounded-xl p-3">
                <p className="text-lg font-black text-emerald-400">No</p>
                <p className="text-xs text-white/35">contract</p>
              </div>
            </div>
          </div>

          {/* Right — auth form */}
          <div>
            <AnimatePresence mode="wait">

              {stage === 'email' && (
                <motion.div key="email" {...FADE} transition={{ duration: 0.3 }}>
                  <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto mb-5">
                      <Zap className="h-7 w-7 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-black mb-2">Sign in to your account</h2>
                    <p className="text-white/45 text-sm max-w-xs mx-auto leading-relaxed">
                      Returning clients go straight to your portal. New here?{' '}
                      <a href="/business/express" className="text-emerald-400 hover:text-emerald-300 transition-colors">Get an instant quote →</a>
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-8 space-y-4">
                    {error && (
                      <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-300 text-sm">{error}</div>
                    )}
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                      <input
                        type="email" value={email}
                        onChange={e => { setEmail(e.target.value); setError(null); }}
                        onKeyDown={e => e.key === 'Enter' && sendOtp()}
                        placeholder="you@yourcompany.com" autoFocus
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/20 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
                      />
                    </div>
                    <p className="text-white/25 text-xs text-center">Business email only — personal addresses not accepted.</p>
                    <button
                      onClick={sendOtp} disabled={loading || !email.trim()}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 text-black disabled:opacity-40 hover:scale-[1.02] transition-all">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                      {loading ? 'Sending code…' : 'Continue →'}
                    </button>
                    <a href="/business/express"
                      className="block text-center text-white/30 hover:text-white/55 text-sm transition-colors pt-1">
                      No account? <span className="text-emerald-400 hover:text-emerald-300 font-semibold">Get an instant quote →</span>
                    </a>
                  </div>
                </motion.div>
              )}

              {stage === 'otp' && (
                <motion.div key="otp" {...FADE} transition={{ duration: 0.3 }}>
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto mb-4">
                      <Mail className="h-8 w-8 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-black mb-2">Check your inbox</h2>
                    <p className="text-white/40 text-sm">We sent a 6-digit code to</p>
                    <p className="text-emerald-400 font-semibold text-sm mt-0.5">{email}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-8 space-y-4">
                    {error && (
                      <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-300 text-sm">{error}</div>
                    )}
                    <input
                      type="text" inputMode="numeric" value={otp}
                      onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(null); }}
                      onKeyDown={e => e.key === 'Enter' && verifyOtp()}
                      placeholder="_ _ _ _ _ _" autoFocus maxLength={6}
                      className="w-full text-center text-3xl font-mono tracking-[0.4em] py-4 rounded-xl bg-white/20 border border-white/20 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                    <button
                      onClick={verifyOtp} disabled={loading || otp.length < 6}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 text-black disabled:opacity-40 hover:scale-[1.02] transition-all">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                      {loading ? 'Verifying…' : 'Verify & sign in'}
                    </button>
                    <button
                      onClick={() => { setStage('email'); setOtp(''); setError(null); }}
                      className="w-full text-center text-white/25 hover:text-white/50 text-sm transition-colors">
                      Use a different email
                    </button>
                    <button onClick={sendOtp}
                      className="w-full text-center text-white/20 text-xs hover:text-white/40 transition-colors">
                      Didn't get it? Resend code
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </div>
      </div>

      <BusinessFooter />
    </div>
  );
}
