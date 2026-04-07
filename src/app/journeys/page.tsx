'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search, Plane, Calendar, Package, ArrowRight, X, Filter,
  Sparkles, CheckCircle, Tag, ChevronLeft, Mail, Shield,
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
  travel_date: string;
  price: number | null;
  weight: string | null;
  type: 'travel' | 'send' | null;
  created_at?: string;
};

/* ── Modal step machine ── */
type ModalStep = 'initial' | 'choose-price' | 'enter-email' | 'enter-otp' | 'confirmed';

export default function LiveJourneysPage() {
  const supabase = createSupabaseClient();

  const [trips, setTrips]               = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromCity, setFromCity]   = useState('');
  const [toCity, setToCity]       = useState('');
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
  const [pendingOpenId, setPendingOpenId] = useState<string | null>(null);

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
    const from = (t.from_city ?? '').toLowerCase();
    const to   = (t.to_city   ?? '').toLowerCase();
    const q    = searchTerm.toLowerCase();
    return (
      (!q         || from.includes(q) || to.includes(q)) &&
      (!fromCity  || from.includes(fromCity.toLowerCase())) &&
      (!toCity    || to.includes(toCity.toLowerCase())) &&
      (!dateFilter || (t.travel_date ?? '') >= dateFilter)
    );
  });

  const clearFilters = () => { setSearchTerm(''); setFromCity(''); setToCity(''); setDateFilter(''); };
  const hasFilters = !!(searchTerm || fromCity || toCity || dateFilter);

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
    // Pre-fill email if logged in
    fetch('/api/auth/me').then(r => r.json()).then(me => {
      if (me.authenticated && me.user?.email) setEmail(me.user.email);
    }).catch(() => {});
  };

  const closeModal = () => setSelectedTrip(null);

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
      <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 transition-colors duration-300 ${focusedField === id ? 'text-cyan-400' : 'text-slate-500'}`}>
        {label}
      </label>
      {children}
      <div className="absolute bottom-0 left-0 h-px w-full bg-white/10" />
      <div className="absolute bottom-0 left-0 h-px bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
        style={{ width: focusedField === id ? '100%' : '0%' }} />
    </div>
  );
  const inputCls = 'w-full bg-transparent pb-3 pt-1 text-sm text-white placeholder:text-slate-600 focus:outline-none';

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

      {/* AMBIENT BLOBS */}
      <div className="hidden sm:block fixed inset-0 opacity-20 pointer-events-none z-0">
        <div className="absolute top-0 -left-4 w-72 h-72 md:w-96 md:h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDuration:'4s'}} />
        <div className="absolute top-0 -right-4 w-72 h-72 md:w-96 md:h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDuration:'6s',animationDelay:'2s'}} />
        <div className="hidden md:block absolute bottom-40 left-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDuration:'5s',animationDelay:'1s'}} />
      </div>

      <NavBar />
      <Suspense><ListingBanner onOpenTrip={(id) => setPendingOpenId(id)} /></Suspense>

      {/* HERO */}
      <section className="relative min-h-[60vh] flex flex-col items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage:'url(/images/GoingonHols1.jpg)', backgroundSize:'cover', backgroundPosition:'center top' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-900/15 to-slate-950/65" />
        <div className="relative z-10 pt-28 pb-16 px-6 w-full max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black mb-4 leading-tight drop-shadow-2xl">
            Live <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">Journeys</span>
          </h1>
          <p className="text-white/80 text-lg font-medium drop-shadow-lg">Real trips from verified BootHop travellers</p>
          <div className="mt-10 max-w-xl mx-auto relative">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
            <input type="text" placeholder="Search any city..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onFocus={() => setFocusedField('search')} onBlur={() => setFocusedField(null)}
              className="w-full bg-transparent border-b border-white/20 py-3 pl-8 pr-8 text-white text-lg placeholder:text-white/35 focus:outline-none focus:border-cyan-400/70 transition-colors duration-300" />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-0 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* FILTER STRIP */}
      <div className="relative z-10 bg-slate-950/60 backdrop-blur-xl border-b border-white/6">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-wrap items-end gap-4 md:gap-10">
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
              <button onClick={clearFilters} className="flex items-center gap-2 text-xs text-slate-500 hover:text-cyan-400 transition-colors pb-3">
                <Filter className="h-3.5 w-3.5" /> Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

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
          <div className="text-center py-24">
            <Plane className="h-10 w-10 text-slate-600 mx-auto mb-4" />
            <p className="text-white font-bold text-lg mb-1">No journeys match your filters</p>
            {hasFilters && <button onClick={clearFilters} className="mt-4 text-sm text-cyan-400">Clear all filters</button>}
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5">
                <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-sm text-blue-400 font-semibold">{filtered.length} {filtered.length === 1 ? 'journey' : 'journeys'} live</span>
              </div>
            </div>

            <div className="space-y-px">
              {filtered.map((trip, i) => (
                <div key={trip.id} onClick={() => openModal(trip)}
                  className="group relative flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-5 border-b border-white/6 hover:bg-white/4 hover:border-white/10 transition-all duration-300 cursor-pointer first:rounded-t-2xl last:rounded-b-2xl last:border-b-0"
                  style={{ animationDelay:`${i*40}ms` }}>
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-cyan-400 rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/40 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Plane className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-white text-base group-hover:text-cyan-400 transition-colors">{trip.from_city}</span>
                        <ArrowRight className="h-4 w-4 text-slate-600 flex-shrink-0" />
                        <span className="font-black text-white text-base group-hover:text-cyan-400 transition-colors">{trip.to_city}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {trip.travel_date && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Calendar className="h-3 w-3" />
                            {new Date(trip.travel_date + 'T00:00:00').toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                          </span>
                        )}
                        {trip.weight && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Package className="h-3 w-3" /> {weightLabel(trip.weight)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0 sm:ml-auto">
                    {trip.type && (
                      <RoleToggle role={trip.type === 'travel' ? 'travel' : 'sender'} />
                    )}
                    {trip.price ? (
                      <div className="text-right">
                        <div className="font-black text-lg bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">£{Number(trip.price).toFixed(2)}</div>
                        <div className="text-xs text-slate-600">budget</div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-600">Negotiable</span>
                    )}
                    <ArrowRight className="h-4 w-4 text-slate-700 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all hidden sm:block" />
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
                <h2 className="text-xl font-black text-white">{selectedTrip.from_city} → {selectedTrip.to_city}</h2>
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
