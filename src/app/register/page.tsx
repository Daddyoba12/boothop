'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  Package, Plane, MapPin, Calendar, ArrowRight,
  CheckCircle, AlertCircle, Mail, Home, PlusCircle,
} from 'lucide-react';
import NavBar from '@/components/NavBar';

// ── Country validation ────────────────────────────────────────────────────────
interface Airport { name: string; city: string; country: string; iata: string; }

const BLOCKED_COUNTRIES       = ['KP', 'IR', 'SY', 'CU', 'SD', 'SS', 'BY', 'RU', 'VE', 'AF'];
const CONTACT_FIRST_COUNTRIES = ['ZA', 'ZW', 'NG', 'GH', 'CD', 'CG'];

const weightOptions = [
  { value: 'letter', label: 'Letter (<1kg)' },
  { value: 'small',  label: 'Small (<5kg)' },
  { value: 'medium', label: 'Medium (5–23kg)' },
  { value: 'large',  label: 'Large (23–32kg)' },
];

// Three images that rotate in the left panel — your register page images
const slides = [
  { src: '/images/register_a.jpg',  alt: 'BootHop delivery handover' },
  { src: '/images/register_b.jpg',  alt: 'BootHop traveller' },
  { src: '/images/register_c.jpg',  alt: 'BootHop community' },
];

