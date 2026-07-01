import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { TikTokViewContent } from '@/components/TikTokTracker';

const CITY_PAIRS: Record<string, { from: string; to: string; time: string; price: string; region: string }> = {
  // ── UK domestic ──────────────────────────────────────────────
  'london-to-manchester':      { from: 'London',        to: 'Manchester',    time: '3–4 hours',   price: '£15',     region: 'UK' },
  'manchester-to-london':      { from: 'Manchester',    to: 'London',        time: '3–4 hours',   price: '£15',     region: 'UK' },
  'london-to-birmingham':      { from: 'London',        to: 'Birmingham',    time: '2–3 hours',   price: '£15',     region: 'UK' },
  'birmingham-to-london':      { from: 'Birmingham',    to: 'London',        time: '2–3 hours',   price: '£15',     region: 'UK' },
  'london-to-edinburgh':       { from: 'London',        to: 'Edinburgh',     time: '5–6 hours',   price: '£20',     region: 'UK' },
  'edinburgh-to-london':       { from: 'Edinburgh',     to: 'London',        time: '5–6 hours',   price: '£20',     region: 'UK' },
  'london-to-glasgow':         { from: 'London',        to: 'Glasgow',       time: '5–6 hours',   price: '£20',     region: 'UK' },
  'glasgow-to-london':         { from: 'Glasgow',       to: 'London',        time: '5–6 hours',   price: '£20',     region: 'UK' },
  'london-to-leeds':           { from: 'London',        to: 'Leeds',         time: '3–4 hours',   price: '£15',     region: 'UK' },
  'leeds-to-london':           { from: 'Leeds',         to: 'London',        time: '3–4 hours',   price: '£15',     region: 'UK' },
  'london-to-liverpool':       { from: 'London',        to: 'Liverpool',     time: '3–4 hours',   price: '£15',     region: 'UK' },
  'liverpool-to-london':       { from: 'Liverpool',     to: 'London',        time: '3–4 hours',   price: '£15',     region: 'UK' },
  'london-to-bristol':         { from: 'London',        to: 'Bristol',       time: '2–3 hours',   price: '£15',     region: 'UK' },
  'bristol-to-london':         { from: 'Bristol',       to: 'London',        time: '2–3 hours',   price: '£15',     region: 'UK' },
  'london-to-sheffield':       { from: 'London',        to: 'Sheffield',     time: '3–4 hours',   price: '£15',     region: 'UK' },
  'sheffield-to-london':       { from: 'Sheffield',     to: 'London',        time: '3–4 hours',   price: '£15',     region: 'UK' },
  'london-to-newcastle':       { from: 'London',        to: 'Newcastle',     time: '4–5 hours',   price: '£18',     region: 'UK' },
  'newcastle-to-london':       { from: 'Newcastle',     to: 'London',        time: '4–5 hours',   price: '£18',     region: 'UK' },
  'london-to-nottingham':      { from: 'London',        to: 'Nottingham',    time: '2–3 hours',   price: '£15',     region: 'UK' },
  'nottingham-to-london':      { from: 'Nottingham',    to: 'London',        time: '2–3 hours',   price: '£15',     region: 'UK' },
  'london-to-essex':           { from: 'London',        to: 'Essex',         time: '1–2 hours',   price: '£12',     region: 'UK' },
  'essex-to-london':           { from: 'Essex',         to: 'London',        time: '1–2 hours',   price: '£12',     region: 'UK' },
  'bristol-to-nottingham':     { from: 'Bristol',       to: 'Nottingham',    time: '2–3 hours',   price: '£15',     region: 'UK' },
  'nottingham-to-bristol':     { from: 'Nottingham',    to: 'Bristol',       time: '2–3 hours',   price: '£15',     region: 'UK' },
  'essex-to-loughborough':     { from: 'Essex',         to: 'Loughborough',  time: '2–3 hours',   price: '£15',     region: 'UK' },
  'loughborough-to-essex':     { from: 'Loughborough',  to: 'Essex',         time: '2–3 hours',   price: '£15',     region: 'UK' },
  'nottingham-to-glasgow':     { from: 'Nottingham',    to: 'Glasgow',       time: '4–5 hours',   price: '£18',     region: 'UK' },
  'glasgow-to-nottingham':     { from: 'Glasgow',       to: 'Nottingham',    time: '4–5 hours',   price: '£18',     region: 'UK' },
  'manchester-to-birmingham':  { from: 'Manchester',    to: 'Birmingham',    time: '1–2 hours',   price: '£12',     region: 'UK' },
  'birmingham-to-manchester':  { from: 'Birmingham',    to: 'Manchester',    time: '1–2 hours',   price: '£12',     region: 'UK' },
  'manchester-to-edinburgh':   { from: 'Manchester',    to: 'Edinburgh',     time: '3–4 hours',   price: '£15',     region: 'UK' },
  'edinburgh-to-manchester':   { from: 'Edinburgh',     to: 'Manchester',    time: '3–4 hours',   price: '£15',     region: 'UK' },

  // ── UK ↔ Europe ──────────────────────────────────────────────
  'london-to-prague':          { from: 'London',        to: 'Prague',        time: '2–3 hours',   price: '£80',     region: 'International' },
  'prague-to-london':          { from: 'Prague',        to: 'London',        time: '2–3 hours',   price: '£80',     region: 'International' },

  // ── UK ↔ Nigeria ─────────────────────────────────────────────
  'london-to-lagos':           { from: 'London',        to: 'Lagos',         time: '6–7 hours',   price: '£120',    region: 'International' },
  'lagos-to-london':           { from: 'Lagos',         to: 'London',        time: '6–7 hours',   price: '£120',    region: 'International' },
  'london-to-abuja':           { from: 'London',        to: 'Abuja',         time: '6–7 hours',   price: '£120',    region: 'International' },
  'abuja-to-london':           { from: 'Abuja',         to: 'London',        time: '6–7 hours',   price: '£120',    region: 'International' },
  'london-to-port-harcourt':   { from: 'London',        to: 'Port Harcourt', time: '7–8 hours',   price: '£120',    region: 'International' },
  'port-harcourt-to-london':   { from: 'Port Harcourt', to: 'London',        time: '7–8 hours',   price: '£120',    region: 'International' },
  'manchester-to-lagos':       { from: 'Manchester',    to: 'Lagos',         time: '7–8 hours',   price: '£100',    region: 'International' },
  'lagos-to-manchester':       { from: 'Lagos',         to: 'Manchester',    time: '7–8 hours',   price: '£100',    region: 'International' },
  'manchester-to-abuja':       { from: 'Manchester',    to: 'Abuja',         time: '7–8 hours',   price: '£100',    region: 'International' },
  'abuja-to-manchester':       { from: 'Abuja',         to: 'Manchester',    time: '7–8 hours',   price: '£100',    region: 'International' },
  'birmingham-to-lagos':       { from: 'Birmingham',    to: 'Lagos',         time: '7–8 hours',   price: '£100',    region: 'International' },
  'lagos-to-birmingham':       { from: 'Lagos',         to: 'Birmingham',    time: '7–8 hours',   price: '£100',    region: 'International' },
  'birmingham-to-abuja':       { from: 'Birmingham',    to: 'Abuja',         time: '7–8 hours',   price: '£100',    region: 'International' },
  'abuja-to-birmingham':       { from: 'Abuja',         to: 'Birmingham',    time: '7–8 hours',   price: '£100',    region: 'International' },

  // ── Nigeria ↔ USA ────────────────────────────────────────────
  'lagos-to-chicago':          { from: 'Lagos',         to: 'Chicago',       time: '12–14 hours', price: '$160',    region: 'International' },
  'chicago-to-lagos':          { from: 'Chicago',       to: 'Lagos',         time: '12–14 hours', price: '$160',    region: 'International' },
  'abuja-to-chicago':          { from: 'Abuja',         to: 'Chicago',       time: '12–14 hours', price: '$160',    region: 'International' },
  'chicago-to-abuja':          { from: 'Chicago',       to: 'Abuja',         time: '12–14 hours', price: '$160',    region: 'International' },
  'lagos-to-houston':          { from: 'Lagos',         to: 'Houston',       time: '13–15 hours', price: '$150',    region: 'International' },
  'houston-to-lagos':          { from: 'Houston',       to: 'Lagos',         time: '13–15 hours', price: '$150',    region: 'International' },
  'lagos-to-new-york':         { from: 'Lagos',         to: 'New York',      time: '11–13 hours', price: '$150',    region: 'International' },
  'new-york-to-lagos':         { from: 'New York',      to: 'Lagos',         time: '11–13 hours', price: '$150',    region: 'International' },
  'abuja-to-new-york':         { from: 'Abuja',         to: 'New York',      time: '11–13 hours', price: '$150',    region: 'International' },
  'new-york-to-abuja':         { from: 'New York',      to: 'Abuja',         time: '11–13 hours', price: '$150',    region: 'International' },
  'lagos-to-atlanta':          { from: 'Lagos',         to: 'Atlanta',       time: '11–13 hours', price: '$150',    region: 'International' },
  'atlanta-to-lagos':          { from: 'Atlanta',       to: 'Lagos',         time: '11–13 hours', price: '$150',    region: 'International' },
  'lagos-to-washington-dc':    { from: 'Lagos',         to: 'Washington DC', time: '11–13 hours', price: '$150',    region: 'International' },
  'washington-dc-to-lagos':    { from: 'Washington DC', to: 'Lagos',         time: '11–13 hours', price: '$150',    region: 'International' },

  // ── Nigeria ↔ Canada ─────────────────────────────────────────
  'lagos-to-toronto':          { from: 'Lagos',         to: 'Toronto',       time: '11–13 hours', price: 'CA$190',  region: 'International' },
  'toronto-to-lagos':          { from: 'Toronto',       to: 'Lagos',         time: '11–13 hours', price: 'CA$190',  region: 'International' },
  'abuja-to-toronto':          { from: 'Abuja',         to: 'Toronto',       time: '11–13 hours', price: 'CA$190',  region: 'International' },
  'toronto-to-abuja':          { from: 'Toronto',       to: 'Abuja',         time: '11–13 hours', price: 'CA$190',  region: 'International' },
  'lagos-to-calgary':          { from: 'Lagos',         to: 'Calgary',       time: '14–16 hours', price: 'CA$200',  region: 'International' },
  'calgary-to-lagos':          { from: 'Calgary',       to: 'Lagos',         time: '14–16 hours', price: 'CA$200',  region: 'International' },
  'lagos-to-vancouver':        { from: 'Lagos',         to: 'Vancouver',     time: '16–18 hours', price: 'CA$210',  region: 'International' },
  'vancouver-to-lagos':        { from: 'Vancouver',     to: 'Lagos',         time: '16–18 hours', price: 'CA$210',  region: 'International' },
  'lagos-to-ottawa':           { from: 'Lagos',         to: 'Ottawa',        time: '11–13 hours', price: 'CA$190',  region: 'International' },
  'ottawa-to-lagos':           { from: 'Ottawa',        to: 'Lagos',         time: '11–13 hours', price: 'CA$190',  region: 'International' },

  // ── Nigeria ↔ Ghana ──────────────────────────────────────────
  'london-to-accra':           { from: 'London',        to: 'Accra',         time: '6–7 hours',   price: '£110',    region: 'International' },
  'accra-to-london':           { from: 'Accra',         to: 'London',        time: '6–7 hours',   price: '£110',    region: 'International' },
};

