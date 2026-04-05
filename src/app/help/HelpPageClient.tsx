'use client';

import Link from 'next/link';
import { Package, Plane, Shield, CreditCard, MessageCircle, UserCheck, Clock, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import FaqAccordion from './FaqAccordion';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const faqs = [
  {
    category: 'Getting Started',
    icon: UserCheck,
    color: 'blue',
    items: [
      {
        q: 'What is BootHop?',
        a: 'BootHop is a peer-to-peer delivery platform that connects verified travellers (Booters) with people who need items sent internationally (Hoopers). Instead of expensive couriers, your item travels with a real person going the same route.',
      },
      {
        q: 'What is a Booter?',
        a: 'A Booter is a traveller who has spare baggage space and is willing to carry items for others. Booters earn money by delivering items along their route.',
      },
      {
        q: 'What is a Hooper?',
        a: 'A Hooper is someone who needs an item delivered. They post a delivery request on BootHop and get matched with a Booter travelling the same route.',
      },
      {
        q: 'How do I sign up?',
        a: "Simply enter your journey or delivery details on the home page and click Register. We'll send you a secure magic link to your email — no password needed. Once verified, your listing goes live immediately.",
      },
    ],
  },
  {
    category: 'Sending Items (Hoopers)',
    icon: Package,
    color: 'emerald',
    items: [
      {
        q: 'What items can I send?',
        a: 'You can send personal effects, gifts, documents, small electronics, and clothing. All items must comply with customs laws in both the origin and destination country. See our Terms & Conditions for the full prohibited items list.',
      },
      {
        q: 'How is my item priced?',
        a: 'You and the Booter agree on a delivery price. BootHop adds a 3% service fee on top of the agreed price. For example, if you agree £100, you pay £103 total.',
      },
      {
        q: 'Who is responsible for customs duties?',
        a: 'You (the sender) are solely responsible for ensuring items comply with customs regulations and for paying any import duties or taxes at the destination.',
      },
      {
        q: 'When does the Booter receive payment?',
        a: 'Payment is held in secure escrow and only released to the Booter once the item has been confirmed as delivered.',
      },
    ],
  },
  {
    category: 'Carrying Items (Booters)',
    icon: Plane,
    color: 'blue',
    items: [
      {
        q: 'How do I post my journey?',
        a: 'Log in to your Booter Dashboard and click "Post New Journey". Fill in your route, travel dates, available space, and your price per delivery. Your listing will be visible to Hoopers immediately.',
      },
      {
        q: 'Am I obligated to accept every request?',
        a: 'No. You review each delivery request before accepting. You have the right to inspect items and decline any request you are not comfortable with.',
      },
      {
        q: 'What if customs stops me?',
        a: 'You must honestly declare all items at customs. BootHop provides match documentation for you to carry. You are not liable for contents you genuinely could not have known about, but you must not knowingly carry prohibited items.',
      },
      {
        q: 'How much can I earn?',
        a: 'You set your own price. The agreed delivery price minus a small platform fee is paid to you once delivery is confirmed. Most Booters earn £30–£150 per delivery.',
      },
    ],
  },
  {
    category: 'Payments & Escrow',
    icon: CreditCard,
    color: 'violet',
    items: [
      {
        q: 'How does escrow work?',
        a: 'When a match is confirmed, the Hooper pays the agreed amount into secure escrow. The funds are held safely and only released to the Booter after the item is confirmed delivered. This protects both parties.',
      },
      {
        q: 'What payment methods are accepted?',
        a: 'BootHop accepts all major credit and debit cards via our secure Stripe payment processor. No cash payments are handled on the platform.',
      },
      {
        q: 'Can I get a refund?',
        a: 'If a delivery is cancelled before the Booter accepts the item, the full escrow amount is refunded to the Hooper. Post-acceptance cancellations are subject to our dispute resolution process.',
      },
    ],
  },
  {
    category: 'Trust & Safety',
    icon: Shield,
    color: 'red',
    items: [
      {
        q: 'How does BootHop verify users?',
        a: 'All users complete identity verification (KYC) before any delivery can proceed. This includes government ID verification and sometimes a selfie check.',
      },
      {
        q: 'What if something goes wrong?',
        a: 'Contact our support team via the Contact Us page immediately. We have a dispute resolution process and work with both parties to reach a fair outcome.',
      },
      {
        q: 'Can I report a user?',
        a: 'Yes. Use the report button within the messages section of any match, or contact us directly. We take all reports seriously and investigate promptly.',
      },
    ],
  },
  {
    category: 'Timings & Matching',
    icon: Clock,
    color: 'amber',
    items: [
      {
        q: 'How long does matching take?',
        a: "Our matching engine runs automatically when you post a listing. If a compatible match already exists, you'll be notified within minutes. If not, you'll be alerted as soon as a match comes in.",
      },
      {
        q: 'Can I edit my listing after posting?',
        a: 'Yes. Go to your dashboard and select the listing you want to edit. Note that accepted matches cannot be changed without cancelling.',
      },
      {
        q: 'What if my travel date changes?',
        a: 'Update your journey listing as soon as possible. If you have an active match, contact your Hooper directly through the messages page to let them know.',
      },
    ],
  },
];

const glowMap: Record<string, string> = {
  blue:   'from-blue-500 to-cyan-400 shadow-blue-500/50',
  emerald:'from-emerald-500 to-teal-400 shadow-emerald-500/50',
  violet: 'from-violet-500 to-purple-400 shadow-violet-500/50',
  red:    'from-red-500 to-rose-400 shadow-red-500/50',
  amber:  'from-amber-500 to-yellow-400 shadow-amber-500/50',
};

const borderMap: Record<string, string> = {
  blue:   'hover:border-blue-500/50 hover:shadow-blue-500/20',
  emerald:'hover:border-emerald-500/50 hover:shadow-emerald-500/20',
  violet: 'hover:border-violet-500/50 hover:shadow-violet-500/20',
  red:    'hover:border-red-500/50 hover:shadow-red-500/20',
  amber:  'hover:border-amber-500/50 hover:shadow-amber-500/20',
};

const touchMap: Record<string, string> = {
  blue:   'touch-blue',
  emerald:'touch-emerald',
  violet: 'touch-violet',
  red:    'touch-red',
  amber:  'touch-amber',
};

const hoverTitleMap: Record<string, string> = {
  blue:   'group-hover:text-cyan-400',
  emerald:'group-hover:text-emerald-400',
  violet: 'group-hover:text-violet-400',
  red:    'group-hover:text-red-400',
  amber:  'group-hover:text-amber-400',
};

const glowColorMap: Record<string, string> = {
  blue:   'bg-blue-500/20',
  emerald:'bg-emerald-500/20',
  violet: 'bg-violet-500/20',
  red:    'bg-red-500/20',
  amber:  'bg-amber-500/20',
};

export default function HelpPageClient() {
  useScrollReveal();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-x-hidden">
      <div className="fixed inset-0 opacity-20 pointer-events-none z-0">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDuration:'4s'}} />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDuration:'6s',animationDelay:'2s'}} />
        <div className="absolute bottom-40 left-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDuration:'5s',animationDelay:'1s'}} />
      </div>

      <NavBar />

      <section className="relative min-h-[65vh] flex items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0" style={{backgroundImage: 'url(/images/GoingonHolsz.jpg)', backgroundAttachment: 'scroll', backgroundSize: 'cover', backgroundPosition: 'center'}} />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-900/55 to-slate-950/95" />
        <div className="absolute inset-0 opacity-50 pointer-events-none">
          <div className="absolute top-24 left-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
          <div className="absolute top-44 right-1/3 w-2 h-2 bg-blue-400 rounded-full animate-ping" style={{animationDelay:'1s'}} />
          <div className="absolute bottom-24 left-1/2 w-2 h-2 bg-purple-400 rounded-full animate-ping" style={{animationDelay:'2s'}} />
        </div>
        <div className="relative z-10 pt-36 pb-20 px-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-cyan-500/30 rounded-full px-6 py-3 mb-8 backdrop-blur-xl">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-cyan-300 font-medium">Help Centre</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-black mb-6 leading-tight">
            How can we{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent animate-pulse">help?</span>
          </h1>
          <p className="text-slate-300 text-xl max-w-2xl mx-auto mb-10">Everything you need to know about sending and carrying items on BootHop.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="group bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 active:scale-[0.96] flex items-center gap-2">
              Contact Support
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            <Link href="/how-it-works" className="border border-white/20 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-all duration-300 hover:scale-105 backdrop-blur-sm">How It Works</Link>
          </div>
        </div>
      </section>

      <div className="relative z-10 max-w-3xl mx-auto px-6 mt-10 mb-6">
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 backdrop-blur-sm flex items-start gap-3 p-5">
          <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-200 leading-relaxed">
            <span className="font-semibold text-amber-300">Never carry items you haven't inspected.</span> BootHop is a peer-to-peer platform — always verify item contents before agreeing to carry anything.
          </p>
        </div>
      </div>

      <main className="relative z-10 max-w-3xl mx-auto px-6 pb-24">
        {faqs.map((section, idx) => {
          const Icon = section.icon;
          return (
            <div key={section.category} className={`reveal d${Math.min(idx + 1, 5)} mb-10 group`}>
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${glowMap[section.color]} flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h2 className={`text-lg font-black text-white transition-colors duration-300 ${hoverTitleMap[section.color]}`}>{section.category}</h2>
              </div>
              <div className={`relative overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm px-6 transition-all duration-300 hover:border-slate-600/70 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer ${borderMap[section.color]} ${touchMap[section.color]}`}>
                <div className={`pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 w-32 h-32 ${glowColorMap[section.color]} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                {section.items.map((item) => (
                  <FaqAccordion key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          );
        })}

        <div className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm p-10 text-center">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl" />
          <div className="relative">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/50">
              <MessageCircle className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">Still need help?</h3>
            <p className="text-sm text-slate-400 mb-6">Our support team typically responds within 24 hours on business days.</p>
            <Link href="/contact" className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105">
              <MessageCircle className="h-4 w-4" /> Get in Touch
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
