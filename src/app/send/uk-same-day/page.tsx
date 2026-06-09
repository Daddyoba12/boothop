import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clock, MapPin, Shield, Zap, CheckCircle, Package } from 'lucide-react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Same-Day Delivery Anywhere in the UK | BootHop',
  description: 'Need something delivered today within the UK? BootHop connects you with verified travellers already making the journey — same-day, door-to-door, no depot queues. From £15.',
  keywords: [
    'same day delivery UK', 'same day courier UK', 'urgent delivery UK today',
    'UK domestic same day delivery', 'send parcel same day UK', 'urgent parcel delivery UK',
    'same day delivery London', 'same day delivery Manchester', 'same day delivery Birmingham',
    'same day courier service UK', 'urgent courier UK', 'next day not fast enough UK',
    'express delivery UK domestic', 'same day package delivery UK', 'UK courier same day',
  ],
  openGraph: {
    title: 'Same-Day Delivery Anywhere in the UK | BootHop',
    description: 'Verified travellers. Real routes. Packages moved today — not tomorrow.',
    type: 'website',
    url: 'https://www.boothop.com/send/uk-same-day',
  },
  alternates: { canonical: 'https://www.boothop.com/send/uk-same-day' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Same-Day UK Domestic Delivery',
  provider: { '@type': 'Organization', name: 'BootHop', url: 'https://www.boothop.com' },
  serviceType: 'Same-Day Courier Service',
  areaServed: { '@type': 'Country', name: 'United Kingdom' },
  description: 'BootHop connects senders with verified travellers already making UK journeys — delivering parcels same-day across Britain without depot queues or handoffs.',
  url: 'https://www.boothop.com/send/uk-same-day',
};

const routes = [
  { from: 'London', to: 'Manchester', time: '~3 hrs' },
  { from: 'London', to: 'Birmingham', time: '~1.5 hrs' },
  { from: 'Manchester', to: 'Leeds', time: '~45 min' },
  { from: 'London', to: 'Bristol', time: '~2 hrs' },
  { from: 'Edinburgh', to: 'Glasgow', time: '~1 hr' },
  { from: 'London', to: 'Liverpool', time: '~3 hrs' },
  { from: 'Birmingham', to: 'Sheffield', time: '~1.5 hrs' },
  { from: 'London', to: 'Leeds', time: '~3 hrs' },
];

const useCases = [
  { icon: Package, title: 'Forgotten Items', desc: 'Left your laptop charger, medication, or passport at home? We get it to you today.' },
  { icon: Zap, title: 'Urgent Business Docs', desc: 'Signed contracts, sample products, prototypes — in the right hands by close of business.' },
  { icon: Clock, title: 'Last-Minute Gifts', desc: "Birthday tomorrow? Anniversary you nearly forgot? It'll be there." },
  { icon: MapPin, title: 'Event Essentials', desc: 'Props, outfits, equipment for events — no van hire, no stress.' },
  { icon: Shield, title: 'Sensitive Items', desc: 'Valuables that need personal handling, not a depot queue.' },
  { icon: CheckCircle, title: 'E-commerce Returns', desc: 'Faster return route than posting — same day collection to seller.' },
];

