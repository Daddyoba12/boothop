'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, Shield, Package, DollarSign, Sparkles, ArrowRight, Lock, Zap, ChevronDown } from 'lucide-react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

const faqData = [
  { q: 'When do I pay?', a: 'Hoopers pay when they accept a Booter\'s offer. Booters receive payment after both parties confirm the delivery is complete.' },
  { q: 'What if the delivery isn\'t completed?', a: 'If both parties don\'t confirm completion, the payment stays in escrow. Our team will investigate and resolve the issue fairly.' },
  { q: 'Can I negotiate the price?', a: 'Yes! Booters and Hoopers can message each other to negotiate before locking in the price. Once agreed, the price is locked.' },
  { q: 'How do I receive my payment as a Booter?', a: 'Payments are automatically transferred to your bank account after both confirmations — typically 2–5 business days.' },
  { q: 'Are there any additional costs?', a: 'No hidden fees from BootHop. However, you may be responsible for customs duties or taxes imposed by authorities.' },
  { q: 'What payment methods do you accept?', a: 'All major credit/debit cards (Visa, Mastercard, Amex) and digital wallets, processed securely via Stripe.' },
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-x-hidden font-sans">

      {/* ANIMATED BLOBS */}
      <div className="fixed inset-0 opacity-20 pointer-events-none z-0">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDuration:'4s'}} />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDuration:'6s',animationDelay:'2s'}} />
        <div className="absolute bottom-40 left-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDuration:'5s',animationDelay:'1s'}} />
      </div>

      <NavBar />

      {/* HERO */}
      <section className="relative pt-40 pb-24 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-cyan-500/30 rounded-full px-6 py-3 mb-8 backdrop-blur-xl">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-cyan-300 font-medium">Transparent Pricing</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black mb-6 leading-tight">
            Simple,{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
              fair fees.
            </span>
          </h1>
          <p className="text-slate-400 text-xl max-w-2xl mx-auto leading-relaxed">
            No hidden charges. No monthly plans. Pay only when you transact — everyone wins.
          </p>
        </div>
      </section>

      {/* PRICING CARDS */}
      <section className="relative py-16 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">

          {/* Hooper Card */}
          <div className="group relative overflow-hidden rounded-3xl border border-blue-500/25 bg-gradient-to-br from-blue-600/15 to-slate-900/40 backdrop-blur-sm p-10 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20 hover:border-blue-400/40 transition-all duration-500 cursor-default active:scale-[0.98]">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl group-hover:opacity-80 transition-opacity" />
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/50 group-hover:scale-110 transition-transform duration-300">
                <Package className="h-7 w-7 text-white" />
              </div>
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1 mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-400">For Hoopers · Senders</span>
              </div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-7xl font-black bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">+3%</span>
              </div>
              <p className="text-slate-400 mb-8 text-sm">Service fee on top of the agreed price</p>

              {/* Example breakdown */}
              <div className="bg-slate-900/60 rounded-2xl p-5 mb-8 border border-white/8">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Example · £100 delivery</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Agreed price</span>
                    <span className="text-white font-semibold">£100.00</span>
                  </div>
                  <div className="flex justify-between text-blue-400">
                    <span>+ Service fee (3%)</span>
                    <span className="font-semibold">£3.00</span>
                  </div>
                  <div className="border-t border-white/10 pt-2 flex justify-between text-base font-black">
                    <span className="text-white">You pay</span>
                    <span className="text-cyan-400">£103.00</span>
                  </div>
                </div>
              </div>

              <ul className="space-y-3">
                {['Pay only when a Booter accepts', 'Funds held securely in escrow', 'Released only after dual confirmation'].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-slate-400 text-sm">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Booter Card */}
          <div className="group relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-emerald-600/15 to-slate-900/40 backdrop-blur-sm p-10 hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/20 hover:border-emerald-400/40 transition-all duration-500 cursor-default active:scale-[0.98]">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl group-hover:opacity-80 transition-opacity" />
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/50 group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="h-7 w-7 text-white" />
              </div>
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">For Booters · Travellers</span>
              </div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-7xl font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">−5%</span>
              </div>
              <p className="text-slate-400 mb-8 text-sm">Deducted from the agreed price on payout</p>

              <div className="bg-slate-900/60 rounded-2xl p-5 mb-8 border border-white/8">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Example · £100 delivery</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Agreed price</span>
                    <span className="text-white font-semibold">£100.00</span>
                  </div>
                  <div className="flex justify-between text-red-400">
                    <span>− Service fee (5%)</span>
                    <span className="font-semibold">£5.00</span>
                  </div>
                  <div className="border-t border-white/10 pt-2 flex justify-between text-base font-black">
                    <span className="text-white">You receive</span>
                    <span className="text-emerald-400">£95.00</span>
                  </div>
                </div>
              </div>

              <ul className="space-y-3">
                {['Earn money on your existing travels', 'Fee covers identity verification & escrow', 'Automatic payout after both confirmations'].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-slate-400 text-sm">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FEE TABLE */}
      <section className="relative py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2 mb-4">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Fee Breakdown</span>
            </div>
            <h2 className="text-4xl font-black text-white">At a glance</h2>
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-5 px-6 text-slate-400 font-semibold">Agreed Price</th>
                  <th className="text-right py-5 px-6 text-blue-400 font-semibold">Hooper Pays<br/><span className="text-xs font-normal text-slate-500">(+3%)</span></th>
                  <th className="text-right py-5 px-6 text-emerald-400 font-semibold">Booter Receives<br/><span className="text-xs font-normal text-slate-500">(−5%)</span></th>
                  <th className="text-right py-5 px-6 text-slate-500 font-semibold">Platform Fee</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { agreed: 50,  hooper: 51.50, booter: 47.50, fee: 4 },
                  { agreed: 100, hooper: 103,   booter: 95,    fee: 8 },
                  { agreed: 200, hooper: 206,   booter: 190,   fee: 16 },
                  { agreed: 500, hooper: 515,   booter: 475,   fee: 40 },
                ].map((row, i) => (
                  <tr key={row.agreed} className={`border-b border-white/5 hover:bg-white/3 transition-colors duration-200 ${i % 2 === 0 ? '' : 'bg-white/2'}`}>
                    <td className="py-4 px-6 font-bold text-white">£{row.agreed}</td>
                    <td className="py-4 px-6 text-right text-blue-400 font-bold">£{row.hooper.toFixed(2)}</td>
                    <td className="py-4 px-6 text-right text-emerald-400 font-bold">£{row.booter.toFixed(2)}</td>
                    <td className="py-4 px-6 text-right text-slate-500">£{row.fee.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ESCROW PIPELINE */}
      <section className="relative py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2 mb-4">
              <Lock className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Secure Escrow</span>
            </div>
            <h2 className="text-4xl font-black text-white mb-2">How your money is protected</h2>
            <p className="text-slate-400">Every penny secured, every step of the way</p>
          </div>

          <div className="space-y-4">
            {[
              { num: '01', title: 'Agreement & Lock-In', desc: 'Both parties agree on the price. Once locked in, the price cannot change.', gradient: 'from-blue-500 to-cyan-400', glow: 'shadow-blue-500/40' },
              { num: '02', title: 'Payment to Escrow', desc: 'Hooper pays (agreed + 3%). Funds held securely — Booter cannot touch them yet.', gradient: 'from-amber-500 to-yellow-400', glow: 'shadow-amber-500/40' },
              { num: '03', title: 'Delivery', desc: 'Booter delivers the item safely to the agreed destination.', gradient: 'from-purple-500 to-pink-400', glow: 'shadow-purple-500/40' },
              { num: '04', title: 'Dual Confirmation Required', desc: 'BOTH parties must confirm: Booter confirms delivery, Hooper confirms receipt & condition.', gradient: 'from-orange-500 to-red-400', glow: 'shadow-orange-500/40' },
              { num: '05', title: 'Automatic Release', desc: 'Once both confirm, payment releases automatically to the Booter. Fair for everyone.', gradient: 'from-emerald-500 to-teal-400', glow: 'shadow-emerald-500/40' },
            ].map((step, i) => (
              <div key={i} className="group flex gap-5 p-6 rounded-2xl border border-white/8 bg-white/3 hover:bg-white/6 hover:border-white/15 hover:scale-[1.01] transition-all duration-400 cursor-default active:scale-[0.99]">
                <div className={`w-14 h-14 bg-gradient-to-br ${step.gradient} rounded-2xl flex items-center justify-center font-black text-white shadow-lg ${step.glow} flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                  {step.num}
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-white text-lg mb-1 group-hover:text-cyan-400 transition-colors duration-300">{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NO HIDDEN FEES */}
      <section className="relative py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-600/10 to-slate-900/40 backdrop-blur-sm p-12 text-center">
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/50">
                <Check className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-4xl font-black text-white mb-3">No Hidden Fees</h2>
              <p className="text-slate-400 text-lg mb-10 max-w-lg mx-auto">What you see is what you pay. No surprises, no additional charges.</p>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { icon: '❌', title: 'No Listing Fees', desc: 'Post journeys or requests for free' },
                  { icon: '❌', title: 'No Monthly Fees', desc: 'Pay only when you transact' },
                  { icon: '❌', title: 'No Cancellation Fees', desc: 'Cancel anytime before acceptance' },
                ].map((item) => (
                  <div key={item.title} className="bg-white/5 rounded-2xl p-5 border border-white/8 hover:bg-white/8 hover:scale-105 transition-all duration-300 active:scale-[0.98]">
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <p className="font-bold text-white mb-1 text-sm">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-white mb-2">FAQ</h2>
            <p className="text-slate-400">Everything you need to know</p>
          </div>
          <div className="space-y-3">
            {faqData.map((item, i) => (
              <div
                key={i}
                className={`overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer ${openFaq === i ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-white/8 bg-white/3 hover:bg-white/5 hover:border-white/15'}`}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div className="flex items-center justify-between px-6 py-5">
                  <h3 className={`font-bold text-sm md:text-base transition-colors duration-300 ${openFaq === i ? 'text-cyan-400' : 'text-white'}`}>{item.q}</h3>
                  <ChevronDown className={`h-5 w-5 flex-shrink-0 ml-4 text-slate-500 transition-transform duration-300 ${openFaq === i ? 'rotate-180 text-cyan-400' : ''}`} />
                </div>
                {openFaq === i && (
                  <div className="px-6 pb-5">
                    <p className="text-slate-400 text-sm leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 px-6 text-center">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-cyan-600/10 to-purple-600/10 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-600/15 to-purple-600/10 backdrop-blur-sm p-16">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-10 -left-10 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl" />
            </div>
            <div className="relative">
              <h2 className="text-5xl font-black text-white mb-4">Ready to get started?</h2>
              <p className="text-slate-400 text-xl mb-10">Fair, transparent pricing. Join thousands already using BootHop.</p>
              <div className="flex flex-col sm:flex-row gap-5 justify-center">
                <Link
                  href="/register?type=booter"
                  className="group bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-10 py-5 rounded-2xl text-base font-bold hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-105 active:scale-[0.97] transition-all duration-200 inline-flex items-center justify-center gap-3"
                >
                  Become a Booter
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
                <Link
                  href="/register?type=hooper"
                  className="group border border-white/20 text-white px-10 py-5 rounded-2xl text-base font-bold hover:bg-white/10 hover:border-white/40 hover:scale-105 active:scale-[0.97] transition-all duration-200 inline-flex items-center justify-center gap-3 backdrop-blur-sm"
                >
                  Become a Hooper
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
