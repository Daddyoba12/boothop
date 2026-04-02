'use client';

import { useState } from 'react';

interface BootHopLogoProps {
  className?: string;
  textClass?: string;
  iconClass?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function BootHopLogo({
  className = '',
  textClass = '',
  iconClass = '',
  size = 'md',
}: BootHopLogoProps) {
  const [pressed, setPressed] = useState(false);

  const sizeMap = {
    sm: { svg: 'h-7 w-7', text: 'text-lg' },
    md: { svg: 'h-9 w-9', text: 'text-2xl' },
    lg: { svg: 'h-12 w-12', text: 'text-3xl' },
  };
  const s = sizeMap[size];

  return (
    <span
      className={`inline-flex items-center gap-3 select-none transition-transform duration-150 ease-out ${pressed ? 'scale-[0.88]' : 'scale-100'} ${className}`}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
    >
      {/* Premium icon: stylised boot with motion lines + hop arc */}
      <svg
        viewBox="0 0 44 44"
        xmlns="http://www.w3.org/2000/svg"
        className={`${s.svg} flex-shrink-0 drop-shadow-lg ${iconClass}`}
        aria-hidden="true"
        fill="currentColor"
      >
        {/* Gradient definition — only renders if SVG is inline */}
        <defs>
          <linearGradient id="bhGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>

        {/* Person body — forward lean, carrying pack */}
        {/* Head */}
        <circle cx="13" cy="6" r="4.5" />

        {/* Torso leaning forward */}
        <path d="M10 11 C8.5 12 8 15.5 8.5 20 L12 20 L13 14.5 L14 20 L17.5 20 C18 15.5 17.5 12 16 11 Z" />

        {/* Forward arm */}
        <path d="M10 12.5 L5.5 18 L7.5 19 L12 13.5 Z" />

        {/* Back arm reaching to pack */}
        <path d="M16 12.5 L19.5 15 L18 16.5 L14.5 14 Z" />

        {/* Legs — mid stride */}
        <path d="M10 20 L7.5 32 L11 32 L13 22 Z" />
        <path d="M14 20 L16.5 32 L20 32 L16.5 22 Z" />

        {/* Backpack / package */}
        <rect x="19" y="9" width="12" height="12" rx="2.5" />
        {/* Buckle detail */}
        <rect x="21" y="11" width="8" height="1.5" rx="0.75" fill="white" opacity="0.3" />
        <rect x="21" y="14.5" width="8" height="1.5" rx="0.75" fill="white" opacity="0.3" />

        {/* Strap connecting pack to person */}
        <path d="M19 12 L17.5 13" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round" />
        <path d="M19 17 L17.5 17.5" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round" />

        {/* Motion speed lines */}
        <path d="M3 16 L1 16" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" opacity="0.5" />
        <path d="M3.5 19.5 L1 19.5" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" opacity="0.35" />
        <path d="M4 23 L2 23" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" opacity="0.2" />

        {/* Hop arc above head */}
        <path d="M8 3 Q13 -1 18 3" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round" opacity="0.55" />
      </svg>

      {/* Wordmark */}
      <span className={`font-black tracking-tight leading-none ${s.text} ${textClass}`}>
        Boot<span
          className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent"
          style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >Hop</span>
      </span>
    </span>
  );
}
