'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle,
  Globe,
  Lock,
  MapPin,
  Menu,
  Package,
  Plane,
  Quote,
  Shield,
  Star,
  TrendingDown,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Mode = 'send' | 'travel';
type ActiveTab = 'hooper' | 'booter';

type TripForm = {
  from: string;
  to: string;
  date: string;
  price: string;
  email: string;
  weight: string;
};

type RecentTrip = {
  id?: string;
  from_city: string;
  to_city: string;
  travel_date: string;
  type: Mode;
  weight?: string;
};

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
  {
    name: 'Toyin A.',
    role: 'MSc Student, London',
    route: 'Lagos → London',
    text: 'I travelled from Lagos to London and used BootHop to send documents ahead. Everything arrived before I did.',
    rating: 5,
  },
  {
    name: 'Kunle O.',
    role: 'Tech Consultant',
    route: 'Lagos → London',
    text: 'Moving from Lagos to London for work was hectic, but BootHop made sending personal items simple.',
    rating: 5,
  },
  {
    name: 'James R.',
    role: 'Management Consultant',
    route: 'London → New York',
    text: 'Delivered a small parcel via BootHop on my London–New York trip. Straightforward process and great communication.',
    rating: 5,
  },
];

const cities = [
  {
    name: 'Lagos',
    country: 'Nigeria',
    image: '/images/cities/lagos1.jpg',
  },
  {
    name: 'London',
    country: 'United Kingdom',
    image: '/images/cities/london1.jpg',
  },
  {
    name: 'New York',
    country: 'United States',
    image: '/images/cities/ny1.jpg',
  },
  {
    name: 'Tokyo',
    country: 'Japan',
    image: '/images/cities/tokyo1.jpg',
  },
];