function RegisterForm() {
  const searchParams  = useSearchParams();
  const initialMode   = searchParams.get('type') === 'travel' ? 'travel' : 'send';
  const prefillFrom   = searchParams.get('from')  || '';
  const prefillTo     = searchParams.get('to')    || '';
  const prefillDate   = searchParams.get('date')  || '';
  const interestedIn  = searchParams.get('interestedIn') || '';

  const [mode, setMode]         = useState<'travel' | 'send'>(initialMode as 'travel' | 'send');
  const [form, setForm]         = useState({ from: prefillFrom, to: prefillTo, date: prefillDate, weight: '', price: '', email: '' });
  const [step, setStep]         = useState<'trip' | 'email' | 'sent' | 'success'>('trip');
  const [authedEmail, setAuthedEmail] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ from: string; to: string; date: string; type: string; redirectTo: string } | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [currency, setCurrency] = useState('£');

  // Image slideshow
  const [slide, setSlide]     = useState(0);
  const [fading, setFading]   = useState(false);

  // Google Places
  const [fromQuery, setFromQuery]   = useState(prefillFrom);
  const [toQuery, setToQuery]       = useState(prefillTo);
  const [fromSugg, setFromSugg]     = useState<string[]>([]);
  const [toSugg, setToSugg]         = useState<string[]>([]);
  const [fromOk, setFromOk]         = useState(!!prefillFrom);
  const [toOk, setToOk]             = useState(!!prefillTo);
  const [mapsReady, setMapsReady]   = useState(false);
  const sessionTokenRef             = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  // Airport suggestions
  const [fromAirports, setFromAirports] = useState<Airport[]>([]);
  const [toAirports,   setToAirports]   = useState<Airport[]>([]);
  const [fromAirportData, setFromAirportData] = useState<Airport | null>(null);
  const [toAirportData,   setToAirportData]   = useState<Airport | null>(null);

  // Country validation
  const [countryBlocked,   setCountryBlocked]   = useState(false);
  const [contactFirst,     setContactFirst]     = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  // Check if already logged in
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.authenticated && d.user?.email) setAuthedEmail(d.user.email);
    }).catch(() => {});
  }, []);

  // Init currency
  useEffect(() => {
    const lang = navigator.language || '';
    setCurrency(lang === 'en-GB' || lang.startsWith('en-GB') ? '£' : '$');
  }, []);

  // Poll until Google Maps Places is ready
  useEffect(() => {
    if (window.google?.maps?.places) {
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
      setMapsReady(true);
      return;
    }
    const check = setInterval(() => {
      if (window.google?.maps?.places) {
        sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
        setMapsReady(true);
        clearInterval(check);
      }
    }, 300);
    return () => clearInterval(check);
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

  // Geolocation — check user country on mount
  useEffect(() => {
    fetch('/api/location/check').then(r => r.json()).then(d => {
      const code: string | null = d.country_code;
      if (!code) return;
      if (BLOCKED_COUNTRIES.includes(code))       setCountryBlocked(true);
      if (CONTACT_FIRST_COUNTRIES.includes(code)) setContactFirst(true);
    }).catch(() => {});
  }, []);

  // From city + airport autocomplete
  useEffect(() => {
    if (fromOk) return;
    const t = setTimeout(async () => {
      if (!fromQuery || fromQuery.length < 2) { setFromSugg([]); setFromAirports([]); return; }
      // Airport search (always — covers IATA codes like LHR as well as city names)
      try {
        const res = await fetch(`/api/airports/search?q=${encodeURIComponent(fromQuery)}`);
        setFromAirports(await res.json());
      } catch { setFromAirports([]); }
      // City search (Google Places — needs 3+ chars)
      if (mapsReady && fromQuery.length >= 3) {
        new google.maps.places.AutocompleteService().getPlacePredictions(
          { input: fromQuery, types: ['(cities)'], sessionToken: sessionTokenRef.current || undefined },
          (p) => setFromSugg(p ? p.map((x) => x.description) : [])
        );
      }
    }, 350);
    return () => clearTimeout(t);
  }, [fromQuery, fromOk, mapsReady]);

  // To city + airport autocomplete
  useEffect(() => {
    if (toOk) return;
    const t = setTimeout(async () => {
      if (!toQuery || toQuery.length < 2) { setToSugg([]); setToAirports([]); return; }
      // Airport search
      try {
        const res = await fetch(`/api/airports/search?q=${encodeURIComponent(toQuery)}`);
        setToAirports(await res.json());
      } catch { setToAirports([]); }
      // City search
      if (mapsReady && toQuery.length >= 3) {
        new google.maps.places.AutocompleteService().getPlacePredictions(
          { input: toQuery, types: ['(cities)'], sessionToken: sessionTokenRef.current || undefined },
          (p) => setToSugg(p ? p.map((x) => x.description) : [])
        );
      }
    }, 350);
    return () => clearTimeout(t);
  }, [toQuery, toOk, mapsReady]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const resetForm = () => {
    setForm({ from: '', to: '', date: '', weight: '', price: '', email: '' });
    setFromQuery(''); setToQuery('');
    setFromSugg([]); setToSugg([]);
    setFromAirports([]); setToAirports([]);
    setFromAirportData(null); setToAirportData(null);
    setFromOk(false); setToOk(false);
  };

  // Airport selection helpers
  const selectFromAirport = (a: Airport) => {
    const display = `${a.city} (${a.iata})`;
    setFromQuery(display); setForm(p => ({ ...p, from: display }));
    setFromAirports([]); setFromSugg([]); setFromOk(true); setFromAirportData(a);
    if (window.google?.maps?.places)
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
  };

  const selectToAirport = (a: Airport) => {
    const display = `${a.city} (${a.iata})`;
    setToQuery(display); setForm(p => ({ ...p, to: display }));
    setToAirports([]); setToSugg([]); setToOk(true); setToAirportData(a);
    if (window.google?.maps?.places)
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
  };

  // Detect international route (used for contact-first check)
  const isInternationalRoute = () => {
    if (fromAirportData && toAirportData) return fromAirportData.country !== toAirportData.country;
    const ukPatterns = ['united kingdom', ', uk', ', england', ', scotland', ', wales', ', northern ireland'];
    const fromUK = ukPatterns.some(p => form.from.toLowerCase().includes(p));
    const toUK   = ukPatterns.some(p => form.to.toLowerCase().includes(p));
    return !(fromUK && toUK);
  };

  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const handleTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Country validation
    if (countryBlocked) { setError('BootHop is not available in your region.'); return; }
    if (contactFirst && isInternationalRoute()) { setShowContactModal(true); return; }

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

    // Already logged in — create listing directly, no email/OTP needed
    if (authedEmail) {
      setLoading(true);
      try {
        const res = await fetch('/api/trips/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: form.from, to: form.to, date: form.date, weight: form.weight, price: `${currency}${form.price}`, mode }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create listing');
        window.location.href = data.redirectTo || '/dashboard?listing=new';
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to create listing');
        setLoading(false);
      }
      return;
    }

    setStep('email');
  };

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.email) { setError('Please enter your email address.'); return; }
    setLoading(true);

    const journeyPayload = { from: form.from, to: form.to, date: form.date, weight: form.weight, price: `${currency}${form.price}`, mode, ...(interestedIn ? { interestedIn } : {}) };

    try {
      const res = await fetch('/api/auth/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, journeyPayload }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to send code');
      setStep('sent');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = codeInput.trim().toUpperCase();
    if (trimmed.length < 5) { setError('Please enter the full 5-character code.'); return; }
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, code: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      if (data.hasDraft) {
        setSuccessData({
          from: form.from,
          to: form.to,
          date: form.date,
          type: mode,
          redirectTo: data.redirectTo || '/journeys?listing=new',
        });
        setStep('success');
        // Auto-redirect after 3 seconds
        setTimeout(() => {
          window.location.href = data.redirectTo || '/journeys?listing=new';
        }, 3000);
      } else {
        window.location.href = data.redirectTo || '/intent';
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 hover:bg-white/10 backdrop-blur-sm';

  return (
    <div className="min-h-screen flex flex-col text-white overflow-hidden">
      <NavBar />

      {/* Split-screen panels — below fixed NavBar */}
      <div className="flex flex-1 pt-20">

      {/* ══════════════════════════════════════════
          LEFT PANEL — scrolling image carousel (60%)
      ══════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-3/5 relative flex-col justify-end p-12 overflow-hidden">

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

        {/* Premium multi-layer overlay */}
        {/* 1. Deep colour wash — pulls image into brand palette */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/70 via-blue-950/50 to-slate-900/60 pointer-events-none" />
        {/* 2. Bottom vignette — makes text legible without killing the photo */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-transparent pointer-events-none" />
        {/* 3. Top vignette — logo area stays readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-transparent to-transparent pointer-events-none" />
        {/* 4. Subtle left edge glow — adds depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-transparent to-transparent pointer-events-none" />

        {/* Bottom content */}
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


        <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">

            {/* ── SUCCESS STATE — trip registered ── */}
            {step === 'success' && successData && (
              <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 backdrop-blur-xl p-10 shadow-2xl text-center">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="relative">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-400 shadow-xl shadow-emerald-500/50">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-white mb-2">Your trip is live!</h2>
                  <p className="text-slate-400 text-sm mb-6">Your listing has been registered and is now live on BootHop Journeys.</p>

                  {/* Trip summary */}
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm space-y-2 mb-6 text-left">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${successData.type === 'travel' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
                      {successData.type === 'travel' ? <><Plane className="h-3 w-3" /> Travelling</> : <><Package className="h-3 w-3" /> Sending</>}
                    </span>
                    <p className="text-white font-bold text-base">{successData.from} → {successData.to}</p>
                    <p className="text-slate-400">
                      {new Date(successData.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-semibold mb-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    Redirecting to Live Journeys…
                  </div>
                  <p className="text-slate-600 text-xs">You'll be taken there automatically in a moment.</p>

                  <button
                    onClick={() => { window.location.href = successData.redirectTo; }}
                    className="mt-5 w-full bg-gradient-to-r from-emerald-600 to-cyan-500 py-3 rounded-xl text-sm font-bold text-white hover:shadow-xl hover:shadow-emerald-500/50 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    View my listing <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── SENT STATE — code input ── */}
            {step === 'sent' && (
              <div className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl p-10 shadow-2xl">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="relative">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-xl shadow-blue-500/50">
                    <Mail className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-white mb-1 text-center">Enter your code</h2>
                  <p className="text-slate-400 text-sm mb-1 text-center">We sent a 5-character code to</p>
                  <p className="text-cyan-400 font-bold mb-6 text-center">{form.email}</p>

                  {error && (
                    <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />{error}
                    </div>
                  )}

                  <form onSubmit={handleVerifyCode} className="space-y-4">
                    <input
                      type="text"
                      value={codeInput}
                      onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                      maxLength={5}
                      placeholder="4827A"
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-4 text-center text-2xl font-bold tracking-[0.35em] uppercase text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                      required
                    />
                    <button type="submit" disabled={loading || codeInput.trim().length < 5}
                      className="group w-full bg-gradient-to-r from-blue-600 to-cyan-500 py-4 rounded-xl text-sm font-bold text-white hover:shadow-xl hover:shadow-blue-500/50 disabled:opacity-60 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2">
                      {loading ? 'Verifying…' : (<>Verify & continue <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" /></>)}
                    </button>
                  </form>

                  <button onClick={() => { setStep('email'); setCodeInput(''); setError(null); }}
                    className="mt-4 w-full text-sm text-slate-500 hover:text-slate-300 transition text-center">
                    ← Resend code
                  </button>
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
                    {loading ? 'Sending…' : (<>Send verification code <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" /></>)}
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

                {countryBlocked && (
                  <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center">
                    <AlertCircle className="h-7 w-7 text-red-400 mx-auto mb-2" />
                    <p className="text-red-300 font-bold text-sm mb-1">Service unavailable in your region</p>
                    <p className="text-slate-400 text-xs">BootHop cannot process deliveries from your country due to international shipping restrictions. Please contact us for assistance.</p>
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
                    {(fromAirports.length > 0 || fromSugg.length > 0) && (
                      <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-auto rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl">
                        {fromAirports.map((a) => (
                          <div key={a.iata} onClick={() => selectFromAirport(a)}
                            className="cursor-pointer px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-2">
                            <Plane className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                            <span className="font-mono font-bold text-xs text-cyan-400 w-9 shrink-0">{a.iata}</span>
                            <div className="min-w-0">
                              <span className="font-medium">{a.city}</span>
                              <span className="text-slate-500 text-xs ml-1 truncate">· {a.name}</span>
                            </div>
                          </div>
                        ))}
                        {fromSugg.map((s, i) => (
                          <div key={`city-${i}`} onClick={() => {
                            setFromQuery(s); setForm(p => ({ ...p, from: s }));
                            setFromSugg([]); setFromAirports([]); setFromOk(true); setFromAirportData(null);
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
                    {(toAirports.length > 0 || toSugg.length > 0) && (
                      <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-auto rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl">
                        {toAirports.map((a) => (
                          <div key={a.iata} onClick={() => selectToAirport(a)}
                            className="cursor-pointer px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-2">
                            <Plane className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                            <span className="font-mono font-bold text-xs text-cyan-400 w-9 shrink-0">{a.iata}</span>
                            <div className="min-w-0">
                              <span className="font-medium">{a.city}</span>
                              <span className="text-slate-500 text-xs ml-1 truncate">· {a.name}</span>
                            </div>
                          </div>
                        ))}
                        {toSugg.map((s, i) => (
                          <div key={`city-${i}`} onClick={() => {
                            setToQuery(s); setForm(p => ({ ...p, to: s }));
                            setToSugg([]); setToAirports([]); setToOk(true); setToAirportData(null);
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

                  <button type="submit" disabled={countryBlocked}
                    className="group w-full bg-gradient-to-r from-blue-600 to-cyan-500 py-4 rounded-xl text-sm font-bold text-white hover:shadow-xl hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mt-2">
                    Register <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
      </div>{/* end pt-20 wrapper */}

      {/* Contact-first modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-3xl border border-amber-500/30 bg-gradient-to-br from-slate-900 to-slate-800 p-8 shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20">
              <AlertCircle className="h-7 w-7 text-amber-400" />
            </div>
            <h2 className="text-xl font-black text-white text-center mb-2">Contact us first</h2>
            <p className="text-slate-400 text-sm text-center mb-6">
              For international shipments originating from your country, we need to speak with you before you proceed. Please contact us to declare your shipping intention and ensure compliance.
            </p>
            <a href="/business/contact"
              className="block w-full text-center bg-gradient-to-r from-amber-600 to-orange-500 py-3 rounded-xl text-sm font-bold text-white mb-3 hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-300">
              Contact us to proceed
            </a>
            <button onClick={() => setShowContactModal(false)}
              className="w-full text-sm text-slate-500 hover:text-slate-300 transition text-center">
              Cancel
            </button>
          </div>
        </div>
      )}
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
