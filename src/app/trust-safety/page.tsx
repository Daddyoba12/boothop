'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Shield, CheckCircle, Lock, Eye, EyeOff, CreditCard,
  FileText, AlertTriangle, ArrowRight, UserCheck, Banknote, Sparkles,
} from 'lucide-react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

const pipeline = [
  { label: 'CREATED',      desc: 'Trip or delivery posted',               color: 'from-slate-500 to-slate-400' },
  { label: 'MATCHED',      desc: 'System finds a compatible match',        color: 'from-blue-600 to-blue-400' },
  { label: 'ACCEPTED',     desc: 'Both parties confirm intent to proceed', color: 'from-indigo-600 to-indigo-400' },
  { label: 'KYC PENDING',  desc: 'Identity documents verified for both',   color: 'from-violet-600 to-violet-400' },
  { label: 'PAYMENT HELD', desc: 'Funds locked in escrow via Stripe',      color: 'from-amber-600 to-amber-400' },
  { label: 'ACTIVE',       desc: 'Details shared — delivery underway',     color: 'from-orange-600 to-orange-400' },
  { label: 'COMPLETED',    desc: 'Both parties confirm delivery',          color: 'from-green-600 to-green-400' },
  { label: 'RELEASED',     desc: 'Payment sent to traveller',              color: 'from-emerald-600 to-emerald-400' },
];

