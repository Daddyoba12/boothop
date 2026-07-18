'use client';

import { useState, useEffect, useCallback } from 'react';

export type SubscribeResult =
  | { ok: true }
  | { ok: false; reason: 'unsupported' | 'denied' | 'sw_timeout' | 'error'; message?: string };

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    setPermission(Notification.permission);
    if (Notification.permission === 'granted') {
      // Check if there's actually an active subscription
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
          .then((reg) => reg.pushManager.getSubscription())
          .then((sub) => { if (sub) setSubscribed(true); })
          .catch(() => {});
      }
    }
  }, []);

  const subscribe = useCallback(async (): Promise<SubscribeResult> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return { ok: false, reason: 'unsupported' };
    }

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return { ok: false, reason: 'error', message: 'Missing server key' };

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return { ok: false, reason: 'denied' };

      // Wait for SW with a 10-second timeout
      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('sw_timeout')), 10_000)
        ),
      ]);

      // Clear any stale subscription — wrap in its own try so it never kills the flow
      try {
        const existing = await reg.pushManager.getSubscription();
        if (existing) await existing.unsubscribe();
      } catch { /* ignore */ }

      const keyBytes = urlBase64ToUint8Array(vapidKey);
      let sub: PushSubscription;
      try {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyBytes.buffer.slice(
            keyBytes.byteOffset,
            keyBytes.byteOffset + keyBytes.byteLength
          ) as ArrayBuffer,
        });
      } catch (err: any) {
        return { ok: false, reason: 'error', message: `subscribe() failed: ${err?.message ?? err}` };
      }

      try {
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub.toJSON()),
        });
      } catch { /* saving subscription is non-critical */ }

      setSubscribed(true);
      return { ok: true };
    } catch (err: any) {
      if (err?.message === 'sw_timeout') return { ok: false, reason: 'sw_timeout' };
      return { ok: false, reason: 'error', message: String(err?.message ?? err) };
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      await fetch('/api/push/subscribe', { method: 'DELETE' });
    } catch {}
    setSubscribed(false);
    setPermission('default');
  }, []);

  return { permission, subscribed, subscribe, unsubscribe };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  // Strip any stray characters (whitespace, smart-quotes, etc.) that can creep
  // in from copy-paste or Vercel env-var encoding issues.  Only valid
  // base64url characters survive, then we convert to standard base64 for atob.
  const cleaned = base64String.replace(/[^A-Za-z0-9+/\-_=]/g, ‘’);
  if (!cleaned) throw new Error(‘VAPID public key is empty or invalid’);
  const padding = ‘=’.repeat((4 - (cleaned.length % 4)) % 4);
  const base64 = (cleaned + padding).replace(/-/g, ‘+’).replace(/_/g, ‘/’);
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
