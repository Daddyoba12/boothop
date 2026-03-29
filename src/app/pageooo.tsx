'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Plane, Shield, Zap, TrendingDown, ArrowRight,
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const stats = [
  { value: '10K+',  label: 'Verified Users' },
  { value: '50K+',  label: 'Successful Deliveries' },
  { value: '200+',  label: 'Cities Worldwide' },
  { value: '95%',   label: 'Satisfaction Rate' },
];

export default function HomePage() {
  const [mode, setMode] = useState<'send' | 'travel'>('send');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [trips, setTrips] = useState<any[]>([]);

  const [trip, setTrip] = useState({
    from: '',
    to: '',
    date: '',
    price: '',
    email: ''
  });

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // STEP 1 → submit basic trip
  const handleSubmit = () => {
    if (!trip.from || !trip.to || !trip.date) {
      return alert('Please fill all required fields');
    }
    setShowEmail(true);
  };

  // STEP 2 → send magic link
  const sendMagicLink = async () => {
    if (!trip.email) {
      alert('Please enter your email');
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: trip.email,
      options: {
        emailRedirectTo: window.location.origin
      }
    });

    if (error) {
      alert(error.message);
      return;
    }

    setEmailSent(true);
  };

  // STEP 3 → after login, save trip
  // STEP 3 → after login, save trip AND trigger matching
