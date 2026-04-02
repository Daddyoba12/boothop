'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  Package, Plane, MapPin, Calendar, ArrowRight,
  CheckCircle, AlertCircle, Mail, Home, PlusCircle,
} from 'lucide-react';
import BootHopLogo from '@/components/BootHopLogo';

const weightOptions = [
  { value: 'letter', label: 'Letter (<1kg)' },
  { value: 'small',  label: 'Small (<5kg)' },
  { value: 'medium', label: 'Medium (5–23kg)' },
  { value: 'large',  label: 'Large (23–32kg)' },
];

// Three images that rotate in the left panel — your register page images
const slides = [
  { src: '/images/Handover.jpg',  alt: 'BootHop delivery handover' },
  { src: '/images/D_login1.jpg',  alt: 'BootHop traveller' },
  { src: '/images/D_login2.jpg',  alt: 'BootHop community' },
];

function RegisterForm() {
  const searchParams = useSearchParams();
  const initialMode  = searchParams.get('type') === 'booter' ? 'travel' : 'send';

  const [mode, setMode]         = useState<'travel' | 'send'>(initialMode as 'travel' | 'send');
  const [form, setForm]         = useState({ from: '', to: '', date: '', weight: '', price: '', email: '' });
  const [step, setStep]         = useState<'trip' | 'email' | 'sent'>('trip');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [currency, setCurrency] = useState('£');

  // Image slideshow
  const [slide, setSlide]     = useState(0);
  const [fading, setFading]   = useState(false);

  // Google Places
  const [fromQuery, setFromQuery]   = useState('');
  const [toQuery, setToQuery]       = useState('');
  const [fromSugg, setFromSugg]     = useState<string[]>([]);
  const [toSugg, setToSugg]         = useState<string[]>([]);
  const [fromOk, setFromOk]         = useState(false);
  const [toOk, setToOk]             = useState(false);
  const sessionTokenRef             = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  // Init currency + session token
  useEffect(() => {
    const lang = navigator.language || '';
    setCurrency(lang === 'en-GB' || lang.startsWith('en-GB') ? '£' : '$');
    if (window.google?.maps?.places)
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
  }, []);

  // Slideshow — cross-fade every 4 s
  useEffect(() => {
    const id = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setSlide((s) => (s + 1) % slides.length);
        setFading(false);
      }, 600);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  // From city autocomplete
  useEffect(() => {
    if (fromOk) return;
    const t = setTimeout(() => {
      if (!fromQuery || fromQuery.length < 3 || !window.google?.maps?.places) { setFromSugg([]); return; }
      new google.maps.places.AutocompleteService().getPlacePredictions(
        { input: fromQuery, types: ['(cities)'], sessionToken: sessionTokenRef.current || undefined },
        (p) => setFromSugg(p ? p.map((x) => x.description) : [])
      );
    }, 350);
    return () => clearTimeout(t);
  }, [fromQuery, fromOk]);

  // To city autocomplete
  useEffect(() => {
    if (toOk) return;
    const t = setTimeout(() => {
      if (!toQuery || toQuery.length < 3 || !window.google?.maps?.places) { setToSugg([]); return; }
      new google.maps.places.AutocompleteService().getPlacePredictions(
        { input: toQuery, types: ['(cities)'], sessionToken: sessionTokenRef.current || undefined },
        (p) => setToSugg(p ? p.map((x) => x.description) : [])
      );
    }, 350);
    return () => clearTimeout(t);
  }, [toQuery, toOk]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const resetForm = () => {
    setForm({ from: '', to: '', date: '', weight: '', price: '', email: '' });
    setFromQuery(''); setToQuery('');
    setFromSugg([]); setToSugg([]);
    setFromOk(false); setToOk(false);
  };

  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const handleTripSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.from || !form.to || !form.date || !form.weight || !form.price) {
      setError('Please fill in all fields including price.');
      return;
    }
    if (!fromOk) { setError('Please select a valid "From" city from the dropdown.'); return; }
    if (!toOk)   { setError('Please select a valid "To" city from the dropdown.'); return; }
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

    // Save trip so auth/callback can post it
    localStorage.setItem('pendingTrip', JSON.stringify({
      from: form.from, to: form.to, date: form.date,
      weight: form.weight, price: form.price, mode,
    }));

    try {
      const res = await fetch('/api/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          tripData: { from: form.from, to: form.to, date: form.date, weight: form.weight, price: `${currency}${form.price}`, mode },
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to send link');
      setStep('sent');
    } catch (err: any) {
      localStorage.removeItem('pendingTrip');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 hover:bg-white/10 backdrop-blur-sm';

  return (
    <div className="min-h-screen flex text-white overflow-hidden">

      {/* ══════════════════════════════════════════
          LEFT PANEL — scrolling image carousel (60%)
      ══════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-3/5 relative flex-col justify-between p-12 overflow-hidden">

        {/* Slides — stacked absolutely, cross-fading */}
        {slides.map((s, i) => (
          <div
            key={s.src}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: i === slide ? (fading ? 0 : 1) : 0 }}
          >
            <Image
              src={s.src}
              alt={s.alt}
              fill
              priority={i === 0}
              className="object-cover object-center"
              sizes="60vw"
            />
          </div>
        ))}

        {/* Same overlay as pagecpy — blue-tinted dark */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/85 via-slate-900/75 to-blue-900/60 pointer-events-none" />

        {/* Ping dots */}
        <div className="absolute inset-0 opacity-50 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
          <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '2s' }} />
        </div>

        {/* Logo — top (relative z-10 matches pagecpy pattern) */}
        <Link href="/" className="relative z-10 inline-flex group">
          <BootHopLogo size="lg" iconClass="text-white group-hover:scale-110 transition-transform duration-300" textClass="text-white" />
        </Link>

        {/* Bottom content — matches pagecpy justify-between bottom */}
        <div className="relative z-10 space-y-5">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 backdrop-blur-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-white/80 font-medium">Live platform · 10K+ verified users</span>
          </div>
          <h2 className="text-white text-3xl font-black leading-snug drop-shadow-lg">
            Post your trip.<br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
              Earn while you travel.
            </span>
          </h2>
          <div className="space-y-3">
            {[
              { v: '50K+', l: 'successful deliveries' },
              { v: '200+', l: 'cities worldwide' },
              { v: '95%',  l: 'satisfaction rate' },
            ].map((s) => (
              <div key={s.l} className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-cyan-400 flex-shrink-0" />
                <span className="text-white/80 text-sm drop-shadow">
                  <strong className="text-white font-semibold">{s.v}</strong> {s.l}
                </span>
              </div>
            ))}
          </div>
          {/* Slide indicators */}
          <div className="flex gap-2 pt-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-500 ${i === slide ? 'w-8 bg-cyan-400 shadow-lg shadow-cyan-400/50' : 'w-2 bg-white/30 hover:bg-white/60'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          RIGHT PANEL — form (40%)
      ══════════════════════════════════════════ */}
      <div className="flex-1 lg:w-2/5 overflow-y-auto flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative">

        {/* Background blobs */}
        <div className="fixed top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="fixed bottom-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />

        {/* Mobile top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 lg:hidden relative z-10">
          <Link href="/">
            <BootHopLogo size="sm" iconClass="text-white" textClass="text-white" />
          </Link>
          <Link href="/login" className="text-sm text-slate-400 hover:text-white transition">Sign in</Link>
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">

            {/* ── SENT STATE ── */}
            {step === 'sent' && (
              <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-xl p-10 text-center shadow-2xl">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="relative">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 shadow-xl shadow-emerald-500/50">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-black text-white mb-2">Check your email</h2>
                  <p className="text-slate-400 text-sm mb-2">We sent a BootHop magic link to</p>
                  <p className="text-cyan-400 font-bold mb-6">{form.email}</p>
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300 mb-8 text-left space-y-1.5">
                    <p>✅ Click the link in your email to verify</p>
                    <p>🚀 Your trip will be posted automatically</p>
                    <p>🔍 We'll instantly scan for matches</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Link href="/"
                      className="group flex items-center justify-center gap-2 w-full bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 py-3.5 rounded-xl text-sm font-bold text-white hover:shadow-xl hover:shadow-slate-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                      <Home className="h-4 w-4" /> Return to Home
                    </Link>
                    <button onClick={() => { setStep('trip'); resetForm(); }}
                      className="group flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-600 to-cyan-500 py-3.5 rounded-xl text-sm font-bold text-white hover:shadow-xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
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
                  <p className="text-slate-400 text-sm mt-1">Enter your email — we'll send a BootHop verification link.</p>
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
                    <input type="email" required value={form.email}
                      onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="you@example.com" className={inputCls} />
                  </div>
                  <button type="submit" disabled={loading}
                    className="group w-full bg-gradient-to-r from-blue-600 to-cyan-500 py-4 rounded-xl text-sm font-bold text-white hover:shadow-xl hover:shadow-blue-500/50 disabled:opacity-60 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2">
                    {loading ? 'Sending…' : (<>Send magic link <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" /></>)}
                  </button>
                  <p className="text-xs text-slate-600 text-center">No password needed · Free to join · Cancel anytime</p>
                </form>
              </div>
            )}

            {/* ── TRIP FORM STEP ── */}
            {step === 'trip' && (
              <div className="relative overflow-hidden rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-xl p-8 shadow-2xl hover:border-slate-600/70 transition-all duration-500">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
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

                  {/* From city */}
                  <div className="group relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-cyan-400 pointer-events-none transition-colors z-10" />
                    <input
                      type="text"
                      placeholder="From city"
                      required
                      value={fromQuery}
                      onChange={(e) => { setFromQuery(e.target.value); setForm(p => ({ ...p, from: e.target.value })); setFromOk(false); }}
                      className={`${inputCls} pl-9 ${fromQuery && !fromOk ? 'ring-2 ring-amber-400/40' : ''}`}
                    />
                    {fromSugg.length > 0 && (
                      <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-auto rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl">
                        {fromSugg.map((s, i) => (
                          <div key={i} onClick={() => {
                            setFromQuery(s); setForm(p => ({ ...p, from: s }));
                            setFromSugg([]); setFromOk(true);
                            if (window.google?.maps?.places)
                              sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
                          }} className="cursor-pointer px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />{s}
                          </div>
                        ))}
                      </div>
                    )}
                    {fromQuery && !fromOk && <p className="absolute -bottom-5 left-1 text-xs text-amber-400 animate-pulse">Select from list</p>}
                  </div>

                  {/* To city */}
                  <div className="group relative mt-6">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-cyan-400 pointer-events-none transition-colors z-10" />
                    <input
                      type="text"
                      placeholder="To city"
                      required
                      value={toQuery}
                      onChange={(e) => { setToQuery(e.target.value); setForm(p => ({ ...p, to: e.target.value })); setToOk(false); }}
                      className={`${inputCls} pl-9 ${toQuery && !toOk ? 'ring-2 ring-amber-400/40' : ''}`}
                    />
                    {toSugg.length > 0 && (
                      <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-auto rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl">
                        {toSugg.map((s, i) => (
                          <div key={i} onClick={() => {
                            setToQuery(s); setForm(p => ({ ...p, to: s }));
                            setToSugg([]); setToOk(true);
                            if (window.google?.maps?.places)
                              sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
                          }} className="cursor-pointer px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />{s}
                          </div>
                        ))}
                      </div>
                    )}
                    {toQuery && !toOk && <p className="absolute -bottom-5 left-1 text-xs text-amber-400 animate-pulse">Select from list</p>}
                  </div>

                  {/* Date */}
                  <div className="group relative mt-2">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-cyan-400 pointer-events-none transition-colors" />
                    <input type="date" required value={form.date}
                      onChange={set('date')} min={tomorrow}
                      className={`${inputCls} pl-9 [color-scheme:dark]`} />
                  </div>

                  {/* Weight */}
                  <select required value={form.weight} onChange={set('weight')}
                    className={`${inputCls} cursor-pointer`} style={{ colorScheme: 'dark' }}>
                    <option value="" className="bg-slate-900 text-slate-400">Weight / size *</option>
                    {weightOptions.map((o) => (
                      <option key={o.value} value={o.value} className="bg-slate-900 text-white">{o.label}</option>
                    ))}
                  </select>

                  {/* Price */}
                  <div className="group relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold pointer-events-none">{currency}</span>
                    <input type="number" required min="1"
                      placeholder={mode === 'travel' ? 'Price per delivery' : 'Your budget'}
                      value={form.price} onChange={set('price')}
                      className={`${inputCls} pl-8`} />
                  </div>

                  <p className="text-xs text-slate-600">Same-day trips cannot be listed — please select a future date.</p>

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
