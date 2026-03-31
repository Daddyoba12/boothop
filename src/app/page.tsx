'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight, CheckCircle, MapPin, Menu, Package,
  Plane, Quote, Search, Star, X,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import BootHopLogo from '@/components/BootHopLogo';

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
];

const testimonials = [
  { name: 'Toyin A.', role: 'MSc Student, London', route: 'Lagos → London', text: 'I travelled from Lagos to London and used BootHop to send documents ahead. Everything arrived before I did.', rating: 5 },
  { name: 'Kunle O.', role: 'Tech Consultant', route: 'Lagos → London', text: 'Moving from Lagos to London for work was hectic, but BootHop made sending personal items simple.', rating: 5 },
  { name: 'James R.', role: 'Management Consultant', route: 'London → New York', text: 'Delivered a small parcel via BootHop on my London–New York trip. Straightforward process and great communication.', rating: 5 },
];

const cities = [
  { name: 'Lagos', country: 'Nigeria', image: '/images/cities/lagos1.jpg' },
  { name: 'London', country: 'United Kingdom', image: '/images/cities/london1.jpg' },
  { name: 'New York', country: 'United States', image: '/images/cities/ny1.jpg' },
  { name: 'Tokyo', country: 'Japan', image: '/images/cities/tokyo1.jpg' },
];