const saveTrip = async () => {
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    alert('Please verify your email first');
    return;
  }

  // Save trip
  const { data: savedTrip, error } = await supabase.from('trips').insert([
    {
      from_city: trip.from,
      to_city: trip.to,
      travel_date: trip.date,
      price: trip.price,
      user_id: userData.user.id,
      type: mode
    }
  ]).select().single();

  if (error) {
    alert('Error saving trip');
    return;
  }

  // 🔥 TRIGGER MATCHING ENGINE
  const matchResponse = await fetch('/api/match-engine', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tripId: savedTrip.id })
  });

  const matchResult = await matchResponse.json();

  if (matchResult.count > 0) {
    alert(`🎉 Trip saved! We found ${matchResult.count} potential matches. Check your email!`);
    
    // Send emails for each match
    for (const match of matchResult.matches) {
      await fetch('/api/send-match-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: match.id })
      });
    }
  } else {
    alert('Trip saved! We\'ll notify you when we find a match.');
  }

  setShowEmail(false);
  setTrip({ from: '', to: '', date: '', price: '', email: '' });
  loadTrips();
};


  // LOAD TRIPS (NO PRICE)
  const loadTrips = async () => {
    const today = new Date().toISOString().split('T')[0];

    const { data } = await supabase
      .from('trips')
      .select('from_city,to_city,travel_date,type')
      .gte('travel_date', today)
      .limit(6);

    setTrips(data || []);
  };

  useEffect(() => {
    loadTrips();
  }, []);

  const navLinks = [
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/pricing',      label: 'Pricing' },
    { href: '/about',        label: 'About' },
    { href: '/trust-safety', label: 'Trust & Safety' },
  ];

  return (
    <div className="min-h-screen">

      {/* PREMIUM GLASS NAV */}
      <nav className={`fixed top-0 w-full z-50 transition-all ${
        scrolled ? 'bg-white/10 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Plane className="text-blue-400 group-hover:text-blue-300 transition-colors" />
            <span className="font-bold text-white">
              Boot<span className="text-blue-400">Hop</span>
            </span>
          </Link>

          <div className="hidden md:flex gap-6">
            {navLinks.map(l => (
              <Link 
                key={l.href} 
                href={l.href} 
                className="text-white/80 hover:text-white transition-colors font-medium"
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex gap-3 items-center">
            <Link 
              href="/login" 
              className="text-sm text-white/80 hover:text-white transition-colors font-medium"
            >
              Login
            </Link>
            <Link 
              href="/register" 
              className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:shadow-xl hover:shadow-blue-500/50 transition-all hover:scale-105"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO - ELITE PREMIUM WITH SEARCH FORM */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Hero Image */}
        <Image
          src="/images/dreal_hooper.jpg"
          alt="BootHop"
          fill
          className="object-cover"
          priority
        />

        {/* Premium Multi-layer Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-blue-950/90 to-purple-950/85" />
        
        {/* Animated Accent Orbs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-16 w-full">
          <div className="max-w-4xl mx-auto text-center">

            {/* Trust Badge */}
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-400/30 backdrop-blur-sm hover:bg-green-500/20 transition-all">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm text-green-300 font-medium">Trusted by 10,000+ verified users</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-[1.1] mb-6">
              Send Packages Globally
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Instantly Matched
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-white/70 mb-10 leading-relaxed max-w-2xl mx-auto">
              Enter your journey or delivery request. We'll match you with verified users automatically.
            </p>

            {/* TOGGLE BUTTONS */}
            <div className="flex justify-center mb-8">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-1 flex shadow-lg">
                <button
                  onClick={() => setMode('send')}
                  className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
                    mode === 'send'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  📦 Send Item
                </button>

                <button
                  onClick={() => setMode('travel')}
                  className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
                    mode === 'travel'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  ✈️ I'm Travelling
                </button>
              </div>
            </div>

            {/* SEARCH FORM - PREMIUM GLASS DESIGN */}
            <div className="max-w-5xl mx-auto bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 grid md:grid-cols-5 gap-4">

              <input
                placeholder="From (City/Country)"
                value={trip.from}
                onChange={(e) => setTrip({...trip, from: e.target.value})}
                className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/50 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />

              <input
                placeholder="To (City/Country)"
                value={trip.to}
                onChange={(e) => setTrip({...trip, to: e.target.value})}
                className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/50 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />

              <input
                type="date"
                value={trip.date}
                onChange={(e) => setTrip({...trip, date: e.target.value})}
                className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/50 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent [color-scheme:dark]"
              />

              {mode === 'travel' ? (
                <input
                  placeholder="Price (£)"
                  type="number"
                  value={trip.price}
                  onChange={(e) => setTrip({...trip, price: e.target.value})}
                  className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/50 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              ) : (
                <input
                  placeholder="Budget (£)"
                  type="number"
                  value={trip.price}
                  onChange={(e) => setTrip({...trip, price: e.target.value})}
                  className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/50 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              )}

              <button 
                onClick={handleSubmit}
                className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-semibold hover:shadow-2xl hover:shadow-blue-500/50 transition-all hover:scale-105 flex items-center justify-center gap-2"
              >
                Register Request <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-white/60">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Instant matching
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Secure escrow
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified users
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* EMAIL MODAL - PREMIUM GLASS DESIGN */}
      {showEmail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900/95 to-blue-900/95 backdrop-blur-xl border border-white/20 p-8 rounded-2xl max-w-md w-full shadow-2xl">

            {!emailSent ? (
              <>
                <h2 className="text-2xl font-bold mb-2 text-white">Verify Your Email</h2>
                <p className="text-white/60 mb-6 text-sm">We'll send you a secure magic link to continue</p>
                
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={trip.email}
                  onChange={(e) => setTrip({...trip, email: e.target.value})}
                  className="bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/50 p-3 w-full mb-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowEmail(false)}
                    className="flex-1 border border-white/30 text-white py-3 rounded-lg hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={sendMagicLink}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-lg hover:shadow-xl hover:shadow-blue-500/50 transition-all font-semibold"
                  >
                    Send Link
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-white">Check Your Email</h2>
                  <p className="text-white/60 text-sm mb-6">
                    We've sent a verification link to <span className="text-blue-400 font-medium">{trip.email}</span>
                  </p>
                </div>
                
                <button 
                  onClick={saveTrip}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg hover:shadow-xl hover:shadow-green-500/50 transition-all font-semibold mb-3"
                >
                  ✓ I've Verified → Save Trip
                </button>
                
                <button 
                  onClick={() => {setShowEmail(false); setEmailSent(false);}}
                  className="w-full text-white/60 hover:text-white text-sm transition-colors"
                >
                  Close
                </button>
              </>
            )}

          </div>
        </div>
      )}

      {/* STATS */}
      <section className="relative bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h60v60H0z' fill='none'/%3E%3Cpath d='M0 0h1v1H0zM59 59h1v1h-1z' fill='%23fff'/%3E%3C/svg%3E")`,
          backgroundSize: '30px 30px'
        }} />
        
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10 px-6">
          {stats.map((s, idx) => (
            <div key={s.label} className="animate-count-up" style={{ animationDelay: `${idx * 0.1}s` }}>
              <h3 className="text-4xl md:text-5xl text-white font-bold mb-2">{s.value}</h3>
              <p className="text-blue-50/90 text-sm font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ACTIVE TRIPS SECTION - NEW */}
      {trips.length > 0 && (
        <section className="py-16 relative overflow-hidden">
          <div className="absolute top-0 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-white text-center mb-10">Recent Trips & Requests</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {trips.map((t, i) => (
                <div key={i} className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{t.type === 'travel' ? '✈️' : '📦'}</span>
                    <span className="text-xs text-white/50 bg-white/10 px-2 py-1 rounded-full">
                      {t.type === 'travel' ? 'Traveller' : 'Sender'}
                    </span>
                  </div>
                  <p className="font-semibold text-white text-lg mb-2">
                    {t.from_city} → {t.to_city}
                  </p>
                  <p className="text-sm text-white/60">{new Date(t.travel_date).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* VALUE SECTION - Premium Glass Cards */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">Why BootHop Wins</h2>
            <p className="text-white/60 max-w-2xl mx-auto text-lg">
              Traditional couriers are expensive and slow. BootHop uses real travel routes to deliver faster and cheaper.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all hover:scale-105 hover:-translate-y-2 card-lift">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <TrendingDown className="text-white w-7 h-7" />
              </div>
              <h3 className="font-bold text-white text-2xl mb-3">Up to 70% cheaper</h3>
              <p className="text-white/60 leading-relaxed">No inflated courier pricing. Pay fair rates set by real travellers.</p>
            </div>

            <div className="group p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all hover:scale-105 hover:-translate-y-2 card-lift">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="text-white w-7 h-7" />
              </div>
              <h3 className="font-bold text-white text-2xl mb-3">Faster delivery</h3>
              <p className="text-white/60 leading-relaxed">Packages move with real travellers on actual flight routes.</p>
            </div>

            <div className="group p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all hover:scale-105 hover:-translate-y-2 card-lift">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="text-white w-7 h-7" />
              </div>
              <h3 className="font-bold text-white text-2xl mb-3">Secure payments</h3>
              <p className="text-white/60 leading-relaxed">Funds held in escrow until confirmed delivery completion.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative py-28 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-950 to-purple-950" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 0L0 0 0 10' fill='none' stroke='%23fff' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-500/20 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Start Shipping Smarter
          </h2>
          <p className="text-white/60 mb-10 text-lg max-w-2xl mx-auto">
            Join thousands of users saving money on global shipping while travellers earn on their journeys.
          </p>
          <Link 
            href="/register" 
            className="inline-block bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-10 py-5 rounded-xl text-white font-bold text-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all hover:scale-105"
          >
            Get Started Now
          </Link>
        </div>
      </section>

    </div>
  );
}
