'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function OpenHandler() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const target = params.get('target') ?? '';
    // web+boothop://track/abc123 → /track/abc123
    // web+boothop://dashboard → /dashboard
    try {
      const path = target.replace(/^web\+boothop:\/\//, '/').replace(/^\/\//, '/');
      router.replace(path || '/dashboard');
    } catch {
      router.replace('/dashboard');
    }
  }, [params, router]);

  return (
    <div className="min-h-screen bg-[#07111f] flex items-center justify-center">
      <p className="text-white/40 text-sm">Opening BootHop…</p>
    </div>
  );
}

export default function OpenPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07111f]" />}>
      <OpenHandler />
    </Suspense>
  );
}
