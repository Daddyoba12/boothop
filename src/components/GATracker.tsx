'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

declare global {
  function gtag(...args: unknown[]): void;
}

export default function GATracker({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!gaId || typeof gtag === 'undefined') return;
    const url = pathname + (searchParams.toString() ? '?' + searchParams.toString() : '');
    gtag('config', gaId, { page_path: url });
  }, [pathname, searchParams, gaId]);

  return null;
}
