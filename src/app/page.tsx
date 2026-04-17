'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight, CheckCircle, MapPin, Menu, Package,
  Plane, Search, Star, X, Shield, Zap, Users,
  MessageCircle, Send, Mail,
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

const stats = [
  { value: '10K+', label: 'Verified Users' },
  { value: '50K+', label: 'Successful Deliveries' },
  { value: '200+', label: 'Cities Worldwide' },
  { value: '95%', label: 'Satisfaction Rate' },
];

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

const HERO_VIDEOS = [
  '/videos/onecall/test_v/video1.mp4',
  '/videos/onecall/test_v/video2.mp4',
  '/videos/onecall/test_v/video3.mp4',
  '/videos/onecall/test_v/video4.mp4',
];

const WHY_VIDEOS = [
  '/videos/onecall/test1/Aboutusbus.mp4',
  '/videos/onecall/test1/Boxoff.mp4',
  '/videos/onecall/test1/boxoff5.mp4',
];

function HomePageContent() {
  useScrollReveal();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('send');
  const [bgIdx,    setBgIdx]    = useState(0);
  const [fading,   setFading]   = useState(false);
  const [whyVid,   setWhyVid]   = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [trips, setTrips] = useState<RecentTrip[]>([]);
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [visibleCount, setVisibleCount] = useState(6);

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
  const [contactForm,    setContactForm]    = useState({ name: '', email: '', message: '' });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactStatus,  setContactStatus]  = useState<'idle' | 'ok' | 'err'>('idle');

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

  const advanceSlide = useCallback((targetIdx?: number) => {
    setFading(true);
    setTimeout(() => {
      setBgIdx(i => targetIdx !== undefined ? targetIdx : (i + 1) % HERO_VIDEOS.length);
      setFading(false);
    }, 500);
  }, []);

  // Auto-rotate every 8 seconds (videos are short, also advance onEnded)
  useEffect(() => {
    const id = setInterval(() => advanceSlide(), 8000);
    return () => clearInterval(id);
  }, [advanceSlide]);

  // Why BootHop section — slow 7s crossfade
  useEffect(() => {
    const id = setInterval(() => setWhyVid(v => (v + 1) % WHY_VIDEOS.length), 7000);
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
      alert('🎉 Your trip has been registered successfully!');
      window.history.replaceState({}, '', '/');
      loadTrips();
    }
  }, [searchParams, loadTrips]);

  const filteredTrips = trips.filter(t => {
    const matchFrom = !filterFrom || t.from_city.toLowerCase().includes(filterFrom.toLowerCase());
    const matchTo = !filterTo || t.to_city.toLowerCase().includes(filterTo.toLowerCase());
    const matchDate = !filterDate || t.travel_date.startsWith(filterDate);
    return matchFrom && matchTo && matchDate;
  });

  const booterTrips = filteredTrips.filter(t => t.type === 'travel');
  const hooperTrips = filteredTrips.filter(t => t.type === 'send');

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

  const submitContact = async () => {
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;
    setContactLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: contactForm.name, email: contactForm.email, topic: 'General Enquiry', message: contactForm.message }),
      });
      setContactStatus(res.ok ? 'ok' : 'err');
      if (res.ok) setContactForm({ name: '', email: '', message: '' });
    } catch { setContactStatus('err'); }
    finally { setContactLoading(false); }
  };

  const verifyModalCode = async () => {
    const trimmed = codeInput.trim().toUpperCase();
    if (trimmed.length < 5) { alert('Please enter the full 5-character code.'); return; }
    setSubmitting(true);
    const res = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: trip.email, code: trimmed }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { alert(data.error || 'Invalid code. Please try again.'); return; }
    setShowEmail(false); setEmailSent(false); setCodeInput('');
    router.push(data.redirectTo || '/intent');
  };

  const saveTrip = async () => {
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); alert('Please verify your email first.'); return; }

    // Auto-translate from/to if non-English (best-effort — never blocks trip creation)
    let fromEn = trip.from, toEn = trip.to, lang = 'en', translated = false;
    try {
      const transRes = await fetch('/api/translate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: trip.from, to: trip.to }),
      });
      if (transRes.ok) {
        const t = await transRes.json();
        fromEn = t.fromEn || trip.from; toEn = t.toEn || trip.to;
        lang = t.language || 'en'; translated = !!t.translated;
      }
    } catch { /* translation failed — proceed without */ }

    // Try insert with translation columns; fall back to core fields if columns don't exist
    let savedTrip: any = null;
    const coreFields = { from_city: trip.from, to_city: trip.to, travel_date: trip.date, price: trip.price ? Number(trip.price) : null, weight: trip.weight, user_id: user.id, type: mode };
    const { data: full, error } = await supabase.from('trips')
      .insert([{ ...coreFields, from_city_en: fromEn, to_city_en: toEn, language: lang, translated }])
      .select().single();
    if (error) {
      // Fallback to core fields only
      const { data: core, error: coreErr } = await supabase.from('trips').insert([coreFields]).select().single();
      if (coreErr || !core) { setSubmitting(false); alert('Error saving trip.'); return; }
      savedTrip = core;
    } else {
      savedTrip = full;
    }
    if (error || !savedTrip) { setSubmitting(false); alert('Error saving trip.'); return; }
    try {
      const matchResponse = await fetch('/api/match-engine', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId: savedTrip.id }),
      });
      if (matchResponse.ok) {
        const matchResult = await matchResponse.json();
        if (matchResult?.count > 0) {
          alert(`🎉 Trip saved! We found ${matchResult.count} potential matches.`);
          if (Array.isArray(matchResult.matches))
            await Promise.all(matchResult.matches.map((match: { id: string }) =>
              fetch('/api/send-match-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matchId: match.id }) })
            ));
        } else { alert("Trip saved! We'll notify you when we find a match."); }
      } else { alert("Trip saved, but matching could not run right now."); }
    } catch { alert("Trip saved, but matching could not run right now."); }
    setSubmitting(false); resetForm(); loadTrips();
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

        {/* ── ROTATING VIDEO BACKGROUND — single element, remounts on advance ── */}
        <div className={`absolute inset-0 overflow-hidden transition-opacity duration-500 ${fading ? 'opacity-0' : 'opacity-100'}`}>
          <video
            key={bgIdx}
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={() => advanceSlide()}
            className="absolute inset-0 w-full h-full object-cover animate-zoom"
          >
            <source src={HERO_VIDEOS[bgIdx]} type="video/mp4" />
          </video>
        </div>

        {/* Dark overlay — keeps text readable while video shows through */}
        <div className="absolute inset-0 bg-black/50 pointer-events-none" />
        {/* Bottom fade to blend into dark sections below */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07111f] via-[#07111f]/10 to-transparent pointer-events-none" />
        {/* Left vignette for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-transparent to-transparent pointer-events-none" />

        {/* Dot indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {HERO_VIDEOS.map((_, i) => (
            <button
              key={i}
              onClick={() => advanceSlide(i)}
              aria-label={`Slide ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${i === bgIdx ? 'w-6 h-2 bg-white shadow-lg shadow-white/30' : 'w-2 h-2 bg-white/35 hover:bg-white/65'}`}
            />
          ))}
        </div>

        <div className="relative z-10 mx-auto grid max-w-7xl w-full items-center gap-12 px-6 py-20 md:grid-cols-2 md:px-8 md:py-28">

          {/* LEFT — copy + form */}
          <div className="relative z-10">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 backdrop-blur-md shadow-lg shadow-black/30">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse shadow-sm shadow-green-400/60" />
              <span className="text-xs font-semibold text-white/85 tracking-wide">Free to join · No subscription · No hidden fees</span>
            </div>

            <h1 className="mb-5 max-w-xl text-4xl font-semibold tracking-tight text-white drop-shadow-lg md:text-5xl md:leading-[1.06] lg:text-[3.25rem] lg:leading-[1.08]">
              Move Anything. Anywhere. Same Day.
            </h1>

            <p className="mb-2 max-w-lg text-base text-white/70 drop-shadow md:text-lg leading-relaxed">
              Same-day logistics powered by verified travellers already in motion.
            </p>

            <p className="mb-6 text-sm text-white/40 drop-shadow">
              UK &amp; Europe · 2-hour collection · Airport-to-airport delivery
            </p>

            <div className="flex flex-wrap gap-3 mb-7">
              <Link href="/business"
                className="border border-white/30 px-5 py-2 rounded-full text-sm font-medium text-white/70 hover:text-white hover:bg-white/[0.08] transition-all">
                💼 For Business
              </Link>
            </div>

            {/* Hero image — mobile only (desktop version is in the right column) */}
            <div className="relative mb-6 md:hidden mx-auto w-full max-w-sm">
              <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.4)]" style={{ aspectRatio: '4/3' }}>
                <Image src="/images/drealboothop.jpg" alt="BootHop delivery community" fill priority className="object-cover object-center" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>
              {/* Floating trust badge on mobile image */}
              <div className="absolute -bottom-3 left-4 rounded-xl border border-green-500/20 bg-[#0b1829]/95 px-3 py-2 shadow-xl backdrop-blur-xl flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20">
                  <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white leading-none">ID Verified</p>
                  <p className="text-[10px] text-white/45 leading-none mt-0.5">Secure escrow held</p>
                </div>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3 mb-8">
              <Link href="#booking-form"
                onClick={(e) => { e.preventDefault(); document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="bg-white text-black px-7 py-3 rounded-full text-sm font-bold hover:bg-white/90 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(255,255,255,0.15)]">
                Send a Package
              </Link>
              <Link href="/business"
                className="border border-white/25 px-7 py-3 rounded-full text-sm font-semibold text-white hover:bg-white/[0.08] transition-all hover:-translate-y-0.5">
                For Business
              </Link>
            </div>

            {/* Trust row */}
            <div className="flex flex-wrap gap-4 text-xs text-white/55 drop-shadow">
              {trustItems.map((item) => (
                <span key={item} className="flex items-center gap-1.5 font-medium">
                  <CheckCircle className="h-3.5 w-3.5 text-green-400" />{item}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT — premium glass image card */}
          <div className="relative z-10 hidden md:block">
            {/* Main image frame — deep glass card */}
            <div className="rounded-[32px] border border-white/25 bg-white/10 p-3 shadow-[0_40px_120px_rgba(0,0,0,0.6)] backdrop-blur-xl ring-1 ring-white/10">
              <div className="relative overflow-hidden rounded-[24px]" style={{ aspectRatio: '4/5' }}>
                <Image src="/images/drealboothop.jpg" alt="BootHop community" fill priority className="object-cover" />
                {/* Gradient for text legibility inside the card */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                {/* Live activity badge inside image */}
                <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 backdrop-blur-xl">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs font-semibold text-white/90">Live platform</span>
                </div>
              </div>
            </div>

            {/* Floating route glass card */}
            <div className="absolute -bottom-4 -left-8 rounded-2xl border border-white/25 bg-white/12 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl ring-1 ring-white/10">
              <p className="mb-2 text-xs font-semibold text-white/50 uppercase tracking-wider">Live Match</p>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/25 ring-1 ring-blue-400/30">
                  <Plane className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">London → Lagos</p>
                  <p className="text-xs text-white/50">Verified traveller · 3 slots left</p>
                </div>
              </div>
            </div>

            {/* Floating trust glass card */}
            <div className="absolute -top-4 -right-4 rounded-2xl border border-green-500/30 bg-white/12 p-3.5 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl ring-1 ring-white/10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/25 ring-1 ring-green-400/30">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">ID Verified</p>
                  <p className="text-[10px] text-white/50">Secure escrow held</p>
                </div>
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
                <div className="flex gap-3">
                  <button onClick={() => { setEmailSent(false); setCodeInput(''); }}
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

      {/* ── BUSINESS STRIP ── */}
      <section className="py-12 px-6 border-y border-white/[0.06] bg-[#020B18]">
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

      {/* ── HOW IT WORKS + VIDEO (merged) ── */}
      <section className="relative min-h-[80vh] overflow-hidden flex items-center justify-center">
        {/* Cycling video background */}
        {WHY_VIDEOS.map((src, i) => (
          <video
            key={src}
            autoPlay muted loop playsInline
            preload={i === 0 ? 'auto' : 'none'}
            className="absolute inset-0 w-full h-full object-cover scale-105 transition-opacity duration-[3000ms] ease-in-out"
            style={{ opacity: i === whyVid ? 1 : 0 }}
          >
            <source src={src} type="video/mp4" />
          </video>
        ))}
        {/* Dark scrim */}
        <div className="absolute inset-0 bg-black/72" />
        {/* Top + bottom fades into adjacent sections */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#020B18] via-transparent to-[#050D1A] pointer-events-none" />

        {/* Content — centred over video */}
        <div className="relative z-10 text-center px-6 py-20 max-w-2xl mx-auto w-full">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-6">How it works</p>

          <div className="space-y-8 mb-10">
            {[
              { n: '01', title: 'Post your request', sub: 'Tell us the route, date and package size. Takes 30 seconds.' },
              { n: '02', title: 'Match with a verified traveller', sub: 'We match you with someone already making that journey.' },
              { n: '03', title: 'Delivered same-day', sub: 'They carry it. You track it. Both sides confirm on arrival.' },
            ].map(({ n, title, sub }) => (
              <div key={n} className="flex items-start gap-5 text-left">
                <span className="text-2xl font-black text-white/15 leading-none w-8 shrink-0">{n}</span>
                <div>
                  <p className="text-white font-semibold text-lg leading-tight">{title}</p>
                  <p className="text-white/45 text-sm mt-1">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          <Link href="/how-it-works" className="inline-flex items-center gap-2 text-sm text-white/35 hover:text-white/65 transition-colors">
            Full details <ArrowRight className="h-3.5 w-3.5" />
          </Link>
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



      {/* ── LIVE TRIPS — only shown when platform has real activity ── */}
      {trips.length >= 3 && <section className="relative py-20 md:py-28 bg-[#07111f]">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <div className="mb-10 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-400/20 bg-green-500/8 px-4 py-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
              <span className="text-xs font-semibold text-green-300">Live on the platform right now</span>
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Current Trips &amp; Requests</h2>
            <p className="mt-3 text-sm text-white/40">Search by route or date to find your match</p>
          </div>
          <div className="mb-8 grid gap-3 sm:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input placeholder="From city..." value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40 backdrop-blur-md transition-all" />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input placeholder="To city..." value={filterTo} onChange={(e) => setFilterTo(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40 backdrop-blur-md transition-all" />
            </div>
            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 backdrop-blur-md transition-all [color-scheme:dark]" />
          </div>
          {trips.length > 0 ? (
            <div className="grid gap-10 md:grid-cols-2">
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15"><Plane className="h-4 w-4 text-blue-400" /></div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      <RoleToggle role="travel" invert variant="text" /> — <RoleToggle role="travel" variant="text" className="opacity-60" />
                    </h3>
                    <p className="text-xs text-white/35">People with space to carry items</p>
                  </div>
                  <span className="ml-auto rounded-full border border-blue-400/15 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">{booterTrips.length} active</span>
                </div>
                <div className="space-y-2.5">
                  {booterTrips.length > 0 ? (
                    <>
                      {booterTrips.slice(0, visibleCount).map((item, i) => (
                        <div key={item.id ?? i} className="group rounded-2xl border border-white/8 bg-white/3 p-4 transition-all duration-200 hover:border-blue-400/20 hover:bg-white/5 hover:shadow-lg hover:shadow-blue-500/8">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{item.from_city} → {item.to_city}</p>
                              <p className="mt-0.5 text-xs text-white/40">{new Date(item.travel_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                            <div className="flex flex-col items-end justify-between gap-2 shrink-0">
                              <span className={`rounded-full border px-2.5 py-1 text-xs text-blue-300 ${item.weight ? 'bg-blue-500/12 border-blue-400/15' : 'invisible'}`}>
                                {weightOptions.find(w => w.value === item.weight)?.label || item.weight || '—'}
                              </span>
                              <button onClick={() => router.push(`/journeys?open=${item.id}`)} className="rounded-xl bg-blue-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-all opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 hover:shadow-lg hover:shadow-blue-500/30">Request →</button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {booterTrips.length > visibleCount && (
                        <button onClick={() => setVisibleCount(v => v + 6)} className="w-full rounded-xl border border-white/8 bg-white/3 py-3 text-sm text-white/50 transition-all hover:bg-white/5 hover:text-white/80">Show more ({booterTrips.length - visibleCount} remaining)</button>
                      )}
                    </>
                  ) : (
                    <div className="rounded-2xl border border-white/8 bg-white/3 p-6 text-center"><p className="text-sm text-white/35">No travellers match your search</p></div>
                  )}
                </div>
              </div>
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15"><Package className="h-4 w-4 text-emerald-400" /></div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      <RoleToggle role="sender" invert variant="text" /> — <RoleToggle role="sender" variant="text" className="opacity-60" />
                    </h3>
                    <p className="text-xs text-white/35">People who need items delivered</p>
                  </div>
                  <span className="ml-auto rounded-full border border-emerald-400/15 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">{hooperTrips.length} active</span>
                </div>
                <div className="space-y-2.5">
                  {hooperTrips.length > 0 ? (
                    <>
                      {hooperTrips.slice(0, visibleCount).map((item, i) => (
                        <div key={item.id ?? i} className="group rounded-2xl border border-white/8 bg-white/3 p-4 transition-all duration-200 hover:border-emerald-400/20 hover:bg-white/5 hover:shadow-lg hover:shadow-emerald-500/8">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{item.from_city} → {item.to_city}</p>
                              <p className="mt-0.5 text-xs text-white/40">{new Date(item.travel_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                            <div className="flex flex-col items-end justify-between gap-2 shrink-0">
                              <span className={`rounded-full border px-2.5 py-1 text-xs text-emerald-300 ${item.weight ? 'bg-emerald-500/12 border-emerald-400/15' : 'invisible'}`}>
                                {weightOptions.find(w => w.value === item.weight)?.label || item.weight || '—'}
                              </span>
                              <button onClick={() => router.push(`/journeys?open=${item.id}`)} className="rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-all opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 hover:shadow-lg hover:shadow-emerald-500/30">Carry this →</button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {hooperTrips.length > visibleCount && (
                        <button onClick={() => setVisibleCount(v => v + 6)} className="w-full rounded-xl border border-white/8 bg-white/3 py-3 text-sm text-white/50 transition-all hover:bg-white/5 hover:text-white/80">Show more ({hooperTrips.length - visibleCount} remaining)</button>
                      )}
                    </>
                  ) : (
                    <div className="rounded-2xl border border-white/8 bg-white/3 p-6 text-center"><p className="text-sm text-white/35">No send requests match your search</p></div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center"><p className="text-white/35">No trips posted yet — be the first!</p></div>
          )}
          <div className="mt-10 text-center">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-8 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(59,130,246,0.4)]">
              Post a Trip <ArrowRight className="h-4 w-4" />
            </button>
            <p className="mt-4 text-xs text-white/30">Free to join · No subscription · Cancel anytime</p>
          </div>
        </div>
      </section>}

      {/* ── BOOKING FORM ── */}
      <section id="booking-form" className="py-24 px-6 bg-[#030A16]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10 reveal">
            <h2 className="text-3xl font-semibold text-white mb-3">Ready to move something?</h2>
            <p className="text-white/45 text-base">Post in under 30 seconds. We&apos;ll match you with a verified traveller.</p>
          </div>

          {/* Mode toggle */}
          <div className="mb-6 flex justify-center">
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

      {/* ── SOCIAL PROOF ── */}
      <section className="py-16 px-6 bg-[#050D1A]">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-3xl border border-white/8 bg-white/3 p-8 md:p-10 relative overflow-hidden">
            {/* quote mark */}
            <span className="absolute top-6 right-8 text-6xl text-white/5 font-serif leading-none select-none">&ldquo;</span>
            <div className="flex items-center gap-0.5 mb-5">
              {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
            </div>
            <p className="text-white/80 text-lg leading-relaxed italic mb-6">
              &ldquo;I travelled from Lagos to London and used BootHop to send documents ahead. Everything arrived before I did. Wish I&apos;d known about this sooner.&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-sm font-bold text-blue-300">T</div>
              <div>
                <p className="text-sm font-semibold text-white">Toyin A.</p>
                <p className="text-xs text-white/40">MSc Student, London · Lagos → London route</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────────── */}
      <section className="relative py-36 px-6 text-center overflow-hidden">
        {/* Atmospheric video background */}
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover scale-105"
        >
          <source src="/videos/onecall/plane1.mp4" type="video/mp4" />
        </video>
        {/* Strong overlay so text stays sharp */}
        <div className="absolute inset-0 bg-black/75" />
        {/* Top + bottom fades */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#07111f] via-transparent to-[#07111f] pointer-events-none" />

        <div className="relative z-10">
          <h2 className="text-4xl md:text-5xl font-semibold text-white mb-4 tracking-tight leading-tight">
            Built for speed.<br />
            <span className="text-white/55">Built for urgency.</span>
          </h2>
          <p className="text-white/45 text-base mb-8 max-w-md mx-auto">
            Join thousands of travellers and senders already on the platform.
          </p>
          <Link href="#booking-form"
            onClick={(e) => { e.preventDefault(); document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="inline-flex items-center gap-2 bg-white text-black px-8 py-3.5 rounded-full font-bold text-sm hover:bg-white/90 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(255,255,255,0.15)]">
            Get Started <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-4 text-xs text-white/25">Free to join · No subscription · Cancel anytime</p>
        </div>
      </section>


      {/* Floating WhatsApp button — icon only */}
      <a href="/api/whatsapp"
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-2xl shadow-[#25D366]/40 hover:scale-110 active:scale-95 transition-all"
        aria-label="Chat on WhatsApp">
        <MessageCircle className="h-7 w-7" />
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