const weightOptions = [
  { value: 'letter', label: 'Letter (<1kg)' },
  { value: 'small', label: 'Small (<5kg)' },
  { value: 'medium', label: 'Medium (5-23kg)' },
  { value: 'large', label: 'Large (23-32kg)' },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

function TestimonialsCarousel() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setIndex((prev) => (prev + 1) % testimonials.length), 5000);
    return () => clearInterval(timer);
  }, []);
  const item = testimonials[index];
  return (
    <section className="bg-slate-900 py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-400">Community Stories</p>
        <h2 className="mb-8 text-2xl font-bold text-white md:text-4xl">Trusted by travellers worldwide</h2>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm md:rounded-3xl md:p-12">
          <Quote className="mx-auto mb-6 h-8 w-8 text-blue-400" />
          <p className="mb-8 text-base italic leading-relaxed text-white/90 md:text-xl">&quot;{item.text}&quot;</p>
          <div className="flex flex-col items-center gap-2">
            <StarRating count={item.rating} />
            <p className="font-semibold text-white">{item.name}</p>
            <p className="text-sm text-white/60">{item.role}</p>
            <span className="rounded-full border border-blue-500/30 bg-blue-500/20 px-3 py-1 text-xs text-blue-300">{item.route}</span>
          </div>
        </div>
        <div className="mt-6 flex justify-center gap-2">
          {testimonials.map((_, i) => (
            <button key={i} onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-blue-400' : 'w-2 bg-white/20'}`}
              aria-label={`Go to testimonial ${i + 1}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
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

  const [trip, setTrip] = useState<TripForm>({ from: '', to: '', date: '', price: '', email: '', weight: '' });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.google?.maps?.places)
      setSessionToken(new google.maps.places.AutocompleteSessionToken());
  }, []);

  useEffect(() => {
    if (fromSelected) return;
    const timer = setTimeout(() => {
      if (!queryFrom || queryFrom.length < 3) { setFromSuggestions([]); return; }
      if (typeof window === 'undefined' || !window.google?.maps?.places) return;
      new google.maps.places.AutocompleteService().getPlacePredictions(
        { input: queryFrom, types: ['(cities)'], sessionToken: sessionToken || undefined },
        (p) => setFromSuggestions(p ? p.map((x) => x.description) : [])
      );
    }, 400);
    return () => clearTimeout(timer);
  }, [queryFrom, sessionToken, fromSelected]);

  useEffect(() => {
    if (toSelected) return;
    const timer = setTimeout(() => {
      if (!queryTo || queryTo.length < 3) { setToSuggestions([]); return; }
      if (typeof window === 'undefined' || !window.google?.maps?.places) return;
      new google.maps.places.AutocompleteService().getPlacePredictions(
        { input: queryTo, types: ['(cities)'], sessionToken: sessionToken || undefined },
        (p) => setToSuggestions(p ? p.map((x) => x.description) : [])
      );
    }, 400);
    return () => clearTimeout(timer);
  }, [queryTo, sessionToken, toSelected]);

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

  // Filter trips
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

  const inputClass = "w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3.5 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm md:text-base";

  return (
    <div className="min-h-screen bg-white text-slate-900">

      {/* ── NAV ── */}
      <nav className={`fixed top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md' : 'bg-transparent'}`}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center">
            <BootHopLogo
              iconClass={scrolled ? 'text-slate-900' : 'text-white'}
              textClass={scrolled ? 'text-slate-900' : 'text-white'}
            />
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${scrolled ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link href="/login" className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${scrolled ? 'text-slate-600 hover:bg-slate-100' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}>Log in</Link>
          </div>

          <button className={`rounded-lg p-2 md:hidden ${scrolled ? 'text-slate-700 hover:bg-slate-100' : 'text-white hover:bg-white/10'}`}
            onClick={() => setMobileOpen((prev) => !prev)} aria-label="Toggle menu">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-slate-100 bg-white shadow-lg md:hidden">
            <div className="space-y-1 px-4 py-4">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">{link.label}</Link>
              ))}
              <div className="flex flex-col gap-2 pt-3">
                <Link href="/login" className="block rounded-xl border border-slate-200 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-50">Log in</Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative flex min-h-screen items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/images/drealboothop.jpg" alt="BootHop community" fill priority className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-900/75 to-slate-800/70" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-20 pt-28 sm:px-6">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-400/30 bg-green-500/10 px-4 py-2 backdrop-blur-sm">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
              <span className="text-sm font-medium text-green-300">Trusted by 10,000+ verified users</span>
            </div>
            <h1 className="mb-6 text-4xl font-bold leading-tight text-white sm:text-5xl md:text-7xl">
              Send Packages Globally<br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">Instantly Matched</span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-white/70 md:text-xl">
              Enter your journey or delivery request and get matched with verified users automatically.
            </p>
            <div className="mb-6 flex justify-center">
              <div className="flex rounded-xl border border-white/20 bg-white/10 p-1 backdrop-blur-xl">
                <button onClick={() => setMode('send')} className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition-all ${mode === 'send' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg' : 'text-white/70 hover:text-white'}`}>📦 Send Item</button>
                <button onClick={() => setMode('travel')} className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition-all ${mode === 'travel' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg' : 'text-white/70 hover:text-white'}`}>✈️ I&apos;m Travelling</button>
              </div>
            </div>
            <div className="mx-auto max-w-6xl rounded-2xl border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-xl md:p-6">
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                <div className="relative">
                  <input placeholder="From (City)" value={queryFrom} onChange={(e) => { setQueryFrom(e.target.value); setTrip({ ...trip, from: e.target.value }); setFromSelected(false); }} className={`${inputClass} ${queryFrom && !fromSelected ? 'ring-2 ring-amber-400/50' : ''}`} />
                  {fromSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-xl border border-white/10 bg-slate-900 shadow-lg">
                      {fromSuggestions.map((s, i) => (
                        <div key={i} onClick={() => { setTrip({ ...trip, from: s }); setQueryFrom(s); setFromSuggestions([]); setFromSelected(true); if (window.google?.maps?.places) setSessionToken(new google.maps.places.AutocompleteSessionToken()); }} className="cursor-pointer p-3 text-sm text-white hover:bg-white/10">{s}</div>
                      ))}
                    </div>
                  )}
                  {queryFrom && !fromSelected && <p className="absolute -bottom-5 left-0 text-xs text-amber-400">Select from list</p>}
                </div>
                <div className="relative">
                  <input placeholder="To (City)" value={queryTo} onChange={(e) => { setQueryTo(e.target.value); setTrip({ ...trip, to: e.target.value }); setToSelected(false); }} className={`${inputClass} ${queryTo && !toSelected ? 'ring-2 ring-amber-400/50' : ''}`} />
                  {toSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-xl border border-white/10 bg-slate-900 shadow-lg">
                      {toSuggestions.map((s, i) => (
                        <div key={i} onClick={() => { setTrip({ ...trip, to: s }); setQueryTo(s); setToSuggestions([]); setToSelected(true); if (window.google?.maps?.places) setSessionToken(new google.maps.places.AutocompleteSessionToken()); }} className="cursor-pointer p-3 text-sm text-white hover:bg-white/10">{s}</div>
                      ))}
                    </div>
                  )}
                  {queryTo && !toSelected && <p className="absolute -bottom-5 left-0 text-xs text-amber-400">Select from list</p>}
                </div>
                <input type="date" value={trip.date} min={new Date().toISOString().split('T')[0]} onChange={(e) => setTrip({ ...trip, date: e.target.value })} className={`${inputClass} [color-scheme:dark]`} />
                <select value={trip.weight} onChange={(e) => setTrip({ ...trip, weight: e.target.value })} className={`${inputClass} cursor-pointer`}>
                  <option value="" disabled className="bg-slate-900 text-white/50">Weight</option>
                  {weightOptions.map((o) => <option key={o.value} value={o.value} className="bg-slate-900 text-white">{o.label}</option>)}
                </select>
                <input type="number" placeholder={mode === 'travel' ? 'Price (£)' : 'Budget (£)'} value={trip.price} onChange={(e) => setTrip({ ...trip, price: e.target.value })} className={inputClass} />
                <button onClick={handleSubmit} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3.5 font-semibold text-white transition hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/40 active:scale-[0.98]">
                  Register <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-white/60">
              {trustItems.map((item) => (
                <span key={item} className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-green-400" />{item}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-xs text-white/40">
          <span>Scroll to explore</span>
          <div className="h-8 w-px bg-gradient-to-b from-white/30 to-transparent" />
        </div>
      </section>

      {/* ── EMAIL MODAL ── */}
      {showEmail && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-gradient-to-br from-slate-900/95 to-blue-900/95 p-6 shadow-2xl backdrop-blur-xl md:p-8">
            {!emailSent ? (
              <>
                <h2 className="mb-2 text-xl font-bold text-white md:text-2xl">Verify Your Email</h2>
                <p className="mb-6 text-sm text-white/60">We&apos;ll send you a secure magic link to continue.</p>
                <input type="email" placeholder="Enter your email" value={trip.email} onChange={(e) => setTrip({ ...trip, email: e.target.value })}
                  className="mb-4 w-full rounded-xl border border-white/30 bg-white/10 p-3.5 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                <div className="flex gap-3">
                  <button onClick={() => setShowEmail(false)} className="flex-1 rounded-xl border border-white/30 py-3 text-white transition hover:bg-white/10">Cancel</button>
                  <button onClick={sendMagicLink} disabled={submitting} className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3 font-semibold text-white transition hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-60">
                    {submitting ? 'Sending...' : 'Send Link'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-6 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                  <h2 className="mb-2 text-xl font-bold text-white md:text-2xl">Check Your Email</h2>
                  <p className="text-white/60">We&apos;ve sent a link to <span className="font-medium text-blue-400">{trip.email}</span></p>
                </div>
                <div className="mb-4 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
                  <p className="text-center text-sm text-blue-300">📧 Click the link in your email to complete registration.<br />Your trip will be saved automatically!</p>
                </div>
                <button onClick={() => { setShowEmail(false); setEmailSent(false); resetForm(); }} className="w-full text-sm text-white/60 transition hover:text-white">Close</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── STATS ── */}
      <section className="bg-blue-600 py-10">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-0 md:divide-x md:divide-blue-500">
            {stats.map((stat) => (
              <div key={stat.label} className="px-6 text-center">
                <div className="mb-1 text-3xl font-bold text-white md:text-4xl">{stat.value}</div>
                <div className="text-sm text-blue-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── POPULAR ROUTES ── */}
      <section className="bg-white px-4 py-16 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">Global Network</p>
            <h2 className="mb-4 text-3xl font-bold text-slate-900 md:text-4xl">Popular Routes</h2>
            <p className="mx-auto max-w-xl text-base text-slate-500 md:text-lg">From Lagos to London, New York to Tokyo — the community spans major travel hubs.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {cities.map((city) => (
              <div key={city.name} className="group relative h-52 overflow-hidden rounded-2xl shadow-lg md:h-72">
                <Image src={city.image} alt={city.name} fill className="object-cover transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4">
                  <p className="text-lg font-bold text-white md:text-xl">{city.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-white/70"><MapPin className="h-3 w-3" />{city.country}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <TestimonialsCarousel />

      {/* ── PRICING ── */}
      <section className="bg-slate-50 px-4 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">Transparent Pricing</p>
            <h2 className="mb-4 text-3xl font-bold text-slate-900 md:text-4xl">Simple, honest fees</h2>
            <p className="text-base text-slate-500 md:text-lg">No hidden charges. Pay only when a delivery is confirmed.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50"><Package className="h-5 w-5 text-blue-600" /></div>
                <div><p className="font-bold text-slate-900">Hoopers (Senders)</p><p className="text-sm text-slate-500">People sending items</p></div>
              </div>
              <div className="mb-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-slate-900 md:text-5xl">+3%</span>
                <span className="ml-1 text-slate-500">service fee</span>
              </div>
              <p className="mb-4 text-sm text-slate-500">Added to the agreed delivery price.</p>
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Example: Agree £100 → you pay <strong>£103</strong> total.</div>
            </div>
            <div className="rounded-3xl bg-blue-600 p-6 text-white md:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20"><Plane className="h-5 w-5 text-white" /></div>
                <div><p className="font-bold">Booters (Travellers)</p><p className="text-sm text-white/70">People carrying items</p></div>
              </div>
              <div className="mb-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold md:text-5xl">Earn</span>
                <span className="ml-2 text-white/70">per delivery</span>
              </div>
              <p className="mb-4 text-sm text-white/70">Set your own price. Platform fees apply.</p>
              <div className="rounded-xl bg-white/10 p-4 text-sm text-white/80">Example: Agreed £100 → you receive approximately <strong>£95</strong> after fees.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE TRIPS on TrustedComm.jpg ── */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0">
          <Image src="/images/TrustedComm.jpg" alt="BootHop community" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-800/60 to-slate-900/72" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-4">

          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-green-400/30 bg-green-500/10 px-4 py-2 backdrop-blur-sm">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
              <span className="text-sm font-semibold text-green-300">Live on the platform right now</span>
            </div>
            <h2 className="text-3xl font-bold text-white md:text-4xl">Current Trips & Requests</h2>
            <p className="mt-3 text-white/50">Real-time listings — search by route or date to find your match</p>
          </div>

          {/* Search filters */}
          <div className="mb-8 grid gap-3 sm:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input placeholder="From city..." value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/8 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400 backdrop-blur-sm" />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input placeholder="To city..." value={filterTo} onChange={(e) => setFilterTo(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/8 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400 backdrop-blur-sm" />
            </div>
            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/8 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400 backdrop-blur-sm [color-scheme:dark]" />
          </div>

          {trips.length > 0 ? (
            <div className="grid gap-10 md:grid-cols-2">

              {/* Booters */}
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-500/20">
                    <Plane className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Booters — Travellers</h3>
                    <p className="text-xs text-white/40">People with space to carry items</p>
                  </div>
                  <span className="ml-auto rounded-full border border-blue-400/20 bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300">
                    {booterTrips.length} active
                  </span>
                </div>
                <div className="space-y-3">
                  {booterTrips.length > 0 ? (
                    <>
                      {booterTrips.slice(0, visibleCount).map((item, i) => (
                        <div key={item.id ?? i} className="group rounded-2xl border border-blue-400/15 bg-white/5 p-4 backdrop-blur-sm transition hover:border-blue-400/30 hover:bg-white/10">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-white">{item.from_city} → {item.to_city}</p>
                              <p className="mt-1 text-sm text-white/50">{new Date(item.travel_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {item.weight && <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-300">{weightOptions.find(w => w.value === item.weight)?.label || item.weight}</span>}
                              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white opacity-0 transition hover:bg-blue-500 group-hover:opacity-100">
                                Request →
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {booterTrips.length > visibleCount && (
                        <button onClick={() => setVisibleCount(v => v + 6)} className="w-full rounded-xl border border-blue-400/20 py-3 text-sm font-medium text-blue-300 transition hover:bg-blue-500/10">
                          Show more ({booterTrips.length - visibleCount} remaining)
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                      <p className="text-sm text-white/40">No travellers match your search</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Hoopers */}
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/20">
                    <Package className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Hoopers — Senders</h3>
                    <p className="text-xs text-white/40">People who need items delivered</p>
                  </div>
                  <span className="ml-auto rounded-full border border-emerald-400/20 bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                    {hooperTrips.length} active
                  </span>
                </div>
                <div className="space-y-3">
                  {hooperTrips.length > 0 ? (
                    <>
                      {hooperTrips.slice(0, visibleCount).map((item, i) => (
                        <div key={item.id ?? i} className="group rounded-2xl border border-emerald-400/15 bg-white/5 p-4 backdrop-blur-sm transition hover:border-emerald-400/30 hover:bg-white/10">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-white">{item.from_city} → {item.to_city}</p>
                              <p className="mt-1 text-sm text-white/50">{new Date(item.travel_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {item.weight && <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300">{weightOptions.find(w => w.value === item.weight)?.label || item.weight}</span>}
                              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white opacity-0 transition hover:bg-emerald-500 group-hover:opacity-100">
                                Carry this →
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {hooperTrips.length > visibleCount && (
                        <button onClick={() => setVisibleCount(v => v + 6)} className="w-full rounded-xl border border-emerald-400/20 py-3 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/10">
                          Show more ({hooperTrips.length - visibleCount} remaining)
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                      <p className="text-sm text-white/40">No send requests match your search</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="mb-6 text-white/40">No trips posted yet — be the first!</p>
            </div>
          )}

          {/* Single CTA — scroll to top */}
          <div className="mt-10 text-center">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:-translate-y-0.5 hover:bg-blue-500 active:scale-[0.98]">
              Post a Trip <ArrowRight className="h-4 w-4" />
            </button>
            <p className="mt-4 text-sm text-white/30">Free to join · No subscription · Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-950 px-4 py-12 text-slate-400 md:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 grid gap-8 sm:grid-cols-2 md:grid-cols-5">
            <div className="sm:col-span-2 md:col-span-2">
              <div className="mb-4">
                <BootHopLogo iconClass="text-white" textClass="text-white" />
              </div>
              <p className="mb-5 max-w-xs text-sm leading-relaxed">Connecting verified travelers with people who need items delivered internationally.</p>
              <div className="flex items-center gap-2 text-xs">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                <span className="text-slate-500">Platform operational</span>
              </div>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-white">Platform</h4>
              <ul className="space-y-2.5 text-sm">
                {[['How It Works', '/how-it-works'], ['Pricing & Fees', '/pricing'], ['Browse Journeys', '/journeys'], ['Trust & Safety', '/trust-safety']].map(([label, href]) => (
                  <li key={href}><Link href={href} className="transition hover:text-white">{label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-white">Legal</h4>
              <ul className="space-y-2.5 text-sm">
                {[['Terms of Service', '/terms'], ['Privacy Policy', '/privacy']].map(([label, href]) => (
                  <li key={href}><Link href={href} className="transition hover:text-white">{label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-white">Support</h4>
              <ul className="space-y-2.5 text-sm">
                {[['Help Center', '/help'], ['Contact Us', '/contact'], ['About BootHop', '/about']].map(([label, href]) => (
                  <li key={href}><Link href={href} className="transition hover:text-white">{label}</Link></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 text-sm md:flex-row">
            <p>© {new Date().getFullYear()} BootHop. All rights reserved.</p>
            <div className="flex items-center gap-5">
              {[['Terms', '/terms'], ['Privacy', '/privacy'], ['Customs', '/customs']].map(([label, href]) => (
                <Link key={href} href={href} className="transition hover:text-white">{label}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
