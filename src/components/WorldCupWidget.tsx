'use client';

import { useEffect, useRef, useState } from 'react';

const EXPIRY  = new Date('2026-07-15T00:00:00Z');
const STORAGE = 'bh_wc_dismissed';
const VIDEOS  = [
  '/videos/wc_logo_1.mp4',
  '/videos/wc_logo_2.mp4',
  '/videos/wc_logo_3.mp4',
];

export default function WorldCupWidget() {
  const [visible, setVisible]   = useState(false);
  const [index, setIndex]       = useState(0);
  const videoRef                = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (Date.now() >= EXPIRY.getTime()) return;
    if (typeof window !== 'undefined' && localStorage.getItem(STORAGE)) return;
    setVisible(true);
  }, []);

  function onEnded() {
    setIndex(i => (i + 1) % VIDEOS.length);
  }

  // When index changes, reload the video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [index]);

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(STORAGE, '1');
    setVisible(false);
  }

  return (
    <div
      style={{
        position:     'fixed',
        bottom:       '88px',
        right:        '16px',
        zIndex:       9999,
        width:        '120px',
        borderRadius: '14px',
        overflow:     'hidden',
        boxShadow:    '0 8px 32px rgba(0,0,0,0.55)',
        border:       '2px solid rgba(255,255,255,0.12)',
        background:   '#0f172a',
      }}
    >
      {/* Dismiss button */}
      <button
        onClick={dismiss}
        aria-label="Close"
        style={{
          position:       'absolute',
          top:            '4px',
          right:          '4px',
          zIndex:         1,
          width:          '20px',
          height:         '20px',
          borderRadius:   '50%',
          background:     'rgba(0,0,0,0.65)',
          border:         'none',
          color:          '#fff',
          fontSize:       '11px',
          cursor:         'pointer',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          padding:        0,
        }}
      >
        ✕
      </button>

      {/* Rotating video */}
      <video
        ref={videoRef}
        key={index}
        src={VIDEOS[index]}
        autoPlay
        muted
        playsInline
        onEnded={onEnded}
        style={{ width: '100%', display: 'block', aspectRatio: '9/16', objectFit: 'cover' }}
      />

      {/* World Cup badge */}
      <div
        style={{
          position:   'absolute',
          bottom:     0,
          left:       0,
          right:      0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
          padding:    '8px 6px 6px',
          textAlign:  'center',
        }}
      >
        <div style={{ fontSize: '16px', lineHeight: 1 }}>⚽</div>
        <div style={{ color: '#facc15', fontSize: '7px', fontWeight: 700, letterSpacing: '0.05em', marginTop: '2px' }}>
          WORLD CUP 2026
        </div>
        <div style={{ color: '#10b981', fontSize: '7px', fontWeight: 600, marginTop: '1px' }}>
          BootHop
        </div>
      </div>
    </div>
  );
}
