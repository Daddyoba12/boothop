'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Shield, CheckCircle, Sparkles, TrendingUp, Globe } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

export default function HowItWorksPage() {
  useScrollReveal();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const booterSteps = [
    { num: '01', title: 'Post Your Journey', desc: 'Share your route, travel dates, and available luggage capacity. Takes under 60 seconds.', icon: '✈️', image: '/images/Traveling.jpg' },
    { num: '02', title: 'Browse Requests', desc: 'See curated delivery requests along your exact route from verified senders.', icon: '🔍', image: '/images/GoingonHols.jpg' },
    { num: '03', title: 'Agree on Terms', desc: 'Confirm price and compliance through secure messaging.', icon: '🤝', image: '/images/meetup1.jpg' },
    { num: '04', title: 'Collect & Deliver', desc: 'Meet sender, carry item, deliver safely.', icon: '📦', image: '/images/Handover.jpg' },
    { num: '05', title: 'Get Paid', desc: 'Payment released instantly after confirmation.', icon: '💰', image: '/images/TrustedComm.jpg' },
  ];

  const hooperSteps = [
    { num: '01', title: 'Post Your Request', desc: 'Describe item, route, and budget.', icon: '📝', image: '/images/WBoothop.jpg' },
    { num: '02', title: 'Find Traveller', desc: 'Browse or get matched automatically.', icon: '🎯', image: '/images/boothopeveryd.jpg' },
    { num: '03', title: 'Pay Securely', desc: 'Funds held safely in escrow.', icon: '🔒', image: '/images/D_login1.jpg' },
    { num: '04', title: 'Track Delivery', desc: 'Stay connected in real time.', icon: '📍', image: '/images/Traveling.jpg' },
    { num: '05', title: 'Confirm Receipt', desc: 'Release payment and rate experience.', icon: '⭐', image: '/images/meetuup2.jpg' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white font-sans overflow-x-hidden">
      
      {/* BG */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.07),transparent_35%)]" />

      <NavBar />

      {/* HERO */}
      <section className="relative pt-40 pb-32 px-6 text-center overflow-hidden">
        <div 
          className="absolute inset-0 opacity-30"
          style={{transform: `translateY(${scrollY * 0.5}px)`}}
        >
          <div className="absolute top-20 left-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
          <div className="absolute top-40 right-1/3 w-2 h-2 bg-blue-400 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-20 left-1/2 w-2 h-2 bg-purple-400 rounded-full animate-ping" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-cyan-500/30 rounded-full px-6 py-3 mb-8 backdrop-blur-xl">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-cyan-300 font-medium">How BootHop Works</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black mb-6 leading-tight">
            Delivery,<br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
              reimagined.
            </span>
          </h1>
          <p className="text-slate-400 text-xl max-w-2xl mx-auto leading-relaxed">
            Someone is already flying London→Lagos, Manchester→Lagos, or Birmingham→Accra.
            They have space. You have something to send. We connect you — safely, cheaply, fast.
          </p>
        </div>
      </section>

      {/* BOOTER SECTION */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto relative">
          {/* Hero Card */}
          <div className="reveal reveal-scale relative mb-20 rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/10 hover:scale-[1.015] active:scale-[0.98] active:shadow-blue-500/10 hover:shadow-blue-500/25 transition-all duration-500 cursor-pointer touch-blue">
            {/* Background Image */}
            <div className="absolute inset-0">
              <img
                src="/images/Delivery.jpg"
                alt="Delivery"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-900/50 to-slate-950/30"></div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 p-6 md:p-12 relative z-10">
              <div className="flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-2 mb-6 w-fit">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-blue-300 font-semibold">For Travellers</span>
                </div>

                <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight">
                  Your journey.<br />
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    Your income.
                  </span>
                </h2>
                <p className="text-slate-400 text-lg mb-8">
                  Transform unused luggage space into a steady income stream while you travel.
                </p>
                
                <div className="flex gap-4">
                  <Link href="/register" className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 flex items-center gap-2">
                    Get Started
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute -top-6 -right-6 w-72 h-72 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-full blur-3xl"></div>
                <div className="relative bg-slate-900/40 backdrop-blur-md p-8 rounded-2xl border border-slate-700/30 shadow-xl">
                  <div className="text-slate-400 text-sm mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    POTENTIAL EARNINGS
                  </div>
                  <div className="text-5xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-4">
                    £85–£320
                  </div>
                  <p className="text-slate-400 text-sm">Per trip • Instant payout</p>
                  
                  <div className="mt-6 pt-6 border-t border-slate-700/50 grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-2xl font-bold text-white">10K+</div>
                      <div className="text-xs text-slate-400">Active Users</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">95%</div>
                      <div className="text-xs text-slate-400">Success Rate</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-cyan-400">Free</div>
                      <div className="text-xs text-slate-400">To Join</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="max-w-2xl">
            <h3 className="text-3xl font-black mb-12 flex items-center gap-3">
              <span className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
                ✨
              </span>
              How it works
            </h3>

            {booterSteps.map((s, i) => (
              <div
                key={i}
                className={`reveal d${i + 1} group flex gap-5 mb-6 p-5 rounded-2xl bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 cursor-pointer touch-blue`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-500/50 group-hover:scale-110 transition-transform duration-300">
                    {s.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-cyan-400 rounded-full flex items-center justify-center text-xs font-bold text-slate-900">
                    {s.num}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-lg mb-1.5 text-white group-hover:text-cyan-400 transition-colors duration-300">
                    {s.title}
                  </div>
                  <div className="text-slate-400 text-sm leading-relaxed">
                    {s.desc}
                  </div>
                </div>
                <div className="w-16 h-16 md:w-28 md:h-28 rounded-xl overflow-hidden flex-shrink-0 border border-white/8">
                  <img src={s.image} alt={s.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOOPER SECTION */}
      <section className="relative py-20 px-6 overflow-hidden mt-32">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto relative">
          {/* Hero Card */}
          <div className="reveal reveal-scale relative mb-20 rounded-3xl overflow-hidden shadow-2xl shadow-emerald-500/10 hover:scale-[1.015] active:scale-[0.98] active:shadow-emerald-500/10 hover:shadow-emerald-500/25 transition-all duration-500 cursor-pointer touch-emerald">
            {/* Background Image */}
            <div className="absolute inset-0">
              <img
                src="/images/GoingonHols.jpg" 
                alt="Going on Holidays" 
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-900/50 to-slate-950/30"></div>
            </div>
            
            <div className="p-6 md:p-12 relative z-10">
              <div className="flex flex-col justify-center max-w-xl">
                <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 rounded-full px-4 py-2 mb-6 w-fit">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-emerald-300 font-semibold">For Senders</span>
                </div>
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight">
                  Send it.<br />
                  <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                    They carry it.
                  </span>
                </h2>
                <p className="text-slate-400 text-lg mb-8">
                  Faster, cheaper, and more trusted delivery through our global traveller network.
                </p>
                <div className="flex gap-4">
                  <Link href="/register" className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105 flex items-center gap-2">
                    Get Started
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="max-w-2xl">
            <h3 className="text-3xl font-black mb-12 flex items-center gap-3">
              <span className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center">
                🎯
              </span>
              How it works
            </h3>

            {hooperSteps.map((s, i) => (
              <div
                key={i}
                className={`reveal d${i + 1} group flex gap-5 mb-6 p-5 rounded-2xl bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-slate-700/50 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/20 hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 cursor-pointer touch-emerald`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-emerald-500/50 group-hover:scale-110 transition-transform duration-300">
                    {s.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-teal-400 rounded-full flex items-center justify-center text-xs font-bold text-slate-900">
                    {s.num}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-lg mb-1.5 text-white group-hover:text-emerald-400 transition-colors duration-300">
                    {s.title}
                  </div>
                  <div className="text-slate-400 text-sm leading-relaxed">
                    {s.desc}
                  </div>
                </div>
                <div className="w-16 h-16 md:w-28 md:h-28 rounded-xl overflow-hidden flex-shrink-0 border border-white/8">
                  <img src={s.image} alt={s.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT CAN I SEND — CUSTOMS CALLOUT */}
      <section className="relative py-20 px-6 mt-8">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl border border-white/10 bg-white/3 overflow-hidden">
            {/* Header */}
            <div className="border-b border-white/8 px-8 py-6 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">What can I send? — Customs guide</h2>
                <p className="text-sm text-white/45">Sending to Nigeria, Ghana or West Africa? Read this first.</p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/8">
              {/* Accepted */}
              <div className="p-6">
                <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-emerald-400">Typically accepted</p>
                <ul className="space-y-2.5">
                  {[
                    'Clothes & shoes (personal use)',
                    'Letters & documents',
                    'Phones & small electronics',
                    'Gifts & household items',
                    'Food (sealed, non-perishable)',
                    'Books & magazines',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-white/65">
                      <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-400/80" />{item}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Not accepted */}
              <div className="p-6">
                <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-red-400">Never accepted</p>
                <ul className="space-y-2.5">
                  {[
                    'Cash or monetary instruments',
                    'Controlled substances / drugs',
                    'Weapons or ammunition',
                    'Counterfeit goods',
                    'Hazardous materials',
                    'Anything misrepresented',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-white/65">
                      <span className="h-3.5 w-3.5 shrink-0 text-red-400/80 font-bold text-base leading-none">✗</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Customs tips */}
              <div className="p-6">
                <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-blue-400">Customs tips for Nigeria</p>
                <ul className="space-y-3">
                  {[
                    { tip: 'Personal effects are duty-free up to a reasonable quantity', note: 'FIRS guidance' },
                    { tip: 'Electronics may attract import duty — declare honestly', note: 'NCS rules' },
                    { tip: 'Food items must be factory-sealed, clearly labelled', note: 'NAFDAC compliance' },
                    { tip: 'Traveller signs a customs declaration — sender is responsible for accuracy', note: 'BootHop policy' },
                  ].map((item) => (
                    <li key={item.tip} className="text-sm">
                      <p className="text-white/65">{item.tip}</p>
                      <p className="text-[11px] text-white/30 mt-0.5">{item.note}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {/* Footer note */}
            <div className="border-t border-white/8 bg-amber-500/5 px-8 py-4">
              <p className="text-xs text-amber-300/70">
                <span className="font-semibold text-amber-300">Important:</span> The sender is solely responsible for ensuring items comply with UK export and Nigerian import regulations.
                BootHop facilitates the connection — we do not inspect packages. Travellers are not liable for undeclared or misrepresented contents.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST LINK CARD */}
      <section className="px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <Link href="/trust-safety" className="group flex items-center justify-between rounded-2xl border border-white/8 bg-white/3 px-6 py-5 transition-all duration-200 hover:border-white/20 hover:bg-white/5">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">ID verified · Escrow payments · 8-stage pipeline</p>
                <p className="mt-0.5 text-xs text-white/40">How we keep every match safe →</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-white/25 transition-transform group-hover:translate-x-1 group-hover:text-purple-400" />
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-32 text-center px-6">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
        
        <div className="max-w-4xl mx-auto relative">
          <h2 className="text-6xl font-black mb-6 leading-tight">
            Ready to <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">transform</span><br/>
            your journey?
          </h2>
          <p className="text-slate-400 text-xl mb-12">Join thousands already earning and saving with BootHop</p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <a 
              href="/register?type=booter"
              className="group bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-10 py-5 rounded-xl text-lg font-bold hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3"
            >
              I'm a Traveller
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </a>
            <a 
              href="/register?type=hooper"
              className="group bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-10 py-5 rounded-xl text-lg font-bold hover:shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3"
            >
              I'm a Sender
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}