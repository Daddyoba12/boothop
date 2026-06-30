'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ArrowRight, CheckCircle, Shield, Clock, MapPin, Star } from 'lucide-react';
import BootHopLogo from '@/components/BootHopLogo';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-key'
);

const track = (event: string, params?: Record<string, string>) => {
  (window as any).ttq?.track(event, params);
};

const TESTIMONIALS = [
  {
    name: 'Toyin A.',
    initial: 'T',
    role: 'MSc Student',
    route: 'Lagos → London',
    text: 'I travelled from Lagos to London and used BootHop to send documents ahead. Everything arrived before I did.',
    outcomes: ['✅ Delivered same day', '🔒 Escrow payment released', '⭐ 5-star experience'],
  },
  {
    name: 'Kunle O.',
    initial: 'K',
    role: 'Tech Consultant',
    route: 'Lagos → London',
    text: 'Moving from Lagos to London for work was hectic, but BootHop made sending personal items simple.',
    outcomes: ['✅ Items delivered safely', '🔒 Full escrow protection'],
  },
  {
    name: 'James R.',
    initial: 'J',
    role: 'Management Consultant',
    route: 'London → New York',
    text: 'Delivered a small parcel via BootHop on my London–New York trip. Straightforward and great communication.',
    outcomes: ['✅ Same-day delivery', '💬 5-star communication'],
  },
];

