'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Suspense, useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight, CheckCircle, Menu, Package,
  Plane, Search, Star, X, Users,
  MessageCircle,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import BootHopLogo from '@/components/BootHopLogo';
import Footer from '@/components/Footer';
import RoleToggle from '@/components/RoleToggle';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-key'
);

type Mode = 'send' | 'travel';
type TripForm = { from: string; to: string; date: string; price: string; email: string; weight: string; };
type RecentTrip = { id?: string; from_city: string; to_city: string; travel_date: string; type: Mode; weight?: string; };

const navLinks = [
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/trust-safety', label: 'Trust & Safety' },
  { href: '/journeys', label: 'Live Journeys' },
  { href: '/business', label: 'For Business' },
];

const testimonials = [
  { name: 'Toyin A.', role: 'MSc Student, London', route: 'Lagos → London', text: 'I travelled from Lagos to London and used BootHop to send documents ahead. Everything arrived before I did.', rating: 5 },
  { name: 'Kunle O.', role: 'Tech Consultant', route: 'Lagos → London', text: 'Moving from Lagos to London for work was hectic, but BootHop made sending personal items simple.', rating: 5 },
  { name: 'James R.', role: 'Management Consultant', route: 'London → New York', text: 'Delivered a small parcel via BootHop on my London–New York trip. Straightforward process and great communication.', rating: 5 },
];

