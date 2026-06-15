'use client';

import { useState } from 'react';

interface BootHopLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  textClass?: string;
  iconClass?: string;
}

export default function BootHopLogo({
  className = '',
  size = 'md',
}: BootHopLogoProps) {
  const [pressed, setPressed] = useState(false);

  const heightMap = {
    sm:  'h-16',
    md:  'h-20',
    lg:  'h-28',
  };

  return (
    <span
      className={`inline-flex items-center select-none cursor-pointer
        px-3 py-2 rounded-xl border border-transparent
        hover:border-cyan-500/30 hover:bg-cyan-500/[0.08] hover:shadow-lg hover:shadow-cyan-500/20
        transition-all duration-300 ease-out
        ${pressed ? 'scale-[0.88]' : 'scale-100'}
        ${className}`}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
    >
      <img
        src="/images/boothop-icon-512.png"
        alt="BootHop"
        className={`${heightMap[size]} w-auto object-contain
          transition-all duration-300 ease-out rounded-xl`}
        style={{ mixBlendMode: 'screen' }}
        draggable={false}
      />
    </span>
  );
}
