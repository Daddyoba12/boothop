import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Globe, Clock, Shield, FileCheck, Plane, Package } from 'lucide-react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'UK to Europe Same-Day Delivery | Post-Brexit Parcel Shipping | BootHop',
  description: 'Send parcels from the UK to Europe same-day. BootHop uses verified travellers on existing flights — beating couriers on speed, cost, and customs clarity. France, Germany, Spain, Netherlands and more.',
  keywords: [
    'UK to Europe delivery', 'send parcel to Europe from UK', 'UK Europe same day courier',
    'post-Brexit UK delivery Europe', 'UK to France delivery', 'UK to Germany parcel',
    'UK to Spain delivery', 'UK to Netherlands parcel', 'UK to Italy delivery',
    'send package UK to Europe', 'cheap UK to Europe parcel', 'UK Europe courier service',
    'same day UK to Europe', 'London to Paris delivery', 'London to Amsterdam parcel',
    'UK to Europe customs clearance', 'post-Brexit parcel service',
  ],
  openGraph: {
    title: 'UK to Europe Same-Day Delivery | BootHop',
    description: 'Verified travellers on existing flights. UK to Europe, same day. Post-Brexit customs handled.',
    type: 'website',
    url: 'https://www.boothop.com/send/uk-to-europe',
  },
  alternates: { canonical: 'https://www.boothop.com/send/uk-to-europe' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'UK to Europe Delivery Service',
  provider: { '@type': 'Organization', name: 'BootHop', url: 'https://www.boothop.com' },
  serviceType: 'International Same-Day Delivery',
  areaServed: [
    { '@type': 'Country', name: 'United Kingdom' },
    { '@type': 'Country', name: 'France' },
    { '@type': 'Country', name: 'Germany' },
    { '@type': 'Country', name: 'Spain' },
    { '@type': 'Country', name: 'Netherlands' },
    { '@type': 'Country', name: 'Italy' },
    { '@type': 'Country', name: 'Belgium' },
    { '@type': 'Country', name: 'Ireland' },
  ],
  description: 'BootHop connects UK senders with verified travellers already flying to European cities — delivering parcels same-day with pre-departure customs compliance.',
  url: 'https://www.boothop.com/send/uk-to-europe',
};

const routes = [
  { from: 'London', to: 'Paris', via: 'CDG/Eurostar' },
  { from: 'London', to: 'Amsterdam', via: 'AMS' },
  { from: 'London', to: 'Frankfurt', via: 'FRA' },
  { from: 'London', to: 'Madrid', via: 'MAD' },
  { from: 'London', to: 'Milan', via: 'MXP/LIN' },
  { from: 'London', to: 'Dublin', via: 'DUB' },
  { from: 'Manchester', to: 'Paris', via: 'CDG' },
  { from: 'Edinburgh', to: 'Amsterdam', via: 'AMS' },
];

const postBrexitPoints = [
  { title: 'Pre-departure customs screening', desc: 'BootHop\'s compliance engine prepares customs documentation before the traveller departs — not at the border.' },
  { title: 'No surprise charges', desc: 'We calculate UK export and EU import requirements before dispatch so there are no unexpected duty holds.' },
  { title: 'Prohibited items check', desc: 'Each delivery goes through BootHop\'s item screening before a carrier is matched.' },
  { title: 'Carrier-accompanied in cabin', desc: 'Your item travels in the cabin, not cargo — faster customs clearance, no cargo hold delays.' },
];

