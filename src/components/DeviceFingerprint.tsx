'use client';

import { useEffect } from 'react';

// ── Fingerprint collection ─────────────────────────────────────────────────

async function sha256(str: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // FNV-1a 32-bit fallback
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h * 16777619) >>> 0; }
  return h.toString(16).padStart(8, '0');
}

async function collectComponents(): Promise<Record<string, string | number | boolean>> {
  const c: Record<string, string | number | boolean> = {
    ua:            navigator.userAgent,
    lang:          navigator.language,
    langs:         (navigator.languages ?? []).join(','),
    platform:      navigator.platform,
    cookie:        navigator.cookieEnabled,
    dnt:           navigator.doNotTrack ?? '',
    cores:         navigator.hardwareConcurrency ?? 0,
    memory:        (navigator as any).deviceMemory ?? 0,
    touch:         navigator.maxTouchPoints ?? 0,
    sw:            screen.width,
    sh:            screen.height,
    sd:            screen.colorDepth,
    pr:            window.devicePixelRatio,
    tz:            Intl.DateTimeFormat().resolvedOptions().timeZone,
  };

  // Canvas fingerprint
  try {
    const cv  = document.createElement('canvas');
    cv.width  = 240;
    cv.height = 60;
    const ctx = cv.getContext('2d')!;
    ctx.textBaseline = 'top';
    ctx.font = '14px "Arial"';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('BootHop 🚀', 2, 15);
    ctx.fillStyle = 'rgba(102,204,0,0.7)';
    ctx.fillText('BootHop 🚀', 4, 17);
    c.canvas = cv.toDataURL().slice(-80);
  } catch { /* canvas blocked by privacy settings */ }

  // WebGL fingerprint
  try {
    const gl  = document.createElement('canvas').getContext('webgl') as WebGLRenderingContext | null;
    if (gl) {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      c.webglV = ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL)   : '';
      c.webglR = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '';
    }
  } catch { /* WebGL blocked */ }

  return c;
}

async function getFingerprint(): Promise<{ fp: string; components: Record<string, string | number | boolean> }> {
  const components = await collectComponents();
  const fp = await sha256(JSON.stringify(components));
  return { fp, components };
}

// ── Component ──────────────────────────────────────────────────────────────

export default function DeviceFingerprint() {
  useEffect(() => {
    // Only send once per session
    if (sessionStorage.getItem('bh_fp_sent')) return;

    (async () => {
      try {
        const { fp, components } = await getFingerprint();
        const res = await fetch('/api/fingerprint', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ fingerprint: fp, components }),
        });
        if (res.ok) sessionStorage.setItem('bh_fp_sent', '1');
      } catch { /* non-fatal — fingerprint is supplementary signal */ }
    })();
  }, []);

  return null; // invisible background component
}
