'use client';

import { useEffect } from 'react';
import BootHopLogo from '@/components/BootHopLogo';
import Link from 'next/link';

// When video ends, redirect to homepage
// QR code on business card points here: www.boothop.com/watch
const VIDEO_ID = 'WrBap-JjCH4';

export default function WatchPage() {
  useEffect(() => {
    // Listen for YouTube player API events
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);

    (window as any).onYouTubeIframeAPIReady = () => {
      new (window as any).YT.Player('yt-player', {
        videoId: VIDEO_ID,
        playerVars: {
          autoplay: 1,
          mute: 1,
          rel: 0,
          modestbranding: 1,
          color: 'white',
          playsinline: 1,
        },
      });
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/8">
        <Link href="/">
          <BootHopLogo size="md" />
        </Link>
        <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors">
          Visit boothop.com →
        </Link>
      </nav>

      {/* Video */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-black text-white mb-2 text-center">
          How BootHop Works
        </h1>
        <p className="text-slate-400 mb-6 text-center text-sm">
          Watch the full walkthrough — then get started at boothop.com
        </p>

        <div className="w-full max-w-3xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-blue-500/20">
          <div style={{ paddingBottom: '56.25%', position: 'relative', height: 0 }}>
            <div id="yt-player" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
          </div>
        </div>

        <p className="text-slate-500 text-xs mt-6 text-center">
          Get started at{' '}
          <a href="https://www.boothop.com" className="text-blue-400 hover:underline">
            www.boothop.com
          </a>
        </p>
      </div>

      {/* Footer */}
      <div className="text-center py-4 border-t border-white/5">
        <p className="text-xs text-slate-600">© {new Date().getFullYear()} BootHop Ltd · Verified. Compliant. Same-Day.</p>
      </div>
    </div>
  );
}