const pillars = [
  {
    icon: UserCheck,
    title: 'Identity Verification (KYC)',
    gradient: 'from-blue-500 to-cyan-400',
    glow: 'shadow-blue-500/50',
    hover: 'hover:border-blue-500/50 hover:shadow-blue-500/20',
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
    gradient: 'from-amber-500 to-yellow-400',
    glow: 'shadow-amber-500/50',
    hover: 'hover:border-amber-500/50 hover:shadow-amber-500/20',
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
    gradient: 'from-violet-500 to-purple-400',
    glow: 'shadow-violet-500/50',
    hover: 'hover:border-violet-500/50 hover:shadow-violet-500/20',
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
    gradient: 'from-emerald-500 to-teal-400',
    glow: 'shadow-emerald-500/50',
    hover: 'hover:border-emerald-500/50 hover:shadow-emerald-500/20',
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
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-x-hidden font-sans">

      {/* ANIMATED BLOBS */}
      <div className="fixed inset-0 opacity-15 pointer-events-none z-0">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDuration:'5s'}} />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDuration:'7s',animationDelay:'2s'}} />
        <div className="absolute bottom-40 left-20 w-96 h-96 bg-violet-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDuration:'6s',animationDelay:'1s'}} />
      </div>

      <NavBar />

      {/* HERO */}
      <section className="relative pt-40 pb-28 px-6 text-center overflow-hidden">
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
          <h1 className="text-6xl md:text-8xl font-black mb-6 leading-tight">
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
      <section className="relative py-20 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
        <div className="relative max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-2 mb-4 mx-auto flex justify-center w-fit">
            <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400">Every delivery goes through</span>
          </div>
          <h2 className="text-center text-3xl md:text-4xl font-black text-white mb-12">
            8-stage verified pipeline
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {pipeline.map((step, i) => (
              <div key={step.label} className="group relative rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm p-5 text-center hover:scale-[1.06] active:scale-[0.97] transition-all duration-300 hover:shadow-2xl cursor-pointer overflow-hidden">
                {/* Colour glow on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-2xl`} />
                {/* Top edge light bar */}
                <div className={`absolute top-0 left-4 right-4 h-px bg-gradient-to-r ${step.color} opacity-0 group-hover:opacity-60 transition-opacity duration-300`} />
                <div className="relative">
                  <span className="text-slate-500 text-xs font-mono mb-2 block group-hover:text-slate-400 transition-colors">{String(i+1).padStart(2,'0')}</span>
                  <span className={`inline-block px-2 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-wider mb-3 bg-gradient-to-r ${step.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {step.label}
                  </span>
                  <p className="text-slate-400 text-xs leading-relaxed group-hover:text-slate-300 transition-colors duration-300">{step.desc}</p>
                </div>
                {i < pipeline.length-1 && (
                  <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 text-slate-600 text-lg group-hover:text-slate-400 transition-colors">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOUR PILLARS */}
      <section className="relative py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-4 mx-auto flex justify-center w-fit">
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-400">How we protect you</span>
          </div>
          <h2 className="text-center text-3xl md:text-5xl font-black text-white mb-14">
            Four layers of protection
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {pillars.map(({ icon: Icon, title, gradient, glow, hover, points }) => (
              <div key={title} className={`group relative overflow-hidden rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm p-8 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl ${hover} cursor-pointer`}>
                <div className={`absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 rounded-full blur-2xl transition-opacity duration-500`} />
                <div className="relative">
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} mb-5 shadow-lg ${glow} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-white mb-4 group-hover:text-cyan-400 transition-colors duration-300">{title}</h3>
                  <ul className="space-y-3">
                    {points.map((pt) => (
                      <li key={pt} className="flex items-start gap-3 text-sm text-slate-400">
                        <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
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

      {/* DETAILS REVEAL RULE */}
      <section className="relative py-20 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            <Eye className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-semibold tracking-widest uppercase text-cyan-300">The Golden Rule</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-8">
            Zero exposure<br />before trust is earned.
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-left mt-10">
            <div className="group relative overflow-hidden rounded-2xl border border-red-500/30 bg-red-500/5 backdrop-blur-sm p-6 hover:scale-105 transition-all duration-500 hover:border-red-500/50 hover:shadow-xl hover:shadow-red-500/10">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <p className="relative text-red-400 font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <EyeOff className="h-4 w-4" /> Before KYC + Payment
              </p>
              <ul className="relative space-y-2 text-sm text-white/70">
                <li>✗ No phone numbers</li>
                <li>✗ No exact address or airport gate</li>
                <li>✗ No personal social profiles</li>
                <li>✗ No direct contact outside BootHop</li>
              </ul>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm p-6 hover:scale-105 transition-all duration-500 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <p className="relative text-emerald-400 font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <Eye className="h-4 w-4" /> After KYC + Payment Held
              </p>
              <ul className="relative space-y-2 text-sm text-white/70">
                <li>✓ Verified phone numbers shared</li>
                <li>✓ Meeting point confirmed</li>
                <li>✓ Full name displayed</li>
                <li>✓ In-app messaging unlocked</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* PROHIBITED ITEMS */}
      <section className="relative py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl border border-red-500/30 bg-gradient-to-br from-red-500/10 to-slate-900/50 backdrop-blur-sm p-10">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-400 flex items-center justify-center shadow-lg shadow-red-500/50">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">Prohibited Items</h2>
                <p className="text-sm text-slate-400">Accounts permanently banned for violations</p>
              </div>
            </div>
            <div className="relative grid md:grid-cols-2 gap-3">
              {prohibited.map((item) => (
                <div key={item} className="group flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 hover:border-red-500/40 hover:bg-red-500/10 hover:scale-[1.02] transition-all duration-300 cursor-default">
                  <span className="text-red-400 font-bold text-lg">✗</span>
                  <span className="text-sm text-slate-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PAYMENT ESCROW */}
      <section className="relative py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2 mb-4 mx-auto flex justify-center w-fit">
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">Escrow</span>
          </div>
          <h2 className="text-center text-3xl md:text-4xl font-black text-white mb-12">
            Your money is never at risk
          </h2>
          <div className="flex flex-col md:flex-row items-center gap-4">
            {[
              { icon: CreditCard, label: 'Sender Pays', desc: 'Funds go to Stripe escrow — not the traveller', gradient: 'from-blue-500 to-cyan-400', glow: 'shadow-blue-500/50' },
              { icon: Lock, label: 'Money Locked', desc: 'Held securely until delivery is confirmed by both', gradient: 'from-amber-500 to-yellow-400', glow: 'shadow-amber-500/50' },
              { icon: Banknote, label: 'Payment Released', desc: 'Auto-released on confirmation or after timeout', gradient: 'from-emerald-500 to-teal-400', glow: 'shadow-emerald-500/50' },
            ].map(({ icon: Icon, label, desc, gradient, glow }, i) => (
              <div key={label} className="group flex-1 flex flex-col items-center text-center rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm p-8 hover:scale-105 transition-all duration-500 hover:shadow-xl">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg ${glow} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <p className="font-black text-white mb-1">{label}</p>
                <p className="text-sm text-slate-400">{desc}</p>
                {i < 2 && <ArrowRight className="h-5 w-5 text-slate-600 mt-4 md:hidden" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 text-center px-6">
        <div className="max-w-4xl mx-auto relative">
          <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-blue-600/20 to-cyan-500/10 backdrop-blur-sm p-16">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-cyan-500/5 pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                Ready to send or travel?
              </h2>
              <p className="text-slate-300 mb-10 text-lg">Every delivery protected. Every traveller verified.</p>
              <Link href="/login" className="group inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold px-10 py-5 rounded-2xl hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105">
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