const featuredRoutes = [
  { from: 'London', to: 'Lagos',         tag: 'Most Popular',   color: 'from-blue-500/20 to-blue-600/10',    border: 'border-blue-500/20',    badge: 'bg-blue-500/20 text-blue-300',     travellers: 12, departs: 'Today' },
  { from: 'Manchester', to: 'Lagos',     tag: 'High Demand',    color: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/20', badge: 'bg-emerald-500/20 text-emerald-300', travellers: 7, departs: 'Tomorrow' },
  { from: 'Derby', to: 'Heathrow',       tag: 'UK Domestic',    color: 'from-violet-500/20 to-violet-600/10', border: 'border-violet-500/20',  badge: 'bg-violet-500/20 text-violet-300', travellers: 4, departs: 'Today' },
  { from: 'London', to: 'Aberdeen',      tag: 'UK Domestic',    color: 'from-sky-500/20 to-sky-600/10',      border: 'border-sky-500/20',     badge: 'bg-sky-500/20 text-sky-300',       travellers: 3, departs: 'Tomorrow' },
  { from: 'London', to: 'Edinburgh',     tag: 'High Demand',    color: 'from-green-500/20 to-green-600/10',  border: 'border-green-500/20',   badge: 'bg-green-500/20 text-green-300',   travellers: 9, departs: 'Today' },
  { from: 'London', to: 'New York',      tag: 'Transatlantic',  color: 'from-cyan-500/20 to-cyan-600/10',    border: 'border-cyan-500/20',    badge: 'bg-cyan-500/20 text-cyan-300',     travellers: 5, departs: 'Thu' },
  { from: 'Birmingham', to: 'Lagos',     tag: 'Growing Route',  color: 'from-amber-500/20 to-amber-600/10',  border: 'border-amber-500/20',   badge: 'bg-amber-500/20 text-amber-300',   travellers: 6, departs: 'Tomorrow' },
  { from: 'London', to: 'Dubai',         tag: 'International',  color: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-500/20', badge: 'bg-orange-500/20 text-orange-300', travellers: 8, departs: 'Today' },
  { from: 'Nottingham', to: 'Lagos',     tag: 'New Corridor',   color: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-500/20', badge: 'bg-purple-500/20 text-purple-300', travellers: 2, departs: 'Fri' },
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
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setIndex((prev) => (prev + 1) % testimonials.length), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="testimonials" className="relative py-20 md:py-28 bg-[#07111f]">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-blue-400">Community Stories</p>
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Trusted by travellers worldwide</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              onClick={() => setIndex(i)}
              className={`cursor-pointer rounded-3xl border p-6 transition-all duration-500 ${i === index ? 'border-blue-500/30 bg-blue-500/8 shadow-[0_20px_60px_rgba(59,130,246,0.15)]' : 'border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/5'}`}
            >
              <StarRating count={t.rating} />
              <p className="mt-4 text-sm leading-relaxed text-white/75 italic">&quot;{t.text}&quot;</p>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-300">
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-white/45">{t.role} · {t.route}</p>
                </div>
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
    glow:     'rgba(59,130,246,0.22)',
    border:   'border-blue-500/30',
    bg:       'from-blue-900/50 to-blue-700/20',
    tag:      'text-blue-300/80',
  },
  {
    emoji:    '🚆',
    label:    'Rail',
    title:    'Same-Day UK Corridors',
    body:     'Intercity trains connect London, Manchester, Birmingham, Edinburgh and beyond. Perfect for domestic same-day delivery.',
    accent:   'cyan',
    glow:     'rgba(6,182,212,0.22)',
    border:   'border-cyan-500/30',
    bg:       'from-cyan-900/50 to-cyan-700/20',
    tag:      'text-cyan-300/80',
  },
  {
    emoji:    '🚗',
    label:    'Road',
    title:    'Door-to-Door Precision',
    body:     'Drivers and commuters cover the last mile. Fast, flexible, and ideal for local same-day jobs where flexibility matters most.',
    accent:   'violet',
    glow:     'rgba(139,92,246,0.22)',
    border:   'border-violet-500/30',
    bg:       'from-violet-900/50 to-violet-700/20',
    tag:      'text-violet-300/80',
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
        className={`relative backdrop-blur-xl bg-gradient-to-br ${mode.bg} border ${mode.border} rounded-3xl p-10 text-left
          shadow-[0_0_80px_var(--glow),0_24px_64px_rgba(0,0,0,0.45)]
          animate-[fadeSlide_0.45s_ease_forwards]`}
        style={{ '--glow': mode.glow } as React.CSSProperties}
      >
        <div className="text-4xl mb-5">{mode.emoji}</div>
        <p className={`text-xs font-bold uppercase tracking-[0.2em] mb-2 ${mode.tag}`}>{mode.label}</p>
        <h3 className="text-white text-2xl font-semibold mb-3">{mode.title}</h3>
        <p className="text-white/60 text-sm leading-relaxed">{mode.body}</p>
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
                ? 'w-8 h-2.5 bg-white'
                : 'w-2.5 h-2.5 bg-white/25 hover:bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* Prev / Next arrows */}
      <div className="flex items-center justify-center gap-4 mt-5">
        <button
          onClick={() => go((active - 1 + TRANSPORT_MODES.length) % TRANSPORT_MODES.length, -1)}
          className="w-9 h-9 rounded-full border border-white/15 bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
          aria-label="Previous"
        >
          ‹
        </button>
        <button
          onClick={() => go((active + 1) % TRANSPORT_MODES.length, 1)}
          className="w-9 h-9 rounded-full border border-white/15 bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
          aria-label="Next"
        >
          ›
        </button>
      </div>
    </div>
  );
}

function HomePageContent() {
  useScrollReveal();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('send');
  const [winsVid,  setWinsVid]  = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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
    const onScroll = () => { setScrollY(window.scrollY); setScrolled(window.scrollY > 20); };
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

  const trustItems = useMemo(() => ['Identity verified', 'Secure escrow', '95% satisfaction', 'Free to join'], []);

  const resetForm = () => {
    setTrip({ from: '', to: '', date: '', price: '', email: '', weight: '' });
    setQueryFrom(''); setQueryTo('');
    setFromSuggestions([]); setToSuggestions([]);
    setFromSelected(false); setToSelected(false);
    setShowEmail(false); setEmailSent(false);
  };

  const loadTrips = useCallback(async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('trips').select('id, from_city, to_city, travel_date, type, weight')
      .gte('travel_date', tomorrowStr).order('travel_date', { ascending: true }).limit(50);
    if (!error) setTrips((data as RecentTrip[]) || []);
  }, []);

  useEffect(() => { loadTrips(); }, [loadTrips]);

  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      window.history.replaceState({}, '', '/');
      loadTrips();
    }
  }, [searchParams, loadTrips]);

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

  const inputClass = "w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-blue-400/70 focus:border-blue-400/50 backdrop-blur-xl transition-all duration-200 hover:bg-white/15 hover:border-white/30 text-sm shadow-inner shadow-black/10";

  return (
    <div className="min-h-screen bg-[#07111f] text-white overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className={`fixed top-0 z-50 w-full transition-all duration-500 ${scrolled ? 'border-b border-white/10 bg-[#07111f]/90 shadow-xl backdrop-blur-2xl' : 'bg-transparent backdrop-blur-sm'}`}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:px-8">
          <Link href="/" className="flex items-center">
            <BootHopLogo
              iconClass="text-white"
              textClass="text-white"
            />
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white/65 hover:text-white hover:bg-white/8 transition-all duration-200">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-white/65 hover:text-white hover:bg-white/8 transition-all duration-200">Log in</Link>
            <Link href="/register" className="rounded-full bg-blue-500 px-5 py-2 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(59,130,246,0.4)]">Get Started</Link>
          </div>

          <button className="rounded-lg p-2 md:hidden text-white/70 hover:text-white hover:bg-white/8 transition-all"
            onClick={() => setMobileOpen((prev) => !prev)} aria-label="Toggle menu">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-white/8 bg-[#07111f]/98 backdrop-blur-2xl md:hidden">
            <div className="space-y-1 px-6 py-4">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-4 py-3 text-sm font-medium text-white/65 hover:text-white hover:bg-white/8 transition-colors">{link.label}</Link>
              ))}
              <div className="flex flex-col gap-2 pt-3">
                <Link href="/login" className="block rounded-xl border border-white/12 py-3 text-center text-sm font-medium text-white/65 hover:text-white hover:bg-white/8 transition-all">Log in</Link>
                <Link href="/register" className="block rounded-xl bg-blue-500 py-3 text-center text-sm font-semibold text-white">Get Started</Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen overflow-hidden flex flex-col justify-center pt-16">

        {/* PLANE VIDEO — SPEED SIGNAL */}
        <video autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover">
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

        {/* CONTENT */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex items-center pt-8 pb-20 md:py-0">
          <div className="grid md:grid-cols-2 gap-12 items-center w-full">

            {/* LEFT */}
            <div>
              {/* H1 anchored at top — visible immediately above the fold */}
              <h1 className="text-4xl md:text-6xl font-semibold text-white leading-tight mb-4 tracking-tight">
                Move Almost Anything.<br />Anywhere. Same Day.
              </h1>

              {/* Trust tag below headline */}
              <div className="mb-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm backdrop-blur-md">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Free to join · No subscription · No hidden fees
              </div>

              <p className="text-white/80 text-lg mb-3 max-w-xl leading-relaxed">
                Your fastest delivery option is already moving.
              </p>
              <p className="text-white/55 text-sm mb-7">
                UK &amp; Europe · Hand-carried by verified travellers · <Link href="/trust-safety" className="underline underline-offset-2 hover:text-white/80 transition-colors">What can I send?</Link>
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-4 mb-4">
                <Link href="#booking-form"
                  onClick={(e) => { e.preventDefault(); document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth' }); }}
                  className="px-7 py-3 rounded-full bg-white text-black font-semibold text-sm hover:scale-105 hover:shadow-[0_12px_32px_rgba(255,255,255,0.2)] transition-all">
                  Send a Package
                </Link>
                <Link href="/business"
                  className="px-7 py-3 rounded-full border border-white/30 text-white text-sm font-medium hover:bg-white/10 transition-all">
                  For Business
                </Link>
              </div>

              {/* £20 signup credit pill */}
              <a href="#emotional-hook"
                onClick={(e) => { e.preventDefault(); document.getElementById('emotional-hook')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="inline-flex items-center gap-2 rounded-full border border-amber-500/35 bg-amber-500/10 backdrop-blur-sm px-5 py-2.5 text-sm font-semibold text-amber-300 hover:bg-amber-500/15 transition-all mb-5 cursor-pointer">
                🎁 New members get £20 delivery credit — claim yours
                <ArrowRight className="h-3.5 w-3.5" />
              </a>

              <p className="text-white/55 text-sm mb-7">⚡ Get matched with a verified traveller in minutes</p>

              {/* Micro How It Works */}
              <div className="flex flex-wrap items-center gap-2 text-white/45 text-sm mb-6">
                {['Post', 'Match', 'Meet', 'Deliver'].map((step, i, arr) => (
                  <span key={step} className="flex items-center gap-2">
                    <span className="text-white/70 font-medium">{step}</span>
                    {i < arr.length - 1 && <ArrowRight className="h-3 w-3 text-white/25" />}
                  </span>
                ))}
              </div>

              {/* Trust strip */}
              <div className="flex flex-wrap gap-5 text-white/55 text-xs">
                <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-green-400" />Identity verified</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-green-400" />Secure escrow</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-green-400" />95% satisfaction rate</span>
              </div>
            </div>

            {/* RIGHT — live glass card */}
            <div className="relative hidden md:block">
              <div className="rounded-3xl border border-white/20 bg-white/5 backdrop-blur-xl p-3 shadow-[0_40px_120px_rgba(0,0,0,0.6)]">
                <div className="relative overflow-hidden rounded-2xl" style={{ aspectRatio: '4/5' }}>
                  <Image src="/images/drealboothop.jpg" alt="BootHop delivery" fill priority className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  {/* Live badge */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 backdrop-blur-xl">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs font-semibold text-white/90">Live platform</span>
                  </div>
                  {/* ID Verified badge */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-green-500/20 border border-green-500/30 px-3 py-1.5 backdrop-blur-xl">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    <span className="text-xs text-white font-semibold">ID Verified</span>
                  </div>
                  {/* Match found signal */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-xl bg-black/60 px-4 py-2 backdrop-blur-md">
                    <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-white font-medium">Match found · 2 mins ago</span>
                  </div>
                </div>
              </div>
              {/* Floating route card */}
              <div className="absolute -bottom-4 -left-8 rounded-2xl border border-white/25 bg-white/10 p-4 shadow-2xl backdrop-blur-xl">
                <p className="mb-1.5 text-[10px] font-semibold text-white/50 uppercase tracking-wider">Live Match</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/25">
                    <Plane className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">London → Lagos</p>
                    <p className="text-xs text-white/50">Verified traveller · 3 slots left</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* ── EMOTIONAL STORY — "Sending home" + £20 credit ── */}
      <section id="emotional-hook" className="relative overflow-hidden" style={{ minHeight: '92vh' }}>

        {/* dont_worry.mp4 — the emotional hook video */}
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/videos/onecall/test_v/dont_worry.mp4" type="video/mp4" />
        </video>

        {/* Layered overlays — heavy on left for text, fades to transparent on right so video shows */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#07111f] via-[#07111f]/85 to-[#07111f]/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07111f]/70 via-transparent to-[#07111f]/85" />

        {/* Soft warm ambient — gives the section a gentle glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_60%,rgba(245,158,11,0.07),transparent_60%)]" />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-28 flex items-center min-h-[92vh] w-full">
          <div className="max-w-xl w-full">

            {/* Eyebrow label */}
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/8 backdrop-blur-sm px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300/90 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Why BootHop exists
            </div>

            {/* Headline — three-line emotional break */}
            <h2 className="text-4xl sm:text-5xl md:text-[3.75rem] font-extrabold text-white leading-[1.06] tracking-tight mb-7">
              Sending home<br />
              <span className="text-white/38">shouldn&apos;t be</span><br />
              this hard.
            </h2>

            {/* Body copy */}
            <p className="text-white/60 text-lg leading-[1.75] mb-3 max-w-[420px]">
              A birthday present stuck at a depot. A letter that can&apos;t wait. A gift that means
              everything — delayed by slow couriers and hidden fees.
            </p>
            <p className="text-white/38 text-base leading-[1.75] mb-11 max-w-[400px]">
              We built BootHop so the miles between you and home feel smaller — by connecting
              your parcel with a real person already making that journey.
            </p>

            {/* ── £20 CREDIT CARD ── */}
            <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-[#1c1300]/90 to-[#0d0900]/70 backdrop-blur-2xl p-7 shadow-[0_0_90px_rgba(245,158,11,0.10),0_32px_80px_rgba(0,0,0,0.55)]">
              <div className="flex items-start gap-5">

                {/* Gift icon block */}
                <div className="w-14 h-14 rounded-2xl border border-amber-500/25 bg-amber-500/10 flex items-center justify-center shrink-0 text-2xl shadow-[inset_0_1px_0_rgba(245,158,11,0.12)]">
                  🎁
                </div>

                <div className="flex-1 min-w-0">
                  {/* Title row */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <p className="text-amber-200 font-extrabold text-xl">£20 free credit</p>
                    <span className="rounded-full bg-amber-500/15 border border-amber-500/25 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 uppercase tracking-wide">
                      New members only
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-white/45 text-sm leading-relaxed mb-6">
                    Join today and your first delivery is on us — up to £20 off, no minimum spend.
                    First 500 members only. Credit applied automatically at checkout.
                  </p>

                  {/* CTA button */}
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-7 py-3.5 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_44px_rgba(245,158,11,0.45)] active:scale-[0.98] shadow-[0_6px_24px_rgba(245,158,11,0.25)]"
                  >
                    Claim £20 &amp; send your first package
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              {/* Subtle divider + social proof strip */}
              <div className="mt-7 pt-5 border-t border-white/[0.06] flex flex-wrap items-center gap-x-6 gap-y-2">
                {[
                  { dot: 'bg-green-400', text: 'No subscription required' },
                  { dot: 'bg-blue-400',  text: 'Auto-applied at checkout' },
                  { dot: 'bg-amber-400', text: 'First 500 members only' },
                ].map(({ dot, text }) => (
                  <span key={text} className="flex items-center gap-1.5 text-[11px] text-white/30 font-medium">
                    <span className={`w-1.5 h-1.5 rounded-full ${dot} opacity-70`} />
                    {text}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── EMAIL MODAL ── */}
      {showEmail && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md rounded-2xl border border-white/12 bg-[#0b1829] p-6 shadow-2xl md:p-8">
            {!emailSent ? (
              <>
                <h2 className="mb-2 text-xl font-semibold text-white md:text-2xl">Almost there</h2>
                <p className="mb-5 text-sm text-white/50">Set your {mode === 'travel' ? 'price' : 'budget'} and enter your email to post.</p>
                <div className="mb-4 relative">
                  <label className="block text-xs text-white/40 mb-1.5">{mode === 'travel' ? 'Your price (£) — what you charge to carry' : 'Your budget (£) — what you\'re willing to pay'}</label>
                  <input type="number" placeholder="e.g. 25" value={trip.price}
                    onChange={(e) => { setTrip({ ...trip, price: e.target.value }); setFormErrors(p => ({ ...p, price: '' })); }}
                    className={`w-full rounded-xl border bg-white/5 p-3.5 text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${formErrors.price ? 'border-red-500/60 ring-1 ring-red-500/40' : 'border-white/12'}`} />
                  {formErrors.price && <p className="mt-1 text-xs text-red-400">{formErrors.price}</p>}
                </div>
                <input type="email" placeholder="Enter your email" value={trip.email}
                  onChange={(e) => { setTrip({ ...trip, email: e.target.value }); setFormErrors(p => ({ ...p, email: '' })); }}
                  className={`mb-1 w-full rounded-xl border bg-white/5 p-3.5 text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${formErrors.email ? 'border-red-500/60 ring-1 ring-red-500/40' : 'border-white/12'}`} />
                {formErrors.email && <p className="mb-3 text-xs text-red-400">{formErrors.email}</p>}
                <div className="flex gap-3">
                  <button onClick={() => setShowEmail(false)}
                    className="flex-1 rounded-xl border border-white/12 py-3 text-sm text-white/65 transition-all hover:bg-white/5 hover:text-white">
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
                <h2 className="mb-1 text-xl font-semibold text-white md:text-2xl">Enter your code</h2>
                <p className="mb-5 text-sm text-white/50">We sent a 5-character code to <span className="font-medium text-blue-400">{trip.email}</span></p>
                <input
                  type="text"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  maxLength={5}
                  placeholder="4827A"
                  className="mb-4 w-full rounded-xl border border-white/12 bg-white/5 p-3.5 text-center text-2xl font-bold tracking-[0.35em] uppercase text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
                {otpError && <p className="mb-3 text-xs text-red-400 text-center">{otpError}</p>}
                <div className="flex gap-3">
                  <button onClick={() => { setEmailSent(false); setCodeInput(''); setOtpError(''); }}
                    className="flex-1 rounded-xl border border-white/12 py-3 text-sm text-white/65 transition-all hover:bg-white/5 hover:text-white">
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
      <section id="booking-form" className="py-20 px-6 bg-[#07111f] border-t border-white/[0.05]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2">Ready to move something?</h2>
            <p className="text-white/40 text-sm">Post in under 30 seconds. We&apos;ll match you with a verified traveller.</p>
          </div>

          {/* Mode toggle */}
          <div className="mb-5 flex justify-center">
            <div className="inline-flex rounded-xl border border-white/20 bg-white/8 p-1 backdrop-blur-xl">
              <button onClick={() => setMode('send')} className={`rounded-lg px-6 py-2.5 text-sm font-semibold transition-all duration-200 ${mode === 'send' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40' : 'text-white/55 hover:text-white hover:bg-white/8'}`}>
                📦 Send Item
              </button>
              <button onClick={() => setMode('travel')} className={`rounded-lg px-6 py-2.5 text-sm font-semibold transition-all duration-200 ${mode === 'travel' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40' : 'text-white/55 hover:text-white hover:bg-white/8'}`}>
                ✈️ I&apos;m Travelling
              </button>
            </div>
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-6 backdrop-blur-xl shadow-[0_32px_80px_rgba(0,0,0,0.4)]">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="relative pb-4">
                <input placeholder="From (City)" value={queryFrom}
                  onChange={(e) => { setQueryFrom(e.target.value); setTrip({ ...trip, from: e.target.value }); setFromSelected(false); setFormErrors(p => ({ ...p, from: '' })); }}
                  className={`${inputClass} ${formErrors.from ? 'border-red-500/60 ring-1 ring-red-500/40' : ''}`} />
                {fromSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-xl border border-white/10 bg-slate-900/98 backdrop-blur-xl shadow-2xl">
                    {fromSuggestions.map((s, i) => (
                      <div key={i} onClick={() => { setTrip({ ...trip, from: s }); setQueryFrom(s); setFromSuggestions([]); setFromSelected(true); setFormErrors(p => ({ ...p, from: '' })); if (window.google?.maps?.places) setSessionToken(new google.maps.places.AutocompleteSessionToken()); }}
                        className="cursor-pointer px-4 py-3 text-sm text-white/85 hover:bg-white/8 hover:text-white transition-colors">{s}</div>
                    ))}
                  </div>
                )}
                {formErrors.from
                  ? <p className="absolute bottom-0 left-0 text-xs text-red-400">{formErrors.from}</p>
                  : queryFrom && !fromSelected && <p className="absolute bottom-0 left-0 text-xs text-amber-400">Select from list</p>}
              </div>
              <div className="relative pb-4">
                <input placeholder="To (City)" value={queryTo}
                  onChange={(e) => { setQueryTo(e.target.value); setTrip({ ...trip, to: e.target.value }); setToSelected(false); setFormErrors(p => ({ ...p, to: '' })); }}
                  className={`${inputClass} ${formErrors.to ? 'border-red-500/60 ring-1 ring-red-500/40' : ''}`} />
                {toSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-xl border border-white/10 bg-slate-900/98 backdrop-blur-xl shadow-2xl">
                    {toSuggestions.map((s, i) => (
                      <div key={i} onClick={() => { setTrip({ ...trip, to: s }); setQueryTo(s); setToSuggestions([]); setToSelected(true); setFormErrors(p => ({ ...p, to: '' })); if (window.google?.maps?.places) setSessionToken(new google.maps.places.AutocompleteSessionToken()); }}
                        className="cursor-pointer px-4 py-3 text-sm text-white/85 hover:bg-white/8 hover:text-white transition-colors">{s}</div>
                    ))}
                  </div>
                )}
                {formErrors.to
                  ? <p className="absolute bottom-0 left-0 text-xs text-red-400">{formErrors.to}</p>
                  : queryTo && !toSelected && <p className="absolute bottom-0 left-0 text-xs text-amber-400">Select from list</p>}
              </div>
              <div className="relative pb-4">
                <label className="block text-xs text-white/40 mb-1.5 pl-1">Travel / send date</label>
                <input type="date" value={trip.date} min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => { setTrip({ ...trip, date: e.target.value }); setFormErrors(p => ({ ...p, date: '' })); }}
                  className={`${inputClass} [color-scheme:dark] ${formErrors.date ? 'border-red-500/60 ring-1 ring-red-500/40' : ''}`} />
                {formErrors.date && <p className="absolute bottom-0 left-0 text-xs text-red-400">{formErrors.date}</p>}
              </div>
              <div className="relative pb-4">
                <select value={trip.weight} onChange={(e) => { setTrip({ ...trip, weight: e.target.value }); setFormErrors(p => ({ ...p, weight: '' })); }}
                  className={`${inputClass} cursor-pointer ${formErrors.weight ? 'border-red-500/60 ring-1 ring-red-500/40' : ''}`}>
                  <option value="" disabled className="bg-slate-900 text-white/50">Package size</option>
                  {weightOptions.map((o) => <option key={o.value} value={o.value} className="bg-slate-900 text-white">{o.label}</option>)}
                </select>
                {formErrors.weight && <p className="absolute bottom-0 left-0 text-xs text-red-400">{formErrors.weight}</p>}
              </div>
              <button onClick={handleSubmit}
                className="sm:col-span-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-4 font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(59,130,246,0.5)] shadow-lg shadow-blue-500/25 text-base tracking-wide">
                {mode === 'send' ? 'Find a Traveller' : 'Post My Journey'} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-4 text-center text-xs text-white/30">Free to join · No subscription · You control your price</p>
          </div>
        </div>
      </section>

      {/* ── BUSINESS STRIP ── */}
      <section className="py-8 px-6 border-y border-white/[0.06] bg-[#020B18]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-2">For Business</p>
            <h3 className="text-white font-semibold text-xl leading-snug max-w-lg">
              Same-day critical logistics for time-sensitive operations
            </h3>
            <p className="text-white/45 text-sm mt-2">
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
      <section className="py-24 md:py-32 bg-[#050D1A]">
        <div className="px-6 max-w-5xl mx-auto w-full">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-3">Simple process</p>
            <h2 className="text-3xl md:text-4xl font-semibold text-white tracking-tight">How BootHop Works</h2>
            <p className="mt-4 text-white/45 text-base">From posting to delivery in four steps.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-14">
            {[
              { n: '01', title: 'Post Your Request', sub: 'Tell us the route, date, and package size. Takes 30 seconds.', icon: '📦', color: 'border-blue-500/25 hover:border-blue-400/40', glow: 'hover:shadow-[0_16px_48px_rgba(59,130,246,0.18)]' },
              { n: '02', title: 'Get Matched', sub: 'We connect you with a verified traveller already making that journey.', icon: '🤝', color: 'border-emerald-500/25 hover:border-emerald-400/40', glow: 'hover:shadow-[0_16px_48px_rgba(16,185,129,0.18)]' },
              { n: '03', title: 'Identity Verified', sub: 'All travellers complete KYC checks before handling any delivery.', icon: '🛡️', color: 'border-violet-500/25 hover:border-violet-400/40', glow: 'hover:shadow-[0_16px_48px_rgba(139,92,246,0.18)]' },
              { n: '04', title: 'Delivered', sub: 'Both sides confirm. Funds release. Simple, safe, done.', icon: '✅', color: 'border-amber-500/25 hover:border-amber-400/40', glow: 'hover:shadow-[0_16px_48px_rgba(245,158,11,0.18)]' },
            ].map(({ n, title, sub, icon, color, glow }) => (
              <div key={n} className={`rounded-2xl border bg-white/[0.03] backdrop-blur-sm p-6 transition-all duration-300 hover:-translate-y-1 ${color} ${glow}`}>
                <div className="text-3xl mb-4">{icon}</div>
                <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2">{n}</p>
                <p className="text-white font-semibold text-base leading-tight mb-2">{title}</p>
                <p className="text-white/45 text-xs leading-relaxed">{sub}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '🔐', label: 'End-to-end encrypted' },
              { icon: '✅', label: 'ID verified travellers' },
              { icon: '💰', label: 'Secure payment escrow' },
              { icon: '🌍', label: '200+ city corridors' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-4 py-3">
                <span className="text-xl">{icon}</span>
                <span className="text-xs text-white/60 font-medium">{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/how-it-works" className="inline-flex items-center gap-2 text-sm text-white/35 hover:text-white/65 transition-colors">
              Full process details <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── POWERED BY MOVEMENT — 3-column transport videos ── */}
      <section className="relative bg-[#020617] py-32 overflow-hidden">

        {/* Plane / Train / Bus — each behind its matching card */}
        <div className="absolute inset-0 opacity-[0.22]">
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

        {/* Dark scrim */}
        <div className="absolute inset-0 bg-black/62" />

        {/* Fade edges into adjacent sections */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/95 via-transparent to-[#020617]/95" />

        {/* Blue radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.13),transparent_70%)]" />

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          <p className="text-blue-400 text-sm font-semibold tracking-[0.2em] uppercase mb-3 reveal">HOW WE MOVE</p>
          <h2 className="text-4xl md:text-5xl text-white font-semibold mb-4 reveal d1">Powered by Movement</h2>
          <p className="text-white/55 max-w-2xl mx-auto mb-16 reveal d2">
            We connect packages with people already moving — by air, rail, or road.
          </p>

          <TransportCarousel />
        </div>
      </section>

      {/* ── WHY BOOTHOP WINS — video background + glass cards ── */}
      <section className="relative py-24 md:py-32 px-6 overflow-hidden">

        {/* Video 1 & 2 crossfading as full background */}
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

        {/* Controlled dark overlay — dim enough for text, light enough to feel the video */}
        <div className="absolute inset-0 bg-black/58" />

        {/* Soft blue ambient glow — lifts the section */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,rgba(59,130,246,0.10),transparent_70%)]" />

        {/* Fade edges into adjacent sections */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050D1A]/90 via-transparent to-[#040C19]/90 pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-3">The Difference</p>
            <h2 className="text-3xl md:text-4xl font-semibold text-white tracking-tight">Why BootHop Wins</h2>
            <p className="mt-4 text-white/55 text-base max-w-lg mx-auto">Traditional couriers were built for a different world. BootHop was built for speed, precision, and last-mile execution.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">

            {/* Traditional — glass with red tint */}
            <div className="rounded-3xl border border-red-500/20 bg-black/30 backdrop-blur-xl p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <div className="flex items-center gap-3 mb-7">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-sm">✕</div>
                <h3 className="text-white font-semibold text-lg">Traditional Courier</h3>
              </div>
              <ul className="space-y-4">
                {[
                  '1–5 day delivery windows',
                  'Fixed pricing with hidden fees',
                  'No idea who handles your package',
                  'Customs delays, lost items, no recourse',
                  'Depot-to-depot — not door-to-door',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white/50">
                    <span className="mt-0.5 text-red-400/60 shrink-0">—</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* BootHop — glass with blue glow */}
            <div className="rounded-3xl border border-blue-500/30 bg-blue-950/30 backdrop-blur-xl p-8 shadow-[0_0_60px_rgba(59,130,246,0.15),inset_0_1px_0_rgba(255,255,255,0.08)]">
              <div className="flex items-center gap-3 mb-7">
                <div className="w-8 h-8 rounded-full bg-blue-500/25 flex items-center justify-center text-sm">✓</div>
                <h3 className="text-white font-semibold text-lg">BootHop</h3>
              </div>
              <ul className="space-y-4">
                {[
                  'Same-day delivery on most routes',
                  'You set the price — transparent, no surprises',
                  'ID-verified traveller, rated by the community',
                  'Escrow protection — funds held until delivery confirmed',
                  'Airport-to-door, city-to-city, or wherever you need',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white/80">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="text-center">
            <Link href="#booking-form"
              onClick={(e) => { e.preventDefault(); document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="inline-flex items-center gap-2 bg-white text-black px-8 py-3.5 rounded-full font-semibold text-sm hover:bg-white/90 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(255,255,255,0.15)]">
              Try it free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURED ROUTES ── */}
      <section className="relative py-20 md:py-28 bg-[#050D1A]">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 text-green-400 text-sm mb-4">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-ping inline-block" />
              Live
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Active Corridors</h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-white/50">Real-time routes with travellers already in motion.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featuredRoutes.map((route) => (
              <div key={`${route.from}-${route.to}`}
                onClick={() => router.push(`/journeys?from=${encodeURIComponent(route.from)}&to=${encodeURIComponent(route.to)}`)}
                className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${route.color} ${route.border} p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer`}>
                <div className="mb-3 flex items-center justify-between">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${route.badge}`}>{route.tag}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] text-green-400 font-semibold">{route.departs}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base font-semibold text-white">{route.from}</span>
                  <ArrowRight className="h-4 w-4 text-white/30" />
                  <span className="text-base font-semibold text-white">{route.to}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1 text-xs text-white/40">
                    <Users className="h-3 w-3" />{route.travellers} traveller{route.travellers !== 1 ? 's' : ''} available
                  </p>
                  <span className="text-xs text-white/25 group-hover:text-white/60 transition-colors">Book →</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/journeys"
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-6 py-3 text-sm font-medium text-white/70 transition-all duration-200 hover:border-white/20 hover:bg-white/8 hover:text-white">
              View all live journeys <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>



      {/* ── TESTIMONIALS ── */}
      <TestimonialsSection />

      {/* ── Final CTA ── */}
      <section className="relative py-36 px-6 text-center overflow-hidden">
        <video autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover scale-105">
          <source src="/videos/onecall/plane1.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/52" />

        <div className="relative z-10 max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300/80 mb-4">Someone is flying that route today</p>
          <h2 className="text-4xl md:text-5xl font-semibold text-white mb-5 tracking-tight leading-tight">
            Your package should<br />
            <span className="text-white/60">already be moving.</span>
          </h2>
          <p className="text-white/50 text-base mb-10 max-w-sm mx-auto leading-relaxed">
            Post in 30 seconds. Match with a verified traveller on their way now.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="#booking-form"
              onClick={(e) => { e.preventDefault(); document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="inline-flex items-center gap-2 bg-white text-black px-8 py-3.5 rounded-full font-bold text-sm hover:bg-white/90 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(255,255,255,0.18)]">
              Post a Journey <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/journeys"
              className="inline-flex items-center gap-2 border border-white/25 text-white/80 px-8 py-3.5 rounded-full text-sm font-medium hover:border-white/50 hover:text-white transition-all">
              Browse Live Routes
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

      <Footer />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#07111f] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500/50 mx-auto mb-4" />
          <p className="text-sm text-white/40">Loading BootHop...</p>
        </div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