export default function SendPage() {
  const [lagosCount, setLagosCount] = useState<number | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('send_banner_dismissed')) {
      setBannerDismissed(true);
    }
  }, []);

  useEffect(() => {
    // Fire ViewContent on load
    track('ViewContent', { content_name: 'Send Landing Page', content_type: 'page' });

    // Fetch live London → Lagos traveller count
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    supabase
      .from('trips')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .ilike('from_city', '%london%')
      .ilike('to_city', '%lagos%')
      .gte('travel_date', today)
      .then(({ count }) => {
        if (count !== null) setLagosCount(count);
      });
  }, []);

  const dismissBanner = () => {
    setBannerDismissed(true);
    localStorage.setItem('send_banner_dismissed', '1');
  };

  const displayCount = lagosCount !== null && lagosCount > 0 ? lagosCount : 21;

  return (
    <div className="min-h-screen bg-[#07111f] text-white overflow-x-hidden">

      {/* ── BANNER ── */}
      {!bannerDismissed && (
        <div className="sticky top-0 z-50 flex items-center justify-center gap-3 bg-amber-500/15 border-b border-amber-500/25 backdrop-blur-md px-4 py-2.5">
          <span className="text-amber-300 text-xs font-semibold hidden sm:inline">
            🎁 New members get £20 delivery credit — first 500 only · No subscription
          </span>
          <span className="text-amber-300 text-xs font-semibold sm:hidden">
            🎁 Get £20 free — first 500 members
          </span>
          <Link
            href="/start?role=sender"
            onClick={() => track('InitiateCheckout', { description: 'banner_cta' })}
            className="rounded-full bg-amber-500 text-black text-xs font-bold px-3 py-1 hover:bg-amber-400 transition-colors whitespace-nowrap"
          >
            Claim yours →
          </Link>
          <button
            onClick={dismissBanner}
            className="ml-1 text-amber-400/60 hover:text-amber-300 transition-colors text-lg leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* ── NAV — minimal, no distraction ── */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <Link href="/">
          <BootHopLogo size="md" />
        </Link>
        <Link
          href="/login"
          className="text-sm text-white/55 border border-white/15 rounded-full px-5 py-2 hover:text-white hover:border-white/35 transition-all"
        >
          Log in
        </Link>
      </nav>

      {/* ── HERO ── */}
      <section className="px-6 pt-10 pb-16 max-w-3xl mx-auto text-center">

        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-300 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Live platform · Verified travellers · UK &amp; Europe
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.1] tracking-tight text-white mb-6">
          Sending home shouldn&apos;t<br />
          <span className="text-white/35">cost £300 and take a week.</span>
        </h1>

        <p className="text-white/65 text-lg leading-relaxed max-w-xl mx-auto mb-10">
          Connect with a verified traveller already flying your route.
          Same day. You set the price. Payment held in escrow until delivered.
        </p>

        <Link
          href="/start?role=sender"
          onClick={() => track('InitiateCheckout', { description: 'hero_cta' })}
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-lg px-10 py-4 rounded-full transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(245,158,11,0.45)] shadow-lg shadow-amber-500/30"
        >
          🎁 Send a Package — Claim £20 Free
          <ArrowRight className="h-5 w-5" />
        </Link>

        <p className="mt-4 text-sm text-white/40">
          Most deliveries cost <strong className="text-white/70">£30–£120</strong>. You set the price — no hidden fees.
        </p>

        {/* Live ticker */}
        <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
          <span className="text-white/75">
            <strong className="text-white">London → Lagos</strong> · {displayCount} verified travellers available right now
          </span>
          <span className="rounded-full bg-green-500/15 border border-green-500/25 text-green-400 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">
            Live
          </span>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <div className="border-y border-white/7 py-4 overflow-x-auto">
        <div className="flex items-center justify-center gap-8 px-6 min-w-max mx-auto text-sm text-white/50">
          {[
            { icon: <Shield className="h-4 w-4 text-blue-400" />, text: 'ID-Verified Travellers' },
            { icon: <CheckCircle className="h-4 w-4 text-green-400" />, text: 'Escrow Payment Protection' },
            { icon: <MapPin className="h-4 w-4 text-blue-400" />, text: 'Real-Time GPS Tracking' },
            { icon: <Star className="h-4 w-4 text-amber-400" />, text: '5-Star Rated Community' },
            { icon: <span className="text-base">🇬🇧</span>, text: 'Registered in England & Wales' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-2 shrink-0">
              {icon}
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── COMPARISON ── */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300/70 mb-3">
            Why not just use DHL?
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Same package. Very different experience.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-5 mb-10">
          <div className="rounded-3xl border border-red-500/20 bg-black/25 backdrop-blur-sm p-7">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-sm font-bold text-red-400">✕</div>
              <h3 className="text-white font-semibold text-lg">Traditional Courier</h3>
            </div>
            <ul className="space-y-3.5">
              {[
                '1–5 day delivery windows',
                'Fixed pricing with hidden fees',
                'No idea who handles your package',
                'Customs delays, lost items, no recourse',
                'Depot-to-depot — not door-to-door',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-white/50">
                  <span className="text-red-400/60 shrink-0 mt-0.5">—</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-blue-500/30 bg-blue-950/25 backdrop-blur-sm p-7 shadow-[0_0_50px_rgba(59,130,246,0.12)]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-blue-500/25 flex items-center justify-center text-sm font-bold text-blue-400">✓</div>
              <h3 className="text-white font-semibold text-lg">BootHop</h3>
            </div>
            <ul className="space-y-3.5">
              {[
                'Same-day delivery on most routes',
                'You set the price — transparent, no surprises',
                'ID-verified traveller, rated by the community',
                'Escrow protection — funds held until delivery confirmed',
                'Airport-to-door, city-to-city, wherever you need',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-white/80">
                  <CheckCircle className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/start?role=sender"
            onClick={() => track('InitiateCheckout', { description: 'comparison_cta' })}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-3.5 rounded-full text-sm transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(245,158,11,0.4)]"
          >
            🎁 Try it free — first delivery up to £20 off <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-3 text-xs text-white/30">Free to join · No subscription · Cancel anytime</p>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-white/7">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300/70 mb-3">How It Works</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            From posting to delivered — in hours.
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { num: '01', icon: '📦', title: 'Post Your Item', desc: 'Describe your package, set your price. Takes 30 seconds.' },
            { num: '02', icon: '✈️', title: 'Get Matched', desc: 'We match you with a verified traveller already heading your way.' },
            { num: '03', icon: '🤝', title: 'Secure Handoff', desc: 'Meet, verify ID, hand over. QR code confirms the exchange.' },
            { num: '04', icon: '✅', title: 'Delivered', desc: 'Track in real time. Confirm receipt. Payment released.' },
          ].map(({ num, icon, title, desc }) => (
            <div key={num} className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-3">Step {num}</p>
              <div className="text-3xl mb-3">{icon}</div>
              <p className="text-white font-semibold text-sm mb-2">{title}</p>
              <p className="text-white/45 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ACTIVE CORRIDOR ── */}
      <section className="py-12 px-6 max-w-2xl mx-auto border-t border-white/7 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300/70 mb-3">Live Right Now</p>
        <h2 className="text-xl font-bold text-white mb-6">Someone is flying this route today.</h2>

        <div className="rounded-3xl border border-white/12 bg-white/[0.04] p-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 text-xl font-extrabold tracking-tight">
            <span>🇬🇧 London</span>
            <span className="text-white/30 font-light">→</span>
            <span>🇳🇬 Lagos</span>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 border border-green-500/25 px-2.5 py-1 text-xs font-bold text-green-400 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              LIVE
            </div>
            <p className="text-sm text-white/55">
              <strong className="text-white">{displayCount} verified travellers</strong> available
            </p>
          </div>
          <Link
            href="/start?role=sender"
            onClick={() => track('InitiateCheckout', { description: 'corridor_cta' })}
            className="bg-blue-500 hover:bg-blue-400 text-white font-bold px-6 py-2.5 rounded-full text-sm transition-all whitespace-nowrap"
          >
            Book a slot →
          </Link>
        </div>

        <p className="mt-4 text-xs text-white/35">
          More routes available ·{' '}
          <Link href="/journeys" className="text-white/50 underline underline-offset-2 hover:text-white/70 transition-colors">
            View all corridors →
          </Link>
        </p>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-white/7">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300/70 mb-3">Real People. Real Deliveries.</p>
          <h2 className="text-3xl font-bold text-white">Trusted by the diaspora community.</h2>
        </div>

        {/* Featured */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 mb-5">
          <div className="flex gap-1 mb-4">
            {[...Array(5)].map((_, i) => <span key={i} className="text-amber-400 text-sm">★</span>)}
          </div>
          <p className="text-white/85 text-lg italic leading-relaxed mb-5">
            &ldquo;{TESTIMONIALS[0].text}&rdquo;
          </p>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center font-bold text-white shrink-0">
              {TESTIMONIALS[0].initial}
            </div>
            <div>
              <p className="font-semibold text-white text-sm">{TESTIMONIALS[0].name}</p>
              <p className="text-xs text-white/40">{TESTIMONIALS[0].role} · {TESTIMONIALS[0].route}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-4 border-t border-white/7">
            {TESTIMONIALS[0].outcomes.map((o) => (
              <span key={o} className="text-xs font-semibold text-white/60 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                {o}
              </span>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {TESTIMONIALS.slice(1).map((t) => (
            <div key={t.name} className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => <span key={i} className="text-amber-400 text-xs">★</span>)}
              </div>
              <p className="text-white/75 text-sm italic leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center font-bold text-white text-xs shrink-0">
                  {t.initial}
                </div>
                <div>
                  <p className="font-semibold text-white/85 text-sm">{t.name}</p>
                  <p className="text-xs text-white/35">{t.role} · {t.route}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/7">
                {t.outcomes.map((o) => (
                  <span key={o} className="text-xs font-semibold text-white/55 bg-white/5 border border-white/10 rounded-full px-2.5 py-0.5">
                    {o}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 px-6 text-center border-t border-white/7">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300/70 mb-5">
          Someone Is Flying That Route Today
        </p>
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight mb-4">
          Your package should<br />
          <span className="text-white/25">already be moving.</span>
        </h2>
        <p className="text-white/50 text-base max-w-sm mx-auto mb-10 leading-relaxed">
          Post in 30 seconds. Match with a verified traveller heading there now.
          First delivery up to £20 free.
        </p>

        <Link
          href="/start?role=sender"
          onClick={() => track('InitiateCheckout', { description: 'final_cta' })}
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-lg px-10 py-4 rounded-full transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(245,158,11,0.45)] shadow-lg shadow-amber-500/30"
        >
          🎁 Send My First Package — Claim £20 Free
          <ArrowRight className="h-5 w-5" />
        </Link>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-white/40">
          <Link href="/journeys" className="hover:text-white/65 underline underline-offset-2 transition-colors">
            Browse live routes →
          </Link>
          <span className="text-white/15">·</span>
          <Link href="/start?role=traveller" className="hover:text-white/65 underline underline-offset-2 transition-colors">
            Are you a traveller? Start earning →
          </Link>
        </div>

        <p className="mt-4 text-xs text-white/25">
          Free to join · No subscription · Cancel anytime · 🎁 First 500 members get £20 credit
        </p>
      </section>

      {/* ── FOOTER — minimal ── */}
      <footer className="border-t border-white/7 py-8 px-6 text-center">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white/45 mb-3">
          {[
            ['How It Works', '/how-it-works'],
            ['Pricing', '/pricing'],
            ['Trust & Safety', '/trust-safety'],
            ['Terms', '/terms'],
            ['Privacy', '/privacy'],
          ].map(([label, href]) => (
            <Link key={href} href={href} className="hover:text-white/75 transition-colors">{label}</Link>
          ))}
        </div>
        <p className="text-xs text-white/30">© {new Date().getFullYear()} BootHop Ltd · Registered in England &amp; Wales</p>
        <div className="mt-2 flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400/80">All systems operational</span>
        </div>
      </footer>

    </div>
  );
}
