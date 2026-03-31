import Link from 'next/link';
import { ChevronDown, Package, Plane, Shield, CreditCard, MessageCircle, UserCheck, Clock, AlertTriangle } from 'lucide-react';
import BootHopLogo from '@/components/BootHopLogo';

export const metadata = {
  title: 'Help Centre – BootHop',
  description: 'Find answers to common questions about sending and carrying items on BootHop.',
};

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
        a: 'Simply enter your journey or delivery details on the home page and click Register. We\'ll send you a secure magic link to your email — no password needed. Once verified, your listing goes live immediately.',
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
        a: 'Our matching engine runs automatically when you post a listing. If a compatible match already exists, you\'ll be notified within minutes. If not, you\'ll be alerted as soon as a match comes in.',
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

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600 border-blue-100',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  violet: 'bg-violet-50 text-violet-600 border-violet-100',
  red: 'bg-red-50 text-red-600 border-red-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
};

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border-b border-slate-100 last:border-0">
      <summary className="flex cursor-pointer items-center justify-between gap-4 py-5 pr-2 text-sm font-semibold text-slate-800 hover:text-blue-600 transition-colors list-none">
        {q}
        <ChevronDown className="h-4 w-4 flex-shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
      </summary>
      <p className="pb-5 text-sm leading-relaxed text-slate-500">{a}</p>
    </details>
  );
}

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">

      {/* NAV */}
      <nav className="fixed top-0 w-full z-50 border-b border-slate-100 bg-white/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <BootHopLogo iconClass="text-slate-900" textClass="text-slate-900" />
          </Link>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1 group">
            <span className="group-hover:-translate-x-1 transition-transform inline-block">←</span> Back to Home
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-14 px-6 bg-gradient-to-b from-slate-50 to-white text-center">
        <div className="inline-flex items-center gap-2 mb-6 px-5 py-2 rounded-full bg-blue-50 border border-blue-100">
          <MessageCircle className="h-4 w-4 text-blue-500" />
          <span className="text-xs font-semibold tracking-widest uppercase text-blue-600">Help Centre</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-4">How can we help?</h1>
        <p className="text-slate-500 text-base max-w-xl mx-auto mb-8">
          Everything you need to know about sending and carrying items on BootHop.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/contact" className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition">
            Contact Support
          </Link>
          <Link href="/how-it-works" className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
            How It Works
          </Link>
        </div>
      </section>

      {/* ALERT BOX */}
      <div className="max-w-3xl mx-auto px-6 mb-10">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 flex items-start gap-3 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Never carry items you haven't inspected.</span> BootHop is a peer-to-peer platform — always verify item contents before agreeing to carry anything.
          </p>
        </div>
      </div>

      {/* FAQ SECTIONS */}
      <main className="max-w-3xl mx-auto px-6 pb-24">
        {faqs.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.category} className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${colorMap[section.color]}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-black text-slate-900">{section.category}</h2>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white shadow-sm px-6">
                {section.items.map((item) => (
                  <FaqItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          );
        })}

        {/* STILL NEED HELP */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-8 text-center">
          <h3 className="text-xl font-black text-slate-900 mb-2">Still need help?</h3>
          <p className="text-sm text-slate-500 mb-6">Our support team typically responds within 24 hours on business days.</p>
          <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition">
            <MessageCircle className="h-4 w-4" /> Get in Touch
          </Link>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-950 px-6 py-10 text-center text-sm text-slate-500">
        <p>© {new Date().getFullYear()} BootHop. All rights reserved.</p>
        <div className="mt-3 flex justify-center gap-5">
          {[['Terms', '/terms'], ['Privacy', '/privacy'], ['Contact', '/contact']].map(([label, href]) => (
            <Link key={href} href={href} className="hover:text-white transition">{label}</Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
