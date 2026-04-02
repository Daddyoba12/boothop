'use client';

import { useEffect, useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
      setDeferredPrompt(null);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 flex justify-center">
      <div className="w-full max-w-md rounded-2xl border border-cyan-500/30 bg-slate-900/95 backdrop-blur-2xl shadow-2xl shadow-blue-500/20 p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/40">
          <Smartphone className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">Install BootHop</p>
          <p className="text-xs text-slate-400 truncate">Add to your home screen for the best experience</p>
        </div>
        <button
          onClick={handleInstall}
          className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold px-4 py-2 rounded-xl hover:shadow-lg hover:shadow-blue-500/40 hover:scale-105 active:scale-[0.97] transition-all duration-200 shrink-0"
        >
          <Download className="h-3.5 w-3.5" />
          Install
        </button>
        <button
          onClick={() => setVisible(false)}
          className="p-1.5 text-slate-500 hover:text-white transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
