'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Shield, CheckCircle, ShieldCheck, LockKeyhole, EyeOff,
  FileCheck2, AlertTriangle, ArrowRight, Sparkles, Navigation,
} from 'lucide-react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const pipeline = [
  { label: 'CREATED',      desc: 'Trip or delivery posted' },
  { label: 'MATCHED',      desc: 'System finds a compatible match' },
  { label: 'ACCEPTED',     desc: 'Both parties confirm intent to proceed' },
  { label: 'KYC PENDING',  desc: 'Identity documents verified for both' },
  { label: 'PAYMENT HELD', desc: 'Funds locked in escrow via Stripe' },
  { label: 'ACTIVE',       desc: 'Details shared — GPS tracking live' },
  { label: 'COMPLETED',    desc: 'Both parties confirm delivery' },
  { label: 'RELEASED',     desc: 'Payment sent to traveller' },
];

const pillars = [
  {
    icon: ShieldCheck,
    title: 'Identity Verification (KYC)',
    points: [
      'Passport or Driving Licence scan',
      'Live selfie face-match',
      'Powered by Stripe Identity',
      'Required for BOTH parties before details are shared',
    ],
  },
  {
    icon: LockKeyhole,
    title: 'Escrow Payments',
    points: [
      'Sender pays into Stripe escrow — not the traveller',
      'Funds are locked until delivery is confirmed',
      'Automatic release on mutual confirmation or timeout',
      'Full refund if match fails before KYC',
    ],
  },
  {
    icon: EyeOff,
    title: 'No Details Until Safe',
    points: [
      'Phone numbers hidden until KYC + payment are complete',
      'Exact meeting location revealed only then',
      'In-app messaging keeps all contact traceable',
      'Zero exposure of personal data during matching',
    ],
  },
  {
    icon: FileCheck2,
    title: 'Customs Compliance',
    points: [
      'Every user signs our customs responsibility declaration',
      'Prohibited items blocked at listing stage',
      'AI-powered compliance check on every submission',
      'Traveller is never liable for undeclared sender contents',
    ],
  },
];

