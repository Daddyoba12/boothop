'use client';

import Image from 'next/image';
import Link from 'next/link';

interface BusinessNavProps {
  /** Content rendered on the right side (links, buttons, email, logout) */
  rightSlot?: React.ReactNode;
  /** When true the nav has no bottom border — use this for overlaying a video */
  transparent?: boolean;
}

/**
 * Shared nav for every page under /business.
 * Logo always links back to /business.
 */
export function BusinessNav({ rightSlot, transparent = false }: BusinessNavProps) {
  return (
    <nav
      className={`px-6 py-4 flex items-center justify-between ${
        transparent ? '' : 'border-b border-white/6'
      }`}
    >
      {/* Logo → /business */}
      <Link href="/business" className="flex items-center gap-3 group shrink-0">
        <div className="relative h-9 w-9 rounded-xl overflow-hidden ring-1 ring-white/10 group-hover:ring-emerald-400/40 transition-all duration-300 shadow-lg shadow-black/40">
          <Image src="/images/logo.jpg" alt="BootHop logo" fill className="object-cover" priority />
        </div>
        <div className="text-xl font-black tracking-tight group-hover:opacity-85 transition-opacity drop-shadow-lg">
          Boot<span className="text-emerald-400">Hop</span>
          <span className="ml-2 text-xs font-semibold bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-full uppercase tracking-widest backdrop-blur-sm">
            Business
          </span>
        </div>
      </Link>

      {/* Right-side slot (nav links, user email, logout, etc.) */}
      {rightSlot && (
        <div className="flex items-center gap-3">{rightSlot}</div>
      )}
    </nav>
  );
}
