'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import BootHopLogo from './BootHopLogo';

const links = [
  { href: '/about',        label: 'About Us' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/pricing',      label: 'Pricing' },
  { href: '/trust-safety', label: 'Trust & Safety' },
  { href: '/journeys',     label: 'Live Journeys' },
];

export default function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-slate-950/85 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-6">

        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <BootHopLogo iconClass="text-white" textClass="text-white" />
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
                    ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
          <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors duration-200 px-3 py-1.5">
            Log in
          </Link>
          <Link
            href="/register"
            className="text-sm font-bold bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-5 py-2 rounded-xl hover:shadow-lg hover:shadow-blue-500/40 hover:scale-105 active:scale-[0.97] transition-all duration-200"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile burger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-white/10 bg-slate-950/95 backdrop-blur-2xl px-6 py-4 flex flex-col gap-2">
          {links.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {label}
              </Link>
            );
          })}
          <div className="border-t border-white/10 mt-2 pt-3 flex flex-col gap-2">
            <Link href="/login" onClick={() => setOpen(false)} className="px-4 py-3 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200">
              Log in
            </Link>
            <Link href="/register" onClick={() => setOpen(false)} className="px-4 py-3 rounded-xl text-sm font-bold text-center bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/40 transition-all duration-200">
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
