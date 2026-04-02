'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Package, Users, Globe, Shield, Star, ArrowRight, CheckCircle, Sparkles, TrendingUp } from 'lucide-react';
import BootHopLogo from '@/components/BootHopLogo';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

export default function AboutPage() {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-x-hidden font-sans">

      {/* ANIMATED BLOBS */}
      <div className="fixed inset-0 opacity-20 pointer-events-none z-0">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDuration:'4s'}} />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDuration:'6s',animationDelay:'2s'}} />
        <div className="absolute bottom-40 left-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDuration:'5s',animationDelay:'1s'}} />
      </div>

      <NavBar />

      {/* VIDEO HERO — three videos floating */}
      <section className="relative pt-32 pb-0 overflow-hidden">
        {/* Parallax ping dots */}
        <div className="absolute inset-0 opacity-30 pointer-events-none z-10" style={{transform:`translateY(${scrollY*0.3}px)`}}>
          <div className="absolute top-24 left-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
          <div className="absolute top-44 right-1/3 w-2 h-2 bg-blue-400 rounded-full animate-ping" style={{animationDelay:'1s'}} />
          <div className="absolute bottom-20 left-1/2 w-2 h-2 bg-purple-400 rounded-full animate-ping" style={{animationDelay:'2s'}} />
        </div>

        {/* Badge + heading above videos */}
        <div className="relative z-20 text-center px-6 mb-10">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-cyan-500/30 rounded-full px-6 py-3 mb-6 backdrop-blur-xl">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-cyan-300 font-medium">About BootHop</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black leading-tight mb-4">
            Connecting<br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent animate-pulse">
              the world.
            </span>
          </h1>
          <p className="text-slate-400 text-xl max-w-2xl mx-auto">
            One journey at a time.
          </p>
        </div>

        {/* Three Videos Side by Side — square glassmorphism boxes */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-3 gap-5">

          {/* Left Video */}
          <div className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-900/60 backdrop-blur-sm border border-blue-500/20 shadow-2xl shadow-blue-500/20 hover:scale-[1.03] hover:shadow-blue-500/40 hover:border-blue-400/40 transition-all duration-500 cursor-pointer">
            <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
              <source src="/videos/Aboutus_train.mp4" type="video/mp4" />
            </video>
            {/* Glassmorphism overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/20" />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            {/* Inner glow border */}
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 group-hover:ring-blue-400/30 transition-all duration-500" />
          </div>

          {/* Center Video (Main) */}
          <div className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-900/60 backdrop-blur-sm border border-cyan-500/25 shadow-2xl shadow-cyan-500/25 hover:scale-[1.03] hover:shadow-cyan-500/50 hover:border-cyan-400/50 transition-all duration-500 cursor-pointer">
            <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" style={{objectPosition:'center center'}}>
              <source src="/videos/about-us.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/20" />
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 group-hover:ring-cyan-400/30 transition-all duration-500" />
            {/* Badge overlay */}
            <div className="absolute bottom-5 left-5 bg-slate-950/80 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-md flex items-center justify-center flex-shrink-0">
                  <Package className="h-3 w-3 text-white" />
                </div>
                <span className="font-semibold text-white text-xs tracking-wide">About BootHop</span>
              </div>
            </div>
          </div>

          {/* Right Video */}
          <div className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-900/60 backdrop-blur-sm border border-purple-500/20 shadow-2xl shadow-purple-500/20 hover:scale-[1.03] hover:shadow-purple-500/40 hover:border-purple-400/40 transition-all duration-500 cursor-pointer">
            <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
              <source src="/videos/Aboutus_train.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/20" />
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 group-hover:ring-purple-400/30 transition-all duration-500" />
          </div>
        </div>
      </section>

      {/* OUR STORY */}
      <section className="relative py-24 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
        <div className="relative max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Left — premium highlight box */}
            <div className="group relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-600/20 to-purple-600/10 backdrop-blur-sm p-12 hover:scale-[1.02] transition-all duration-500 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl group-hover:opacity-80 transition-opacity" />
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/50 group-hover:scale-110 transition-transform duration-300">
                  <Package className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-3xl font-black text-white mb-4">Redundant Boot Space</h3>
                <p className="text-lg text-blue-200 leading-relaxed">
                  Every journey has the potential to move items. Why travel with empty space?
                </p>
              </div>
            </div>

            {/* Right — story content */}
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-6">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold uppercase tracking-widest text-blue-400">Our Story</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Our Story</h2>
              <div className="space-y-5 text-lg text-slate-400 leading-relaxed">
                <p>We started with a simple idea: <strong className="text-white">use redundant boot space to transport goods</strong> to their destination. Every journey has the potential to move items.</p>
                <p className="text-2xl font-black bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  Why drive an empty car? Why drive with an empty boot?
                </p>
                <p>Documents are even more convenient to transport. They easily fit into hand luggage, and you'd be helping someone else out.</p>
                <p className="font-bold text-white">We're helping to connect the world, one journey at a time.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OUR MISSION */}
      <section className="relative py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400">Our Mission</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-8">Our Mission</h2>

          <div className="relative overflow-hidden rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm p-12 mb-8 hover:border-slate-600 hover:shadow-2xl transition-all duration-500">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <p className="text-xl text-slate-300 mb-6 leading-relaxed">
                We love little things, small and medium-sized packages—actually anything that can be carried on an existing journey. We specialize in{' '}
                <span className="font-bold text-cyan-400">personal effects, letters, and small parcels</span>.
              </p>
              <p className="text-lg text-slate-400 mb-8">
                Courier services are great, but they're not one-size-fits-all. We are an alternative service that's flexible and convenient.
              </p>
              <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-600/30 to-cyan-600/20 backdrop-blur-sm p-8">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/5 pointer-events-none" />
                <p className="relative text-3xl font-black text-white mb-2">You are already going to make that journey</p>
                <p className="relative text-2xl text-cyan-300">—why not make it count?</p>
              </div>
            </div>
          </div>

          {/* Key Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {[
              { label: 'Personal Effects', desc: 'Small personal items delivered with care', gradient: 'from-blue-500 to-cyan-400', glow: 'shadow-blue-500/50', hover: 'hover:border-blue-500/50 hover:shadow-blue-500/20' },
              { label: 'Letters & Documents', desc: 'Important papers delivered securely', gradient: 'from-emerald-500 to-teal-400', glow: 'shadow-emerald-500/50', hover: 'hover:border-emerald-500/50 hover:shadow-emerald-500/20' },
              { label: 'Small Parcels', desc: 'Compact packages sent worldwide', gradient: 'from-purple-500 to-pink-400', glow: 'shadow-purple-500/50', hover: 'hover:border-purple-500/50 hover:shadow-purple-500/20' },
            ].map((f) => (
              <div key={f.label} className={`group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm p-6 hover:scale-105 transition-all duration-500 hover:shadow-xl ${f.hover} cursor-pointer`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                <div className="relative">
                  <div className={`w-14 h-14 bg-gradient-to-br ${f.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg ${f.glow} group-hover:scale-110 transition-transform duration-300`}>
                    <CheckCircle className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-black text-lg text-white mb-2 group-hover:text-cyan-400 transition-colors duration-300">{f.label}</h3>
                  <p className="text-slate-400 text-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OUR VALUES */}
      <section className="relative py-20 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent pointer-events-none" />
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2 mb-4">
              <Star className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold uppercase tracking-widest text-purple-400">Our Values</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Our Values</h2>
            <p className="text-xl text-slate-400">The principles that guide everything we do at BootHop</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Users, label: 'Community First', desc: 'We believe in the power of people helping people. Our platform connects communities and creates meaningful interactions between travelers and senders.', gradient: 'from-blue-500 to-cyan-400', glow: 'shadow-blue-500/50', hover: 'hover:border-blue-500/50 hover:shadow-blue-500/20' },
              { icon: Globe, label: 'Efficiency', desc: 'We maximize the potential of every journey by utilizing existing transportation capacity, reducing waste and environmental impact.', gradient: 'from-emerald-500 to-teal-400', glow: 'shadow-emerald-500/50', hover: 'hover:border-emerald-500/50 hover:shadow-emerald-500/20' },
              { icon: Shield, label: 'Trust & Safety', desc: 'Safety and trust are at the core of our platform. We provide secure transactions and verified user profiles to ensure peace of mind.', gradient: 'from-purple-500 to-pink-400', glow: 'shadow-purple-500/50', hover: 'hover:border-purple-500/50 hover:shadow-purple-500/20' },
            ].map(({ icon: Icon, label, desc, gradient, glow, hover }) => (
              <div key={label} className={`group relative overflow-hidden rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm p-10 text-center hover:scale-105 transition-all duration-500 hover:shadow-2xl ${hover} cursor-pointer`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                <div className="relative">
                  <div className={`w-20 h-20 bg-gradient-to-br ${gradient} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg ${glow} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-4 group-hover:text-cyan-400 transition-colors duration-300">{label}</h3>
                  <p className="text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="relative py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-600/20 to-purple-600/10 backdrop-blur-sm p-16">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-10 -left-10 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl" />
            </div>
            <div className="relative text-center mb-12">
              <h2 className="text-4xl font-black text-white mb-2">BootHop by the Numbers</h2>
              <p className="text-slate-400">Making a real impact on communities worldwide</p>
            </div>
            <div className="relative grid md:grid-cols-4 gap-8 text-center">
              {[
                { value: '10K+', label: 'Happy Users', gradient: 'from-blue-400 to-cyan-300' },
                { value: '50K+', label: 'Successful Deliveries', gradient: 'from-emerald-400 to-teal-300' },
                { value: '200+', label: 'Cities Covered', gradient: 'from-purple-400 to-pink-300' },
                { value: '95%', label: 'Satisfaction Rate', gradient: 'from-amber-400 to-yellow-300' },
              ].map((s) => (
                <div key={s.label} className="group">
                  <div className={`text-6xl font-black mb-2 bg-gradient-to-r ${s.gradient} bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300 inline-block`}>{s.value}</div>
                  <div className="text-slate-400">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 text-center px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
            Ready to{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
              get started?
            </span>
          </h2>
          <p className="text-xl text-slate-400 mb-12">Join thousands of travelers and senders already using BootHop</p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/register" className="group bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-10 py-5 rounded-2xl text-lg font-bold hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 inline-flex items-center justify-center gap-3">
              Sign Up Now <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            <Link href="/how-it-works" className="border border-white/20 text-white px-10 py-5 rounded-2xl text-lg font-bold hover:bg-white/10 transition-all duration-300 hover:scale-105 backdrop-blur-sm">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
