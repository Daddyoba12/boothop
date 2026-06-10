import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle, ArrowRight } from 'lucide-react';

const CITY_PAIRS: Record<string, { from: string; to: string; time: string; price: string; region: string }> = {
  'london-to-manchester':   { from: 'London',     to: 'Manchester',  time: '3–4 hours',  price: '£15', region: 'UK' },
  'london-to-birmingham':   { from: 'London',     to: 'Birmingham',  time: '2–3 hours',  price: '£15', region: 'UK' },
  'london-to-edinburgh':    { from: 'London',     to: 'Edinburgh',   time: '5–6 hours',  price: '£20', region: 'UK' },
  'london-to-glasgow':      { from: 'London',     to: 'Glasgow',     time: '5–6 hours',  price: '£20', region: 'UK' },
  'london-to-leeds':        { from: 'London',     to: 'Leeds',       time: '3–4 hours',  price: '£15', region: 'UK' },
  'london-to-liverpool':    { from: 'London',     to: 'Liverpool',   time: '3–4 hours',  price: '£15', region: 'UK' },
  'london-to-bristol':      { from: 'London',     to: 'Bristol',     time: '2–3 hours',  price: '£15', region: 'UK' },
  'london-to-sheffield':    { from: 'London',     to: 'Sheffield',   time: '3–4 hours',  price: '£15', region: 'UK' },
  'london-to-newcastle':    { from: 'London',     to: 'Newcastle',   time: '4–5 hours',  price: '£18', region: 'UK' },
  'london-to-nottingham':   { from: 'London',     to: 'Nottingham',  time: '2–3 hours',  price: '£15', region: 'UK' },
  'manchester-to-london':   { from: 'Manchester', to: 'London',      time: '3–4 hours',  price: '£15', region: 'UK' },
  'manchester-to-birmingham': { from: 'Manchester', to: 'Birmingham', time: '1–2 hours', price: '£12', region: 'UK' },
  'manchester-to-edinburgh': { from: 'Manchester', to: 'Edinburgh',  time: '3–4 hours',  price: '£15', region: 'UK' },
  'birmingham-to-london':   { from: 'Birmingham', to: 'London',      time: '2–3 hours',  price: '£15', region: 'UK' },
  'birmingham-to-manchester': { from: 'Birmingham', to: 'Manchester', time: '1–2 hours', price: '£12', region: 'UK' },
  'edinburgh-to-london':    { from: 'Edinburgh',  to: 'London',      time: '5–6 hours',  price: '£20', region: 'UK' },
  'glasgow-to-london':      { from: 'Glasgow',    to: 'London',      time: '5–6 hours',  price: '£20', region: 'UK' },
  'bristol-to-london':      { from: 'Bristol',    to: 'London',      time: '2–3 hours',  price: '£15', region: 'UK' },
  'leeds-to-london':        { from: 'Leeds',      to: 'London',      time: '3–4 hours',  price: '£15', region: 'UK' },
  'liverpool-to-london':    { from: 'Liverpool',  to: 'London',      time: '3–4 hours',  price: '£15', region: 'UK' },
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

  const title = `Same-Day Delivery ${pair.from} to ${pair.to} | BootHop`;
  const description = `Need same-day delivery from ${pair.from} to ${pair.to}? BootHop connects you with verified travellers already making the journey — door-to-door in ${pair.time}. From ${pair.price}. No depot queues.`;

  return {
    title,
    description,
    keywords: [
      `${pair.from.toLowerCase()} to ${pair.to.toLowerCase()} delivery`,
      `same day delivery ${pair.from.toLowerCase()} to ${pair.to.toLowerCase()}`,
      `courier ${pair.from.toLowerCase()} ${pair.to.toLowerCase()}`,
      `send parcel ${pair.from.toLowerCase()} to ${pair.to.toLowerCase()}`,
      `same day courier ${pair.from.toLowerCase()}`,
      `${pair.to.toLowerCase()} delivery service`,
      'peer to peer delivery UK',
      'same day delivery UK',
      'verified traveller delivery',
      'BootHop delivery',
    ],
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

  const related = Object.entries(CITY_PAIRS)
    .filter(([slug]) => slug !== cityroute && (slug.startsWith(pair.from.toLowerCase()) || slug.endsWith(pair.to.toLowerCase())))
    .slice(0, 4);

  return (
    <main className="min-h-screen bg-[#0a0f1e] text-white">

      {/* Hero */}
      <section className="px-6 py-20 text-center max-w-3xl mx-auto">
        <span className="inline-block text-xs font-bold text-blue-400 uppercase tracking-widest mb-4 bg-blue-500/10 px-4 py-1.5 rounded-full">
          Same-Day UK Delivery
        </span>
        <h1 className="text-4xl sm:text-5xl font-black mb-4">
          {pair.from} to {pair.to}
          <span className="text-blue-400"> Delivery</span>
        </h1>
        <p className="text-gray-400 text-lg mb-6">
          Get your package from {pair.from} to {pair.to} same-day via a verified BootHop traveller already making the journey — door-to-door in {pair.time}. From {pair.price}.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {[`⚡ ${pair.time}`, `💷 From ${pair.price}`, '🛡️ Insured', '✅ Verified carriers'].map(tag => (
            <span key={tag} className="text-sm bg-white/5 border border-white/10 px-4 py-2 rounded-full text-gray-300">{tag}</span>
          ))}
        </div>
        <Link href="/journeys" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors">
          Find a Carrier Now <ArrowRight className="h-5 w-5" />
        </Link>
      </section>

      {/* How it works */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-10">How it works</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { step: '1', title: 'Post your request', desc: `Tell us you need delivery from ${pair.from} to ${pair.to} — package size, pickup address, drop-off.` },
            { step: '2', title: 'Get matched', desc: `We connect you with a verified traveller already heading from ${pair.from} to ${pair.to}.` },
            { step: '3', title: 'Delivered same-day', desc: `Your package is collected and delivered door-to-door in ${pair.time}. Payment released on delivery.` },
          ].map(({ step, title, desc }) => (
            <div key={step} className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-lg mb-4">{step}</div>
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
            {[
              'Faster than traditional couriers — no depot, no sorting hub',
              `Verified, ID-checked carriers on every ${pair.from}–${pair.to} route`,
              'Fully insured as standard — every delivery protected',
              'Secure escrow payments — funds released only on delivery',
              `Live tracking from ${pair.from} to ${pair.to}`,
              'Real-time messaging with your carrier',
            ].map(point => (
              <div key={point} className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                <span className="text-gray-300 text-sm">{point}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related routes */}
      {related.length > 0 && (
        <section className="px-6 py-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Related delivery routes</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {related.map(([slug, p]) => (
              <Link key={slug} href={`/send/${slug}`}
                className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4 hover:border-blue-500/50 transition-colors">
                <span className="font-medium">{p.from} → {p.to}</span>
                <span className="text-sm text-blue-400">From {p.price} <ArrowRight className="inline h-3 w-3" /></span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="px-6 py-20 text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-black mb-4">Ready to send from {pair.from} to {pair.to}?</h2>
        <p className="text-gray-400 mb-8">Browse live carriers already making the journey today.</p>
        <Link href="/journeys" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors">
          Browse Live Routes <ArrowRight className="h-5 w-5" />
        </Link>
      </section>

    </main>
  );
}
