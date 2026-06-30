'use client';

import { useState, useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function PushPermissionBanner() {
  const { permission, subscribed, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash

  useEffect(() => {
    // Only show after a small delay, once we know the state
    if (permission === 'default' && !subscribed) {
      const alreadyDismissed = localStorage.getItem('boothop_push_dismissed');
      if (!alreadyDismissed) {
        const t = setTimeout(() => setDismissed(false), 2000);
        return () => clearTimeout(t);
      }
    }
  }, [permission, subscribed]);

  if (dismissed || permission === 'denied' || subscribed) return null;

  function handleEnable() {
    subscribe().then(ok => {
      if (ok) setDismissed(true);
    });
  }

  function handleDismiss() {
    localStorage.setItem('boothop_push_dismissed', '1');
    setDismissed(true);
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div className="rounded-2xl border border-white/10 bg-[#0d1829]/95 backdrop-blur-xl shadow-2xl px-4 py-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl leading-none mt-0.5">🔔</span>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-snug">Stay in the loop</p>
            <p className="text-white/50 text-xs mt-0.5 leading-relaxed">
              Get notified when a match is found, payment confirmed, or your package is delivered.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleEnable}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-bold text-xs"
              >
                Enable
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-2 rounded-xl border border-white/10 text-white/40 text-xs hover:text-white/60 transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
