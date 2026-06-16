'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Mail, ShieldCheck, ArrowRight, Crown, Headphones, BarChart3 } from 'lucide-react';
import { BusinessNav } from '@/components/business/BusinessNav';
import BusinessFooter from '@/components/business/BusinessFooter';

const BG = 'linear-gradient(135deg, #020617 0%, #1a0e00 50%, #020617 100%)';
const FADE = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -16 } };

const FEATURES = [
  { icon: Crown,      label: 'Dedicated account manager',  sub: 'Your own point of contact for every shipment' },
  { icon: ArrowRight, label: 'Priority carrier matching',  sub: 'First access to verified top-rated carriers' },
  { icon: Headphones, label: '24/7 concierge support',     sub: 'Reach us any time — call, email or WhatsApp' },
  { icon: BarChart3,  label: 'Volume pricing & analytics', sub: 'Discounted rates and full shipment reporting' },
];

export default function PrioritySignInPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [stage, setStage]       = useState<'email' | 'otp'>('email');
  const [email, setEmail]       = useState('');
  const [otp, setOtp]           = useState('');
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  // Redirect immediately if already signed in
  useEffect(() => {
    fetch('/api/business/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.authenticated) {
          router.replace(d.partner_status === 'active' ? '/business/portal/priority' : '/business/portal');
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, []);

  const sendOtp = async () => {
    setError(null); setLoading(true);
    try {
      const res = await fetch('/api/business/auth/send-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error || 'Could not send code.'); return; }
      if (j.skipOtp) {
        // Remembered user — check their actual tier before routing
        const me = await fetch('/api/business/auth/me').then(r => r.json()).catch(() => null);
        router.push(me?.partner_status === 'active' ? '/business/portal/priority' : '/business/portal');
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
      // Check actual tier so Express clients who land here still reach the right portal
      const me = await fetch('/api/business/auth/me').then(r => r.json()).catch(() => null);
      router.push(me?.partner_status === 'active' ? '/business/portal/priority' : '/business/portal');
    } catch { setError('Verification failed. Try again.'); }
    finally { setLoading(false); }
  };

  // Auth check in progress — show minimal loader, not a blank or broken form
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white" style={{ background: BG }}>
      <BusinessNav />

      <div className="min-h-screen flex items-center justify-center px-6 py-24">
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">

          {/* Left — feature panel */}
          <div className="hidden md:block">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 uppercase tracking-widest">
              <Crown className="h-3 w-3" /> Priority Partner
            </div>
            <h2 className="text-3xl font-black mb-2">
              BootHop <span className="text-amber-400">Priority</span>
            </h2>
            <p className="text-white/45 text-sm leading-relaxed mb-8">
              Your exclusive members portal. Manage bookings, track shipments, access your dedicated account manager, and view your volume pricing — all in one place.
            </p>
            <ul className="space-y-4">
              {FEATURES.map(({ icon: Icon, label, sub }) => (
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
            <div className="mt-8 flex gap-3 text-center">
              <div className="flex-1 bg-white/4 border border-white/8 rounded-xl p-3">
                <p className="text-lg font-black text-amber-400">UK</p>
                <p className="text-xs text-white/35">& Global</p>
              </div>
              <div className="flex-1 bg-white/4 border border-white/8 rounded-xl p-3">
                <p className="text-lg font-black text-amber-400">5★</p>
                <p className="text-xs text-white/35">Carriers only</p>
              </div>
              <div className="flex-1 bg-white/4 border border-white/8 rounded-xl p-3">
                <p className="text-lg font-black text-amber-400">24/7</p>
                <p className="text-xs text-white/35">Concierge</p>
              </div>
            </div>
          </div>

          {/* Right — auth form */}
          <div>
            <AnimatePresence mode="wait">

              {stage === 'email' && (
                <motion.div key="email" {...FADE} transition={{ duration: 0.3 }}>
                  <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center mx-auto mb-5">
                      <Crown className="h-7 w-7 text-amber-400" />
                    </div>
                    <h2 className="text-2xl font-black mb-2">Priority member sign in</h2>
                    <p className="text-white/45 text-sm max-w-xs mx-auto leading-relaxed">
                      Enter your registered email and we'll send a one-time code directly to your inbox.
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
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/20 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                      />
                    </div>
                    <button
                      onClick={sendOtp} disabled={loading || !email.trim()}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black bg-gradient-to-r from-amber-400 to-yellow-400 text-black disabled:opacity-40 hover:scale-[1.02] transition-all">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                      {loading ? 'Sending code…' : 'Continue →'}
                    </button>
                    <p className="text-center text-white/25 text-xs pt-1">
                      Not a Priority Partner yet?{' '}
                      <a href="/business/priority-partner" className="text-amber-400 hover:text-amber-300 transition-colors font-semibold">
                        Learn more →
                      </a>
                    </p>
                  </div>
                </motion.div>
              )}

              {stage === 'otp' && (
                <motion.div key="otp" {...FADE} transition={{ duration: 0.3 }}>
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center mx-auto mb-4">
                      <Mail className="h-8 w-8 text-amber-400" />
                    </div>
                    <h2 className="text-2xl font-black mb-2">Check your inbox</h2>
                    <p className="text-white/40 text-sm">We sent a 5-character code to</p>
                    <p className="text-amber-400 font-semibold text-sm mt-0.5">{email}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-8 space-y-4">
                    {error && (
                      <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-300 text-sm">{error}</div>
                    )}
                    <input
                      type="text" inputMode="text" value={otp}
                      onChange={e => { setOtp(e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 5)); setError(null); }}
                      onKeyDown={e => e.key === 'Enter' && verifyOtp()}
                      placeholder="_ _ _ _ _" autoFocus maxLength={5}
                      className="w-full text-center text-3xl font-mono tracking-[0.4em] py-4 rounded-xl bg-white/20 border border-white/20 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-amber-400 uppercase"
                    />
                    <button
                      onClick={verifyOtp} disabled={loading || otp.length < 5}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black bg-gradient-to-r from-amber-400 to-yellow-400 text-black disabled:opacity-40 hover:scale-[1.02] transition-all">
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