const duringDelivery = {
  icon: Navigation,
  title: 'Real-Time GPS Tracking',
  points: [
    'Traveller shares live GPS during active deliveries only',
    'Journey milestones: Collected → At Airport → Departed → Landed → Delivered',
    'Consent-based — tracking starts and stops with the delivery, never outside it',
    'Sender sees live map and progress in real time',
  ],
};

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
  useScrollReveal();
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden font-sans">

      {/* BG */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.07),transparent_35%)]" />

      <NavBar />

      {/* HERO */}
      <section className="relative pt-40 pb-28 px-6 text-center overflow-hidden">
        {/* Background image with parallax */}
        <div
          className="absolute inset-0"
          style={{ transform:`translateY(${scrollY*0.25}px)` }}
        >
          <img
            src="/images/boothopeveryd.jpg"
            alt=""
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/70 to-slate-950/95" />
        </div>
        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{transform:`translateY(${scrollY*0.4}px)`}}>
          <div className="absolute top-20 left-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
          <div className="absolute top-40 right-1/3 w-2 h-2 bg-blue-400 rounded-full animate-ping" style={{animationDelay:'1s'}} />
          <div className="absolute bottom-20 left-1/2 w-2 h-2 bg-violet-400 rounded-full animate-ping" style={{animationDelay:'2s'}} />
        </div>
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-full px-6 py-3 mb-8 backdrop-blur-xl">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-cyan-300 font-medium">Trust &amp; Safety</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black mb-6 leading-tight text-white">
            Safe by<br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-300 to-violet-400 bg-clip-text text-transparent animate-pulse">
              design.
            </span>
          </h1>
          <p className="text-slate-400 text-xl max-w-2xl mx-auto leading-relaxed">
            Every match on BootHop is protected by identity verification, escrow payments, and a strict
            no-details-before-payment policy. Safety isn&apos;t a feature — it&apos;s the foundation.
          </p>
        </div>
      </section>

      {/* STATUS PIPELINE */}
      <section className="relative pt-16 pb-8 px-6 scroll-mt-28">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
        <div className="relative max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-cyan-50 border border-cyan-200 rounded-full px-4 py-2 mb-4 mx-auto flex justify-center w-fit">
            <span className="text-xs font-semibold uppercase tracking-widest text-cyan-700">Every delivery goes through</span>
          </div>
          <h2 className="text-center text-3xl md:text-4xl font-black text-slate-900 mb-12 scroll-mt-28">
            8-stage verified pipeline
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {pipeline.map((step, i) => (
              <div key={step.label} className={`reveal d${Math.min(i+1,5)} group relative rounded-2xl border border-slate-200 bg-white p-5 text-center hover:scale-[1.06] active:scale-[0.97] transition-all duration-300 hover:shadow-xl cursor-pointer overflow-hidden touch-violet`}>
                {/* Colour glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-400 opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-2xl" />
                {/* Top edge light bar */}
                <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-blue-600 to-blue-400 opacity-0 group-hover:opacity-60 transition-opacity duration-300" />
                <div className="relative">
                  <span className="text-slate-600 text-xs font-mono mb-2 block group-hover:text-slate-800 transition-colors">{String(i+1).padStart(2,'0')}</span>
                  <span className="inline-block px-2 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-wider mb-3 bg-blue-700 shadow-sm group-hover:scale-110 transition-transform duration-300">
                    {step.label}
                  </span>
                  <p className="text-slate-600 text-xs leading-relaxed group-hover:text-slate-800 transition-colors duration-300">{step.desc}</p>
                </div>
                {i < pipeline.length-1 && (
                  <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 text-slate-500 text-lg group-hover:text-slate-700 transition-colors">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOUR PILLARS */}
      <section className="relative pt-4 pb-20 px-6 scroll-mt-28">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2 mb-4 mx-auto flex justify-center w-fit">
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-700">How we protect you</span>
          </div>
          <h2 className="text-center text-3xl md:text-5xl font-black text-slate-900 mb-14 scroll-mt-28">
            Four layers of protection
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {pillars.map(({ icon: Icon, title, points }, i) => (
              <div key={title} className={`reveal d${i+1} group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl hover:border-blue-200 cursor-pointer touch-violet`}>
                <div className="relative">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 mb-5 group-hover:bg-blue-100 transition-colors duration-300">
                    <Icon className="h-6 w-6 text-blue-800" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">{title}</h3>
                  <ul className="space-y-3">
                    {points.map((pt) => (
                      <li key={pt} className="flex items-start gap-3 text-sm text-slate-600">
                        <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DURING DELIVERY */}
      <section className="relative pt-0 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2 mb-4 mx-auto flex justify-center w-fit">
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-700">While your delivery is moving</span>
          </div>
          <h2 className="text-center text-3xl md:text-4xl font-black text-slate-900 mb-10">
            During delivery
          </h2>
          <div className="max-w-2xl mx-auto">
            <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 transition-all duration-500 hover:shadow-xl hover:border-blue-200 touch-violet">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 mb-5 group-hover:bg-blue-100 transition-colors duration-300">
                <duringDelivery.icon className="h-6 w-6 text-blue-800" strokeWidth={1.75} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-4">{duringDelivery.title}</h3>
              <ul className="space-y-3">
                {duringDelivery.points.map((pt) => (
                  <li key={pt} className="flex items-start gap-3 text-sm text-slate-600">
                    <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* PROHIBITED ITEMS */}
      <section className="relative py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-10">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-100 rounded-full blur-3xl pointer-events-none" />
            <div className="relative flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-400 flex items-center justify-center shadow-lg shadow-red-500/30">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">Prohibited Items</h2>
                <p className="text-sm text-slate-600">Accounts permanently banned for violations</p>
              </div>
            </div>
            <div className="relative grid md:grid-cols-2 gap-3">
              {prohibited.map((item) => (
                <div key={item} className="group flex items-center gap-3 rounded-xl border border-red-200 bg-white px-4 py-3 hover:border-red-300 hover:bg-red-50 hover:scale-[1.02] transition-all duration-300 cursor-default">
                  <span className="text-red-500 font-bold text-lg">✗</span>
                  <span className="text-sm text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* UK → NIGERIA CORRIDOR */}
      <section className="relative py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Sending on the UK → Nigeria corridor?</h2>
              <p className="text-sm text-slate-600">Here&apos;s what both sides need to know</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {/* For senders */}
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-blue-700">For Senders</p>
              <ul className="space-y-3">
                {[
                  'You are responsible for ensuring your item complies with Nigerian Customs Service (NCS) import rules',
                  'Personal effects and gifts up to a reasonable quantity are typically duty-free',
                  'Electronics must be declared honestly — import duties may apply on arrival',
                  'Food items must be factory-sealed and NAFDAC compliant to clear customs',
                  'You sign a declaration confirming contents — false declarations lead to permanent ban',
                ].map((pt) => (
                  <li key={pt} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />{pt}
                  </li>
                ))}
              </ul>
            </div>
            {/* For travellers */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-emerald-700">For Travellers (Booters)</p>
              <ul className="space-y-3">
                {[
                  'You are never liable for contents you did not pack and were not informed of',
                  'You have the right to inspect any item before accepting the match',
                  'Refuse any item you are uncomfortable with — no penalty applies',
                  'BootHop\'s customs declaration places legal responsibility on the sender',
                  'UK travellers: personal effects carried for others may be questioned at Nigerian customs — carry the BootHop match confirmation',
                ].map((pt) => (
                  <li key={pt} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />{pt}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Need more guidance?</span> The Nigerian Customs Service (customs.gov.ng) publishes the current passenger baggage allowances and prohibited items list.
              UK export restrictions are governed by HMRC and the Export Control Joint Unit.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 text-center px-6">
        <div className="max-w-4xl mx-auto relative">
          <div className="relative overflow-hidden rounded-3xl border border-cyan-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-16">
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-cyan-100 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
                Ready to send or travel?
              </h2>
              <p className="text-slate-600 mb-10 text-lg">Every delivery protected. Every traveller verified.</p>
              <Link href="/login" className="group inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold px-10 py-5 rounded-2xl hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105">
                Get Started <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
