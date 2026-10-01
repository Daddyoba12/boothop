'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Mail, ShieldCheck, ArrowRight, Truck, Clock, AlertCircle, Package, MapPin, BarChart3 } from 'lucide-react';
import { BusinessNav } from '@/components/business/BusinessNav';
import BusinessFooter from '@/components/business/BusinessFooter';

const FADE = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -16 } };

const FEATURES = [
  { icon: Package,  label: 'Job alerts in your area',   sub: 'Receive matched jobs within your coverage radius' },
  { icon: Truck,    label: 'Accept jobs on your terms', sub: 'Pick up deliveries that fit your schedule' },
  { icon: MapPin,   label: 'UK & International routes', sub: 'Operate across domestic and international networks' },
  { icon: BarChart3, label: 'Full job history',         sub: 'Track all active and completed deliveries' },
];

type Stage = 'email' | 'otp' | 'pending' | 'not_found';

export default function CarrierSignInPage() {
  const router = useRouter();
  const [checking, setChecking]           = useState(true);
  const [stage, setStage]                 = useState<Stage>('email');
  const [email, setEmail]                 = useState('');
  const [otp, setOtp]                     = useState('');
  const [error, setError]                 = useState<string | null>(null);
  const [loading, setLoading]             = useState(false);
  const [carrierStatus, setCarrierStatus] = useState<string | null>(null);
  const [companyName, setCompanyName]     = useState<string | null>(null);

  // Redirect immediately if already signed in
  useEffect(() => {
    fetch('/api/business/auth/me')
      .then(r => r.json())
      .then(async d => {
        if (d.authenticated) {
          await routeCarrier();
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
      if (j.skipOtp) { await routeCarrier(); return; }
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
      await routeCarrier();
    } catch { setError('Verification failed. Try again.'); }
    finally { setLoading(false); }
  };

  const routeCarrier = async () => {
    const me = await fetch('/api/business/carrier/me').then(r => r.json());
    setChecking(false);
    if (!me.registered) { setStage('not_found'); return; }
    setCarrierStatus(me.status);
    setCompanyName(me.company_name);
    if (me.status === 'active' && me.status_active) {
      router.push('/business/carrier-portal');
      return;
    }
    setStage('pending');
  };

  // Auth check in progress — show minimal loader
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-900 bg-white">
      <BusinessNav showDefaultNav />

      <div className="min-h-screen flex items-center justify-center px-6 pt-32 pb-16">
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">

          {/* Left — feature panel */}
          <div className="hidden md:block">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 uppercase tracking-widest">
              <Truck className="h-3 w-3" /> Carrier Network
            </div>
            <h2 className="text-3xl font-black mb-2">
              BootHop <span className="text-blue-600">Carriers</span>
            </h2>
            <p className="text-slate-600 text-base leading-relaxed mb-8">
              Your dashboard for accepting jobs, tracking deliveries, and managing your carrier profile — all in one place.
            </p>
            <ul className="space-y-4">
              {FEATURES.map(({ icon: Icon, label, sub }) => (
                <li key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{label}</p>
                    <p className="text-sm text-slate-600 mt-0.5">{sub}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex gap-3 text-center">
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="text-lg font-black text-blue-600">UK</p>
                <p className="text-sm text-slate-600">& International</p>
              </div>
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="text-lg font-black text-blue-600">Weekly</p>
                <p className="text-sm text-slate-600">Payments</p>
              </div>
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="text-lg font-black text-blue-600">Flex</p>
                <p className="text-sm text-slate-600">Schedule</p>
              </div>
            </div>
          </div>

          {/* Right — auth / status */}
          <div>
            <AnimatePresence mode="wait">

              {stage === 'email' && (
                <motion.div key="email" {...FADE} transition={{ duration: 0.3 }}>
                  <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center mx-auto mb-5">
                      <Truck className="h-7 w-7 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-black mb-2">Carrier sign in</h2>
                    <p className="text-slate-600 text-base max-w-xs mx-auto leading-relaxed">
                      Sign in to your carrier dashboard, or{' '}
                      <a href="/business/carrier-network" className="text-blue-600 hover:text-blue-700 transition-colors font-medium">register to join the network →</a>
                    </p>
                  </div>
                  <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-8 space-y-4">
                    {error && (
                      <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-600 text-sm">{error}</div>
                    )}
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        type="email" value={email}
                        onChange={e => { setEmail(e.target.value); setError(null); }}
                        onKeyDown={e => e.key === 'Enter' && sendOtp()}
                        placeholder="you@yourcompany.com" autoFocus
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                      />
                    </div>
                    <p className="text-slate-600 text-sm text-center">Business email only — personal addresses not accepted.</p>
                    <button
                      onClick={sendOtp} disabled={loading || !email.trim()}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black bg-gradient-to-r from-blue-600 to-blue-500 text-white disabled:opacity-40 hover:scale-[1.02] transition-all">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                      {loading ? 'Checking…' : 'Continue'}
                    </button>
                    <a href="/business/carrier-network"
                      className="flex items-center justify-center gap-2 text-sm text-slate-600 hover:text-slate-800 transition-colors pt-1">
                      Not yet registered? <span className="text-blue-600 hover:text-blue-700 font-semibold">Join the carrier network →</span>
                    </a>
                  </div>
                </motion.div>
              )}

              {stage === 'otp' && (
                <motion.div key="otp" {...FADE} transition={{ duration: 0.3 }}>
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center mx-auto mb-4">
                      <Mail className="h-8 w-8 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-black mb-2">Check your inbox</h2>
                    <p className="text-slate-600 text-base">We sent a 5-character code to</p>
                    <p className="text-blue-600 font-semibold text-base mt-0.5">{email}</p>
                  </div>
                  <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-8 space-y-4">
                    {error && (
                      <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-600 text-sm">{error}</div>
                    )}
                    <input
                      type="text" inputMode="text" value={otp}
                      onChange={e => { setOtp(e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 5)); setError(null); }}
                      onKeyDown={e => e.key === 'Enter' && verifyOtp()}
                      placeholder="_ _ _ _ _" autoFocus maxLength={5}
                      className="w-full text-center text-3xl font-mono tracking-[0.4em] py-4 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 uppercase"
                    />
                    <button
                      onClick={verifyOtp} disabled={loading || otp.length < 5}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black bg-gradient-to-r from-blue-600 to-blue-500 text-white disabled:opacity-40 hover:scale-[1.02] transition-all">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                      {loading ? 'Verifying…' : 'Verify & sign in'}
                    </button>
                    <button
                      onClick={() => { setStage('email'); setOtp(''); setError(null); }}
                      className="w-full text-center text-slate-600 hover:text-slate-800 text-sm transition-colors">
                      Use a different email
                    </button>
                    <button onClick={sendOtp}
                      className="w-full text-center text-slate-600 text-sm hover:text-slate-800 transition-colors">
                      Didn&apos;t get it? Resend code
                    </button>
                  </div>
                </motion.div>
              )}

              {stage === 'pending' && (
                <motion.div key="pending" {...FADE} transition={{ duration: 0.3 }}>
                  <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-8 text-center space-y-5">
                    <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center mx-auto">
                      <Clock className="h-8 w-8 text-amber-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black mb-2">Application in progress</h2>
                      {companyName && <p className="text-blue-600 font-semibold text-base mb-3">{companyName}</p>}
                      <p className="text-slate-600 text-base leading-relaxed">
                        {carrierStatus === 'payment_pending'
                          ? 'Your application is received and awaiting your £250 registration payment. Once payment clears (2 working days), your profile will be activated and job alerts will begin.'
                          : "Your application is under review. Our team typically completes verification within 24 hours. We'll email you when your profile is activated."}
                      </p>
                    </div>
                    {carrierStatus === 'payment_pending' && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left text-sm space-y-1">
                        <p className="font-bold text-amber-700 text-xs uppercase tracking-wide mb-2">Payment details</p>
                        <p className="text-slate-600">Account: <span className="text-slate-900 font-semibold">BootHop Ltd</span></p>
                        <p className="text-slate-600">Sort code: <span className="text-slate-900 font-semibold">23-08-01</span></p>
                        <p className="text-slate-600">Account no: <span className="text-slate-900 font-semibold">44947453</span></p>
                        <p className="text-slate-600">Amount: <span className="text-slate-900 font-black">£250</span></p>
                      </div>
                    )}
                    <p className="text-slate-600 text-sm">
                      Questions? <a href="mailto:carriers@boothop.com" className="text-blue-600 hover:text-blue-700 font-medium">carriers@boothop.com</a> · +44 115 661 2825
                    </p>
                  </div>
                </motion.div>
              )}

              {stage === 'not_found' && (
                <motion.div key="not_found" {...FADE} transition={{ duration: 0.3 }}>
                  <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-8 text-center space-y-5">
                    <div className="w-16 h-16 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center mx-auto">
                      <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black mb-2">No carrier account found</h2>
                      <p className="text-slate-600 text-base">
                        We couldn&apos;t find a carrier profile for <span className="text-slate-900 font-semibold">{email}</span>.
                        Register below to join the BootHop carrier network.
                      </p>
                    </div>
                    <a
                      href="/business/carrier-network"
                      className="inline-flex items-center gap-2 w-full justify-center py-3.5 rounded-xl font-black bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:scale-[1.02] transition-all">
                      <Truck className="h-4 w-4" /> Register as Carrier Partner
                    </a>
                    <button
                      onClick={() => { setStage('email'); setOtp(''); setError(null); }}
                      className="block w-full text-center text-slate-600 hover:text-slate-800 text-sm transition-colors">
                      Try a different email
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
