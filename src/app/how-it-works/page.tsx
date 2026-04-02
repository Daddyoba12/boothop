'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Shield, CheckCircle, Star, Sparkles, TrendingUp, Globe, Lock, ArrowUp } from 'lucide-react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

export default function HowItWorksPage() {
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState('booter');
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const booterSteps = [
    { num: '01', title: 'Post Your Journey', desc: 'Share your route, travel dates, and available luggage capacity. Takes under 60 seconds.', icon: '✈️' },
    { num: '02', title: 'Browse Requests', desc: 'See curated delivery requests along your exact route from verified senders.', icon: '🔍' },
    { num: '03', title: 'Agree on Terms', desc: 'Confirm price and compliance through secure messaging.', icon: '🤝' },
    { num: '04', title: 'Collect & Deliver', desc: 'Meet sender, carry item, deliver safely.', icon: '📦' },
    { num: '05', title: 'Get Paid', desc: 'Payment released instantly after confirmation.', icon: '💰' },
  ];

  const hooperSteps = [
    { num: '01', title: 'Post Your Request', desc: 'Describe item, route, and budget.', icon: '📝' },
    { num: '02', title: 'Find Traveller', desc: 'Browse or get matched automatically.', icon: '🎯' },
    { num: '03', title: 'Pay Securely', desc: 'Funds held safely in escrow.', icon: '🔒' },
    { num: '04', title: 'Track Delivery', desc: 'Stay connected in real time.', icon: '📍' },
    { num: '05', title: 'Confirm Receipt', desc: 'Release payment and rate experience.', icon: '⭐' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white font-sans overflow-x-hidden">
      
      {/* Animated background */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDuration: '4s'}}></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDuration: '6s', animationDelay: '2s'}}></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDuration: '5s', animationDelay: '1s'}}></div>
      </div>

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
            <span className="text-sm text-cyan-300 font-medium">The Future of Delivery</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black mb-6 leading-tight">
            Delivery,<br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent animate-pulse">
              reimagined.
            </span>
          </h1>
          <p className="text-slate-400 text-xl max-w-2xl mx-auto leading-relaxed">
            A revolutionary trusted network connecting travellers and senders worldwide.
          </p>
        </div>
      </section>

      {/* BOOTER SECTION */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto relative">
          {/* Hero Card */}
          <div className="relative mb-20 rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/10">
            {/* Background Image */}
            <div className="absolute inset-0">
              <img 
                src="/images/Delivery.jpg" 
                alt="Delivery" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-900/50 to-slate-950/30"></div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 p-12 relative z-10">
              <div className="flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-2 mb-6 w-fit">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-blue-300 font-semibold">For Travellers</span>
                </div>
                
                <h2 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
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
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h3 className="text-3xl font-black mb-12 flex items-center gap-3">
                <span className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
                  ✨
                </span>
                How it works
              </h3>
              
              {booterSteps.map((s, i) => (
                <div 
                  key={i} 
                  className="group flex gap-6 mb-8 p-6 rounded-2xl bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20 cursor-pointer"
                  style={{animationDelay: `${i * 100}ms`}}
                >
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-500/50 group-hover:scale-110 transition-transform duration-300">
                      {s.icon}
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-cyan-400 rounded-full flex items-center justify-center text-xs font-bold text-slate-900">
                      {s.num}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-xl mb-2 text-white group-hover:text-cyan-400 transition-colors duration-300">
                      {s.title}
                    </div>
                    <div className="text-slate-400 text-sm leading-relaxed">
                      {s.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-6 sticky top-32">
              {[
                { label: '£320 max', sublabel: 'Per trip', gradient: 'from-blue-500 to-cyan-400', icon: '💎' },
                { label: '10K users', sublabel: 'Worldwide', gradient: 'from-purple-500 to-pink-400', icon: '🌍' },
                { label: '95% success', sublabel: 'Completion', gradient: 'from-emerald-500 to-teal-400', icon: '✓' },
                { label: 'Free', sublabel: 'No fees', gradient: 'from-orange-500 to-yellow-400', icon: '🎁' },
              ].map((stat, i) => (
                <div 
                  key={i}
                  className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 p-8 hover:scale-105 transition-all duration-500 hover:shadow-2xl cursor-pointer"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                  <div className="text-4xl mb-3">{stat.icon}</div>
                  <div className="text-2xl font-black text-white mb-1">{stat.label}</div>
                  <div className="text-sm text-slate-400">{stat.sublabel}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOOPER SECTION */}
      <section className="relative py-20 px-6 overflow-hidden mt-32">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto relative">
          {/* Hero Card */}
          <div className="relative mb-20 rounded-3xl overflow-hidden shadow-2xl shadow-emerald-500/10">
            {/* Background Image */}
            <div className="absolute inset-0">
              <img 
                src="/images/GoingonHols.jpg" 
                alt="Going on Holidays" 
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-900/50 to-slate-950/30"></div>
            </div>
            
            <div className="p-12 relative z-10">
              <div className="flex flex-col justify-center max-w-xl">
                <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 rounded-full px-4 py-2 mb-6 w-fit">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-emerald-300 font-semibold">For Senders</span>
                </div>
                <h2 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
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
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="grid grid-cols-2 gap-6 sticky top-32">
              {[
                { label: '70% cheaper', sublabel: 'Save more', gradient: 'from-emerald-500 to-teal-400', icon: '💰' },
                { label: '50K deliveries', sublabel: 'Completed', gradient: 'from-blue-500 to-cyan-400', icon: '📦' },
                { label: '200 cities', sublabel: 'Worldwide', gradient: 'from-purple-500 to-pink-400', icon: '🌐' },
                { label: 'Free', sublabel: 'No fees', gradient: 'from-orange-500 to-yellow-400', icon: '✨' },
              ].map((stat, i) => (
                <div 
                  key={i}
                  className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 p-8 hover:scale-105 transition-all duration-500 hover:shadow-2xl cursor-pointer"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                  <div className="text-4xl mb-3">{stat.icon}</div>
                  <div className="text-2xl font-black text-white mb-1">{stat.label}</div>
                  <div className="text-sm text-slate-400">{stat.sublabel}</div>
                </div>
              ))}
            </div>
            
            <div>
              <h3 className="text-3xl font-black mb-12 flex items-center gap-3">
                <span className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center">
                  🎯
                </span>
                How it works
              </h3>
              
              {hooperSteps.map((s, i) => (
                <div 
                  key={i} 
                  className="group flex gap-6 mb-8 p-6 rounded-2xl bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-slate-700/50 hover:border-emerald-500/50 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/20 cursor-pointer"
                >
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-emerald-500/50 group-hover:scale-110 transition-transform duration-300">
                      {s.icon}
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-teal-400 rounded-full flex items-center justify-center text-xs font-bold text-slate-900">
                      {s.num}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-xl mb-2 text-white group-hover:text-emerald-400 transition-colors duration-300">
                      {s.title}
                    </div>
                    <div className="text-slate-400 text-sm leading-relaxed">
                      {s.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SAFETY */}
      <section className="relative py-32 px-6 mt-32">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-800/30 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-400/30 rounded-full px-6 py-3 mb-6">
              <Lock className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300 font-semibold">Bank-Level Security</span>
            </div>
            <h2 className="text-5xl font-black mb-4">Built on trust</h2>
            <p className="text-slate-400 text-lg">Your safety is our top priority</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: 'Verification', desc: 'All users verified with government ID and background checks.', color: 'blue' },
              { icon: CheckCircle, title: 'Escrow Protection', desc: 'Funds protected until successful delivery confirmation.', color: 'emerald' },
              { icon: Star, title: 'Rating System', desc: 'Trusted community with transparent reviews and ratings.', color: 'purple' },
            ].map((item, i) => (
              <div 
                key={i}
                className="group relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 p-10 rounded-3xl hover:border-slate-600 transition-all duration-500 hover:scale-105 hover:shadow-2xl cursor-pointer"
              >
                <div className={`absolute inset-0 bg-gradient-to-br from-${item.color}-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                <div className="relative">
                  <div className={`w-16 h-16 bg-gradient-to-br from-${item.color}-500 to-${item.color}-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-${item.color}-500/50 group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-black text-2xl mb-3 text-white">{item.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
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