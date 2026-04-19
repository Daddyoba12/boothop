'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search, Plane, Calendar, Package, ArrowRight, X, Filter,
  Sparkles, CheckCircle, Tag, ChevronLeft, Mail, Shield, Globe,
} from 'lucide-react';
import RoleToggle from '@/components/RoleToggle';
import { createSupabaseClient } from '@/lib/supabase';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

/* ── Weight label mapping ── */
const WEIGHT_LABELS: Record<string, string> = {
  letter: 'Letter  <1 kg',
  small:  'Small parcel  <5 kg',
  medium: 'Medium package  5–23 kg',
  large:  'Large package  23–32 kg',
};
function weightLabel(raw: string | null): string {
  if (!raw) return '';
  return WEIGHT_LABELS[raw.toLowerCase()] ?? raw;
}

/* ── New listing banner + auto-open handler ── */
function ListingBanner({ onOpenTrip }: { onOpenTrip: (id: string) => void }) {
  const searchParams = useSearchParams();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (searchParams.get('listing') === 'new') {
      setShow(true);
      const t = setTimeout(() => setShow(false), 6000);
      return () => clearTimeout(t);
    }
    // Auto-open modal for a specific trip (e.g. linked from home page)
    const openId = searchParams.get('open');
    if (openId) onOpenTrip(openId);
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!show) return null;
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
      <div className="relative flex items-center gap-4 bg-gradient-to-r from-emerald-900/95 via-emerald-800/95 to-teal-900/95 border border-emerald-500/40 rounded-2xl px-5 py-4 shadow-2xl shadow-emerald-500/20 backdrop-blur-xl">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-xl flex items-center justify-center flex-shrink-0">
          <CheckCircle className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm">Your new listing is now live!</p>
          <p className="text-emerald-300/80 text-xs mt-0.5">It&apos;s visible to travellers and senders below.</p>
        </div>
        <button onClick={() => setShow(false)} className="text-emerald-400/60 hover:text-white transition-colors flex-shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

type Trip = {
  id: string;
  user_id: string;
  email?: string;
  from_city: string;
  to_city: string;
  from_city_en?: string;
  to_city_en?: string;
  language?: string;
  translated?: boolean;
  travel_date: string;
  price: number | null;
  weight: string | null;
  type: 'travel' | 'send' | null;
  created_at?: string;
};

/* ── Modal step machine ── */
type ModalStep = 'initial' | 'choose-price' | 'enter-email' | 'enter-otp' | 'confirmed';