export default function UKSameDayPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <NavBar />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold px-4 py-2 rounded-full mb-6">
          <Clock className="h-3.5 w-3.5" /> UK SAME-DAY DELIVERY
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          Same-Day Delivery<br />
          <span className="text-blue-400">Anywhere in the UK</span>
        </h1>
        <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          Someone is already travelling your route today. BootHop connects your package with a verified traveller heading in the same direction — door-to-door, today, no depot queues.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-bold px-8 py-4 rounded-full text-base transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(59,130,246,0.4)]"
          >
            Send Something Today <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/journeys" className="text-slate-400 hover:text-white text-sm underline underline-offset-4">
            Browse live UK journeys →
          </Link>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-white/8 py-8">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 px-6 text-center">
          {[
            { stat: 'Same Day', label: 'UK delivery' },
            { stat: 'KYC Verified', label: 'Every carrier' },
            { stat: 'Stripe Escrow', label: 'Secure payment' },
            { stat: 'From £15', label: 'UK routes' },
          ].map(({ stat, label }) => (
            <div key={label}>
              <div className="text-2xl font-black text-blue-400">{stat}</div>
              <div className="text-sm text-slate-400 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-4">How Same-Day UK Delivery Works</h2>
        <p className="text-slate-400 text-center mb-14 max-w-xl mx-auto">No depots. No sorting centres. Your package travels with a person who is already going there.</p>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: '01', title: 'Post your delivery', desc: 'Enter pickup and drop-off, package details, and when you need it there.' },
            { step: '02', title: 'Get matched', desc: 'Our engine finds verified travellers already on your route today.' },
            { step: '03', title: 'Handoff & go', desc: 'Meet the carrier, hand over your item. Payment held securely in escrow.' },
            { step: '04', title: 'Delivered', desc: 'Carrier delivers to your recipient. Payment releases on confirmation.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="bg-white/4 border border-white/8 rounded-2xl p-6">
              <div className="text-blue-400 font-black text-sm mb-3">{step}</div>
              <h3 className="font-bold text-white mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Active UK routes */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl font-black text-center mb-4">Popular UK Same-Day Routes</h2>
        <p className="text-slate-400 text-center mb-10">Travellers post their routes daily — these corridors are covered most frequently.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {routes.map(({ from, to, time }) => (
            <div key={`${from}-${to}`} className="bg-white/4 border border-white/8 rounded-xl p-4 text-center hover:border-blue-500/40 transition-colors">
              <div className="font-bold text-white text-sm">{from} → {to}</div>
              <div className="text-blue-400 text-xs mt-1">{time}</div>
            </div>
          ))}
        </div>
        <p className="text-center text-slate-500 text-sm mt-6">
          Don't see your route?{' '}
          <Link href="/journeys" className="text-blue-400 hover:underline">Check live journeys</Link>
          {' '}— new routes are added every hour.
        </p>
      </section>

      {/* Use cases */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl font-black text-center mb-12">What People Send Same-Day</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {useCases.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/4 border border-white/8 rounded-2xl p-6 hover:border-blue-500/30 transition-colors">
              <Icon className="h-6 w-6 text-blue-400 mb-4" />
              <h3 className="font-bold text-white mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* vs traditional couriers */}
      <section className="py-16 px-6 max-w-3xl mx-auto">
        <h2 className="text-3xl font-black text-center mb-10">BootHop vs Traditional Same-Day Courier</h2>
        <div className="bg-white/4 border border-white/8 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-3 gap-0 text-sm">
            <div className="p-4 font-bold text-slate-400 border-b border-white/8">Feature</div>
            <div className="p-4 font-bold text-blue-400 border-b border-white/8 text-center">BootHop</div>
            <div className="p-4 font-bold text-slate-400 border-b border-white/8 text-center">Traditional Courier</div>
            {[
              ['Depot handoffs', '0 — direct delivery', '3–5 sorting stages'],
              ['Verified carrier', 'KYC on every traveller', 'Driver check varies'],
              ['Payment protection', 'Stripe escrow', 'Pay upfront, hope for best'],
              ['Tracking', 'Real-time via app', 'Scan-point updates'],
              ['UK cost', 'From £15', 'From £30–£80+'],
              ['Availability', 'If a traveller is going', 'Service area dependent'],
            ].map(([feature, boothop, courier]) => (
              <>
                <div key={`${feature}-f`} className="p-4 text-slate-300 border-b border-white/6">{feature}</div>
                <div key={`${feature}-b`} className="p-4 text-slate-200 border-b border-white/6 text-center">{boothop}</div>
                <div key={`${feature}-c`} className="p-4 text-slate-400 border-b border-white/6 text-center">{courier}</div>
              </>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto bg-blue-500/10 border border-blue-500/20 rounded-3xl p-10 text-center">
          <h2 className="text-3xl font-black mb-4">Your package should already be moving.</h2>
          <p className="text-slate-400 mb-8">Post your delivery in under 2 minutes. Matched with a verified traveller heading your way today.</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-bold px-8 py-4 rounded-full text-base transition-all hover:-translate-y-0.5"
          >
            Post Your Delivery <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-slate-500 text-xs mt-6">Free to post · No commitment until matched · Stripe-secured payment</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