const features = [
  {
    title: 'Identity Verification',
    desc: 'Every user undergoes verification before participating in the network.',
    highlights: ['Government ID check', 'Address verification', 'Ongoing review'],
    icon: Shield,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    title: 'Escrow Payments',
    desc: 'Funds are held safely until successful delivery is confirmed.',
    highlights: ['Secure holding', 'Dual confirmation', 'Safer disputes'],
    icon: Lock,
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
  },
  {
    title: 'Real-Time Matching',
    desc: 'Compatible routes and requests are matched quickly as new trips are posted.',
    highlights: ['Instant notifications', 'Smart route logic', 'Better timing'],
    icon: Zap,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
];

const steps = {
  booter: [
    {
      title: 'Post Your Journey',
      desc: 'Share your route, travel date, and how much space you have.',
      icon: Plane,
    },
    {
      title: 'Get Matched',
      desc: 'Senders with compatible requests can connect with you.',
      icon: Users,
    },
    {
      title: 'Secure Payment',
      desc: 'Funds are held safely until delivery is completed.',
      icon: Lock,
    },
    {
      title: 'Build Reputation',
      desc: 'Earn ratings and unlock better opportunities over time.',
      icon: Star,
    },
  ],
  hooper: [
    {
      title: 'Post Your Request',
      desc: 'Add the route, date, and delivery budget for your item.',
      icon: Package,
    },
    {
      title: 'Browse Journeys',
      desc: 'Find verified travellers heading in the right direction.',
      icon: Globe,
    },
    {
      title: 'Pay in Escrow',
      desc: 'Payment stays protected until you confirm safe delivery.',
      icon: Lock,
    },
    {
      title: 'Save More',
      desc: 'Pay far less than many traditional courier options.',
      icon: TrendingDown,
    },
  ],
};

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
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const item = testimonials[index];

  return (
    <section className="bg-slate-900 py-24">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-400">
          Community Stories
        </p>
        <h2 className="mb-10 text-3xl font-bold text-white md:text-4xl">
          Trusted by travellers worldwide
        </h2>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm md:p-12">
          <Quote className="mx-auto mb-6 h-8 w-8 text-blue-400" />
          <p className="mb-8 text-lg italic leading-relaxed text-white/90 md:text-xl">
            &quot;{item.text}&quot;
          </p>
          <div className="flex flex-col items-center gap-2">
            <StarRating count={item.rating} />
            <p className="font-semibold text-white">{item.name}</p>
            <p className="text-sm text-white/60">{item.role}</p>
            <span className="rounded-full border border-blue-500/30 bg-blue-500/20 px-3 py-1 text-xs text-blue-300">
              {item.route}
            </span>
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? 'w-6 bg-blue-400' : 'w-2 bg-white/20'
              }`}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const [mode, setMode] = useState<Mode>('send');
  const [activeTab, setActiveTab] = useState<ActiveTab>('hooper');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [trips, setTrips] = useState<RecentTrip[]>([]);

  // Google Places search states
  const [queryFrom, setQueryFrom] = useState('');
  const [fromSuggestions, setFromSuggestions] = useState<string[]>([]);
  const [queryTo, setQueryTo] = useState('');
  const [toSuggestions, setToSuggestions] = useState<string[]>([]);

  // Track if user selected from dropdown (not just typed) - NEW
  const [fromSelected, setFromSelected] = useState(false);
  const [toSelected, setToSelected] = useState(false);

  // Session token for Google Places (reduces billing)
  const [sessionToken, setSessionToken] = useState<google.maps.places.AutocompleteSessionToken | null>(null);

  const [trip, setTrip] = useState<TripForm>({
    from: '',
    to: '',
    date: '',
    price: '',
    email: '',
    weight: '',
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Initialize session token when Google loads
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google?.maps?.places) {
      setSessionToken(new google.maps.places.AutocompleteSessionToken());
    }
  }, []);

  // Debounced Google Places search for FROM
  // Debounced Google Places search for FROM
useEffect(() => {
  // Don't search if already selected
  if (fromSelected) return;

  const timer = setTimeout(() => {
    if (!queryFrom || queryFrom.length < 3) {
      setFromSuggestions([]);
      return;
    }
    if (typeof window === 'undefined' || !window.google?.maps?.places) return;

    const service = new google.maps.places.AutocompleteService();

    service.getPlacePredictions(
      {
        input: queryFrom,
        types: ['(cities)'],
        sessionToken: sessionToken || undefined,
      },
      (predictions) => {
        if (!predictions) {
          setFromSuggestions([]);
          return;
        }
        setFromSuggestions(predictions.map((p) => p.description));
      }
    );
  }, 400);

  return () => clearTimeout(timer);
}, [queryFrom, sessionToken, fromSelected]);


  // Debounced Google Places search for TO
  
// Debounced Google Places search for TO
useEffect(() => {
  // Don't search if already selected
  if (toSelected) return;

  const timer = setTimeout(() => {
    if (!queryTo || queryTo.length < 3) {
      setToSuggestions([]);
      return;
    }
    if (typeof window === 'undefined' || !window.google?.maps?.places) return;

    const service = new google.maps.places.AutocompleteService();

    service.getPlacePredictions(
      {
        input: queryTo,
        types: ['(cities)'],
        sessionToken: sessionToken || undefined,
      },
      (predictions) => {
        if (!predictions) {
          setToSuggestions([]);
          return;
        }
        setToSuggestions(predictions.map((p) => p.description));
      }
    );
  }, 400);

  return () => clearTimeout(timer);
}, [queryTo, sessionToken, toSelected]);

  const trustItems = useMemo(
    () => ['Identity verified', 'Secure escrow', '95% satisfaction', 'Free to join'],
    []
  );

  // Updated resetForm with selection flags
  const resetForm = () => {
    setTrip({
      from: '',
      to: '',
      date: '',
      price: '',
      email: '',
      weight: '',
    });
    setQueryFrom('');
    setQueryTo('');
    setFromSuggestions([]);
    setToSuggestions([]);
    setFromSelected(false);
    setToSelected(false);
    setShowEmail(false);
    setEmailSent(false);
  };

  const loadTrips = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('trips')
      .select('id, from_city, to_city, travel_date, type, weight')
      .gte('travel_date', today)
      .order('travel_date', { ascending: true })
      .limit(6);

    if (!error) {
      setTrips((data as RecentTrip[]) || []);
    }
  }, []);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      alert('🎉 Your trip has been registered successfully!');
      window.history.replaceState({}, '', '/');
      loadTrips();
    }
  }, [searchParams, loadTrips]);

  // Updated handleSubmit with city selection validation
  const handleSubmit = () => {
    // Validate all required fields
    if (!trip.from || !trip.to || !trip.date || !trip.weight) {
      alert('Please fill in all required fields.');
      return;
    }

    // Validate city selections
    if (!fromSelected) {
      alert('Please select a valid "From" city from the dropdown suggestions.');
      return;
    }

    if (!toSelected) {
      alert('Please select a valid "To" city from the dropdown suggestions.');
      return;
    }

    setShowEmail(true);
  };

  const sendMagicLink = async () => {
    if (!trip.email) {
      alert('Please enter your email.');
      return;
    }

    setSubmitting(true);

    // Save trip data to localStorage so callback page can use it
    localStorage.setItem('pendingTrip', JSON.stringify({
      from: trip.from,
      to: trip.to,
      date: trip.date,
      price: trip.price,
      weight: trip.weight,
      mode: mode,
    }));

    const { error } = await supabase.auth.signInWithOtp({
      email: trip.email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setSubmitting(false);

    if (error) {
      localStorage.removeItem('pendingTrip');
      alert(error.message);
      return;
    }

    setEmailSent(true);
  };

  const saveTrip = async () => {
    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSubmitting(false);
      alert('Please verify your email first, then return to save the trip.');
      return;
    }

    const { data: savedTrip, error } = await supabase
      .from('trips')
      .insert([
        {
          from_city: trip.from,
          to_city: trip.to,
          travel_date: trip.date,
          price: trip.price ? Number(trip.price) : null,
          weight: trip.weight,
          user_id: user.id,
          type: mode,
        },
      ])
      .select()
      .single();

    if (error || !savedTrip) {
      setSubmitting(false);
      alert('Error saving trip.');
      return;
    }

    try {
      const matchResponse = await fetch('/api/match-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId: savedTrip.id }),
      });

      if (matchResponse.ok) {
        const matchResult = await matchResponse.json();

        if (matchResult?.count > 0) {
          alert(`🎉 Trip saved! We found ${matchResult.count} potential matches.`);

          if (Array.isArray(matchResult.matches)) {
            await Promise.all(
              matchResult.matches.map((match: { id: string }) =>
                fetch('/api/send-match-email', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ matchId: match.id }),
                })
              )
            );
          }
        } else {
          alert("Trip saved! We'll notify you when we find a match.");
        }
      } else {
        alert("Trip saved, but matching could not run right now.");
      }
    } catch {
      alert("Trip saved, but matching could not run right now.");
    }

    setSubmitting(false);
    resetForm();
    loadTrips();
  };

  // Common input class for consistent styling
  const inputClass = "w-full rounded-lg border border-white/30 bg-white/10 p-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400";

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <nav
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? 'border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700">
              <Plane className="h-4 w-4 text-white" />
            </div>
            <span
              className={`text-xl font-bold tracking-tight ${
                scrolled ? 'text-slate-900' : 'text-white'
              }`}
            >
              Boot<span className="text-blue-400">Hop</span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  scrolled
                    ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                scrolled
                  ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Get Started
            </Link>
          </div>

          <button
            className={`rounded-lg p-2 md:hidden ${
              scrolled ? 'text-slate-700 hover:bg-slate-100' : 'text-white hover:bg-white/10'
            }`}
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-slate-100 bg-white shadow-lg md:hidden">
            <div className="space-y-1 px-4 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-3">
                <Link
                  href="/login"
                  className="block rounded-xl border border-slate-200 py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="block rounded-xl bg-blue-600 py-2.5 text-center text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

            <section className="relative flex min-h-screen items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/drealboothop.jpg"
            alt="BootHop community"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-blue-950/85 to-slate-900/80" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-400/30 bg-green-500/10 px-4 py-2 backdrop-blur-sm">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm font-medium text-green-300">
                Trusted by 10,000+ verified users
              </span>
            </div>

            <h1 className="mb-6 text-5xl font-bold leading-tight text-white md:text-7xl">
              Send Packages Globally
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Instantly Matched
              </span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/70 md:text-xl">
              Enter your journey or delivery request and get matched with verified users
              automatically.
            </p>

            <div className="mb-8 flex justify-center">
              <div className="flex rounded-xl border border-white/20 bg-white/10 p-1 backdrop-blur-xl">
                <button
                  onClick={() => setMode('send')}
                  className={`rounded-lg px-6 py-3 text-sm font-semibold transition-all ${
                    mode === 'send'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  📦 Send Item
                </button>
                <button
                  onClick={() => setMode('travel')}
                  className={`rounded-lg px-6 py-3 text-sm font-semibold transition-all ${
                    mode === 'travel'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  ✈️ I&apos;m Travelling
                </button>
              </div>
            </div>

            {/* Form grid with city validation */}
            <div className="mx-auto grid max-w-6xl gap-4 rounded-2xl border border-white/20 bg-white/10 p-6 pb-10 shadow-2xl backdrop-blur-xl md:grid-cols-6">
              {/* FROM input */}
              <div className="relative">
                <input
                  placeholder="From (City/Country)"
                  value={queryFrom}
                  onChange={(e) => {
                    setQueryFrom(e.target.value);
                    setTrip({ ...trip, from: e.target.value });
                    setFromSelected(false);
                  }}
                  className={`${inputClass} ${
                    queryFrom && !fromSelected ? 'ring-2 ring-amber-400/50' : ''
                  }`}
                />
               {fromSuggestions.length > 0 && (
  <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-lg border border-white/10 bg-slate-900 shadow-lg">
    {fromSuggestions.map((s, i) => (
      <div
        key={i}
        onClick={() => {
          setTrip({ ...trip, from: s });
          setQueryFrom(s);
          setFromSuggestions([]); // Clear suggestions immediately
          setFromSelected(true);
          if (window.google?.maps?.places) {
            setSessionToken(new google.maps.places.AutocompleteSessionToken());
          }
        }}
        className="cursor-pointer p-3 text-white hover:bg-white/10"
      >
        {s}
      </div>
    ))}
  </div>
)}

                {queryFrom && !fromSelected && (
                  <p className="absolute -bottom-5 left-0 text-xs text-amber-400">
                    Select from list
                  </p>
                )}
              </div>

              {/* TO input */}
              <div className="relative">
                <input
                  placeholder="To (City/Country)"
                  value={queryTo}
                  onChange={(e) => {
                    setQueryTo(e.target.value);
                    setTrip({ ...trip, to: e.target.value });
                    setToSelected(false);
                  }}
                  className={`${inputClass} ${
                    queryTo && !toSelected ? 'ring-2 ring-amber-400/50' : ''
                  }`}
                />
{toSuggestions.length > 0 && (
  <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-lg border border-white/10 bg-slate-900 shadow-lg">
    {toSuggestions.map((s, i) => (
      <div
        key={i}
        onClick={() => {
          setTrip({ ...trip, to: s });
          setQueryTo(s);
          setToSuggestions([]);
          setToSelected(true);
          if (window.google?.maps?.places) {
            setSessionToken(new google.maps.places.AutocompleteSessionToken());
          }
        }}
        className="cursor-pointer p-3 text-white hover:bg-white/10"
      >
        {s}
      </div>
    ))}
  </div>
)}


                {queryTo && !toSelected && (
                  <p className="absolute -bottom-5 left-0 text-xs text-amber-400">
                    Select from list
                  </p>
                )}
              </div>

              {/* DATE */}
              <input
                type="date"
                value={trip.date}
                onChange={(e) => setTrip({ ...trip, date: e.target.value })}
                className={`${inputClass} [color-scheme:dark]`}
              />

              {/* WEIGHT */}
              <select
                value={trip.weight}
                onChange={(e) => setTrip({ ...trip, weight: e.target.value })}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="" disabled className="bg-slate-900 text-white/50">
                  Weight
                </option>
                {weightOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    className="bg-slate-900 text-white"
                  >
                    {option.label}
                  </option>
                ))}
              </select>

              {/* PRICE/BUDGET */}
              <input
                type="number"
                placeholder={mode === 'travel' ? 'Price (£)' : 'Budget (£)'}
                value={trip.price}
                onChange={(e) => setTrip({ ...trip, price: e.target.value })}
                className={inputClass}
              />

              {/* SUBMIT BUTTON */}
              <button
                onClick={handleSubmit}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 p-3 font-semibold text-white transition hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/40"
              >
                Register
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-white/60">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                Instant matching
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                Secure escrow
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                Verified users
              </span>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-5 text-sm text-white/60">
              {trustItems.map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-xs text-white/40">
          <span>Scroll to explore</span>
          <div className="h-8 w-px bg-gradient-to-b from-white/30 to-transparent" />
        </div>
      </section>

    


      {showEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-gradient-to-br from-slate-900/95 to-blue-900/95 p-8 shadow-2xl backdrop-blur-xl">
            {!emailSent ? (
              <>
                <h2 className="mb-2 text-2xl font-bold text-white">Verify Your Email</h2>
                <p className="mb-6 text-sm text-white/60">
                  We&apos;ll send you a secure magic link to continue.
                </p>

                <input
                  type="email"
                  placeholder="Enter your email"
                  value={trip.email}
                  onChange={(e) => setTrip({ ...trip, email: e.target.value })}
                  className="mb-4 w-full rounded-lg border border-white/30 bg-white/10 p-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEmail(false)}
                    className="flex-1 rounded-lg border border-white/30 py-3 text-white transition hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendMagicLink}
                    disabled={submitting}
                    className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 py-3 font-semibold text-white transition hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-60"
                  >
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
                  <h2 className="mb-2 text-2xl font-bold text-white">Check Your Email</h2>
                  <p className="text-white/60">
                    We&apos;ve sent a verification link to{' '}
                    <span className="font-medium text-blue-400">{trip.email}</span>
                  </p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-300 text-center">
                    📧 Click the link in your email to complete registration.
                    <br />
                    Your trip will be saved automatically!
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowEmail(false);
                    setEmailSent(false);
                    resetForm();
                  }}
                  className="w-full text-sm text-white/60 transition hover:text-white"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <section className="bg-blue-600 py-10">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-0 md:divide-x md:divide-blue-500">
            {stats.map((stat) => (
              <div key={stat.label} className="px-6 text-center">
                <div className="mb-1 text-4xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-blue-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {trips.length > 0 && (
        <section className="bg-slate-950 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="mb-10 text-center text-3xl font-bold text-white">
              Recent Trips & Requests
            </h2>

            <div className="grid gap-6 md:grid-cols-3">
              {trips.map((item, i) => (
                <div
                  key={item.id ?? i}
                  className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition hover:bg-white/10"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-2xl">{item.type === 'travel' ? '✈️' : '📦'}</span>
                    <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/60">
                      {item.type === 'travel' ? 'Traveller' : 'Sender'}
                    </span>
                    {item.weight && (
                      <span className="rounded-full bg-blue-500/20 px-2 py-1 text-xs text-blue-300">
                        {weightOptions.find(w => w.value === item.weight)?.label || item.weight}
                      </span>
                    )}
                  </div>
                  <p className="mb-2 text-lg font-semibold text-white">
                    {item.from_city} → {item.to_city}
                  </p>
                  <p className="text-sm text-white/60">
                    {new Date(item.travel_date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="how-it-works" className="bg-slate-50 px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">
              Simple Process
            </p>
            <h2 className="mb-4 text-4xl font-bold text-slate-900">How BootHop Works</h2>
            <p className="mx-auto max-w-xl text-lg text-slate-500">
              Whether you&apos;re sending an item or travelling with spare luggage space.
            </p>
          </div>

          <div className="mb-12 flex justify-center">
            <div className="flex gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
              <button
                onClick={() => setActiveTab('hooper')}
                className={`rounded-xl px-6 py-2.5 text-sm font-semibold transition-all ${
                  activeTab === 'hooper'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                I need to send an item
              </button>
              <button
                onClick={() => setActiveTab('booter')}
                className={`rounded-xl px-6 py-2.5 text-sm font-semibold transition-all ${
                  activeTab === 'booter'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                I&apos;m travelling
              </button>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps[activeTab].map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="relative rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
                >
                  <div className="absolute -right-3 -top-3 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow">
                    {i + 1}
                  </div>
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 font-semibold text-slate-900">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">
              Global Network
            </p>
            <h2 className="mb-4 text-4xl font-bold text-slate-900">Popular Routes</h2>
            <p className="mx-auto max-w-xl text-lg text-slate-500">
              From Lagos to London, New York to Tokyo — the community spans major travel hubs.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {cities.map((city) => (
              <div
                key={city.name}
                className="group relative h-72 overflow-hidden rounded-2xl shadow-lg"
              >
                <Image
                  src={city.image}
                  alt={city.name}
                  fill
                  className="object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-5">
                  <p className="text-xl font-bold text-white">{city.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-white/70">
                    <MapPin className="h-3 w-3" />
                    {city.country}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TestimonialsCarousel />

      <section className="bg-white px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">
              Why BootHop
            </p>
            <h2 className="mb-4 text-4xl font-bold text-slate-900">
              Built on trust. Designed for people.
            </h2>
            <p className="mx-auto max-w-xl text-lg text-slate-500">
              Every feature exists to help your item and your money move more safely.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm"
                >
                  <div
                    className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${feature.iconBg}`}
                  >
                    <Icon className={`h-7 w-7 ${feature.iconColor}`} />
                  </div>

                  <h3 className="mb-3 text-xl font-bold text-slate-900">{feature.title}</h3>
                  <p className="mb-5 leading-relaxed text-slate-500">{feature.desc}</p>

                  <ul className="space-y-2">
                    {feature.highlights.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-0">
        <div className="relative h-80 w-full">
          <Image
            src="/images/TrustedComm.jpg"
            alt="BootHop trusted community"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-slate-900/80" />
          <div className="relative z-10 flex h-full items-center justify-center px-4 text-center">
            <div>
              <h2 className="mb-3 text-3xl font-bold text-white md:text-4xl">
                A community built on mutual trust
              </h2>
              <p className="mx-auto mb-6 max-w-lg text-white/70">
                Every user is verified, every payment is protected, and every delivery can be rated.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-blue-600 shadow transition hover:bg-blue-50"
              >
                Join the Community
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">
              Transparent Pricing
            </p>
            <h2 className="mb-4 text-4xl font-bold text-slate-900">Simple, honest fees</h2>
            <p className="text-lg text-slate-500">
              No hidden charges. Pay only when a delivery is confirmed.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Hoopers (Senders)</p>
                  <p className="text-sm text-slate-500">People sending items</p>
                </div>
              </div>

              <div className="mb-3 flex items-baseline gap-1">
                <span className="text-5xl font-bold text-slate-900">+3%</span>
                <span className="ml-1 text-slate-500">service fee</span>
              </div>

              <p className="mb-4 text-sm text-slate-500">
                Added to the agreed delivery price.
              </p>

              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                Example: Agree £100 → you pay <strong>£103</strong> total.
              </div>
            </div>

            <div className="rounded-3xl bg-blue-600 p-8 text-white">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                  <Plane className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-bold">Booters (Travellers)</p>
                  <p className="text-sm text-white/70">People carrying items</p>
                </div>
              </div>

              <div className="mb-3 flex items-baseline gap-1">
                <span className="text-5xl font-bold">Earn</span>
                <span className="ml-2 text-white/70">per delivery</span>
              </div>

              <p className="mb-4 text-sm text-white/70">
                Set your own price. Platform fees apply.
              </p>

              <div className="rounded-xl bg-white/10 p-4 text-sm text-white/80">
                Example: Agreed £100 → you receive approximately <strong>£95</strong> after fees.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-blue-950 px-4 py-24">
        <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_20%_50%,#3b82f6_0%,transparent_50%),radial-gradient(circle_at_80%_20%,#7c3aed_0%,transparent_50%)]" />
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-blue-400">
            Ready to start?
          </p>
          <h2 className="mb-6 text-4xl font-bold leading-tight text-white md:text-5xl">
            Your next delivery is one
            <br />
            journey away.
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-lg text-white/60">
            Join travellers earning on their trips and senders saving on every shipment.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:-translate-y-0.5 hover:bg-blue-500"
            >
              Create Free Account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-8 py-4 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/20"
            >
              How It Works
            </Link>
          </div>
          <p className="mt-6 text-sm text-white/30">
            Free to join · No subscription · Cancel anytime
          </p>
        </div>
      </section>

      <footer className="bg-slate-950 px-4 py-16 text-slate-400">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 grid gap-10 md:grid-cols-5">
            <div className="md:col-span-2">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700">
                  <Plane className="h-4 w-4 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white">
                  Boot<span className="text-blue-400">Hop</span>
                </span>
              </div>
              <p className="mb-5 max-w-xs text-sm leading-relaxed">
                Connecting verified travelers with people who need items delivered
                internationally.
              </p>
              <div className="flex items-center gap-2 text-xs">
                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-slate-500">Platform operational</span>
              </div>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-semibold text-white">Platform</h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link href="/how-it-works" className="transition hover:text-white">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="transition hover:text-white">
                    Pricing & Fees
                  </Link>
                </li>
                <li>
                  <Link href="/journeys" className="transition hover:text-white">
                    Browse Journeys
                  </Link>
                </li>
                <li>
                  <Link href="/trust-safety" className="transition hover:text-white">
                    Trust & Safety
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-semibold text-white">Legal</h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link href="/terms" className="transition hover:text-white">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="transition hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-semibold text-white">Support</h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link href="/help" className="transition hover:text-white">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="transition hover:text-white">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="transition hover:text-white">
                    About BootHop
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 text-sm md:flex-row">
            <p>© {new Date().getFullYear()} BootHop. All rights reserved.</p>
            <div className="flex items-center gap-5">
              <Link href="/terms" className="transition hover:text-white">
                Terms
              </Link>
              <Link href="/privacy" className="transition hover:text-white">
                Privacy
              </Link>
              <Link href="/customs" className="transition hover:text-white">
                Customs
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

