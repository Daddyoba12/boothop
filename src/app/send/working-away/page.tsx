import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Briefcase, Home, Clock, Package, Wrench, MapPin } from 'lucide-react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Working Away from Home? Get Packages Delivered to You | BootHop',
  description: 'On a contract in another city? Working away for weeks? BootHop delivers what you need — documents, tools, personal items — same-day to wherever you are across the UK. No fixed address required.',
  keywords: [
    'working away from home delivery UK', 'send package to temporary address UK',
    'delivery for contractors UK', 'urgent delivery while working away',
    'send items to hotel UK', 'contractor delivery service UK',
    'working away parcel delivery', 'send documents while travelling for work',
    'delivery to construction site UK', 'send to temporary accommodation UK',
    'remote worker package delivery UK', 'package delivery while on contract',
    'send belongings to work location UK', 'urgent delivery to any UK address',
  ],
  openGraph: {
    title: 'Working Away from Home? Get Packages Delivered to You | BootHop',
    description: 'Left your toolkit at home. Need documents from the office. BootHop delivers same-day to wherever your contract takes you.',
    type: 'website',
    url: 'https://www.boothop.com/send/working-away',
  },
  alternates: { canonical: 'https://www.boothop.com/send/working-away' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Working Away Delivery Service UK',
  provider: { '@type': 'Organization', name: 'BootHop', url: 'https://www.boothop.com' },
  serviceType: 'Same-Day Delivery Service',
  areaServed: { '@type': 'Country', name: 'United Kingdom' },
  description: 'BootHop connects people working away from home with verified travellers who can deliver essential items — documents, equipment, personal items — same-day to any UK location.',
  url: 'https://www.boothop.com/send/working-away',
};

const scenarios = [
  { icon: Wrench, title: 'Left your tools at home', desc: 'Site starts Monday. Tools are still in your garage. A traveller picks them up and meets you at the site.' },
  { icon: Briefcase, title: 'Documents from head office', desc: 'Contract needs signing, spec sheet needs reviewing — physical docs delivered to your hotel or site office today.' },
  { icon: Home, title: 'Personal items from home', desc: 'Six weeks on a contract. You need your charger, your medication, or your own pillow. Done.' },
  { icon: Package, title: 'Parcels to a temporary address', desc: 'Most couriers need a fixed address. BootHop delivers to hotels, serviced apartments, site offices, anywhere.' },
  { icon: Clock, title: 'Same-day when it counts', desc: 'Meeting at 9am, documents stuck in your flat. Traveller collects at 7am, drops to your hotel by 8:30.' },
  { icon: MapPin, title: 'Return items home', desc: 'Sending equipment or personal items back to base — without expensive courier vans or complicated logistics.' },
];

export default function WorkingAwayPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <NavBar />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold px-4 py-2 rounded-full mb-6">
          <Briefcase className="h-3.5 w-3.5" /> DELIVERY WHILE WORKING AWAY
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          Working Away?<br />
          <span className="text-blue-400">We Deliver to Where You Are</span>
        </h1>
        <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-4 leading-relaxed">
          Contracts take you away from home. Tools, documents, and personal items don't always follow. BootHop connects you with verified travellers already heading your way — same-day delivery to hotels, site offices, or temporary accommodation anywhere in the UK.
        </p>
        <p className="text-slate-400 mb-10 text-sm">No fixed address required. No account needed to browse routes.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-bold px-8 py-4 rounded-full text-base transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(59,130,246,0.4)]"
          >
            Send Something Today <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/journeys" className="text-slate-400 hover:text-white text-sm underline underline-offset-4">
            Browse live routes →
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/8 py-8">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 px-6 text-center">
          {[
            { stat: 'Same Day', label: 'UK delivery' },
            { stat: 'Any Address', label: 'Hotel, site, flat' },
            { stat: 'KYC Verified', label: 'Every carrier' },
            { stat: 'From £15', label: 'UK routes' },
          ].map(({ stat, label }) => (
            <div key={label}>
              <div className="text-2xl font-black text-blue-400">{stat}</div>
              <div className="text-sm text-slate-400 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Scenarios */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-4">The Working-Away Moments BootHop Solves</h2>
        <p className="text-slate-400 text-center mb-14 max-w-xl mx-auto">
          Six weeks on a contract in a city you don't live in creates problems. Here are the ones we hear most.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {scenarios.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/4 border border-white/8 rounded-2xl p-6 hover:border-blue-500/30 transition-colors">
              <Icon className="h-6 w-6 text-blue-400 mb-4" />
              <h3 className="font-bold text-white mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who uses this */}
      <section className="py-16 px-6 max-w-4xl mx-auto">
        <h2 className="text-3xl font-black text-center mb-10">Who Uses BootHop While Working Away</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { role: 'Construction & Site Workers', detail: 'Tools, PPE, specialist equipment delivered to site.' },
            { role: 'IT Contractors', detail: 'Laptops, cables, access cards — delivered to client offices.' },
            { role: 'Healthcare Professionals', detail: 'Personal items, uniforms, certifications to placement hospitals.' },
            { role: 'Film & Production Crews', detail: 'Props, costumes, gear — delivered to location before call time.' },
            { role: 'Consultants & Advisers', detail: 'Physical files, branded materials, presentation kits.' },
            { role: 'Sports & Coaching Staff', detail: 'Kit, tactical boards, equipment to training grounds or away venues.' },
          ].map(({ role, detail }) => (
            <div key={role} className="bg-white/4 border border-white/8 rounded-xl p-5 flex gap-4 items-start">
              <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
              <div>
                <div className="font-bold text-white text-sm">{role}</div>
                <div className="text-slate-400 text-sm mt-1">{detail}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl font-black text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: '01', title: 'Post your delivery', desc: 'Give us the pickup address (your home, office, family) and drop-off (your hotel, site, apartment).' },
            { step: '02', title: 'Matched same day', desc: 'We find a verified traveller heading your route — usually within the hour.' },
            { step: '03', title: 'Carrier collects', desc: 'Traveller picks up from the source address. Payment held securely until delivery confirmed.' },
            { step: '04', title: 'Delivered to you', desc: 'You receive it at your working location. Confirm delivery, payment releases.' },
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
          <h2 className="text-3xl font-black mb-4">Your contract doesn't have to mean going without.</h2>
          <p className="text-slate-400 mb-8">
            Post your delivery in 2 minutes. First £20 on us. Verified traveller, same-day UK delivery.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-bold px-8 py-4 rounded-full text-base transition-all hover:-translate-y-0.5"
          >
            Get It Delivered Today <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-slate-500 text-xs mt-6">Free to post · Stripe-secured payment · Cancel before match</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
