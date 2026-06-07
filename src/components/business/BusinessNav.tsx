'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import BootHopLogo from '@/components/BootHopLogo';
import { ChevronDown } from 'lucide-react';

interface BusinessNavProps {
  rightSlot?: React.ReactNode;
  transparent?: boolean;
  /** Show the default Sign In dropdown + Get Started (main landing pages) */
  showDefaultNav?: boolean;
}

const SIGN_IN_OPTIONS = [
  { label: "I'm a Business Client",  sub: 'Book express deliveries',     href: '/business',                emoji: '⚡' },
  { label: "I'm a Carrier Partner",  sub: 'Manage your profile & alerts', href: '/business/carrier-network', emoji: '🚚' },
  { label: "I'm a Priority Client",  sub: 'Access my account',            href: '/business',                emoji: '🏆' },
];

export function BusinessNav({ rightSlot, transparent = false, showDefaultNav = false }: BusinessNavProps) {
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 h-20 px-6 flex items-center justify-between ${
          transparent ? '' : 'border-b border-white/6 bg-[#020617]/90 backdrop-blur-xl'
        }`}
      >
        {/* Logo */}
        <Link href="/business" className="flex items-center gap-4 shrink-0">
          <BootHopLogo size="md" />
          <span className="text-sm font-semibold bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-full uppercase tracking-widest backdrop-blur-sm">
            Business
          </span>
        </Link>

        {/* Right side */}
        {rightSlot ? (
          <div className="flex items-center gap-3">{rightSlot}</div>
        ) : showDefaultNav ? (
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm font-semibold text-white/30 hover:text-white/70 transition-colors hidden md:block">← BootHop</a>
            <span className="text-white/10 hidden md:block">|</span>
            <a href="/business/how-it-works" className="text-sm text-white/45 hover:text-white transition-colors hidden lg:block">How It Works</a>
            <a href="/business/carrier-network" className="text-sm text-blue-400/70 hover:text-blue-300 transition-colors hidden lg:block">Carrier Network</a>
            <a href="/business/contact" className="text-sm text-white/45 hover:text-white transition-colors hidden md:block">Contact</a>

            {/* Sign In dropdown */}
            <div className="relative" ref={dropRef}>
              <button
                onClick={() => setDropOpen(v => !v)}
                className="flex items-center gap-1.5 text-sm font-semibold text-white/60 hover:text-white transition-colors"
              >
                Sign In <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${dropOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropOpen && (
                <div className="absolute right-0 top-full mt-3 w-64 bg-[#0d1f35]/95 backdrop-blur-xl border border-white/12 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 z-50">
                  {SIGN_IN_OPTIONS.map(({ label, sub, href, emoji }) => (
                    <a
                      key={label}
                      href={href}
                      onClick={() => setDropOpen(false)}
                      className="flex items-start gap-3 px-4 py-3.5 hover:bg-white/8 transition-colors"
                    >
                      <span className="text-lg mt-0.5">{emoji}</span>
                      <div>
                        <p className="text-sm font-bold text-white">{label}</p>
                        <p className="text-xs text-white/40">{sub}</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Get Started */}
            <a
              href="/business/express"
              className="inline-flex items-center gap-2 bg-emerald-400 hover:bg-emerald-300 text-black font-black text-sm px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95"
            >
              Get Started →
            </a>
          </div>
        ) : null}
      </nav>

      {/* Returning user banner — only shown when showDefaultNav is true */}
      {showDefaultNav && (
        <div className="fixed top-20 left-0 right-0 z-40 border-b border-white/4 bg-[#0d1f35]/80 backdrop-blur-sm px-6 py-2 flex items-center justify-center gap-2 text-xs text-white/40">
          <span>👋 Returning?</span>
          <a href="/business" className="hover:text-white/70 transition-colors font-semibold">Sign in as Business Client</a>
          <span>·</span>
          <a href="/business/carrier-network" className="hover:text-white/70 transition-colors font-semibold">Sign in as Carrier Partner</a>
          <span>·</span>
          <a href="/business" className="hover:text-white/70 transition-colors font-semibold">Sign in as Priority Client</a>
        </div>
      )}
    </>
  );
}
