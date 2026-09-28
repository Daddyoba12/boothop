'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Suspense, useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight, CheckCircle, Package,
  Plane, Search, Star, Users,
  MessageCircle,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import dynamic from 'next/dynamic';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import RoleToggle from '@/components/RoleToggle';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const FlightTicker = dynamic(() => import('@/components/bfi/FlightTicker'), { ssr: false });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-key'
);

type Mode = 'send' | 'travel';
type TripForm = { from: string; to: string; date: string; price: string; email: string; weight: string; };
type RecentTrip = { id?: string; from_city: string; to_city: string; travel_date: string; type: Mode; weight?: string; };

const testimonials = [
  { name: 'Toyin A.', role: 'MSc Student', route: 'Lagos → London', text: 'I travelled from Lagos to London and used BootHop to send documents ahead. Everything arrived before I did.', rating: 5, outcome: 'Delivered same day · Escrow payment released' },
  { name: 'Kunle O.', role: 'Tech Consultant', route: 'Lagos → London', text: 'Moving from Lagos to London for work was hectic, but BootHop made sending personal items simple.', rating: 5, outcome: 'Items delivered · Payment secured via escrow' },
  { name: 'James R.', role: 'Management Consultant', route: 'London → New York', text: 'Delivered a small parcel via BootHop on my London–New York trip. Straightforward process and great communication.', rating: 5, outcome: 'Same-day delivery · Traveller rated 5 stars' },
];