export async function generateStaticParams() {
  return Object.keys(CITY_PAIRS).map((cityroute) => ({ cityroute }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ cityroute: string }> }
): Promise<Metadata> {
  const { cityroute } = await params;
  const pair = CITY_PAIRS[cityroute];
  if (!pair) return {};

  const isInternational = pair.region === 'International';
  const title = isInternational
    ? `Send Packages ${pair.from} to ${pair.to} | BootHop Peer-to-Peer Delivery`
    : `Same-Day Delivery ${pair.from} to ${pair.to} | BootHop`;

  const description = isInternational
    ? `Send packages from ${pair.from} to ${pair.to} with a verified traveller already flying the route. No courier markup. From ${pair.price}. Secure escrow, live tracking, ID-verified carriers.`
    : `Need same-day delivery from ${pair.from} to ${pair.to}? BootHop connects you with verified travellers already making the journey — door-to-door in ${pair.time}. From ${pair.price}. No depot queues.`;

  const diasporaKeywords = isInternational ? [
    `send parcel ${pair.from.toLowerCase()} to ${pair.to.toLowerCase()}`,
    `package delivery ${pair.from.toLowerCase()} to ${pair.to.toLowerCase()}`,
    `courier ${pair.from.toLowerCase()} to ${pair.to.toLowerCase()}`,
    `send clothes ${pair.from.toLowerCase()} to ${pair.to.toLowerCase()}`,
    `send food items ${pair.from.toLowerCase()} ${pair.to.toLowerCase()}`,
    `peer to peer delivery ${pair.from.toLowerCase()} ${pair.to.toLowerCase()}`,
    `traveller delivery ${pair.from.toLowerCase()} ${pair.to.toLowerCase()}`,
    `diaspora delivery ${pair.to.toLowerCase()}`,
    `verified traveller cargo ${pair.from.toLowerCase()}`,
    'BootHop international delivery',
    'peer to peer international shipping',
    'send package with traveller',
  ] : [
    `${pair.from.toLowerCase()} to ${pair.to.toLowerCase()} delivery`,
    `same day delivery ${pair.from.toLowerCase()} to ${pair.to.toLowerCase()}`,
    `courier ${pair.from.toLowerCase()} ${pair.to.toLowerCase()}`,
    `send parcel ${pair.from.toLowerCase()} to ${pair.to.toLowerCase()}`,
    'peer to peer delivery UK',
    'same day delivery UK',
    'verified traveller delivery',
    'BootHop delivery',
  ];

  return {
    title,
    description,
    keywords: diasporaKeywords,
    openGraph: {
      title,
      description,
      url: `https://www.boothop.com/send/${cityroute}`,
      type: 'website',
    },
    alternates: { canonical: `https://www.boothop.com/send/${cityroute}` },
  };
}