function LiveJourneysContent() {
  const supabase = createSupabaseClient();
  const searchParams = useSearchParams();

  const [trips, setTrips]               = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  // Pre-populate from ?from= and ?to= query params (e.g. from Active Corridors)
  const [fromCity, setFromCity]   = useState(() => searchParams.get('from') ?? '');
  const [toCity, setToCity]       = useState(() => searchParams.get('to')   ?? '');
  // Remember if filters were set from URL so we can fall back gracefully
  const [filtersFromUrl]          = useState(() => !!(searchParams.get('from') || searchParams.get('to')));
  const [dateFilter, setDateFilter] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  /* ── Modal state ── */
  const [step, setStep]                 = useState<ModalStep>('initial');
  const [interestType, setInterestType] = useState<'full_price' | 'offer'>('full_price');
  const [discountPct, setDiscountPct]   = useState<5 | 10 | 15 | 20>(10);
  const [email, setEmail]               = useState('');
  const [otpCode, setOtpCode]           = useState('');
  const [busy, setBusy]                 = useState(false);
  const [fieldError, setFieldError]     = useState('');
  const [blockingError, setBlockingError] = useState('');
  const [isLoggedIn, setIsLoggedIn]     = useState(false);
  const [pendingOpenId, setPendingOpenId] = useState<string | null>(null);
  // Track which trip cards are showing their original (non-English) text
  const [showOriginalIds, setShowOriginalIds] = useState<Set<string>>(new Set());
  const toggleOriginal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowOriginalIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  useEffect(() => { fetchTrips(); }, []);

  // Open modal once trips are loaded if a ?open=id param was passed
  useEffect(() => {
    if (pendingOpenId && trips.length > 0) {
      const trip = trips.find(t => t.id === pendingOpenId);
      if (trip) { openModal(trip); setPendingOpenId(null); }
    }
  }, [pendingOpenId, trips]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTrips = async () => {
    setLoading(true); setError(null);
    try {
      const { data, error: e } = await supabase
        .from('trips').select('*').gte('travel_date', tomorrow).order('travel_date', { ascending: true });
      if (!e && data) { setTrips(data as Trip[]); return; }

      // fallback: client-side date filter
      const { data: all } = await supabase.from('trips').select('*').order('created_at', { ascending: false });
      if (all) {
        setTrips((all as Trip[]).filter(t => !t.travel_date || t.travel_date >= tomorrow));
        return;
      }
      setError('No journeys found. Check back soon.');
    } catch { setError('Unable to load journeys. Please try again shortly.'); }
    finally { setLoading(false); }
  };

  const filtered = trips.filter(t => {
    const from   = (t.from_city    ?? '').toLowerCase();
    const to     = (t.to_city      ?? '').toLowerCase();
    const fromEn = (t.from_city_en ?? from).toLowerCase();
    const toEn   = (t.to_city_en   ?? to).toLowerCase();
    const q      = searchTerm.toLowerCase();
    return (
      (!q         || from.includes(q)   || to.includes(q)   || fromEn.includes(q) || toEn.includes(q)) &&
      (!fromCity  || from.includes(fromCity.toLowerCase())   || fromEn.includes(fromCity.toLowerCase())) &&
      (!toCity    || to.includes(toCity.toLowerCase())       || toEn.includes(toCity.toLowerCase())) &&
      (!dateFilter || (t.travel_date ?? '') >= dateFilter)
    );
  });

  const clearFilters = () => { setSearchTerm(''); setFromCity(''); setToCity(''); setDateFilter(''); };
  const hasFilters = !!(searchTerm || fromCity || toCity || dateFilter);

  // Route came from Active Corridor click but has no live trips
  const routeEmpty = !loading && filtersFromUrl && filtered.length === 0;

  /* ── Compute offered price from listing price ── */
  function computePrice(trip: Trip): string {
    const base = Number(trip.price) || 0;
    if (interestType === 'full_price') return base.toFixed(2);
    return (base * (1 - discountPct / 100)).toFixed(2);
  }

  /* ── Open modal: reset all state ── */
  const openModal = (trip: Trip) => {
    setSelectedTrip(trip);
    setStep('initial');
    setInterestType('full_price');
    setDiscountPct(10);
    setEmail('');
    setOtpCode('');
    setBusy(false);
    setFieldError('');
    setBlockingError('');
    // Pre-fill email if logged in (user must still confirm via OTP)
    fetch('/api/auth/me').then(r => r.json()).then(me => {
      if (me.authenticated && me.user?.email) setEmail(me.user.email);
    }).catch(() => {});
  };

  const closeModal = () => setSelectedTrip(null);

  /* ── Submit interest directly (logged-in users — no OTP needed) ── */
  const submitDirectly = async () => {
    if (!selectedTrip) return;
    setBusy(true); setFieldError('');
    try {
      const res  = await fetch('/api/matches/express-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId:       selectedTrip.id,
          interestType,
          discountPct:  interestType === 'offer' ? discountPct : 0,
          offeredPrice: computePrice(selectedTrip),
          email,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg = json.error || 'Could not submit. Please try again.';
        if (msg.toLowerCase().includes('same person') || msg.toLowerCase().includes('booter and a hooper')) {
          setBlockingError(msg); return;
        }
        throw new Error(msg);
      }
      setStep('confirmed');
    } catch (e: any) { setFieldError(e.message); }
    finally { setBusy(false); }
  };

  /* ── Step: send OTP ── */
  const sendOtp = async () => {
    if (!email.trim().includes('@')) { setFieldError('Enter a valid email address.'); return; }
    setBusy(true); setFieldError('');
    try {
      const res  = await fetch('/api/auth/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // no journeyPayload — this is interest only, not a new listing
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to send code.');
      // remember-me cookie still valid — session renewed, no code was sent
      if (json.skipOtp) { await submitDirectly(); return; }
      setStep('enter-otp');
    } catch (e: any) { setFieldError(e.message); }
    finally { setBusy(false); }
  };

  /* ── Step: verify OTP then submit interest ── */
  const verifyAndSubmit = async () => {
    if (!selectedTrip) return;
    const code = otpCode.trim().toUpperCase();
    if (code.length < 4) { setFieldError('Enter the full verification code.'); return; }
    setBusy(true); setFieldError('');
    try {
      // 1. Verify OTP — sets session cookie but creates no trip (no journeyPayload)
      const verifyRes  = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code }),
      });
      const verifyJson = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyJson.error || 'Incorrect code. Please try again.');

      // 2. Record interest / offer
      const interestRes  = await fetch('/api/matches/express-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId:       selectedTrip.id,
          interestType,
          discountPct:  interestType === 'offer' ? discountPct : 0,
          offeredPrice: computePrice(selectedTrip),
          email:        email.trim().toLowerCase(),
        }),
      });
      const interestJson = await interestRes.json();
      if (!interestRes.ok) {
        const msg = interestJson.error || 'Could not submit. Please try again.';
        // Show blocking popup for role-conflict errors
        if (msg.toLowerCase().includes('same person') || msg.toLowerCase().includes('booter and a hooper')) {
          setBlockingError(msg);
          return;
        }
        throw new Error(msg);
      }

      setStep('confirmed');
    } catch (e: any) { setFieldError(e.message); }
    finally { setBusy(false); }
  };

  /* ── Field wrapper with animated underline ── */
  const Field = ({ id, label, children }: { id: string; label: string; children: React.ReactNode }) => (
    <div className="flex-1 min-w-[120px] relative">
      <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 transition-colors duration-300 ${focusedField === id ? 'text-cyan-300' : 'text-white/60'}`}>
        {label}
      </label>
      {children}
      <div className="absolute bottom-0 left-0 h-px w-full bg-white/10" />
      <div className="absolute bottom-0 left-0 h-px bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
        style={{ width: focusedField === id ? '100%' : '0%' }} />
    </div>
  );
  const inputCls = 'w-full bg-transparent pb-3 pt-1 text-sm text-white placeholder:text-white/40 focus:outline-none';

  /* ── Discount tiers ── */
  const TIERS: Array<{ pct: 5 | 10 | 15 | 20; label: string; recommended?: true }> = [
    { pct: 5,  label: 'Save 5%' },
    { pct: 10, label: 'Save 10%', recommended: true },
    { pct: 15, label: 'Save 15%' },
    { pct: 20, label: 'Save 20%' },
  ];

  /* ── Back logic ── */
  const goBack = () => {
    setFieldError('');
    if (step === 'choose-price')  { setStep('initial'); return; }
    if (step === 'enter-email')   { setStep(interestType === 'offer' ? 'choose-price' : 'initial'); return; }
    if (step === 'enter-otp')     { setStep('enter-email'); return; }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-x-hidden flex flex-col">

      {/* AMBIENT GLOWS — screen blend works on dark bg */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[400px] h-[400px] bg-cyan-600/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 w-[300px] h-[300px] bg-violet-600/10 rounded-full blur-[80px]" />
      </div>

      <NavBar />
      <Suspense><ListingBanner onOpenTrip={(id) => setPendingOpenId(id)} /></Suspense>

      {/* HERO + FILTERS — everything sits on the image */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Background image — centered */}
        <div className="absolute inset-0">
          <img
            src="/images/GoingonHols1.jpg"
            alt=""
            className="w-full h-full object-cover object-center"
          />
        </div>
        {/* Overlays — very light so image shows fully */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/10 to-slate-950/45" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(59,130,246,0.08),transparent_65%)]" />

        {/* All content floats on the image */}
        <div className="relative z-10 w-full max-w-3xl mx-auto px-6 pt-32 pb-16 flex flex-col items-center text-center gap-8">

          {/* Live pill — glass */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] backdrop-blur-md px-4 py-2 text-xs font-bold text-white uppercase tracking-widest shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live now
          </div>

          {/* Heading */}
          <div>
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-extrabold leading-[1.0] tracking-tight drop-shadow-2xl">
              Live{' '}
              <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
                Journeys
              </span>
            </h1>
            <p className="mt-4 text-white/70 text-base md:text-lg drop-shadow-lg">
              Real trips from verified BootHop travellers — ready to match with your delivery.
            </p>
          </div>

          {/* Glass search bar */}
          <div className="w-full max-w-xl">
            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.07] backdrop-blur-xl px-5 py-4 shadow-[0_8px_40px_rgba(0,0,0,0.3)] focus-within:border-blue-400/40 focus-within:bg-white/[0.12] transition-all">
              <Search className="h-4 w-4 text-white/50 shrink-0" />
              <input
                type="text"
                placeholder="Search any city or route…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onFocus={() => setFocusedField('search')}
                onBlur={() => setFocusedField(null)}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="text-white/40 hover:text-white transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Glass filter strip — sits on the image */}
          <div className="w-full rounded-2xl border border-white/12 bg-white/[0.06] backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.25)] px-6 py-5">
            <div className="flex flex-wrap items-end gap-6 md:gap-10">
              <Field id="from" label="From">
                <input type="text" placeholder="Any city" value={fromCity}
                  onChange={e => setFromCity(e.target.value)} onFocus={() => setFocusedField('from')} onBlur={() => setFocusedField(null)} className={inputCls} />
              </Field>
              <Field id="to" label="To">
                <input type="text" placeholder="Any city" value={toCity}
                  onChange={e => setToCity(e.target.value)} onFocus={() => setFocusedField('to')} onBlur={() => setFocusedField(null)} className={inputCls} />
              </Field>
              <Field id="date" label="Date from">
                <input type="date" value={dateFilter} min={tomorrow}
                  onChange={e => setDateFilter(e.target.value)} onFocus={() => setFocusedField('date')} onBlur={() => setFocusedField(null)}
                  className={`${inputCls} [color-scheme:dark]`} />
              </Field>
              {hasFilters && (
                <button onClick={clearFilters} className="flex items-center gap-2 text-xs text-white/40 hover:text-cyan-300 transition-colors pb-3">
                  <X className="h-3.5 w-3.5" /> Clear
                </button>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* RESULTS */}
      <div className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        {loading ? (
          <div className="text-center py-24">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/50 animate-bounce">
              <Plane className="h-7 w-7 text-white" />
            </div>
            <p className="text-slate-400">Loading live journeys...</p>
          </div>
        ) : error ? (
          <div className="text-center py-24">
            <Plane className="h-10 w-10 text-slate-600 mx-auto mb-4" />
            <p className="text-white font-bold text-lg mb-2">{error}</p>
            <button onClick={fetchTrips} className="mt-4 text-sm text-cyan-400 hover:text-cyan-300 transition-colors">Try again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Plane className="h-10 w-10 text-slate-600 mx-auto mb-4" />
            {routeEmpty ? (
              <>
                <p className="text-white font-bold text-lg mb-2">
                  All slots on {fromCity}{toCity ? ` → ${toCity}` : ''} are taken
                </p>
                <p className="text-white/45 text-sm mb-7 max-w-sm mx-auto">
                  No travellers are currently available on this route. Post your trip and we&apos;ll match you the moment one becomes available.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a href={`/register?type=send&from=${encodeURIComponent(fromCity)}&to=${encodeURIComponent(toCity)}`}
                    className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-semibold text-sm px-7 py-3 rounded-full transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(59,130,246,0.4)]">
                    Book my trip to match <ArrowRight className="h-4 w-4" />
                  </a>
                  <button onClick={clearFilters}
                    className="text-sm text-white/45 hover:text-white/80 transition-colors">
                    Browse all routes →
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-white font-bold text-lg mb-1">No journeys match your filters</p>
                {hasFilters && <button onClick={clearFilters} className="mt-4 text-sm text-cyan-400">Clear all filters</button>}
              </>
            )}
          </div>
        ) : (
          <>
            {/* Count + live badge */}
            <div className="mb-7 flex items-center justify-between">
              <div className="inline-flex items-center gap-2 rounded-full border border-green-500/25 bg-green-500/8 px-4 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm text-green-400 font-semibold">
                  {filtered.length} {filtered.length === 1 ? 'journey' : 'journeys'} live
                </span>
              </div>
              <p className="text-xs text-white/25">Tap any card to connect</p>
            </div>

            {/* LIST */}
            <div className="flex flex-col gap-3">
              {filtered.map((trip) => (
                <div
                  key={trip.id}
                  onClick={() => openModal(trip)}
                  className="group relative rounded-2xl border border-white/8 bg-white/[0.04] backdrop-blur-sm px-5 py-4 cursor-pointer transition-all duration-200 hover:border-blue-500/30 hover:bg-white/[0.07] hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden"
                >
                  {/* Hover glow */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,rgba(59,130,246,0.07),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  <div className="relative flex items-center gap-4">

                    {/* Type icon */}
                    <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                      trip.type === 'travel' ? 'bg-blue-500/15 text-blue-400' : 'bg-emerald-500/15 text-emerald-400'
                    }`}>
                      {trip.type === 'travel' ? <Plane className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                    </div>

                    {/* Route */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white group-hover:text-cyan-200 transition-colors truncate">
                          {showOriginalIds.has(trip.id) ? trip.from_city : (trip.from_city_en || trip.from_city)}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-blue-400/60 shrink-0" />
                        <span className="font-bold text-white group-hover:text-cyan-200 transition-colors truncate">
                          {showOriginalIds.has(trip.id) ? trip.to_city : (trip.to_city_en || trip.to_city)}
                        </span>
                        {trip.translated && trip.language && trip.language !== 'en' && (
                          <button
                            onClick={(e) => toggleOriginal(trip.id, e)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/12 border border-blue-500/20 text-blue-400 text-[10px] font-semibold hover:bg-blue-500/20 transition-colors"
                          >
                            <Globe className="h-2.5 w-2.5" />
                            {showOriginalIds.has(trip.id) ? 'EN' : trip.language.toUpperCase()}
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className={`text-[11px] font-semibold ${trip.type === 'travel' ? 'text-blue-400/70' : 'text-emerald-400/70'}`}>
                          {trip.type === 'travel' ? 'Traveller with space' : 'Sender needs carrier'}
                        </span>
                        {trip.travel_date && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-white/40">
                            <Calendar className="h-3 w-3" />
                            {new Date(trip.travel_date + 'T00:00:00').toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                          </span>
                        )}
                        {trip.weight && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-white/40">
                            <Package className="h-3 w-3" />
                            {weightLabel(trip.weight)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price + CTA */}
                    <div className="shrink-0 text-right">
                      {trip.price ? (
                        <p className="font-extrabold text-base bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                          £{Number(trip.price).toFixed(0)}
                        </p>
                      ) : (
                        <p className="text-sm text-white/30 font-medium">Open</p>
                      )}
                      <span className="flex items-center justify-end gap-1 mt-1 text-[11px] text-white/25 group-hover:text-cyan-400 transition-all font-semibold">
                        Connect <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Footer />

      {/* ── BLOCKING ERROR POPUP ── */}
      {blockingError && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-red-500/30 bg-slate-900 shadow-2xl shadow-red-500/20 p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-500/15 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <X className="h-8 w-8 text-red-400" />
            </div>
            <h3 className="text-white font-black text-xl mb-3">Action Not Allowed</h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-2">
              The <span className="text-red-400 font-semibold">Sender</span> and <span className="text-blue-400 font-semibold">Traveller</span> on a BootHop match cannot be the same person.
            </p>
            <p className="text-slate-500 text-xs leading-relaxed mb-7">
              You are trying to respond to a listing using the same email address as the person who posted it. Each match requires two different people — a <strong className="text-emerald-400">Hooper</strong> (sender) and a <strong className="text-blue-400">Booter</strong> (traveller).
            </p>
            <button
              onClick={() => { setBlockingError(''); closeModal(); }}
              className="w-full rounded-xl bg-gradient-to-r from-red-600 to-rose-500 py-3.5 text-sm font-bold text-white hover:shadow-lg hover:shadow-red-500/30 transition-all"
            >
              Got it — close
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          INTEREST / OFFER MODAL
      ══════════════════════════════════════════════════════ */}
      {selectedTrip && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 shadow-2xl p-7 animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto">

            {/* Modal header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                {step !== 'initial' && step !== 'confirmed' && (
                  <button onClick={goBack} className="flex items-center gap-1 text-xs text-slate-500 hover:text-white transition-colors mb-2">
                    <ChevronLeft className="h-3.5 w-3.5" /> Back
                  </button>
                )}
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Live Journey</span>
                </div>
                <h2 className="text-xl font-black text-white">
                  {selectedTrip.from_city_en || selectedTrip.from_city} → {selectedTrip.to_city_en || selectedTrip.to_city}
                  {selectedTrip.translated && selectedTrip.language && selectedTrip.language !== 'en' && (
                    <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/25 text-blue-400 text-xs font-semibold align-middle">
                      <Globe className="h-3 w-3" /> {selectedTrip.language.toUpperCase()}
                    </span>
                  )}
                </h2>
              </div>
              <button onClick={closeModal} className="p-2 text-slate-500 hover:text-white transition-colors flex-shrink-0">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Journey summary card — always visible */}
            <div className="rounded-2xl border border-white/8 bg-white/4 p-4 mb-6 space-y-3">
              {selectedTrip.travel_date && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400 flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Date</span>
                  <span className="text-white font-semibold">
                    {new Date(selectedTrip.travel_date + 'T00:00:00').toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}
                  </span>
                </div>
              )}
              {selectedTrip.weight && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400 flex items-center gap-1.5"><Package className="h-3.5 w-3.5" /> Capacity</span>
                  <span className="text-white font-semibold">{weightLabel(selectedTrip.weight)}</span>
                </div>
              )}
              {selectedTrip.price && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Listed price</span>
                  <span className="text-cyan-400 font-black text-lg">£{Number(selectedTrip.price).toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* ── STEP: initial ── */}
            {step === 'initial' && (
              <>
                {/* Context-aware header */}
                {selectedTrip.type === 'travel' ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <Plane className="h-4 w-4 text-blue-400" />
                      </div>
                      <p className="text-white font-black text-base">Booter has space on this route</p>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed mb-5">
                      This <span className="text-blue-300 font-semibold">Booter (Traveller)</span> is already flying this route and has luggage space available.
                      Request them to carry your package — they earn, you save on shipping.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <Package className="h-4 w-4 text-emerald-400" />
                      </div>
                      <p className="text-white font-black text-base">Hooper needs a carrier</p>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed mb-5">
                      This <span className="text-emerald-300 font-semibold">Hooper (Sender)</span> has a package ready to go on this route.
                      If you&apos;re travelling this way, carry it and earn from your spare luggage space.
                    </p>
                  </>
                )}

                <div className="flex gap-3">
                  {selectedTrip.price ? (
                    <>
                      <button
                        onClick={() => { setInterestType('offer'); setStep('choose-price'); }}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-blue-500/40 bg-blue-500/10 py-4 text-sm font-bold text-blue-300 hover:bg-blue-500/20 transition-all"
                      >
                        <Tag className="h-4 w-4" /> Make Offer
                      </button>
                      <button
                        onClick={() => { setInterestType('full_price'); setStep('enter-email'); }}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-4 text-sm font-bold text-white hover:shadow-lg hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        <CheckCircle className="h-4 w-4" />
                        {selectedTrip.type === 'travel' ? 'Request Carry' : 'I\'ll Carry This'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => { setInterestType('full_price'); setStep('enter-email'); }}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-4 text-sm font-bold text-white hover:shadow-lg hover:shadow-blue-500/40 hover:scale-[1.02] transition-all"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {selectedTrip.type === 'travel' ? 'Request Carry' : 'I\'ll Carry This'}
                    </button>
                  )}
                </div>
              </>
            )}

            {/* ── STEP: choose-price ── */}
            {step === 'choose-price' && (
              <>
                <p className="text-slate-300 text-sm font-semibold mb-1">Select your offer</p>
                <p className="text-slate-500 text-xs mb-5">
                  Listed at <span className="text-white font-bold">£{Number(selectedTrip.price).toFixed(2)}</span> — choose a price below.
                </p>
                <div className="space-y-2 mb-5">
                  {TIERS.map(tier => {
                    const price   = (Number(selectedTrip.price) * (1 - tier.pct / 100)).toFixed(2);
                    const chosen  = discountPct === tier.pct;
                    return (
                      <button key={tier.pct} onClick={() => setDiscountPct(tier.pct)}
                        className={`relative w-full flex items-center justify-between rounded-2xl border px-5 py-4 transition-all duration-200 ${
                          chosen
                            ? 'border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/20'
                            : 'border-white/10 bg-white/4 hover:border-white/20'
                        }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${chosen ? 'border-blue-400 bg-blue-400' : 'border-slate-600'}`}>
                            {chosen && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <div className="text-left">
                            <p className="text-white font-black text-lg leading-none">£{price}</p>
                            <p className={`text-xs mt-0.5 ${chosen ? 'text-blue-300' : 'text-slate-500'}`}>{tier.label}</p>
                          </div>
                        </div>
                        {tier.recommended && (
                          <span className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                            ⭐ Recommended
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => setStep('enter-email')}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-4 text-sm font-bold text-white hover:shadow-lg hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  Continue with £{(Number(selectedTrip.price) * (1 - discountPct / 100)).toFixed(2)} →
                </button>
              </>
            )}

            {/* ── STEP: enter-email ── */}
            {step === 'enter-email' && (
              <>
                {/* Selected price summary */}
                <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-300 font-semibold uppercase tracking-wider mb-1">
                      {interestType === 'full_price' ? 'Full price' : `${discountPct}% discount`}
                    </p>
                    <p className="text-white font-black text-2xl">£{computePrice(selectedTrip)}</p>
                  </div>
                  {interestType === 'offer' && (
                    <p className="text-slate-500 text-xs text-right line-through">£{Number(selectedTrip.price).toFixed(2)}</p>
                  )}
                </div>

                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Your email address</label>
                <input type="email" placeholder="you@example.com" value={email}
                  onChange={e => { setEmail(e.target.value); setFieldError(''); }}
                  onKeyDown={e => e.key === 'Enter' && sendOtp()}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/60 transition-colors mb-1" />
                {fieldError && <p className="text-red-400 text-xs mb-3">{fieldError}</p>}
                <p className="text-slate-600 text-xs mb-5 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" /> We&apos;ll send a one-time code to verify your email.
                </p>
                <button onClick={sendOtp} disabled={busy}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-4 text-sm font-bold text-white hover:shadow-lg hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100">
                  {busy
                    ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Sending...</>
                    : <><Mail className="h-4 w-4" /> Send verification code</>}
                </button>
              </>
            )}

            {/* ── STEP: enter-otp ── */}
            {step === 'enter-otp' && (
              <>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Mail className="h-6 w-6 text-blue-400" />
                  </div>
                  <p className="text-white font-semibold text-sm mb-1">Check your inbox</p>
                  <p className="text-slate-500 text-xs">
                    We sent a code to <span className="text-white font-medium">{email}</span>
                  </p>
                </div>

                {/* Offer summary */}
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/8 px-4 py-3 mb-5 flex items-center justify-between">
                  <span className="text-slate-400 text-xs">
                    {interestType === 'full_price' ? 'Full price offer' : `${discountPct}% discount offer`}
                  </span>
                  <span className="text-white font-black">£{computePrice(selectedTrip)}</span>
                </div>

                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Verification code</label>
                <input type="text" placeholder="Enter code" value={otpCode} maxLength={8}
                  onChange={e => { setOtpCode(e.target.value.toUpperCase()); setFieldError(''); }}
                  onKeyDown={e => e.key === 'Enter' && verifyAndSubmit()}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white text-center tracking-widest placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/60 transition-colors mb-1" />
                {fieldError && <p className="text-red-400 text-xs mb-3 text-center">{fieldError}</p>}
                <p className="text-slate-600 text-xs text-center mb-5">
                  Didn&apos;t receive it?{' '}
                  <button onClick={() => { setOtpCode(''); setFieldError(''); setStep('enter-email'); }} className="text-cyan-500 hover:text-cyan-400 transition-colors">
                    Resend code
                  </button>
                </p>

                <button onClick={verifyAndSubmit} disabled={busy}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-4 text-sm font-bold text-white hover:shadow-lg hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100">
                  {busy
                    ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Verifying...</>
                    : interestType === 'full_price'
                      ? <><CheckCircle className="h-4 w-4" /> Confirm interest</>
                      : <><Tag className="h-4 w-4" /> Submit offer</>}
                </button>
              </>
            )}

            {/* ── STEP: confirmed ── */}
            {step === 'confirmed' && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/40">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <p className="text-white font-black text-xl mb-2">
                  {interestType === 'full_price' ? 'Interest confirmed!' : 'Offer submitted!'}
                </p>
                <p className="text-slate-400 text-sm mb-2">
                  {interestType === 'full_price'
                    ? 'The listing owner has been notified and can now accept or decline.'
                    : `Your offer of £${computePrice(selectedTrip)} has been sent to the listing owner.`}
                </p>
                <p className="text-slate-500 text-xs mb-8">We&apos;ll email you at <span className="text-white">{email}</span> when they respond.</p>
                <button onClick={closeModal} className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-4 text-sm font-bold text-white hover:shadow-lg transition-all">
                  Done
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

export default function LiveJourneysPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#07111f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500/50" />
      </div>
    }>
      <LiveJourneysContent />
    </Suspense>
  );
}
