'use client';

import Image from 'next/image';
import { useState } from 'react';

interface BootHopLogoProps {
  className?: string;
  textClass?: string;
  iconClass?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { w: 110, h: 37 },
  md: { w: 148, h: 50 },
  lg: { w: 200, h: 67 },
};

export default function BootHopLogo({
  className = '',
  size = 'md',
}: BootHopLogoProps) {
  const [pressed, setPressed] = useState(false);
  const { w, h } = sizeMap[size];

  return (
    <span
      className={`inline-flex items-center select-none
        px-2 py-1.5 rounded-xl border border-transparent
        hover:border-cyan-500/20 hover:bg-white/5
        transition-all duration-300 ease-out cursor-pointer
        ${pressed ? 'scale-[0.92]' : 'scale-100'} ${className}`}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
    >
      <Image
        src="/images/logoMainBoothop-light.png"
        alt="BootHop"
        width={w}
        height={h}
        priority
        className="object-contain"
        style={{
          maxHeight: h,
          width: 'auto',
          filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.15)) drop-shadow(0 1px 3px rgba(0,0,0,0.4))',
        }}
      />
    </span>
  );
}