export default async function CityRoutePage(
  { params }: { params: Promise<{ cityroute: string }> }
) {
  const { cityroute } = await params;
  const pair = CITY_PAIRS[cityroute];
  if (!pair) notFound();

  const isInternational = pair.region === 'International';

  const related = Object.entries(CITY_PAIRS)
    .filter(([slug]) => slug !== cityroute && (
      slug.startsWith(pair.from.toLowerCase().replace(' ', '-')) ||
      slug.endsWith(pair.to.toLowerCase().replace(' ', '-')) ||
      slug.includes(pair.from.toLowerCase().split(' ')[0]) ||
      slug.includes(pair.to.toLowerCase().split(' ')[0])
    ))
    .slice(0, 4);

  return (
    <main className="min-h-screen bg-[#0a0f1e] text-white">
      <TikTokViewContent contentName={`Send ${pair.from} to ${pair.to}`} contentType="delivery_route" />

      {/* Hero */}
      <section className="px-6 py-20 text-center max-w-3xl mx-auto">
        <span className={`inline-block text-xs font-bold uppercase tracking-widest mb-4 px-4 py-1.5 rounded-full ${
          isInternational
            ? 'text-amber-400 bg-amber-500/10'
            : 'text-blue-400 bg-blue-500/10'
        }`}>
          {isInternational ? '✈️ Peer-to-Peer International Delivery' : 'Same-Day UK Delivery'}
        </span>
        <h1 className="text-4xl sm:text-5xl font-black mb-4">
          {pair.from} to {pair.to}
          <span className={isInternational ? ' text-amber-400' : ' text-blue-400'}> Delivery</span>
        </h1>
        <p className="text-gray-400 text-lg mb-6">
          {isInternational
            ? `Send your package from ${pair.from} to ${pair.to} with a verified traveller already flying the route. No courier markup, no depot queues — door-to-door via someone you can track and message. From ${pair.price}.`
            : `Get your package from ${pair.from} to ${pair.to} same-day via a verified BootHop traveller already making the journey — door-to-door in ${pair.time}. From ${pair.price}.`
          }
        </p>
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {[
            `✈️ ${pair.time} flight`,
            `💰 From ${pair.price}`,
            '🛡️ Insured',
            '✅ ID-verified carriers',
          ].map(tag => (
            <span key={tag} className="text-sm bg-white/5 border border-white/10 px-4 py-2 rounded-full text-gray-300">{tag}</span>
          ))}
        </div>
        <Link
          href={`/start?role=sender`}
          className={`inline-flex items-center gap-2 font-bold px-8 py-4 rounded-xl text-lg transition-colors ${
            isInternational
              ? 'bg-amber-500 hover:bg-amber-400 text-black'
              : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          Send from {pair.from} <ArrowRight className="h-5 w-5" />
        </Link>
      </section>

      {/* How it works */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-10">How it works</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              step: '1',
              title: 'Post your request',
              desc: `Tell us you need delivery from ${pair.from} to ${pair.to} — package size, pickup address, drop-off.`,
            },
            {
              step: '2',
              title: isInternational ? 'Matched with a traveller' : 'Get matched',
              desc: isInternational
                ? `We connect you with a verified traveller flying from ${pair.from} to ${pair.to} who has luggage space.`
                : `We connect you with a verified traveller already heading from ${pair.from} to ${pair.to}.`,
            },
            {
              step: '3',
              title: isInternational ? 'Delivered at destination' : 'Delivered same-day',
              desc: isInternational
                ? `Your package is collected before departure and delivered on arrival. Payment released on delivery.`
                : `Your package is collected and delivered door-to-door in ${pair.time}. Payment released on delivery.`,
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mb-4 ${isInternational ? 'bg-amber-500' : 'bg-blue-600'}`}>{step}</div>
              <h3 className="font-bold text-lg mb-2">{title}</h3>
              <p className="text-gray-400 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why BootHop */}
      <section className="px-6 py-16 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">Why use BootHop for {pair.from} to {pair.to}?</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {(isInternational ? [
              `No courier company markup — pay the traveller directly`,
              `Verified, ID-checked carriers on every ${pair.from}–${pair.to} flight`,
              'Fully insured as standard — every delivery protected',
              'Secure escrow payments — funds released only on delivery',
              `Live tracking from ${pair.from} to ${pair.to}`,
              'Real-time messaging with your carrier before, during and after the flight',
            ] : [
              'Faster than traditional couriers — no depot, no sorting hub',
              `Verified, ID-checked carriers on every ${pair.from}–${pair.to} route`,
              'Fully insured as standard — every delivery protected',
              'Secure escrow payments — funds released only on delivery',
              `Live tracking from ${pair.from} to ${pair.to}`,
              'Real-time messaging with your carrier',
            ]).map(point => (
              <div key={point} className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                <span className="text-gray-300 text-sm">{point}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What can I send? — international only */}
      {isInternational && (
        <section className="px-6 py-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">What can I send from {pair.from} to {pair.to}?</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { emoji: '👗', label: 'Clothes & fashion', desc: 'Send outfits, shoes, bags — anything wearable' },
              { emoji: '💊', label: 'Medicine & health', desc: 'Prescription items, supplements, creams' },
              { emoji: '📦', label: 'Gifts & parcels', desc: 'Birthday gifts, care packages, personal items' },
              { emoji: '📱', label: 'Electronics', desc: 'Phones, tablets, accessories, chargers' },
              { emoji: '🍲', label: 'Food items', desc: 'Dry goods, spices, snacks (non-perishable)' },
              { emoji: '📄', label: 'Documents', desc: 'Passports, certificates, legal papers' },
            ].map(({ emoji, label, desc }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="text-2xl mb-2">{emoji}</div>
                <h3 className="font-semibold text-sm mb-1">{label}</h3>
                <p className="text-gray-400 text-xs">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Related routes */}
      {related.length > 0 && (
        <section className="px-6 py-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Related delivery routes</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {related.map(([slug, p]) => (
              <Link key={slug} href={`/send/${slug}`}
                className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4 hover:border-amber-500/50 transition-colors">
                <span className="font-medium">{p.from} → {p.to}</span>
                <span className="text-sm text-amber-400">From {p.price} <ArrowRight className="inline h-3 w-3" /></span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="px-6 py-20 text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-black mb-4">Ready to send from {pair.from} to {pair.to}?</h2>
        <p className="text-gray-400 mb-8">
          {isInternational
            ? 'Find a verified traveller flying this route and send your package today.'
            : 'Browse live carriers already making the journey today.'}
        </p>
        <Link
          href="/start?role=sender"
          className={`inline-flex items-center gap-2 font-bold px-8 py-4 rounded-xl text-lg transition-colors ${
            isInternational
              ? 'bg-amber-500 hover:bg-amber-400 text-black'
              : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          {isInternational ? 'Send Your Package →' : 'Browse Live Routes'} <ArrowRight className="h-5 w-5" />
        </Link>
      </section>

    </main>
  );
}
