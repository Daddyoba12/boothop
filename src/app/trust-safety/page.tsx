import Link from 'next/link';
import Image from 'next/image';
import {
  Shield, CheckCircle, Lock, Eye, EyeOff, CreditCard,
  FileText, AlertTriangle, ArrowRight, UserCheck, Banknote,
} from 'lucide-react';

export const metadata = {
  title: 'Trust & Safety – BootHop',
  description: 'How BootHop keeps every sender and traveller safe through identity verification, escrow payments, and compliance.',
};

const pipeline = [
  { label: 'CREATED',       desc: 'Trip or delivery posted',                color: 'bg-slate-500' },
  { label: 'MATCHED',       desc: 'System finds a compatible match',         color: 'bg-blue-500' },
  { label: 'ACCEPTED',      desc: 'Both parties confirm intent to proceed',  color: 'bg-indigo-500' },
  { label: 'KYC PENDING',   desc: 'Identity documents verified for both',    color: 'bg-violet-500' },
  { label: 'PAYMENT HELD',  desc: 'Funds locked in escrow via Stripe',       color: 'bg-amber-500' },
  { label: 'ACTIVE',        desc: 'Details shared — delivery underway',      color: 'bg-orange-500' },
  { label: 'COMPLETED',     desc: 'Both parties confirm delivery',           color: 'bg-green-500' },
  { label: 'RELEASED',      desc: 'Payment sent to traveller',               color: 'bg-emerald-500' },
];

const pillars = [
  {
    icon: UserCheck,
    title: 'Identity Verification (KYC)',
    color: 'text-blue-400',
    ring: 'ring-blue-500/30 bg-blue-500/10',
    points: [
      'Passport or Driving Licence scan',
      'Live selfie face-match',
      'Powered by Stripe Identity',
      'Required for BOTH parties before details are shared',
    ],
  },
  {
    icon: Lock,
    title: 'Escrow Payments',
    color: 'text-amber-400',
    ring: 'ring-amber-500/30 bg-amber-500/10',
    points: [
      'Sender pays into Stripe escrow — not to the traveller',
      'Funds are locked until delivery is confirmed',
      'Automatic release on mutual confirmation or timeout',
      'Full refund if match fails before KYC',
    ],
  },
  {
    icon: EyeOff,
    title: 'No Details Until Safe',
    color: 'text-violet-400',
    ring: 'ring-violet-500/30 bg-violet-500/10',
    points: [
      'Phone numbers hidden until KYC + payment are complete',
      'Exact meeting location revealed only then',
      'In-app messaging keeps all contact traceable',
      'Zero exposure of personal data during matching',
    ],
  },
  {
    icon: FileText,
    title: 'Customs Compliance',
    color: 'text-green-400',
    ring: 'ring-green-500/30 bg-green-500/10',
    points: [
      'Every user signs our customs responsibility declaration',
      'Prohibited items blocked at listing stage',
      'AI-powered compliance check on every submission',
      'Traveller is never liable for undeclared sender contents',
    ],
  },
];

const prohibited = [
  'Cash or monetary instruments',
  'Controlled substances / drugs',
  'Weapons or ammunition',
  'Counterfeit goods',
  'Hazardous materials',
  'Live animals',
  'Items exceeding customs allowances',
  'Anything the sender misrepresents',
];