export default function UKToEuropePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <NavBar />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold px-4 py-2 rounded-full mb-6">
          <Globe className="h-3.5 w-3.5" /> UK → EUROPE DELIVERY
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          UK to Europe.<br />
          <span className="text-blue-400">Same Day. Post-Brexit Ready.</span>
        </h1>
        <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-4 leading-relaxed">
          Hundreds of flights leave the UK for Europe every day. BootHop connects your parcel with a verified traveller already on one of them — delivering to Paris, Amsterdam, Frankfurt, Madrid, and beyond, same-day, with customs compliance built in.
        </p>
        <p className="text-slate-400 mb-10 text-sm">
          Post-Brexit customs handled. No surprise border charges. No depot queues.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-bold px-8 py-4 rounded-full text-base transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(59,130,246,0.4)]"
          >
            Send to Europe Today <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/journeys" className="text-slate-400 hover:text-white text-sm underline underline-offset-4">
            Browse live European routes →
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/8 py-8">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 px-6 text-center">
          {[
            { stat: 'Same Day', label: 'UK to Europe' },
            { stat: 'Customs', label: 'Compliance included' },
            { stat: 'KYC Verified', label: 'Every carrier' },
            { stat: '0', label: 'Depot handoffs' },
          ].map(({ stat, label }) => (
            <div key={label}>
              <div className="text-2xl font-black text-blue-400">{stat}</div>
              <div className="text-sm text-slate-400 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Routes */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl font-black text-center mb-4">Active UK–Europe Routes</h2>
        <p className="text-slate-400 text-center mb-12 max-w-xl mx-auto">
          Travellers post these routes daily. New routes are matched as travellers book flights.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {routes.map(({ from, to, via }) => (
            <div key={`${from}-${to}`} className="bg-white/4 border border-white/8 rounded-xl p-4 text-center hover:border-blue-500/40 transition-colors">
              <div className="font-bold text-white text-sm">{from} → {to}</div>
              <div className="text-blue-400 text-xs mt-1">via {via}</div>
            </div>
          ))}
        </div>
        <p className="text-center text-slate-500 text-sm mt-6">
          Other European city?{' '}
          <Link href="/journeys" className="text-blue-400 hover:underline">Search all live journeys</Link>
        </p>
      </section>

      {/* Post-Brexit section */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl font-black text-center mb-4">Post-Brexit Shipping — Without the Headaches</h2>
        <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
          Since Brexit, sending parcels from the UK to the EU has become significantly more complex. BootHop builds compliance into every delivery before it crosses the border.
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          {postBrexitPoints.map(({ title, desc }) => (
            <div key={title} className="bg-white/4 border border-white/8 rounded-2xl p-6 flex gap-4">
              <FileCheck className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Who sends UK to Europe */}
      <section className="py-16 px-6 max-w-4xl mx-auto">
        <h2 className="text-3xl font-black text-center mb-10">Who Sends UK to Europe via BootHop</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { who: 'UK businesses with EU clients', what: 'Samples, documents, and physical products to European contacts.' },
            { who: 'Expats and EU workers in the UK', what: 'Personal items, food, and gifts sent to family back home.' },
            { who: 'Fashion & retail', what: 'Samples and returns needing to reach European buyers fast.' },
            { who: 'Legal and professional services', what: 'Cross-border documentation requiring personal chain of custody.' },
            { who: 'Property and finance', what: 'Signed originals for European transactions and closings.' },
            { who: 'Event organisers', what: 'Props, materials, and equipment to European venues.' },
          ].map(({ who, what }) => (
            <div key={who} className="bg-white/4 border border-white/8 rounded-xl p-5 flex gap-4">
              <Package className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
              <div>
                <div className="font-bold text-white text-sm">{who}</div>
                <div className="text-slate-400 text-sm mt-1">{what}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl font-black text-center mb-12">How UK to Europe Delivery Works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: '01', title: 'Post your delivery', desc: 'UK pickup address, European destination, item description, deadline.' },
            { step: '02', title: 'Customs screening', desc: 'BootHop\'s compliance engine checks your item, prepares documentation.' },
            { step: '03', title: 'Carrier matched', desc: 'Verified traveller on the right flight collects your item.' },
            { step: '04', title: 'Delivered in Europe', desc: 'Door-to-door delivery at the destination. Escrow payment releases on confirmation.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="bg-white/4 border border-white/8 rounded-2xl p-6">
              <div className="text-blue-400 font-black text-sm mb-3">{step}</div>
              <h3 className="font-bold text-white mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto bg-blue-500/10 border border-blue-500/20 rounded-3xl p-10 text-center">
          <h2 className="text-3xl font-black mb-4">Europe is closer than you think.</h2>
          <p className="text-slate-400 mb-8">
            Post your UK to Europe delivery in under 2 minutes. Matched with a verified traveller on today's flights.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-bold px-8 py-4 rounded-full text-base transition-all hover:-translate-y-0.5"
          >
            Send to Europe Today <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-slate-500 text-xs mt-6">Customs included · Stripe escrow · KYC-verified carriers</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
