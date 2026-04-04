'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight, CheckCircle, MapPin, Menu, Package,
  Plane, Search, Star, X, Shield, Zap, Users,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import BootHopLogo from '@/components/BootHopLogo';
import Footer from '@/components/Footer';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
];

const testimonials = [
  { name: 'Toyin A.', role: 'MSc Student, London', route: 'Lagos → London', text: 'I travelled from Lagos to London and used BootHop to send documents ahead. Everything arrived before I did.', rating: 5 },
  { name: 'Kunle O.', role: 'Tech Consultant', route: 'Lagos → London', text: 'Moving from Lagos to London for work was hectic, but BootHop made sending personal items simple.', rating: 5 },
  { name: 'James R.', role: 'Management Consultant', route: 'London → New York', text: 'Delivered a small parcel via BootHop on my London–New York trip. Straightforward process and great communication.', rating: 5 },
];

const featuredRoutes = [
  { from: 'London', to: 'Lagos', tag: 'Most Popular', color: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/20', badge: 'bg-blue-500/20 text-blue-300' },
  { from: 'Manchester', to: 'Lagos', tag: 'High Demand', color: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/20', badge: 'bg-emerald-500/20 text-emerald-300' },
  { from: 'Nottingham', to: 'Lagos', tag: 'Growing Route', color: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-500/20', badge: 'bg-purple-500/20 text-purple-300' },
  { from: 'London', to: 'New York', tag: 'Transatlantic', color: 'from-cyan-500/20 to-cyan-600/10', border: 'border-cyan-500/20', badge: 'bg-cyan-500/20 text-cyan-300' },
  { from: 'Birmingham', to: 'Lagos', tag: 'New Corridor', color: 'from-amber-500/20 to-amber-600/10', border: 'border-amber-500/20', badge: 'bg-amber-500/20 text-amber-300' },
  { from: 'London', to: 'Tokyo', tag: 'International', color: 'from-rose-500/20 to-rose-600/10', border: 'border-rose-500/20', badge: 'bg-rose-500/20 text-rose-300' },
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

function HomePageContent() {
  useScrollReveal();
  const [mode, setMode] = useState<Mode>('send');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
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

  const trustItems = useMemo(() => ['Identity verified', 'Secure escrow', '95% satisfaction', 'Free to join'], []);

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
      .gte('travel_date', today).order('travel_date', { ascending: true }).limit(50);
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
    if (!trip.from || !trip.to || !trip.date || !trip.weight) { alert('Please fill in all required fields.'); return; }
    if (!fromSelected) { alert('Please select a valid "From" city from the dropdown.'); return; }
    if (!toSelected) { alert('Please select a valid "To" city from the dropdown.'); return; }
    setShowEmail(true);
  };

  const sendMagicLink = async () => {
    if (!trip.email) { alert('Please enter your email.'); return; }
    setSubmitting(true);
    localStorage.setItem('pendingTrip', JSON.stringify({ from: trip.from, to: trip.to, date: trip.date, price: trip.price, weight: trip.weight, mode }));
    const { error } = await supabase.auth.signInWithOtp({
      email: trip.email, options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setSubmitting(false);
    if (error) { localStorage.removeItem('pendingTrip'); alert(error.message); return; }
    setEmailSent(true);
  };

  const saveTrip = async () => {
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); alert('Please verify your email first.'); return; }
    const { data: savedTrip, error } = await supabase.from('trips')
      .insert([{ from_city: trip.from, to_city: trip.to, travel_date: trip.date, price: trip.price ? Number(trip.price) : null, weight: trip.weight, user_id: user.id, type: mode }])
      .select().single();
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

  const inputClass = "w-full rounded-xl border border-white/15 bg-white/8 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/60 backdrop-blur-md transition-all duration-200 hover:bg-white/12 text-sm";

  return (
    <div className="min-h-screen bg-[#07111f] text-white overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className={`fixed top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'border-b border-white/8 bg-[#07111f]/95 shadow-lg backdrop-blur-2xl' : 'bg-transparent'}`}>
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
      <section className="relative overflow-hidden pt-16">
        {/* Subtle dual radial glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.10),transparent_35%)]" />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:px-8 md:py-28">

          {/* LEFT — copy + form */}
          <div className="relative z-10">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur">
              <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
              <span className="text-xs font-medium text-white/70">UK–Nigeria routes now live</span>
            </div>

            <h1 className="mb-5 max-w-xl text-4xl font-semibold tracking-tight text-white md:text-5xl md:leading-[1.08] lg:text-6xl lg:leading-[1.05]">
              Send packages cheaper —{' '}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">or earn from your luggage space</span>
            </h1>

            <p className="mb-8 max-w-lg text-base text-white/60 md:text-lg">
              BootHop connects senders with verified travellers already heading the same way. Save on delivery costs or turn spare luggage space into extra income.
            </p>

            {/* Mode toggle */}
            <div className="mb-5 inline-flex rounded-xl border border-white/10 bg-white/5 p-1 backdrop-blur">
              <button onClick={() => setMode('send')} className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${mode === 'send' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'text-white/55 hover:text-white'}`}>
                📦 Send Item
              </button>
              <button onClick={() => setMode('travel')} className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${mode === 'travel' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'text-white/55 hover:text-white'}`}>
                ✈️ I&apos;m Travelling
              </button>
            </div>

            {/* Form */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
              <div className="grid gap-2.5 sm:grid-cols-2">
                <div className="relative">
                  <input placeholder="From (City)" value={queryFrom}
                    onChange={(e) => { setQueryFrom(e.target.value); setTrip({ ...trip, from: e.target.value }); setFromSelected(false); }}
                    className={inputClass} />
                  {fromSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-xl border border-white/10 bg-slate-900/98 backdrop-blur-xl shadow-2xl">
                      {fromSuggestions.map((s, i) => (
                        <div key={i} onClick={() => { setTrip({ ...trip, from: s }); setQueryFrom(s); setFromSuggestions([]); setFromSelected(true); if (window.google?.maps?.places) setSessionToken(new google.maps.places.AutocompleteSessionToken()); }}
                          className="cursor-pointer px-4 py-3 text-sm text-white/85 hover:bg-white/8 hover:text-white transition-colors">{s}</div>
                      ))}
                    </div>
                  )}
                  {queryFrom && !fromSelected && <p className="absolute -bottom-4 left-0 text-xs text-amber-400">Select from list</p>}
                </div>
                <div className="relative">
                  <input placeholder="To (City)" value={queryTo}
                    onChange={(e) => { setQueryTo(e.target.value); setTrip({ ...trip, to: e.target.value }); setToSelected(false); }}
                    className={inputClass} />
                  {toSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-xl border border-white/10 bg-slate-900/98 backdrop-blur-xl shadow-2xl">
                      {toSuggestions.map((s, i) => (
                        <div key={i} onClick={() => { setTrip({ ...trip, to: s }); setQueryTo(s); setToSuggestions([]); setToSelected(true); if (window.google?.maps?.places) setSessionToken(new google.maps.places.AutocompleteSessionToken()); }}
                          className="cursor-pointer px-4 py-3 text-sm text-white/85 hover:bg-white/8 hover:text-white transition-colors">{s}</div>
                      ))}
                    </div>
                  )}
                  {queryTo && !toSelected && <p className="absolute -bottom-4 left-0 text-xs text-amber-400">Select from list</p>}
                </div>
                <input type="date" value={trip.date} min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setTrip({ ...trip, date: e.target.value })}
                  className={`${inputClass} [color-scheme:dark]`} />
                <select value={trip.weight} onChange={(e) => setTrip({ ...trip, weight: e.target.value })}
                  className={`${inputClass} cursor-pointer`}>
                  <option value="" disabled className="bg-slate-900 text-white/50">Weight</option>
                  {weightOptions.map((o) => <option key={o.value} value={o.value} className="bg-slate-900 text-white">{o.label}</option>)}
                </select>
                <input type="number" placeholder={mode === 'travel' ? 'Price (£)' : 'Budget (£)'}
                  value={trip.price} onChange={(e) => setTrip({ ...trip, price: e.target.value })}
                  className={inputClass} />
                <button onClick={handleSubmit}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-3 font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(59,130,246,0.4)] active:translate-y-0">
                  Register <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Trust row */}
            <div className="mt-5 flex flex-wrap gap-4 text-xs text-white/45">
              {trustItems.map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-green-400/80" />{item}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT — premium image card */}
          <div className="relative z-10 hidden md:block">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl">
              <div className="relative overflow-hidden rounded-[24px]" style={{ aspectRatio: '4/5' }}>
                <Image src="/images/drealboothop.jpg" alt="BootHop community" fill priority className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              </div>
            </div>

            {/* Floating route card */}
            <div className="absolute -bottom-4 -left-8 rounded-2xl border border-white/12 bg-[#0b1829]/95 p-4 shadow-2xl backdrop-blur-xl">
              <p className="mb-2 text-xs font-semibold text-white/50 uppercase tracking-wider">Live Match</p>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20">
                  <Plane className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">London → Lagos</p>
                  <p className="text-xs text-white/45">Verified traveller · 3 slots left</p>
                </div>
              </div>
            </div>

            {/* Floating trust card */}
            <div className="absolute -top-4 -right-4 rounded-2xl border border-green-500/20 bg-[#0b1829]/95 p-3 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500/20">
                  <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">ID Verified</p>
                  <p className="text-[10px] text-white/45">Secure escrow held</p>
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
                <h2 className="mb-2 text-xl font-semibold text-white md:text-2xl">Verify Your Email</h2>
                <p className="mb-6 text-sm text-white/50">We&apos;ll send you a secure magic link to continue.</p>
                <input type="email" placeholder="Enter your email" value={trip.email}
                  onChange={(e) => setTrip({ ...trip, email: e.target.value })}
                  className="mb-4 w-full rounded-xl border border-white/12 bg-white/5 p-3.5 text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" />
                <div className="flex gap-3">
                  <button onClick={() => setShowEmail(false)}
                    className="flex-1 rounded-xl border border-white/12 py-3 text-sm text-white/65 transition-all hover:bg-white/5 hover:text-white">
                    Cancel
                  </button>
                  <button onClick={sendMagicLink} disabled={submitting}
                    className="flex-1 rounded-xl bg-blue-500 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(59,130,246,0.4)] disabled:opacity-60 disabled:cursor-not-allowed">
                    {submitting ? 'Sending...' : 'Send Link'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-6 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15">
                    <CheckCircle className="h-7 w-7 text-green-400" />
                  </div>
                  <h2 className="mb-2 text-xl font-semibold text-white md:text-2xl">Check Your Email</h2>
                  <p className="text-sm text-white/50">We&apos;ve sent a link to <span className="font-medium text-blue-400">{trip.email}</span></p>
                </div>
                <div className="mb-5 rounded-xl border border-blue-500/20 bg-blue-500/8 p-4">
                  <p className="text-center text-sm text-blue-300/85">Click the link in your email to complete registration. Your trip will be saved automatically.</p>
                </div>
                <Link
                  href="/"
                  onClick={() => { setShowEmail(false); setEmailSent(false); resetForm(); }}
                  className="block w-full rounded-xl bg-blue-500 py-3.5 text-center text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(59,130,246,0.4)] active:translate-y-0">
                  Done — back to home
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── STATS ── */}
      <section className="border-y border-white/6 bg-white/3 py-10">
        <div className="mx-auto max-w-5xl px-6 md:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-0 md:divide-x md:divide-white/8">
            {stats.map((stat) => (
              <div key={stat.label} className="px-6 text-center">
                <div className="mb-1 text-3xl font-bold text-white md:text-4xl">{stat.value}</div>
                <div className="text-sm text-white/45">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="relative py-20 md:py-28 bg-[#07111f]">
        <div className="mx-auto max-w-4xl px-6 md:px-8">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-blue-400">Simple Process</p>
            <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">How BootHop works</h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-white/50">Three steps from post to delivery — fully verified and insured.</p>
          </div>
          <div className="space-y-4">
            {[
              { emoji: '✈️', step: '01', title: 'Post your trip or request', body: 'Register your journey dates and route, or submit a delivery request with weight and budget.', gradient: 'from-blue-500 to-cyan-400', badge: 'bg-cyan-400', shadow: 'shadow-blue-500/50', hover: 'hover:border-blue-500/40 hover:shadow-blue-500/15', touch: 'touch-blue', delay: 'd1' },
              { emoji: '⚡', step: '02', title: 'Get matched securely', body: 'Our engine finds verified matches on the same route. Both sides confirm before any payment.', gradient: 'from-violet-500 to-purple-400', badge: 'bg-purple-400', shadow: 'shadow-violet-500/50', hover: 'hover:border-violet-500/40 hover:shadow-violet-500/15', touch: 'touch-violet', delay: 'd2' },
              { emoji: '💸', step: '03', title: 'Deliver and get paid', body: 'Funds are held in escrow and released only after the recipient confirms safe delivery.', gradient: 'from-emerald-500 to-teal-400', badge: 'bg-teal-400', shadow: 'shadow-emerald-500/50', hover: 'hover:border-emerald-500/40 hover:shadow-emerald-500/15', touch: 'touch-emerald', delay: 'd3' },
            ].map((item) => (
              <div key={item.step} className={`reveal ${item.delay} group flex items-center gap-6 rounded-2xl border border-white/8 bg-white/3 p-6 transition-all duration-300 hover:bg-white/5 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 cursor-pointer ${item.hover} ${item.touch}`}>
                <div className="relative flex-shrink-0">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient} text-2xl shadow-lg ${item.shadow} group-hover:scale-110 transition-transform duration-300`}>
                    {item.emoji}
                  </div>
                  <div className={`absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full ${item.badge} text-xs font-bold text-slate-900`}>
                    {item.step}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`mb-1.5 text-base font-bold text-white transition-colors duration-300 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:${item.gradient}`}>{item.title}</h3>
                  <p className="text-sm leading-relaxed text-white/50">{item.body}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-white/15 transition-all duration-300 group-hover:text-white/40 group-hover:translate-x-1" />
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/how-it-works" className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-6 py-3 text-sm font-medium text-white/60 transition-all duration-200 hover:border-white/20 hover:bg-white/8 hover:text-white">
              See the full process <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── TWO-SIDED VALUE ── */}
      <section className="relative py-20 md:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.06),transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-blue-400">Who It&apos;s For</p>
            <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Built for both sides of the journey</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Senders */}
            <div className="reveal d1 group rounded-3xl border border-white/8 bg-white/3 p-8 transition-all duration-300 hover:border-emerald-500/25 hover:bg-white/5 hover:shadow-[0_24px_60px_rgba(16,185,129,0.08)] hover:-translate-y-1 touch-emerald">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
                <Package className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">For Senders</h3>
              <p className="mb-6 text-sm text-white/50">Send items with verified travellers at a fraction of courier costs.</p>
              <ul className="mb-8 space-y-3">
                {['Cheaper than excess baggage fees', 'Faster than traditional shipping', 'Matched with real, verified travellers', 'Funds held securely in escrow'].map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm text-white/65">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400/70" />{point}
                  </li>
                ))}
              </ul>
              <Link href="/register?type=hooper"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 border border-emerald-500/25 px-5 py-2.5 text-sm font-semibold text-emerald-300 transition-all duration-200 hover:bg-emerald-500/25 hover:-translate-y-0.5">
                Start Sending <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Travellers */}
            <div className="reveal d2 group rounded-3xl border border-white/8 bg-white/3 p-8 transition-all duration-300 hover:border-blue-500/25 hover:bg-white/5 hover:shadow-[0_24px_60px_rgba(59,130,246,0.08)] hover:-translate-y-1 touch-blue">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-400">
                <Plane className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">For Travellers</h3>
              <p className="mb-6 text-sm text-white/50">Earn from unused luggage space on trips you&apos;re already taking.</p>
              <ul className="mb-8 space-y-3">
                {['Earn from unused luggage space', 'Choose what you carry', 'Turn trips into extra income', 'Full identity protection'].map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm text-white/65">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-400/70" />{point}
                  </li>
                ))}
              </ul>
              <Link href="/register?type=booter"
                className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 border border-blue-500/25 px-5 py-2.5 text-sm font-semibold text-blue-300 transition-all duration-200 hover:bg-blue-500/25 hover:-translate-y-0.5">
                Start Earning <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURED ROUTES ── */}
      <section className="relative py-20 md:py-28 bg-[#07111f]">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-blue-400">Active Corridors</p>
            <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Popular routes</h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-white/50">Real routes with active travellers right now. Post your trip to get matched instantly.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featuredRoutes.map((route) => (
              <div key={`${route.from}-${route.to}`}
                className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${route.color} ${route.border} p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer`}>
                <div className="mb-4 flex items-center justify-between">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${route.badge}`}>{route.tag}</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/8">
                    <Plane className="h-3.5 w-3.5 text-white/60" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-white">{route.from}</span>
                  <ArrowRight className="h-4 w-4 text-white/30" />
                  <span className="text-base font-semibold text-white">{route.to}</span>
                </div>
                <p className="mt-1 flex items-center gap-1 text-xs text-white/40">
                  <MapPin className="h-3 w-3" />Active travellers available
                </p>
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

      {/* ── QUICK LINK CARDS ── */}
      <section className="py-8 bg-[#07111f]">
        <div className="mx-auto max-w-4xl px-6 md:px-8">
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/trust-safety"
              className="group flex items-center justify-between rounded-2xl border border-white/8 bg-white/3 px-6 py-5 transition-all duration-200 hover:border-blue-500/25 hover:bg-white/5">
              <div>
                <p className="text-sm font-semibold text-white">ID verified · Escrow payments · 8-stage pipeline</p>
                <p className="mt-0.5 text-xs text-white/40">How we keep every match safe →</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-white/25 transition-transform group-hover:translate-x-1 group-hover:text-blue-400" />
            </Link>
            <Link href="/pricing"
              className="group flex items-center justify-between rounded-2xl border border-white/8 bg-white/3 px-6 py-5 transition-all duration-200 hover:border-emerald-500/25 hover:bg-white/5">
              <div>
                <p className="text-sm font-semibold text-white">Senders +3% · Travellers −5% · No hidden fees</p>
                <p className="mt-0.5 text-xs text-white/40">See full pricing & courier comparison →</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-white/25 transition-transform group-hover:translate-x-1 group-hover:text-emerald-400" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── LIVE TRIPS ── */}
      <section className="relative py-20 md:py-28 bg-[#07111f]">
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
                    <h3 className="text-sm font-semibold text-white">Booters — Travellers</h3>
                    <p className="text-xs text-white/35">People with space to carry items</p>
                  </div>
                  <span className="ml-auto rounded-full border border-blue-400/15 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">{booterTrips.length} active</span>
                </div>
                <div className="space-y-2.5">
                  {booterTrips.length > 0 ? (
                    <>
                      {booterTrips.slice(0, visibleCount).map((item, i) => (
                        <div key={item.id ?? i} className="group rounded-2xl border border-white/8 bg-white/3 p-4 transition-all duration-200 hover:border-blue-400/20 hover:bg-white/5 hover:shadow-lg hover:shadow-blue-500/8">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-white">{item.from_city} → {item.to_city}</p>
                              <p className="mt-0.5 text-xs text-white/40">{new Date(item.travel_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {item.weight && <span className="rounded-full bg-blue-500/12 border border-blue-400/15 px-2.5 py-1 text-xs text-blue-300">{weightOptions.find(w => w.value === item.weight)?.label || item.weight}</span>}
                              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="rounded-xl bg-blue-500 px-3.5 py-1.5 text-xs font-semibold text-white opacity-0 transition-all group-hover:opacity-100 hover:shadow-lg hover:shadow-blue-500/30">Request →</button>
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
                    <h3 className="text-sm font-semibold text-white">Hoopers — Senders</h3>
                    <p className="text-xs text-white/35">People who need items delivered</p>
                  </div>
                  <span className="ml-auto rounded-full border border-emerald-400/15 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">{hooperTrips.length} active</span>
                </div>
                <div className="space-y-2.5">
                  {hooperTrips.length > 0 ? (
                    <>
                      {hooperTrips.slice(0, visibleCount).map((item, i) => (
                        <div key={item.id ?? i} className="group rounded-2xl border border-white/8 bg-white/3 p-4 transition-all duration-200 hover:border-emerald-400/20 hover:bg-white/5 hover:shadow-lg hover:shadow-emerald-500/8">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-white">{item.from_city} → {item.to_city}</p>
                              <p className="mt-0.5 text-xs text-white/40">{new Date(item.travel_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {item.weight && <span className="rounded-full bg-emerald-500/12 border border-emerald-400/15 px-2.5 py-1 text-xs text-emerald-300">{weightOptions.find(w => w.value === item.weight)?.label || item.weight}</span>}
                              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white opacity-0 transition-all group-hover:opacity-100 hover:shadow-lg hover:shadow-emerald-500/30">Carry this →</button>
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
      </section>

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
