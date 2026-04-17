'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Suspense, useEffect, useMemo, useState, useCallback, useRef } from 'react';
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

const HERO_VIDEO = '/videos/onecall/plane2.mp4';

const WHY_VIDEOS = [
  '/videos/onecall/test1/Aboutusbus.mp4',
  '/videos/onecall/test1/Boxoff.mp4',
  '/videos/onecall/test1/boxoff5.mp4',
];

function HomePageContent() {
  useScrollReveal();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('send');
  const [whyVid,   setWhyVid]   = useState(0);
  const [winsVid,  setWinsVid]  = useState(0);
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
  const movementSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => { setScrollY(window.scrollY); setScrolled(window.scrollY > 20); };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Cinematic parallax — videos drift slower than content as user scrolls
  useEffect(() => {
    const handleParallax = () => {
      if (!movementSectionRef.current) return;
      const offset = movementSectionRef.current.offsetTop;
      const movement = (window.scrollY - offset) * 0.12;
      movementSectionRef.current.querySelectorAll<HTMLVideoElement>('.parallax-vid').forEach(v => {
        v.style.transform = `translateY(${movement}px) scale(1.15)`;
      });
    };
    window.addEventListener('scroll', handleParallax, { passive: true });
    return () => window.removeEventListener('scroll', handleParallax);
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

  // Why BootHop section — slow 7s crossfade
  useEffect(() => {
    const id = setInterval(() => setWhyVid(v => (v + 1) % WHY_VIDEOS.length), 7000);
    return () => clearInterval(id);
  }, []);

  // Why BootHop Wins video strip — 5s crossfade
  useEffect(() => {
    const id = setInterval(() => setWinsVid(v => (v + 1) % 4), 5000);
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

        {/* PLANE VIDEO — SPEED SIGNAL */}
        <video autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover">
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

        {/* CONTENT */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex items-center py-24 md:py-0">
          <div className="grid md:grid-cols-2 gap-12 items-center w-full">

            {/* LEFT */}
            <div>
              {/* Trust tag */}
              <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm backdrop-blur-md">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Free to join · No subscription · No hidden fees
              </div>

              <h1 className="text-4xl md:text-6xl font-semibold text-white leading-tight mb-6 tracking-tight">
                Move Anything.<br />Anywhere. Same Day.
              </h1>

              <p className="text-white/80 text-lg mb-3 max-w-xl leading-relaxed">
                Your fastest delivery option is already moving.
              </p>
              <p className="text-white/55 text-sm mb-7">
                UK &amp; Europe · 2-hour collection · Airport-to-airport delivery
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
                <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-green-400" />95% satisfaction</span>
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

        {/* TRANSPORT STRIP at bottom of hero */}
        <div className="absolute bottom-0 w-full py-4 bg-black/60 backdrop-blur-md border-t border-white/[0.06]">
          <div className="flex justify-center gap-8 md:gap-16 text-white/60 text-sm">
            <span>✈️ Air</span>
            <span>🚆 Rail</span>
            <span>🚗 Road</span>
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

      {/* ── POWERED BY MOVEMENT — cinematic parallax ── */}
      <section ref={movementSectionRef} className="relative bg-[#020617] py-32 overflow-hidden">

        {/* Three videos side-by-side — low opacity, parallax drift */}
        <div className="absolute inset-0 opacity-[0.18]">
          <div className="grid grid-cols-3 h-full">
            <video autoPlay muted loop playsInline className="parallax-vid w-full h-full object-cover scale-110">
              <source src="/videos/onecall/plane2.mp4" type="video/mp4" />
            </video>
            <video autoPlay muted loop playsInline className="parallax-vid w-full h-full object-cover scale-110">
              <source src="/videos/onecall/Aboutus_train.mp4" type="video/mp4" />
            </video>
            <video autoPlay muted loop playsInline className="parallax-vid w-full h-full object-cover scale-110">
              <source src="/videos/onecall/test1/Aboutusbus.mp4" type="video/mp4" />
            </video>
          </div>
        </div>

        {/* Dark gradient control — fades into adjacent sections */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/95 via-[#020617]/88 to-[#020617]/95" />

        {/* Blue radial glow — depth layer */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.13),transparent_70%)]" />

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          <p className="text-blue-400 text-sm font-semibold tracking-[0.2em] uppercase mb-3 reveal">HOW WE MOVE</p>
          <h2 className="text-4xl md:text-5xl text-white font-semibold mb-4 reveal d1">Powered by Movement</h2>
          <p className="text-white/55 max-w-2xl mx-auto mb-16 reveal d2">
            We connect packages with people already moving — by air, rail, or road.
          </p>

          <div className="grid md:grid-cols-3 gap-6 items-center">

            {/* AIR */}
            <div className="reveal d1 backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl p-7 text-left hover:scale-[1.03] hover:-translate-y-1 transition-all duration-500 hover:shadow-[0_20px_60px_rgba(59,130,246,0.12)]">
              <div className="text-blue-400 text-2xl mb-4">✈️</div>
              <p className="text-xs font-bold text-blue-400/70 uppercase tracking-widest mb-2">Air</p>
              <h3 className="text-white text-xl font-semibold mb-3">Flight-Speed Delivery</h3>
              <p className="text-white/55 text-sm leading-relaxed">
                Match with verified travellers on commercial flights. Ideal for urgent cross-border deliveries, documents, and high-value items.
              </p>
            </div>

            {/* RAIL — focus card, elevated */}
            <div className="reveal d2 backdrop-blur-xl bg-gradient-to-br from-blue-900/45 to-blue-700/20 border border-blue-500/25 rounded-2xl p-7 text-left scale-[1.06] shadow-[0_0_50px_rgba(59,130,246,0.18),0_20px_60px_rgba(0,0,0,0.4)] hover:scale-[1.10] transition-all duration-500">
              <div className="text-blue-300 text-2xl mb-4">🚆</div>
              <p className="text-xs font-bold text-blue-300/70 uppercase tracking-widest mb-2">Rail</p>
              <h3 className="text-white text-xl font-semibold mb-3">Same-Day UK Corridors</h3>
              <p className="text-white/65 text-sm leading-relaxed">
                Intercity trains connect London, Manchester, Birmingham, Edinburgh and beyond. Perfect for domestic same-day delivery.
              </p>
            </div>

            {/* ROAD */}
            <div className="reveal d3 backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl p-7 text-left hover:scale-[1.03] hover:-translate-y-1 transition-all duration-500 hover:shadow-[0_20px_60px_rgba(139,92,246,0.12)]">
              <div className="text-violet-400 text-2xl mb-4">🚗</div>
              <p className="text-xs font-bold text-violet-400/70 uppercase tracking-widest mb-2">Road</p>
              <h3 className="text-white text-xl font-semibold mb-3">Door-to-Door Precision</h3>
              <p className="text-white/55 text-sm leading-relaxed">
                Drivers and commuters cover the last mile. Fast, flexible, and ideal for local same-day jobs where flexibility matters most.
              </p>
            </div>

          </div>
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
        <div className="absolute inset-0 bg-black/62" />
        {/* Top + bottom fades into adjacent sections */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#020B18] via-transparent to-[#050D1A] pointer-events-none" />

        {/* Content — centred over video */}
        <div className="relative z-10 px-6 py-20 max-w-5xl mx-auto w-full">
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
              <div key={n}
                className={`rounded-2xl border bg-black/40 backdrop-blur-xl p-6 transition-all duration-300 hover:-translate-y-1 ${color} ${glow}`}>
                <div className="text-3xl mb-4">{icon}</div>
                <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2">{n}</p>
                <p className="text-white font-semibold text-base leading-tight mb-2">{title}</p>
                <p className="text-white/45 text-xs leading-relaxed">{sub}</p>
              </div>
            ))}
          </div>

          {/* Trust bar */}
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

      {/* ── WHY BOOTHOP WINS ── */}
      <section className="py-20 md:py-28 px-6 bg-[#040C19]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 reveal">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-3">The Difference</p>
            <h2 className="text-3xl md:text-4xl font-semibold text-white tracking-tight">Why BootHop Wins</h2>
            <p className="mt-4 text-white/45 text-base max-w-lg mx-auto">Traditional couriers were built for a different world. BootHop was built for speed.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {/* Traditional — red tint */}
            <div className="reveal d1 rounded-3xl border border-red-500/15 bg-red-500/5 p-8">
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
                    <span className="mt-0.5 text-red-400/70 shrink-0">—</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* BootHop — blue/green tint */}
            <div className="reveal d2 rounded-3xl border border-blue-500/25 bg-gradient-to-br from-blue-500/10 to-emerald-500/5 p-8 shadow-[0_20px_60px_rgba(59,130,246,0.12)]">
              <div className="flex items-center gap-3 mb-7">
                <div className="w-8 h-8 rounded-full bg-blue-500/30 flex items-center justify-center text-sm">✓</div>
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
                  <li key={item} className="flex items-start gap-3 text-sm text-white/75">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="reveal text-center mb-14">
            <Link href="#booking-form"
              onClick={(e) => { e.preventDefault(); document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="inline-flex items-center gap-2 bg-blue-500 text-white px-8 py-3.5 rounded-full font-semibold text-sm hover:bg-blue-400 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(59,130,246,0.4)]">
              Try it free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* ── VIDEO STRIP — real deliveries in motion ── */}
          <div className="relative w-full rounded-3xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.6)]" style={{ height: 'clamp(200px, 36vw, 420px)' }}>
            {[1, 2, 3, 4].map((n, i) => (
              <video
                key={n}
                autoPlay muted loop playsInline
                preload={i === 0 ? 'auto' : 'none'}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[2500ms] ease-in-out"
                style={{ opacity: i === winsVid ? 1 : 0 }}
              >
                <source src={`/videos/onecall/test_v/video${n}.mp4`} type="video/mp4" />
              </video>
            ))}

            {/* Dark scrim — keeps it cinematic, not raw footage */}
            <div className="absolute inset-0 bg-black/45" />

            {/* Edge fade into section background */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#040C19]/80 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#040C19] to-transparent" />

            {/* Label overlay */}
            <div className="absolute bottom-6 left-7 flex items-center gap-3">
              <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-semibold text-white/70 uppercase tracking-widest">Real deliveries. Real people.</span>
            </div>

            {/* Dot indicators */}
            <div className="absolute bottom-6 right-7 flex gap-1.5">
              {[0, 1, 2, 3].map(i => (
                <button key={i} onClick={() => setWinsVid(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === winsVid ? 'w-5 bg-white' : 'w-1.5 bg-white/30'}`} />
              ))}
            </div>
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
        {/* Plane video background */}
        <video autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover scale-105">
          <source src="/videos/onecall/plane1.mp4" type="video/mp4" />
        </video>
        {/* Single overlay — light enough to see the plane, dark enough for text */}
        <div className="absolute inset-0 bg-black/50" />

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
