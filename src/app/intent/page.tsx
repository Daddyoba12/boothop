'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, Plane, ArrowRight, Shield, CheckCircle, LogOut } from 'lucide-react';
import { createSupabaseClient } from '@/lib/supabase';

export default function IntentPage() {
  const router   = useRouter();
  const supabase = createSupabaseClient();

  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(true);
  const [hover, setHover]     = useState<'send' | 'travel' | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(me => {
      if (!me.authenticated || !me.user?.email) { router.replace('/login'); return; }
      setEmail(me.user.email);
      setLoading(false);
    });
  }, [router]);

  const signOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex flex-col">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
        <Link href="/" className="text-2xl font-bold text-white tracking-tight">
          Boot<span className="text-blue-400">Hop</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="hidden sm:block text-sm text-white/50">{email}</span>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </div>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30">
            <CheckCircle className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-300">Logged in</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
            What are you doing today?
          </h1>
          <p className="text-white/50 text-lg max-w-md mx-auto">
            Choose your intent — no permanent role, just what you need right now.
          </p>
        </div>

        {/* ── Choice cards ── */}
        <div className="grid md:grid-cols-2 gap-6 w-full max-w-2xl">

          {/* SEND */}
          <button
            onClick={() => router.push('/requests/create')}
            onMouseEnter={() => setHover('send')}
            onMouseLeave={() => setHover(null)}
            className={`group relative rounded-3xl border p-8 text-left transition-all duration-300 cursor-pointer ${
              hover === 'send'
                ? 'border-blue-400 bg-blue-500/20 shadow-2xl shadow-blue-500/20 scale-[1.02]'
                : 'border-white/10 bg-white/5 hover:border-blue-500/50'
            }`}
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all ${
              hover === 'send' ? 'bg-blue-500' : 'bg-blue-500/20'
            }`}>
              <Package className={`h-8 w-8 transition-all ${hover === 'send' ? 'text-white' : 'text-blue-400'}`} />
            </div>

            <h2 className="text-2xl font-black text-white mb-2">Send a Package</h2>
            <p className="text-white/50 text-sm leading-relaxed mb-6">
              Need to get something delivered internationally? Post your item and we&apos;ll match you with a verified traveller on that route.
            </p>

            <ul className="space-y-2 mb-8">
              {['Post item details', 'Get matched automatically', 'Pay into secure escrow', 'Confirm delivery & rate'].map((s) => (
                <li key={s} className="flex items-center gap-2 text-sm text-white/60">
                  <CheckCircle className="h-3.5 w-3.5 text-blue-400 shrink-0" /> {s}
                </li>
              ))}
            </ul>

            <div className={`flex items-center gap-2 font-semibold text-sm transition-all ${
              hover === 'send' ? 'text-blue-300' : 'text-blue-400'
            }`}>
              Post a delivery request <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* TRAVEL */}
          <button
            onClick={() => router.push('/journeys/create')}
            onMouseEnter={() => setHover('travel')}
            onMouseLeave={() => setHover(null)}
            className={`group relative rounded-3xl border p-8 text-left transition-all duration-300 cursor-pointer ${
              hover === 'travel'
                ? 'border-cyan-400 bg-cyan-500/20 shadow-2xl shadow-cyan-500/20 scale-[1.02]'
                : 'border-white/10 bg-white/5 hover:border-cyan-500/50'
            }`}
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all ${
              hover === 'travel' ? 'bg-cyan-500' : 'bg-cyan-500/20'
            }`}>
              <Plane className={`h-8 w-8 transition-all ${hover === 'travel' ? 'text-white' : 'text-cyan-400'}`} />
            </div>

            <h2 className="text-2xl font-black text-white mb-2">I&apos;m Travelling</h2>
            <p className="text-white/50 text-sm leading-relaxed mb-6">
              Got spare luggage space on your trip? Post your route and earn money by carrying verified packages for fellow community members.
            </p>

            <ul className="space-y-2 mb-8">
              {['Post your route & dates', 'Accept matched requests', 'Complete ID verification', 'Get paid on delivery'].map((s) => (
                <li key={s} className="flex items-center gap-2 text-sm text-white/60">
                  <CheckCircle className="h-3.5 w-3.5 text-cyan-400 shrink-0" /> {s}
                </li>
              ))}
            </ul>

            <div className={`flex items-center gap-2 font-semibold text-sm transition-all ${
              hover === 'travel' ? 'text-cyan-300' : 'text-cyan-400'
            }`}>
              Post my trip <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        {/* ── Trust note ── */}
        <div className="mt-10 flex items-center gap-3 text-white/30 text-xs">
          <Shield className="h-4 w-4" />
          <span>KYC verification and escrow payment required before any details are shared between parties</span>
        </div>
      </div>
    </div>
  );
}
