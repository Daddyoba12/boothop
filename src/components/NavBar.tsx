'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import BootHopLogo from './BootHopLogo';

const links = [
  { href: '/how-it-works',    label: 'How It Works' },
  { href: '/journeys',        label: 'Live Journeys' },
  { href: '/pricing',         label: 'Pricing' },
  { href: '/about',           label: 'About' },
  { href: '/trust-safety',    label: 'Trust & Safety' },
  { href: '/blog',            label: 'Blog' },
  { href: '/business',        label: 'For Business' },
];

interface NavBarProps {
  /** True while a dismissible top banner (e.g. a promo strip) is showing above
   *  the nav, so the nav shifts down instead of sitting under/behind it. */
  bannerVisible?: boolean;
}

export default function NavBar({ bannerVisible = false }: NavBarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className={`fixed w-full z-50 border-b border-slate-200 bg-white/90 backdrop-blur-2xl transition-all duration-500 ${bannerVisible ? 'top-10' : 'top-0'}`}>
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-6">

        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <BootHopLogo size="md" />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {links.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'text-blue-600 bg-blue-50 border border-blue-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
          <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900 transition-colors duration-200 px-3 py-1.5">
            Log in
          </Link>
          <Link
            href="/start"
            className="text-sm font-bold bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-5 py-2 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105 active:scale-[0.97] transition-all duration-200"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile burger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-slate-500 hover:text-slate-900 transition-colors"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-2xl px-6 py-4 flex flex-col gap-2">
          {links.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'text-blue-600 bg-blue-50 border border-blue-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {label}
              </Link>
            );
          })}
          <div className="border-t border-slate-200 mt-2 pt-3 flex flex-col gap-2">
            <Link href="/login" onClick={() => setOpen(false)} className="px-4 py-3 rounded-xl text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200">
              Log in
            </Link>
            <Link href="/start" onClick={() => setOpen(false)} className="px-4 py-3 rounded-xl text-sm font-bold text-center bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200">
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
