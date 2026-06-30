'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function ShareHandler() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const title = params.get('title') ?? '';
    const text = params.get('text') ?? '';
    const url = params.get('url') ?? '';

    // Combine shared content and try to extract origin/destination
    const combined = [title, text, url].filter(Boolean).join(' ');

    // Store shared content for the /start flow to pick up
    if (combined) {
      sessionStorage.setItem('boothop_shared_content', combined);
    }

    router.replace('/start?role=sender');
  }, [params, router]);

  return (
    <div className="min-h-screen bg-[#07111f] flex items-center justify-center">
      <p className="text-white/40 text-sm">Opening BootHop…</p>
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07111f]" />}>
      <ShareHandler />
    </Suspense>
  );
}
