'use client';

import { useEffect, useState } from 'react';

const EXPIRY   = new Date('2026-07-15T00:00:00Z');
const STORAGE  = 'bh_wc_dismissed';

export default function WorldCupWidget() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Date.now() >= EXPIRY.getTime()) return;
    if (typeof window !== 'undefined' && localStorage.getItem(STORAGE)) return;
    setVisible(true);
  }, []);

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
          position:        'absolute',
          top:             '4px',
          right:           '4px',
          zIndex:          1,
          width:           '20px',
          height:          '20px',
          borderRadius:    '50%',
          background:      'rgba(0,0,0,0.65)',
          border:          'none',
          color:           '#fff',
          fontSize:        '11px',
          lineHeight:      '20px',
          textAlign:       'center',
          cursor:          'pointer',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          padding:         0,
        }}
      >
        ✕
      </button>

      {/* Video */}
      <video
        src="/videos/aboutuspart1.mp4"
        autoPlay
        muted
        loop
        playsInline
        style={{ width: '100%', display: 'block', aspectRatio: '9/16', objectFit: 'cover' }}
      />

      {/* World Cup badge overlay */}
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
