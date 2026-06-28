'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ttTrack } from '@/lib/tiktok';

// Fires ttq.page() on every client-side route change (SPA navigation)
export function TikTokPageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined' || !window.ttq) return;
    window.ttq.page();
  }, [pathname]);

  return null;
}

// Drop into any server component page to fire ViewContent on mount
export function TikTokViewContent({ contentName, contentType = 'product' }: {
  contentName: string;
  contentType?: string;
}) {
  useEffect(() => {
    ttTrack('ViewContent', { content_name: contentName, content_type: contentType });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
