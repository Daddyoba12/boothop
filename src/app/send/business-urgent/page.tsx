import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Zap, Plane, Scale, TrendingUp, Trophy, Building, Clock, Shield } from 'lucide-react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { TikTokViewContent } from '@/components/TikTokTracker';

export const metadata: Metadata = {
  title: 'Urgent Business Delivery UK – Same-Day for Finance, Law, Aerospace & Sport | BootHop',
  description: 'Time-critical business deliveries across the UK. Signed legal documents, financial instruments, AOG aerospace parts, Premiership kit — same-day, verified carriers, Stripe-secured. From £300.',
  keywords: [
    'urgent business delivery UK', 'same day business courier UK',
    'legal document courier UK', 'urgent legal documents delivery',
    'financial document courier UK', 'same day courier law firm UK',
    'AOG parts delivery UK', 'aerospace courier UK', 'aviation parts same day UK',
    'premiership football club courier', 'sports club same day delivery UK',
    'urgent document delivery London', 'time critical courier UK',
    'financial instrument delivery UK', 'same day document courier City of London',
    'law firm urgent courier UK', 'sports kit urgent delivery UK',
  ],
  openGraph: {
    title: 'Urgent Business Delivery UK – Finance, Law, Aerospace & Sport | BootHop',
    description: 'When downtime costs thousands per hour, BootHop delivers. Same-day, verified carriers, zero depot handoffs.',
    type: 'website',
    url: 'https://www.boothop.com/send/business-urgent',
  },
  alternates: { canonical: 'https://www.boothop.com/send/business-urgent' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Urgent B2B Same-Day Delivery UK',
  provider: { '@type': 'Organization', name: 'BootHop', url: 'https://www.boothop.com' },
  serviceType: 'On-Board Courier / Same-Day Business Delivery',
  areaServed: { '@type': 'Country', name: 'United Kingdom' },
  description: 'BootHop provides time-critical same-day delivery for UK businesses — legal documents, financial instruments, aerospace components, and sports equipment — using KYC-verified carriers with zero depot handoffs.',
  url: 'https://www.boothop.com/send/business-urgent',
};

const industries = [
  {
    icon: TrendingUp,
    title: 'Financial Institutions',
    tag: 'Finance & FI',
    items: [
      'Signed term sheets and deal documents by close of business',
      'Physical share certificates and bearer instruments',
      'Regulatory filings requiring wet signatures',
      'Bank documents between City offices and regional branches',
    ],
    quote: 'The deal closes at 5pm. The document needs to be in Canary Wharf by 4:30. Done.',
  },
  {
    icon: Scale,
    title: 'Law Firms & Legal',
    tag: 'Legal',
    items: [
      'Court bundles, evidence, and originals before hearings',
      'Executed contracts, deeds, and notarised documents',
      'Property transaction documents on completion day',
      'Cross-examination materials to chambers or court',
    ],
    quote: 'Completion is at noon. The signed engrossments need to cross three desks first.',
  },
  {
    icon: Plane,
    title: 'Aerospace & Aviation',
    tag: 'AOG & Engineering',
    items: [
      'Aircraft-on-Ground (AOG) components to minimise downtime',
      'Avionics and instruments needing hand-carry to MROs',
      'Certification documents to airfields and maintenance bases',
      'Tooling and calibrated instruments between facilities',
    ],
    quote: 'A grounded aircraft costs £40,000/hour. The part is 150 miles away.',
  },
  {
    icon: Trophy,
    title: 'Premiership Football & Sport',
    tag: 'Sport',
    items: [
      'Kit and equipment to away grounds before kick-off',
      'Medical supplies and physio equipment for travel squads',
      'Media accreditation packs and broadcast materials',
      'Contractual and registration documents to the FA/PL',
    ],
    quote: 'Away fixture tomorrow. Half the medical kit is still at the training ground.',
  },
];

export default function BusinessUrgentPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TikTokViewContent contentName="Business Urgent Delivery" contentType="delivery_service" />
      <NavBar />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold px-4 py-2 rounded-full mb-6">
          <Zap className="h-3.5 w-3.5" /> TIME-CRITICAL BUSINESS DELIVERY
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          When Hours Matter.<br />
          <span className="text-blue-400">Not Days.</span>
        </h1>
        <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-4 leading-relaxed">
          BootHop connects UK businesses with verified carriers for same-day delivery of time-critical items — legal documents, financial instruments, aerospace components, and sports equipment. Zero depot handoffs. KYC-verified carriers. Stripe escrow on every movement.
        </p>
        <p className="text-slate-400 mb-10 text-sm">Serving finance, law, aerospace, and sport across the UK.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/business"
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-bold px-8 py-4 rounded-full text-base transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(59,130,246,0.4)]"
          >
            Post Urgent Delivery <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/business" className="text-slate-400 hover:text-white text-sm underline underline-offset-4">
            Enterprise accounts →
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/8 py-8">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 px-6 text-center">
          {[
            { stat: 'Same Day', label: 'UK delivery' },
            { stat: '0', label: 'Depot handoffs' },
            { stat: 'KYC Verified', label: 'Every carrier' },
            { stat: 'Stripe Escrow', label: 'Secure payment' },
          ].map(({ stat, label }) => (
            <div key={label}>
              <div className="text-2xl font-black text-blue-400">{stat}</div>
              <div className="text-sm text-slate-400 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Industries */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-4">Industries We Serve</h2>
        <p className="text-slate-400 text-center mb-14 max-w-xl mx-auto">
          BootHop is built for the sectors where a missed delivery is not just an inconvenience — it is a measurable business loss.
        </p>
        <div className="grid md:grid-cols-2 gap-8">
          {industries.map(({ icon: Icon, title, tag, items, quote }) => (
            <div key={title} className="bg-white/4 border border-white/8 rounded-2xl p-7 hover:border-blue-500/30 transition-colors">
              <div className="flex items-center gap-3 mb-5">
                <Icon className="h-6 w-6 text-blue-400 shrink-0" />
                <div>
                  <h3 className="font-black text-white">{title}</h3>
                  <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">{tag}</span>
                </div>
              </div>
              <ul className="space-y-2 mb-5">
                {items.map(item => (
                  <li key={item} className="flex gap-2 text-sm text-slate-300">
                    <span className="text-blue-400 mt-0.5">›</span>
                    {item}
                  </li>
                ))}
              </ul>
              <blockquote className="border-l-2 border-blue-500/40 pl-4 text-slate-400 text-sm italic">
                "{quote}"
              </blockquote>
            </div>
          ))}
        </div>
      </section>

      {/* Why BootHop for business */}
      <section className="py-16 px-6 max-w-4xl mx-auto">
        <h2 className="text-3xl font-black text-center mb-10">Why Business Clients Choose BootHop</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Clock, title: 'Speed without compromise', desc: 'Verified carriers are already on your route. No "available in 4 hours" — matched within the hour.' },
            { icon: Shield, title: 'Compliance built in', desc: 'Every carrier completes KYC before they carry anything. Payments held in Stripe escrow until confirmed.' },
            { icon: Building, title: 'Enterprise accounts', desc: 'Priority Partner programme gives recurring clients a dedicated account manager and pre-vetted carrier pool.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/4 border border-white/8 rounded-2xl p-6 text-center">
              <Icon className="h-7 w-7 text-blue-400 mx-auto mb-4" />
              <h3 className="font-bold text-white mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl font-black text-center mb-12">How It Works for Business</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: '01', title: 'Post requirement', desc: 'Route, item, urgency, required delivery window. Takes 90 seconds.' },
            { step: '02', title: 'Carrier matched', desc: 'We surface verified carriers already on your route. You approve.' },
            { step: '03', title: 'Briefed and collected', desc: 'Carrier collects from your office or pickup point. Payment held in escrow.' },
            { step: '04', title: 'Delivered and confirmed', desc: 'Recipient confirms. Chain-of-custody log generated. Payment releases.' },
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
        <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-6">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-3xl p-8 text-center">
            <h3 className="text-xl font-black mb-3">One-off urgent delivery</h3>
            <p className="text-slate-400 text-sm mb-6">Post a single delivery today. No account required, payment on match.</p>
            <Link
              href="/business"
              className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-bold px-6 py-3 rounded-full text-sm transition-all"
            >
              Post Now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="bg-white/4 border border-white/8 rounded-3xl p-8 text-center">
            <h3 className="text-xl font-black mb-3">Enterprise account</h3>
            <p className="text-slate-400 text-sm mb-6">Recurring same-day needs? Priority Partner gives you a dedicated carrier pool and account manager.</p>
            <Link
              href="/business"
              className="inline-flex items-center gap-2 border border-white/20 text-white/70 hover:text-white px-6 py-3 rounded-full text-sm transition-all"
            >
              Enquire About Priority Partner <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
