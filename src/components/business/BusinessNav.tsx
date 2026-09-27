'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import BootHopLogo from '@/components/BootHopLogo';
import { ChevronDown, Menu, X } from 'lucide-react';

interface BusinessNavProps {
  rightSlot?: React.ReactNode;
  transparent?: boolean;
  /** Show the default Sign In dropdown + Get Started (main landing pages) */
  showDefaultNav?: boolean;
}

const SIGN_IN_OPTIONS = [
  { label: "I'm an Express Client",  sub: 'Book & track deliveries',      href: '/business/sign-in',          emoji: '⚡' },
  { label: "I'm a Carrier Partner",  sub: 'View your job dashboard',      href: '/business/carrier-sign-in',  emoji: '🚚' },
  { label: "I'm a Priority Client",  sub: 'Access my account',            href: '/business/priority-sign-in', emoji: '🏆' },
];

export function BusinessNav({ rightSlot, transparent = false, showDefaultNav = false }: BusinessNavProps) {
  const [dropOpen, setDropOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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
          transparent ? '' : 'border-b border-slate-200 bg-white/90 backdrop-blur-xl'
        }`}
      >
        {/* Logo */}
        <Link href="/business" className="flex items-center gap-4 shrink-0">
          <BootHopLogo size="md" />
          <span className="text-sm font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-full uppercase tracking-widest">
            Business
          </span>
        </Link>

        {/* Right side */}
        {rightSlot ? (
          <div className="flex items-center gap-3">{rightSlot}</div>
        ) : showDefaultNav ? (
          <>
            {/* Desktop */}
            <div className="hidden md:flex items-center gap-4">
              <a href="/" className="text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors">← BootHop</a>
              <span className="text-slate-200">|</span>
              <a href="/business/how-it-works" className="text-sm text-slate-600 hover:text-slate-900 transition-colors hidden lg:block">How It Works</a>
              <a href="/business/contact" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Contact</a>

              {/* Sign In dropdown */}
              <div className="relative" ref={dropRef}>
                <button
                  onClick={() => setDropOpen(v => !v)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Sign In <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${dropOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropOpen && (
                  <div className="absolute right-0 top-full mt-3 w-64 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/10 z-50">
                    {SIGN_IN_OPTIONS.map(({ label, sub, href, emoji }) => (
                      <a
                        key={label}
                        href={href}
                        onClick={() => setDropOpen(false)}
                        className="flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors"
                      >
                        <span className="text-lg mt-0.5">{emoji}</span>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{label}</p>
                          <p className="text-xs text-slate-600">{sub}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Get Started */}
              <a
                href="/business/get-started"
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95"
              >
                Get Started →
              </a>
            </div>

            {/* Mobile burger */}
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="md:hidden p-2 -mr-2 text-slate-600 hover:text-slate-900 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </>
        ) : null}
      </nav>

      {/* Mobile menu panel */}
      {showDefaultNav && mobileOpen && (
        <div className="fixed top-20 left-0 right-0 z-40 md:hidden border-b border-slate-200 bg-white shadow-lg px-6 py-4 flex flex-col gap-1">
          <a href="/" onClick={() => setMobileOpen(false)} className="px-2 py-3 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">← BootHop</a>
          <a href="/business/how-it-works" onClick={() => setMobileOpen(false)} className="px-2 py-3 text-sm text-slate-600 hover:text-slate-900 transition-colors border-t border-slate-100">How It Works</a>
          <a href="/business/contact" onClick={() => setMobileOpen(false)} className="px-2 py-3 text-sm text-slate-600 hover:text-slate-900 transition-colors border-t border-slate-100">Contact</a>

          <p className="px-2 pt-4 pb-1 text-xs font-semibold uppercase tracking-widest text-slate-600 border-t border-slate-100">Sign in</p>
          {SIGN_IN_OPTIONS.map(({ label, sub, href, emoji }) => (
            <a
              key={label}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="flex items-start gap-3 px-2 py-3 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <span className="text-lg mt-0.5">{emoji}</span>
              <div>
                <p className="text-sm font-bold text-slate-900">{label}</p>
                <p className="text-xs text-slate-600">{sub}</p>
              </div>
            </a>
          ))}

          <a
            href="/business/get-started"
            onClick={() => setMobileOpen(false)}
            className="mt-3 inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm px-5 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
          >
            Get Started →
          </a>
        </div>
      )}

      {/* Returning user banner — only shown when showDefaultNav is true */}
      {showDefaultNav && !mobileOpen && (
        <div className="fixed top-20 left-0 right-0 z-40 border-b border-slate-200 bg-slate-50/95 backdrop-blur-md px-6 py-2.5 flex items-center justify-center gap-3 flex-wrap">
          <span className="text-xs text-slate-600 font-medium shrink-0">Returning?</span>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <a href="/business/sign-in"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-full transition-all">
              ⚡ Express Client
            </a>
            <a href="/business/carrier-sign-in"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-full transition-all">
              🚚 Carrier Partner
            </a>
            <a href="/business/priority-sign-in"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-full transition-all">
              🏆 Priority Client
            </a>
          </div>
        </div>
      )}
    </>
  );
}