export default function TrustSafetyPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">

      {/* ── NAV ── */}
      <nav className="fixed top-0 w-full z-50 border-b border-slate-100 bg-white/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/images/boothop.png" alt="BootHop" width={160} height={44} className="h-10 w-auto object-contain" />
          </Link>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-2 group">
            <span className="group-hover:-translate-x-1 transition-transform inline-block">←</span> Back to Home
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="pt-32 pb-16 px-6 bg-gradient-to-b from-slate-50 to-white text-center">
        <div className="inline-flex items-center gap-2 mb-6 px-5 py-2 rounded-full bg-blue-50 border border-blue-100">
          <Shield className="h-4 w-4 text-blue-500" />
          <span className="text-xs font-semibold tracking-widest uppercase text-blue-600">Trust &amp; Safety</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-tight mb-6">
          Safe by<br />
          <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">design.</span>
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
          Every match on BootHop is protected by identity verification, escrow payments, and a strict
          no-details-before-payment policy. Safety isn&apos;t a feature — it&apos;s the foundation.
        </p>
      </section>

      {/* ── STATUS PIPELINE ── */}
      <section className="py-16 px-6 bg-slate-950">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-blue-400 mb-3">
            Every delivery goes through
          </p>
          <h2 className="text-center text-2xl md:text-4xl font-bold text-white mb-12">
            8-stage verified pipeline
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {pipeline.map((step, i) => (
              <div key={step.label} className="relative rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                <span className="text-white/30 text-xs font-mono mb-2 block">{String(i + 1).padStart(2, '0')}</span>
                <span className={`inline-block px-2 py-0.5 rounded-full text-white text-[10px] font-bold uppercase tracking-wider mb-3 ${step.color}`}>
                  {step.label}
                </span>
                <p className="text-white/60 text-xs leading-relaxed">{step.desc}</p>
                {i < pipeline.length - 1 && (
                  <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 text-white/20 text-lg">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOUR PILLARS ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-blue-600 mb-3">How we protect you</p>
          <h2 className="text-center text-3xl md:text-5xl font-black text-slate-900 mb-14">
            Four layers of protection
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {pillars.map(({ icon: Icon, title, color, ring, points }) => (
              <div key={title} className="rounded-2xl border border-slate-100 p-8 hover:shadow-lg transition-shadow">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ring-1 mb-5 ${ring}`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">{title}</h3>
                <ul className="space-y-3">
                  {points.map((pt) => (
                    <li key={pt} className="flex items-start gap-3 text-sm text-slate-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DETAILS REVEAL RULE ── */}
      <section className="py-20 px-6 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6 px-5 py-2 rounded-full bg-white/10 border border-white/20">
            <Eye className="h-4 w-4 text-blue-300" />
            <span className="text-xs font-semibold tracking-widest uppercase text-blue-300">The Golden Rule</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-8">
            Zero exposure<br />before trust is earned.
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-left mt-10">
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
              <p className="text-red-400 font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <EyeOff className="h-4 w-4" /> Before KYC + Payment
              </p>
              <ul className="space-y-2 text-sm text-white/70">
                <li>✗ No phone numbers</li>
                <li>✗ No exact address or airport gate</li>
                <li>✗ No personal social profiles</li>
                <li>✗ No direct contact outside BootHop</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-6">
              <p className="text-green-400 font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <Eye className="h-4 w-4" /> After KYC + Payment Held
              </p>
              <ul className="space-y-2 text-sm text-white/70">
                <li>✓ Verified phone numbers shared</li>
                <li>✓ Meeting point confirmed</li>
                <li>✓ Full name displayed</li>
                <li>✓ In-app messaging unlocked</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROHIBITED ITEMS ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl border-2 border-red-100 bg-red-50 p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">Prohibited Items</h2>
                <p className="text-sm text-slate-500">These are never allowed — accounts are permanently banned for violations</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {prohibited.map((item) => (
                <div key={item} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-red-100">
                  <span className="text-red-500 font-bold text-lg">✗</span>
                  <span className="text-sm text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PAYMENT ESCROW DETAIL ── */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-blue-600 mb-3">Escrow</p>
          <h2 className="text-center text-3xl md:text-4xl font-black text-slate-900 mb-12">
            Your money is never at risk
          </h2>
          <div className="flex flex-col md:flex-row items-center gap-4">
            {[
              { icon: CreditCard, label: 'Sender Pays', desc: 'Funds go to Stripe escrow — not the traveller', color: 'text-blue-600 bg-blue-50' },
              { icon: Lock, label: 'Money Locked', desc: 'Held securely until delivery is confirmed by both', color: 'text-amber-600 bg-amber-50' },
              { icon: Banknote, label: 'Payment Released', desc: 'Auto-released on confirmation or after timeout', color: 'text-green-600 bg-green-50' },
            ].map(({ icon: Icon, label, desc, color }, i) => (
              <div key={label} className="flex-1 flex flex-col items-center text-center">
                <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mb-4`}>
                  <Icon className="h-7 w-7" />
                </div>
                <p className="font-bold text-slate-900 mb-1">{label}</p>
                <p className="text-sm text-slate-500">{desc}</p>
                {i < 2 && <ArrowRight className="h-5 w-5 text-slate-300 mt-4 md:hidden" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-cyan-500 text-center">
        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
          Ready to send or travel?
        </h2>
        <p className="text-white/80 mb-8 text-lg">Every delivery protected. Every traveller verified.</p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 bg-white text-blue-600 font-bold px-8 py-4 rounded-2xl hover:bg-blue-50 transition-colors shadow-lg"
        >
          Get Started <ArrowRight className="h-5 w-5" />
        </Link>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 px-6 border-t border-slate-100 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} BootHop Ltd. All rights reserved.</p>
        <div className="flex justify-center gap-6 mt-3">
          <Link href="/how-it-works" className="hover:text-slate-600 transition-colors">How It Works</Link>
          <Link href="/pricing" className="hover:text-slate-600 transition-colors">Pricing</Link>
          <Link href="/about" className="hover:text-slate-600 transition-colors">About</Link>
        </div>
      </footer>
    </div>
  );
}