const featuredRoutes = [
  { from: 'London',     to: 'Lagos',     tag: 'Most Popular',  color: 'from-blue-50 to-blue-100/60',       border: 'border-blue-200',    badge: 'bg-blue-100 text-blue-700',       travellers: 12, departs: 'Today',     sendSlug: 'london-to-lagos'      },
  { from: 'Manchester', to: 'Lagos',     tag: 'High Demand',   color: 'from-emerald-50 to-emerald-100/60', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', travellers: 7,  departs: 'Tomorrow',  sendSlug: 'manchester-to-lagos'  },
  { from: 'Derby',      to: 'Heathrow',  tag: 'UK Domestic',   color: 'from-violet-50 to-violet-100/60',   border: 'border-violet-200',  badge: 'bg-violet-100 text-violet-700',   travellers: 4,  departs: 'Today',     sendSlug: null                   },
  { from: 'London',     to: 'Aberdeen',  tag: 'UK Domestic',   color: 'from-sky-50 to-sky-100/60',         border: 'border-sky-200',     badge: 'bg-sky-100 text-sky-700',         travellers: 3,  departs: 'Tomorrow',  sendSlug: null                   },
  { from: 'London',     to: 'Edinburgh', tag: 'High Demand',   color: 'from-green-50 to-green-100/60',     border: 'border-green-200',   badge: 'bg-green-100 text-green-700',     travellers: 9,  departs: 'Today',     sendSlug: 'london-to-edinburgh'  },
  { from: 'London',     to: 'New York',  tag: 'Transatlantic', color: 'from-cyan-50 to-cyan-100/60',       border: 'border-cyan-200',    badge: 'bg-cyan-100 text-cyan-700',       travellers: 5,  departs: 'Thu',       sendSlug: null                   },
  { from: 'Birmingham', to: 'Lagos',     tag: 'Growing Route', color: 'from-amber-50 to-amber-100/60',     border: 'border-amber-200',   badge: 'bg-amber-100 text-amber-700',     travellers: 6,  departs: 'Tomorrow',  sendSlug: 'birmingham-to-lagos'  },
  { from: 'London',     to: 'Dubai',     tag: 'International', color: 'from-orange-50 to-orange-100/60',   border: 'border-orange-200',  badge: 'bg-orange-100 text-orange-700',   travellers: 8,  departs: 'Today',     sendSlug: null                   },
  { from: 'Nottingham', to: 'Lagos',     tag: 'New Corridor',  color: 'from-purple-50 to-purple-100/60',   border: 'border-purple-200',  badge: 'bg-purple-100 text-purple-700',   travellers: 2,  departs: 'Fri',       sendSlug: null                   },
];

const weightOptions = [
  { value: 'letter', label: 'Letter (<1kg)' },
  { value: 'small', label: 'Small (<5kg)' },
  { value: 'medium', label: 'Medium (5–23kg)' },
  { value: 'large', label: 'Large (23–32kg)' },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

function TestimonialsSection() {
  return (
    <section id="testimonials" className="relative py-20 md:py-28 bg-slate-50">
      <div className="mx-auto max-w-5xl px-6 md:px-8">

        {/* Big pull quote — first testimonial */}
        <div className="mb-14 border-l-2 border-blue-400 pl-8">
          <p className="text-2xl md:text-3xl font-medium text-slate-800 leading-snug italic mb-6">
            &ldquo;{testimonials[0].text}&rdquo;
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
              {testimonials[0].name[0]}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{testimonials[0].name}</p>
              <p className="text-xs text-slate-400">{testimonials[0].role} · {testimonials[0].route}</p>
            </div>
            <div className="ml-4">
              <StarRating count={testimonials[0].rating} />
            </div>
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs text-green-700 font-medium">
            <CheckCircle className="h-3 w-3 shrink-0" /> {testimonials[0].outcome}
          </div>
        </div>

        {/* Two smaller cards */}
        <div className="grid gap-5 md:grid-cols-2">
          {testimonials.slice(1).map((t) => (
            <div key={t.name} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <StarRating count={t.rating} />
              <p className="mt-3 text-sm leading-relaxed text-slate-600 italic">&quot;{t.text}&quot;</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.role} · {t.route}</p>
                </div>
              </div>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs text-green-700 font-medium">
                <CheckCircle className="h-3 w-3 shrink-0" /> {t.outcome}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const HERO_VIDEO = '/videos/onecall/plane2.mp4';

// ── Transport carousel ────────────────────────────────────────────────────────
const TRANSPORT_MODES = [
  {
    emoji:    '✈️',
    label:    'Air',
    title:    'Flight-Speed Delivery',
    body:     'Match with verified travellers on commercial flights. Ideal for urgent cross-border deliveries, documents, and high-value items.',
    accent:   'blue',
    glow:     'rgba(59,130,246,0.12)',
    border:   'border-blue-200',
    bg:       'from-blue-50 to-blue-100/50',
    tag:      'text-blue-600',
  },
  {
    emoji:    '🚆',
    label:    'Rail',
    title:    'Same-Day UK Corridors',
    body:     'Intercity trains connect London, Manchester, Birmingham, Edinburgh and beyond. Perfect for domestic same-day delivery.',
    accent:   'cyan',
    glow:     'rgba(6,182,212,0.12)',
    border:   'border-cyan-200',
    bg:       'from-cyan-50 to-cyan-100/50',
    tag:      'text-cyan-600',
  },
  {
    emoji:    '🚗',
    label:    'Road',
    title:    'Door-to-Door Precision',
    body:     'Drivers and commuters cover the last mile. Fast, flexible, and ideal for local same-day jobs where flexibility matters most.',
    accent:   'violet',
    glow:     'rgba(139,92,246,0.12)',
    border:   'border-violet-200',
    bg:       'from-violet-50 to-violet-100/50',
    tag:      'text-violet-600',
  },
] as const;

function TransportCarousel() {
  const [active, setActive]   = useState(0);
  const [prev,   setPrev]     = useState<number | null>(null);
  const [dir,    setDir]      = useState<1 | -1>(1);  // 1 = forward, -1 = back

  const go = useCallback((next: number, direction: 1 | -1 = 1) => {
    setPrev(active);
    setDir(direction);
    setActive(next);
  }, [active]);

  // Auto-advance
  useEffect(() => {
    const id = setInterval(() => {
      go((active + 1) % TRANSPORT_MODES.length, 1);
    }, 4000);
    return () => clearInterval(id);
  }, [active, go]);

  const mode = TRANSPORT_MODES[active];

  return (
    <div className="w-full max-w-xl mx-auto select-none">
      {/* Card */}
      <div
        key={active}
        className={`relative bg-gradient-to-br ${mode.bg} border ${mode.border} rounded-3xl p-10 text-left
          shadow-[0_0_50px_var(--glow),0_16px_40px_rgba(15,23,42,0.08)]
          animate-[fadeSlide_0.45s_ease_forwards]`}
        style={{ '--glow': mode.glow } as React.CSSProperties}
      >
        <div className="text-4xl mb-5">{mode.emoji}</div>
        <p className={`text-xs font-bold uppercase tracking-[0.2em] mb-2 ${mode.tag}`}>{mode.label}</p>
        <h3 className="text-slate-900 text-2xl font-semibold mb-3">{mode.title}</h3>
        <p className="text-slate-500 text-sm leading-relaxed">{mode.body}</p>
      </div>

      {/* Dot navigation */}
      <div className="flex items-center justify-center gap-3 mt-7">
        {TRANSPORT_MODES.map((m, i) => (
          <button
            key={m.label}
            onClick={() => go(i, i > active ? 1 : -1)}
            aria-label={`Show ${m.label}`}
            className={`rounded-full transition-all duration-300 ${
              i === active
                ? 'w-8 h-2.5 bg-blue-500'
                : 'w-2.5 h-2.5 bg-slate-300 hover:bg-slate-400'
            }`}
          />
        ))}
      </div>

      {/* Prev / Next arrows */}
      <div className="flex items-center justify-center gap-4 mt-5">
        <button
          onClick={() => go((active - 1 + TRANSPORT_MODES.length) % TRANSPORT_MODES.length, -1)}
          className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
          aria-label="Previous"
        >
          ‹
        </button>
        <button
          onClick={() => go((active + 1) % TRANSPORT_MODES.length, 1)}
          className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
          aria-label="Next"
        >
          ›
        </button>
      </div>
    </div>
  );
}

function RegisteredRedirect({ loadTrips }: { loadTrips: () => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      window.history.replaceState({}, '', '/');
      loadTrips();
    }
  }, [searchParams, loadTrips]);
  return null;
}

function HomePageContent() {
  useScrollReveal();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('send');
  const [winsVid,  setWinsVid]  = useState(0);
  const [showEmail, setShowEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [trips, setTrips] = useState<RecentTrip[]>([]);
  const [queryFrom, setQueryFrom] = useState('');
  const [fromSuggestions, setFromSuggestions] = useState<string[]>([]);
  const [queryTo, setQueryTo] = useState('');
  const [toSuggestions, setToSuggestions] = useState<string[]>([]);
  const [fromSelected, setFromSelected] = useState(false);
  const [toSelected, setToSelected] = useState(false);
  const [sessionToken, setSessionToken] = useState<google.maps.places.AutocompleteSessionToken | null>(null);
  const [mapsReady, setMapsReady] = useState(false);

  const [trip, setTrip] = useState<TripForm>({ from: '', to: '', date: '', price: '', email: '', weight: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [otpError, setOtpError] = useState('');

  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const onScroll = () => { setScrollY(window.scrollY); };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (window.google?.maps?.places) {
      setMapsReady(true);
      setSessionToken(new google.maps.places.AutocompleteSessionToken());
      return;
    }
    const check = setInterval(() => {
      if (window.google?.maps?.places) {
        setMapsReady(true);
        setSessionToken(new google.maps.places.AutocompleteSessionToken());
        clearInterval(check);
      }
    }, 300);
    return () => clearInterval(check);
  }, []);

  useEffect(() => {
    if (fromSelected || !mapsReady) return;
    const timer = setTimeout(() => {
      if (!queryFrom || queryFrom.length < 3) { setFromSuggestions([]); return; }
      new google.maps.places.AutocompleteService().getPlacePredictions(
        { input: queryFrom, types: ['(cities)'], sessionToken: sessionToken || undefined },
        (p) => setFromSuggestions(p ? p.map((x) => x.description) : [])
      );
    }, 350);
    return () => clearTimeout(timer);
  }, [queryFrom, sessionToken, fromSelected, mapsReady]);

  useEffect(() => {
    if (toSelected || !mapsReady) return;
    const timer = setTimeout(() => {
      if (!queryTo || queryTo.length < 3) { setToSuggestions([]); return; }
      new google.maps.places.AutocompleteService().getPlacePredictions(
        { input: queryTo, types: ['(cities)'], sessionToken: sessionToken || undefined },
        (p) => setToSuggestions(p ? p.map((x) => x.description) : [])
      );
    }, 350);
    return () => clearTimeout(timer);
  }, [queryTo, sessionToken, toSelected, mapsReady]);

  // Why BootHop Wins background — 6s crossfade between video1 and video2
  useEffect(() => {
    const id = setInterval(() => setWinsVid(v => (v + 1) % 2), 6000);
    return () => clearInterval(id);
  }, []);

  const [routeCounts, setRouteCounts] = useState<Record<string, number>>({});
  const [routesLoaded, setRoutesLoaded] = useState(false);

  const resetForm = () => {
    setTrip({ from: '', to: '', date: '', price: '', email: '', weight: '' });
    setQueryFrom(''); setQueryTo('');
    setFromSuggestions([]); setToSuggestions([]);
    setFromSelected(false); setToSelected(false);
    setShowEmail(false); setEmailSent(false);
  };

  const loadTrips = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('trips').select('id, from_city, to_city, travel_date, type, weight')
      .gte('travel_date', today).order('travel_date', { ascending: true }).limit(200);
    if (!error) {
      setTrips((data as RecentTrip[]) || []);
      // Count real travellers per featured route
      const counts: Record<string, number> = {};
      for (const t of (data as RecentTrip[]) ?? []) {
        const match = featuredRoutes.find(r =>
          t.from_city?.toLowerCase().includes(r.from.toLowerCase()) &&
          t.to_city?.toLowerCase().includes(r.to.toLowerCase())
        );
        if (match) {
          const key = `${match.from}→${match.to}`;
          counts[key] = (counts[key] ?? 0) + 1;
        }
      }
      setRouteCounts(counts);
      setRoutesLoaded(true);
    }
  }, []);

  useEffect(() => { loadTrips(); }, [loadTrips]);

  // searchParams handled by RegisteredRedirect child (keeps this component out of Suspense)

  const handleSubmit = () => {
    const errors: Record<string, string> = {};
    if (!trip.from)        errors.from   = 'Please enter a departure city';
    else if (!fromSelected) errors.from  = 'Select a city from the dropdown';
    if (!trip.to)          errors.to     = 'Please enter a destination city';
    else if (!toSelected)   errors.to    = 'Select a city from the dropdown';
    if (!trip.date)        errors.date   = 'Please choose a date';
    if (!trip.weight)      errors.weight = 'Please select a weight';
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setFormErrors({});
    setShowEmail(true);
  };

  const sendMagicLink = async () => {
    const errs: Record<string, string> = {};
    if (!trip.price || Number(trip.price) <= 0) errs.price = mode === 'travel' ? 'Please enter your price' : 'Please enter your budget';
    if (!trip.email) errs.email = 'Please enter your email address';
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    setSubmitting(true);
    const journeyPayload = { from: trip.from, to: trip.to, date: trip.date, price: trip.price, weight: trip.weight, mode };
    const res = await fetch('/api/auth/request-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: trip.email, journeyPayload }),
    });
    setSubmitting(false);
    if (!res.ok) { const d = await res.json(); setFormErrors({ email: d.error || 'Unable to send code. Please try again.' }); return; }
    setEmailSent(true);
  };

  const verifyModalCode = async () => {
    const trimmed = codeInput.trim().toUpperCase();
    if (trimmed.length < 5) { setOtpError('Please enter the full 5-character code.'); return; }
    setOtpError('');
    setSubmitting(true);
    const res = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: trip.email, code: trimmed }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { setOtpError(data.error || 'Invalid code. Please try again.'); return; }
    setShowEmail(false); setEmailSent(false); setCodeInput(''); setOtpError('');
    router.push(data.redirectTo || '/intent');
  };

  const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/70 focus:border-blue-400/50 transition-all duration-200 hover:border-slate-300 text-sm";

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden pb-14">

      {/* ── NAV ── */}
      <NavBar />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-20">

        {/* PLANE VIDEO — full-bleed background, brightened for a cinematic feel, poster shown while it loads */}
        <video autoPlay muted loop playsInline poster="/images/hero-plane-poster.jpg"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(1.18) saturate(1.08) contrast(1.02)' }}>
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>

        {/* Overlay — mobile gets an even wash since the copy spans full width; desktop concentrates the dark gradient behind the text column (strong enough to hold the smaller lines, not just the headline) and fades out toward the plane/photo */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60 md:hidden" />
        <div className="absolute inset-0 hidden md:block bg-gradient-to-r from-black/80 via-black/55 to-transparent" />

        {/* CONTENT */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-14 md:py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center w-full">

            {/* LEFT */}
            <div>
              <h1 className="text-4xl md:text-6xl font-semibold text-white leading-tight mb-4 tracking-tight">
                Sending home shouldn&apos;t<br />cost £300 and take a week.
              </h1>

              <p className="text-white/90 text-lg mb-1 max-w-xl leading-relaxed" style={{ textShadow: '0 1px 10px rgba(0,0,0,0.55)' }}>
                Connect with a verified traveller already flying your route.
              </p>
              <p className="text-white/75 text-sm mb-7 max-w-xl" style={{ textShadow: '0 1px 10px rgba(0,0,0,0.55)' }}>
                Same day. You set the price. Payment protected.{' '}
                <Link href="/trust-safety" className="underline underline-offset-2 hover:text-white transition-colors">What can I send? →</Link>
              </p>

              {/* CTAs — two equal options, the first choice made immediately clear */}
              <div className="flex flex-col sm:flex-row gap-3 mb-3">
                <Link href="/start?role=sender"
                  onClick={() => (window as any).ttq?.track('InitiateCheckout', { description: 'hero_sender_cta' })}
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-base transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(245,158,11,0.45)] shadow-lg shadow-amber-500/30">
                  📦 Send an Item
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/start?role=traveller"
                  onClick={() => (window as any).ttq?.track('InitiateCheckout', { description: 'hero_traveller_cta' })}
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full border border-white/25 bg-white/10 hover:bg-white/15 hover:border-white/40 text-white font-bold text-base transition-all hover:-translate-y-0.5">
                  ✈️ Earn While Travelling
                </Link>
              </div>
              <p className="text-white/70 text-sm mb-7" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.55)' }}>
                🎁 New members receive <span className="text-white font-semibold">£20</span> delivery credit ·{' '}
                <span className="text-white/55">Most deliveries £30–£120</span>
              </p>
              <div className="flex flex-col gap-1.5 mb-7">
                <p className="text-xs text-white/60" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.55)' }}>
                  Using BootHop for business?{' '}
                  <Link href="/business" className="underline underline-offset-2 hover:text-white transition-colors">
                    Explore Business Portal →
                  </Link>
                </p>
              </div>

              {/* Micro How It Works */}
              <div className="flex flex-wrap items-center gap-2 text-white/65 text-sm mb-6" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.55)' }}>
                {['Post', 'Match', 'Handoff', 'Deliver'].map((step, i, arr) => (
                  <span key={step} className="flex items-center gap-2">
                    <span className="text-white font-medium">{step}</span>
                    {i < arr.length - 1 && <ArrowRight className="h-3 w-3 text-white/45" />}
                  </span>
                ))}
              </div>

              {/* Trust strip */}
              <div className="flex flex-wrap gap-5 text-white/75 text-xs" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.55)' }}>
                <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-green-400" />Every traveller ID-verified before matching</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-green-400" />Payment held in escrow until you confirm delivery</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-green-400" />Real-time GPS tracking on every active delivery</span>
              </div>
            </div>

            {/* RIGHT — delivery photo, floating over the hero video */}
            <div className="relative hidden md:block">
              <div className="rounded-[28px] border border-white/12 bg-white/5 backdrop-blur-xl p-1.5 shadow-[0_25px_70px_rgba(0,0,0,0.3)]">
                <div className="relative overflow-hidden rounded-[22px]" style={{ aspectRatio: '4/5' }}>
                  <Image src="/images/drealboothop.jpg" alt="BootHop delivery" fill priority
                    className="absolute inset-0 object-cover"
                    style={{ filter: 'sepia(0.14) saturate(1.2) brightness(1.03) contrast(1.02)' }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />

                  {/* Live badge */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 backdrop-blur-xl shadow-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-semibold text-slate-800">Live platform</span>
                  </div>
                  {/* ID Verified badge */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-white/90 border border-green-200 px-3 py-1.5 backdrop-blur-xl shadow-sm">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-slate-800 font-semibold">ID Verified</span>
                  </div>
                  {/* Match found signal */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2 backdrop-blur-md shadow-sm">
                    <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs text-slate-800 font-medium">Match found · 2 mins ago</span>
                  </div>
                </div>
              </div>
              {/* Floating route card */}
              <div className="absolute -bottom-4 -left-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.15)]">
                <p className="mb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Live Match</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                    <Plane className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">London → Lagos</p>
                    <p className="text-xs text-slate-500">Verified traveller · 3 slots left</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* ── WHY NOT DHL? — comparison table, moved to section 2 ── */}
      <section className="relative py-24 md:py-32 px-6 bg-white">

        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600/80 mb-3">Why not just use DHL?</p>
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">Same package. Very different experience.</h2>
          </div>

          {/* Video 1 & 2 crossfading, framed as a banner instead of a full-bleed background */}
          <div className="relative mb-12 overflow-hidden rounded-3xl border border-slate-200 shadow-[0_30px_70px_rgba(15,23,42,0.12)]" style={{ aspectRatio: '21/9' }}>
            {[1, 2].map((n, i) => (
              <video
                key={n}
                autoPlay muted loop playsInline
                preload={i === 0 ? 'auto' : 'none'}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[3000ms] ease-in-out"
                style={{ opacity: i === winsVid ? 1 : 0 }}
              >
                <source src={`/videos/onecall/test_v/video${n}.mp4`} type="video/mp4" />
              </video>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">

            {/* Traditional — light card, red accent */}
            <div className="rounded-3xl border border-red-100 bg-red-50/40 p-8">
              <div className="flex items-center gap-3 mb-7">
                <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm">✕</div>
                <h3 className="text-slate-900 font-semibold text-lg">Traditional Courier</h3>
              </div>
              <ul className="space-y-4">
                {[
                  '1–5 day delivery windows',
                  'Fixed pricing with hidden fees',
                  'No idea who handles your package',
                  'Customs delays, lost items, no recourse',
                  'Depot-to-depot — not door-to-door',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-500">
                    <span className="mt-0.5 text-red-400 shrink-0">—</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* BootHop — light card, blue accent */}
            <div className="rounded-3xl border border-blue-200 bg-blue-50/40 p-8 shadow-[0_20px_50px_rgba(59,130,246,0.08)]">
              <div className="flex items-center gap-3 mb-7">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">✓</div>
                <h3 className="text-slate-900 font-semibold text-lg">BootHop</h3>
              </div>
              <ul className="space-y-4">
                {[
                  'Same-day delivery on most routes',
                  'You set the price — transparent, no surprises',
                  'ID-verified traveller, rated by the community',
                  'Escrow protection — funds held until delivery confirmed',
                  'Airport-to-door, city-to-city, or wherever you need',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="text-center">
            <Link href="/start"
              onClick={() => (window as any).ttq?.track('InitiateCheckout', { description: 'comparison_cta' })}
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-8 py-3.5 rounded-full font-bold text-sm transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(245,158,11,0.4)]">
              🎁 Try it free — Claim £20 credit <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── EMOTIONAL STORY — "Sending home" + £20 credit ── */}
      <section id="emotional-hook" className="relative bg-slate-50 py-24 md:py-32 px-6 overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">

          {/* LEFT — copy + credit card */}
          <div>
            <h2 className="text-4xl sm:text-5xl font-semibold text-slate-900 leading-[1.1] tracking-tight mb-7">
              Sending home<br />
              <span className="text-slate-400">shouldn&apos;t be</span><br />
              this hard.
            </h2>

            <p className="text-slate-600 text-lg leading-[1.75] mb-3 max-w-[420px]">
              A birthday present stuck at a depot. A letter that can&apos;t wait. A gift that means
              everything — delayed by slow couriers and hidden fees.
            </p>
            <p className="text-slate-400 text-base leading-[1.75] mb-11 max-w-[400px]">
              We built BootHop so the miles between you and home feel smaller — by connecting
              your parcel with a real person already making that journey.
            </p>

            {/* ── £20 CREDIT CARD ── */}
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-7 shadow-[0_20px_50px_rgba(245,158,11,0.08)]">
              <div className="flex items-start gap-5">

                <div className="w-14 h-14 rounded-2xl border border-amber-200 bg-amber-100 flex items-center justify-center shrink-0 text-2xl">
                  🎁
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <p className="text-amber-700 font-extrabold text-xl">£20 free credit</p>
                    <span className="rounded-full bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 uppercase tracking-wide">
                      New members only
                    </span>
                  </div>

                  <p className="text-slate-500 text-sm leading-relaxed mb-6">
                    Join today and your first delivery is on us — up to £20 off, no minimum spend.
                    First 500 members only. Credit applied automatically at checkout.
                  </p>

                  <Link
                    href="/start?role=sender"
                    onClick={() => (window as any).ttq?.track('InitiateCheckout', { description: 'credit_cta' })}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-7 py-3.5 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_44px_rgba(245,158,11,0.35)] active:scale-[0.98] shadow-[0_6px_24px_rgba(245,158,11,0.2)]"
                  >
                    Claim £20 &amp; send your first package
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="mt-7 pt-5 border-t border-amber-200/60 flex flex-wrap items-center gap-x-6 gap-y-2">
                {[
                  { dot: 'bg-green-500', text: 'No subscription required' },
                  { dot: 'bg-blue-500',  text: 'Auto-applied at checkout' },
                  { dot: 'bg-amber-500', text: 'First 500 members only' },
                ].map(({ dot, text }) => (
                  <span key={text} className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                    <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                    {text}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — dont_worry.mp4, framed clean with no overlay now that text has moved off it */}
          <div className="relative hidden md:block">
            <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
              <div className="relative overflow-hidden rounded-2xl" style={{ aspectRatio: '4/5' }}>
                <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
                  <source src="/videos/onecall/test_v/dont_worry.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── EMAIL MODAL ── */}
      {showEmail && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl md:p-8">
            {!emailSent ? (
              <>
                <h2 className="mb-2 text-xl font-semibold text-slate-900 md:text-2xl">Almost there</h2>
                <p className="mb-5 text-sm text-slate-500">Set your {mode === 'travel' ? 'price' : 'budget'} and enter your email to post.</p>
                <div className="mb-4 relative">
                  <label className="block text-xs text-slate-400 mb-1.5">{mode === 'travel' ? 'Your price (£) — what you charge to carry' : 'Your budget (£) — what you\'re willing to pay'}</label>
                  <input type="number" placeholder="e.g. 25" value={trip.price}
                    onChange={(e) => { setTrip({ ...trip, price: e.target.value }); setFormErrors(p => ({ ...p, price: '' })); }}
                    className={`w-full rounded-xl border bg-white p-3.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${formErrors.price ? 'border-red-400 ring-1 ring-red-300' : 'border-slate-200'}`} />
                  {formErrors.price && <p className="mt-1 text-xs text-red-500">{formErrors.price}</p>}
                </div>
                <input type="email" placeholder="Enter your email" value={trip.email}
                  onChange={(e) => { setTrip({ ...trip, email: e.target.value }); setFormErrors(p => ({ ...p, email: '' })); }}
                  className={`mb-1 w-full rounded-xl border bg-white p-3.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${formErrors.email ? 'border-red-400 ring-1 ring-red-300' : 'border-slate-200'}`} />
                {formErrors.email && <p className="mb-3 text-xs text-red-500">{formErrors.email}</p>}
                <div className="flex gap-3">
                  <button onClick={() => setShowEmail(false)}
                    className="flex-1 rounded-xl border border-slate-200 py-3 text-sm text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900">
                    Cancel
                  </button>
                  <button onClick={sendMagicLink} disabled={submitting}
                    className="flex-1 rounded-xl bg-blue-500 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(59,130,246,0.4)] disabled:opacity-60 disabled:cursor-not-allowed">
                    {submitting ? 'Sending...' : 'Send Code'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="mb-1 text-xl font-semibold text-slate-900 md:text-2xl">Enter your code</h2>
                <p className="mb-5 text-sm text-slate-500">We sent a 5-character code to <span className="font-medium text-blue-600">{trip.email}</span></p>
                <input
                  type="text"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  maxLength={5}
                  placeholder="4827A"
                  className="mb-4 w-full rounded-xl border border-slate-200 bg-white p-3.5 text-center text-2xl font-bold tracking-[0.35em] uppercase text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
                {otpError && <p className="mb-3 text-xs text-red-500 text-center">{otpError}</p>}
                <div className="flex gap-3">
                  <button onClick={() => { setEmailSent(false); setCodeInput(''); setOtpError(''); }}
                    className="flex-1 rounded-xl border border-slate-200 py-3 text-sm text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900">
                    ← Resend
                  </button>
                  <button onClick={verifyModalCode} disabled={submitting || codeInput.trim().length < 5}
                    className="flex-1 rounded-xl bg-blue-500 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(59,130,246,0.4)] disabled:opacity-60 disabled:cursor-not-allowed">
                    {submitting ? 'Verifying...' : 'Verify & continue'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── BOOKING FORM — right below hero for instant action ── */}
      <section id="booking-form" className="py-20 px-6 bg-white border-t border-slate-100">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-1">Post in 30 seconds.</h2>
            <p className="text-slate-500 text-sm">We&apos;ll match you with a verified traveller heading that way.</p>
          </div>

          {/* Mode toggle */}
          <div className="mb-5 flex justify-center">
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
              <button onClick={() => setMode('send')} className={`rounded-lg px-6 py-2.5 text-sm font-semibold transition-all duration-200 ${mode === 'send' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:text-slate-900 hover:bg-white'}`}>
                📦 Send Item
              </button>
              <button onClick={() => setMode('travel')} className={`rounded-lg px-6 py-2.5 text-sm font-semibold transition-all duration-200 ${mode === 'travel' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:text-slate-900 hover:bg-white'}`}>
                ✈️ I&apos;m Travelling
              </button>
            </div>
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="relative pb-4">
                <input placeholder="From (City)" value={queryFrom}
                  onChange={(e) => { setQueryFrom(e.target.value); setTrip({ ...trip, from: e.target.value }); setFromSelected(false); setFormErrors(p => ({ ...p, from: '' })); }}
                  className={`${inputClass} ${formErrors.from ? 'border-red-500/60 ring-1 ring-red-500/40' : ''}`} />
                {fromSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-xl border border-slate-200 bg-white shadow-2xl">
                    {fromSuggestions.map((s, i) => (
                      <div key={i} onClick={() => { setTrip({ ...trip, from: s }); setQueryFrom(s); setFromSuggestions([]); setFromSelected(true); setFormErrors(p => ({ ...p, from: '' })); if (window.google?.maps?.places) setSessionToken(new google.maps.places.AutocompleteSessionToken()); }}
                        className="cursor-pointer px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors">{s}</div>
                    ))}
                  </div>
                )}
                {formErrors.from
                  ? <p className="absolute bottom-0 left-0 text-xs text-red-500">{formErrors.from}</p>
                  : queryFrom && !fromSelected && <p className="absolute bottom-0 left-0 text-xs text-amber-600">Select from list</p>}
              </div>
              <div className="relative pb-4">
                <input placeholder="To (City)" value={queryTo}
                  onChange={(e) => { setQueryTo(e.target.value); setTrip({ ...trip, to: e.target.value }); setToSelected(false); setFormErrors(p => ({ ...p, to: '' })); }}
                  className={`${inputClass} ${formErrors.to ? 'border-red-500/60 ring-1 ring-red-500/40' : ''}`} />
                {toSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-xl border border-slate-200 bg-white shadow-2xl">
                    {toSuggestions.map((s, i) => (
                      <div key={i} onClick={() => { setTrip({ ...trip, to: s }); setQueryTo(s); setToSuggestions([]); setToSelected(true); setFormErrors(p => ({ ...p, to: '' })); if (window.google?.maps?.places) setSessionToken(new google.maps.places.AutocompleteSessionToken()); }}
                        className="cursor-pointer px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors">{s}</div>
                    ))}
                  </div>
                )}
                {formErrors.to
                  ? <p className="absolute bottom-0 left-0 text-xs text-red-500">{formErrors.to}</p>
                  : queryTo && !toSelected && <p className="absolute bottom-0 left-0 text-xs text-amber-600">Select from list</p>}
              </div>
              <div className="relative pb-4">
                <label className="block text-xs text-slate-400 mb-1.5 pl-1">Travel / send date</label>
                <input type="date" value={trip.date} min={(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })()}
                  onChange={(e) => { setTrip({ ...trip, date: e.target.value }); setFormErrors(p => ({ ...p, date: '' })); }}
                  className={`${inputClass} ${formErrors.date ? 'border-red-500/60 ring-1 ring-red-500/40' : ''}`} />
                {formErrors.date && <p className="absolute bottom-0 left-0 text-xs text-red-500">{formErrors.date}</p>}
              </div>
              <div className="relative pb-4">
                <select value={trip.weight} onChange={(e) => { setTrip({ ...trip, weight: e.target.value }); setFormErrors(p => ({ ...p, weight: '' })); }}
                  className={`${inputClass} cursor-pointer ${formErrors.weight ? 'border-red-500/60 ring-1 ring-red-500/40' : ''}`}>
                  <option value="" disabled className="bg-white text-slate-400">Package size</option>
                  {weightOptions.map((o) => <option key={o.value} value={o.value} className="bg-white text-slate-900">{o.label}</option>)}
                </select>
                {formErrors.weight && <p className="absolute bottom-0 left-0 text-xs text-red-500">{formErrors.weight}</p>}
              </div>
              <button onClick={handleSubmit}
                className="sm:col-span-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-4 font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(59,130,246,0.5)] shadow-lg shadow-blue-500/25 text-base tracking-wide">
                {mode === 'send' ? 'Find a Traveller' : 'Post My Journey'} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-4 text-center text-xs text-slate-400">Free to join · No subscription · You control your price</p>
          </div>
        </div>
      </section>

      {/* ── BUSINESS STRIP ── */}
      <section className="py-8 px-6 border-y border-slate-100 bg-slate-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-2">For Business</p>
            <h3 className="text-slate-900 font-semibold text-xl leading-snug max-w-lg">
              Same-day critical logistics for time-sensitive operations
            </h3>
            <p className="text-slate-500 text-sm mt-2">
              Pharmaceutical samples · Legal documents · Luxury goods · Tech equipment
            </p>
          </div>
          <Link href="/business"
            className="shrink-0 bg-blue-500 text-white px-7 py-3 rounded-full text-sm font-semibold hover:bg-blue-400 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(59,130,246,0.35)] whitespace-nowrap">
            Explore Business Portal →
          </Link>
        </div>
      </section>


      {/* ── HOW BOOTHOP WORKS ── */}
      <section className="py-24 md:py-32 bg-white">
        <div className="px-6 max-w-5xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-14">
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">How BootHop Works</h2>
            <div className="flex items-center gap-5 text-sm text-slate-300 pb-1">
              {['01 Post', '02 Match', '03 Handoff', '04 Deliver'].map((s, i) => (
                <span key={s} className="flex items-center gap-2">
                  <span className="text-slate-500 font-mono text-xs">{s}</span>
                  {i < 3 && <span className="text-slate-200">›</span>}
                </span>
              ))}
            </div>
          </div>

          {/* Two diagram cards side by side */}
          <div className="grid md:grid-cols-2 gap-6 mb-14">

            {/* Traveller card */}
            <div className="group cursor-pointer flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-sm shadow-lg shadow-blue-500/30">✈️</span>
                <div>
                  <p className="text-slate-900 font-bold text-sm">For Travellers</p>
                  <p className="text-slate-400 text-xs">Earn from your spare luggage space</p>
                </div>
              </div>
              <div className="relative flex-1">
                <div className="relative rounded-2xl overflow-hidden border border-blue-100 shadow-[0_20px_50px_rgba(59,130,246,0.10)] group-hover:shadow-[0_24px_60px_rgba(59,130,246,0.18)] group-hover:-translate-y-2 transition-all duration-500 bg-white">
                  <img
                    src="/images/traveller-diagram.jpg"
                    alt="How it works for Travellers"
                    className="w-full h-auto object-contain group-hover:scale-[1.02] transition-transform duration-700"
                  />
                </div>
              </div>
            </div>

            {/* Sender card */}
            <div className="group cursor-pointer flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-sm shadow-lg shadow-emerald-500/30">📦</span>
                <div>
                  <p className="text-slate-900 font-bold text-sm">For Senders</p>
                  <p className="text-slate-400 text-xs">Send anything, anywhere, affordably</p>
                </div>
              </div>
              <div className="relative flex-1">
                <div className="relative rounded-2xl overflow-hidden border border-emerald-100 shadow-[0_20px_50px_rgba(16,185,129,0.10)] group-hover:shadow-[0_24px_60px_rgba(16,185,129,0.18)] group-hover:-translate-y-2 transition-all duration-500 bg-white">
                  <img
                    src="/images/sender-diagram.png"
                    alt="How it works for Senders"
                    className="w-full h-auto object-contain group-hover:scale-[1.02] transition-transform duration-700"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* QR — scan to watch */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/watch"
              className="group flex items-center gap-5 rounded-2xl border border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-blue-50 transition-all duration-300 px-6 py-4 cursor-pointer">
              <Image src="/images/watch-qr.png" alt="Scan to watch" width={72} height={72} className="rounded-lg opacity-90 group-hover:opacity-100 transition-opacity" />
              <div className="text-left">
                <p className="text-slate-900 font-semibold text-sm mb-0.5">Watch how it works</p>
                <p className="text-slate-400 text-xs">Scan with your phone or click to play</p>
                <p className="text-blue-600 text-xs mt-1.5 font-medium group-hover:text-blue-700 transition-colors">▶ Play video →</p>
              </div>
            </Link>
            <Link href="/how-it-works" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-700 transition-colors">
              Full process details <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── POWERED BY MOVEMENT — 3-column transport videos ── */}
      <section className="relative bg-slate-50 py-24 md:py-32 overflow-hidden">
        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl text-slate-900 font-semibold mb-10 reveal">Powered by Movement</h2>

          {/* Plane / Train / Bus — framed banner instead of a full-bleed dark background */}
          <div className="relative mb-14 overflow-hidden rounded-3xl border border-slate-200 shadow-[0_30px_70px_rgba(15,23,42,0.10)]" style={{ aspectRatio: '21/7' }}>
            <div className="grid grid-cols-3 h-full">
              <video autoPlay muted loop playsInline className="w-full h-full object-cover">
                <source src="/videos/onecall/plane2.mp4" type="video/mp4" />
              </video>
              <video autoPlay muted loop playsInline className="w-full h-full object-cover">
                <source src="/videos/onecall/Aboutus_train.mp4" type="video/mp4" />
              </video>
              <video autoPlay muted loop playsInline className="w-full h-full object-cover">
                <source src="/videos/onecall/test1/Aboutusbus.mp4" type="video/mp4" />
              </video>
            </div>
          </div>

          <TransportCarousel />
        </div>
      </section>

      {/* ── FEATURED ROUTES ── */}
      <section className="relative py-20 md:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
              <span className="text-slate-900 font-semibold text-lg">Active Corridors</span>
            </div>
            <Link href="/journeys" className="text-sm text-slate-400 hover:text-slate-700 transition-colors">
              View all →
            </Link>
          </div>

          {!routesLoaded ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 h-28 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {featuredRoutes.map((route) => {
                const liveCount = routeCounts[`${route.from}→${route.to}`] ?? 0;
                const displayCount = liveCount > 0 ? liveCount : route.travellers;
                const isLive = liveCount > 0;
                const href = route.sendSlug
                  ? `/send/${route.sendSlug}`
                  : `/journeys?from=${encodeURIComponent(route.from)}&to=${encodeURIComponent(route.to)}`;
                return (
                  <Link key={`${route.from}-${route.to}`}
                    href={href}
                    className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${route.color} ${route.border} p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer block`}>
                    <div className="mb-3 flex items-center justify-between">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${route.badge}`}>{route.tag}</span>
                      {isLive ? (
                        <div className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-[10px] text-green-600 font-semibold">Live</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">{route.departs}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base font-semibold text-slate-900">{route.from}</span>
                      <ArrowRight className="h-4 w-4 text-slate-300" />
                      <span className="text-base font-semibold text-slate-900">{route.to}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="flex items-center gap-1 text-xs text-slate-500">
                        <Users className="h-3 w-3" />
                        {`${displayCount} traveller${displayCount !== 1 ? 's' : ''} available`}
                      </p>
                      <span className="text-xs text-slate-400 group-hover:text-slate-700 transition-colors">Book →</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>



      {/* ── ROUTE LINK HUB — crawlable anchor links for Google ── */}
      <section className="py-10 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Popular delivery routes</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'London → Lagos',        href: '/send/london-to-lagos'        },
              { label: 'Manchester → Lagos',     href: '/send/manchester-to-lagos'    },
              { label: 'Birmingham → Lagos',     href: '/send/birmingham-to-lagos'    },
              { label: 'London → Abuja',         href: '/send/london-to-abuja'        },
              { label: 'London → Accra',         href: '/send/london-to-accra'        },
              { label: 'Lagos → Chicago',        href: '/send/lagos-to-chicago'       },
              { label: 'Lagos → New York',       href: '/send/lagos-to-new-york'      },
              { label: 'Lagos → Toronto',        href: '/send/lagos-to-toronto'       },
              { label: 'London → Edinburgh',     href: '/send/london-to-edinburgh'    },
              { label: 'London → Manchester',    href: '/send/london-to-manchester'   },
              { label: 'London → Birmingham',    href: '/send/london-to-birmingham'   },
              { label: 'London → Glasgow',       href: '/send/london-to-glasgow'      },
              { label: 'Same-Day UK',            href: '/send/uk-same-day'            },
              { label: 'UK → Europe',            href: '/send/uk-to-europe'           },
              { label: 'Student Delivery',       href: '/send/student-delivery'       },
              { label: 'Business Urgent',        href: '/send/business-urgent'        },
            ].map(({ label, href }) => (
              <Link key={href} href={href}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 transition-all">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── USE CASES — "What people use BootHop for" ── */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="mb-14">
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight mb-2">What people use BootHop for</h2>
            <p className="text-slate-500 text-base">From urgent business deliveries to sending love home.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: '🌍', title: 'Diaspora & Home Goods', body: 'Birthday gifts, food parcels, personal items — from family in the UK to loved ones across Africa and Europe.', tag: 'Consumer', tagColor: 'bg-emerald-100 text-emerald-700' },
              { icon: '🛫', title: 'Airport Hand-Carry', body: 'High-value or fragile items that need a human escort — carried personally, door to door.', tag: 'Premium', tagColor: 'bg-rose-100 text-rose-700' },
              { icon: '📄', title: 'Legal Documents', body: 'Signed contracts, court bundles, mortgage deeds — time-sensitive paperwork that cannot wait for a depot.', tag: 'B2B & Personal', tagColor: 'bg-violet-100 text-violet-700' },
              { icon: '🧬', title: 'Medical & Pharmaceutical', body: 'Clinical samples, patient medication, medical devices — tracked and compliance-aware delivery.', tag: 'B2B', tagColor: 'bg-blue-100 text-blue-700' },
              { icon: '⚙️', title: 'Business-Critical Parts', body: 'Aerospace components, AOG spares, engineering parts — same-day with full compliance documentation.', tag: 'B2B', tagColor: 'bg-blue-100 text-blue-700' },
              { icon: '🛍️', title: 'Retail & E-Commerce', body: 'Overflow fulfilment, marketplace orders, boutique deliveries — where standard couriers are too slow or too costly.', tag: 'B2B', tagColor: 'bg-amber-100 text-amber-700' },
            ].map(({ icon, title, body, tag, tagColor }) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 hover:border-slate-300 hover:bg-white hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <span className="text-3xl mb-4 block">{icon}</span>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <p className="text-slate-900 font-semibold text-base">{title}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tagColor}`}>{tag}</span>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/trust-safety" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-700 transition-colors">
              See full permitted items list <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <TestimonialsSection />

      {/* ── Final CTA — kept as one deliberate bold moment to close on ── */}
      <section className="relative py-36 px-6 text-center overflow-hidden">
        <video autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover scale-105">
          <source src="/videos/onecall/plane1.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/52" />
        {/* Soft fade from the light section above into this closing panel */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/90 to-transparent" />

        <div className="relative z-10 max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300/80 mb-4">Someone is flying that route today</p>
          <h2 className="text-4xl md:text-5xl font-semibold text-white mb-5 tracking-tight leading-tight">
            Your package should<br />
            <span className="text-white/60">already be moving.</span>
          </h2>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/40 mb-6">
            🌍 Expanding: UK → Europe → Africa
          </div>
          <p className="text-white/50 text-base mb-10 max-w-sm mx-auto leading-relaxed">
            Post in 30 seconds. Match with a verified traveller on their way now.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5">
            <Link href="/start?role=sender"
              onClick={() => (window as any).ttq?.track('InitiateCheckout', { description: 'footer_sender_cta' })}
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-8 py-4 rounded-full font-bold text-base transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(245,158,11,0.45)] shadow-lg shadow-amber-500/30">
              📦 Start Sending <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/start?role=traveller"
              onClick={() => (window as any).ttq?.track('InitiateCheckout', { description: 'footer_traveller_cta' })}
              className="inline-flex items-center gap-2 border border-white/20 bg-white/8 hover:bg-white/12 text-white px-8 py-4 rounded-full font-bold text-base transition-all hover:-translate-y-0.5">
              ✈️ Earn While Travelling
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link href="/journeys" className="text-white/40 hover:text-white/70 transition-colors underline underline-offset-2">
              Browse live routes →
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <p className="text-xs text-white/25">Free to join · No subscription · Cancel anytime</p>
            <span className="text-white/15">·</span>
            <span className="inline-flex items-center gap-1 text-xs text-amber-400/60 font-medium">🎁 First 500 members get £20 credit</span>
          </div>
        </div>
      </section>


      {/* Floating WhatsApp button — smaller on mobile so it never overlaps content */}
      <a href="/api/whatsapp"
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-40 flex items-center justify-center w-11 h-11 md:w-13 md:h-13 bg-[#25D366] text-white rounded-full shadow-xl shadow-[#25D366]/35 hover:scale-110 active:scale-95 transition-all"
        aria-label="Chat on WhatsApp">
        <MessageCircle className="h-5 w-5 md:h-6 md:w-6" />
      </a>

      <Suspense fallback={null}>
        <RegisteredRedirect loadTrips={loadTrips} />
      </Suspense>
      <Footer />

      {/* ── FLIGHT TICKER — fixed news-flash bar at the bottom ── */}
      <FlightTicker fixed />
    </div>
  );
}

export default function HomePage() {
  return <HomePageContent />;
}
