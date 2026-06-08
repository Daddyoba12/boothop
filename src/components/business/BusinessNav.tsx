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
  { label: "I'm an Express Client",  sub: 'Book & track deliveries',      href: '/business/sign-in',          emoji: '⚡' },
  { label: "I'm a Carrier Partner",  sub: 'View your job dashboard',      href: '/business/carrier-sign-in',  emoji: '🚚' },
  { label: "I'm a Priority Client",  sub: 'Access my account',            href: '/business/priority-partner', emoji: '🏆' },
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
              href="/business/get-started"
              className="inline-flex items-center gap-2 bg-emerald-400 hover:bg-emerald-300 text-black font-black text-sm px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95"
            >
              Get Started →
            </a>
          </div>
        ) : null}
      </nav>

      {/* Returning user banner — only shown when showDefaultNav is true */}
      {showDefaultNav && (
        <div className="fixed top-20 left-0 right-0 z-40 border-b border-white/8 bg-[#0b1929]/90 backdrop-blur-md px-6 py-2.5 flex items-center justify-center gap-3 flex-wrap">
          <span className="text-xs text-white/50 font-medium shrink-0">Returning?</span>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <a href="/business/sign-in"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/75 hover:text-white bg-white/8 hover:bg-white/14 border border-white/12 hover:border-white/25 px-3 py-1.5 rounded-full transition-all">
              ⚡ Express Client
            </a>
            <a href="/business/carrier-sign-in"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/75 hover:text-white bg-white/8 hover:bg-white/14 border border-white/12 hover:border-white/25 px-3 py-1.5 rounded-full transition-all">
              🚚 Carrier Partner
            </a>
            <a href="/business/priority-partner"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/75 hover:text-white bg-white/8 hover:bg-white/14 border border-white/12 hover:border-white/25 px-3 py-1.5 rounded-full transition-all">
              🏆 Priority Client
            </a>
          </div>
        </div>
      )}
    </>
  );
}
