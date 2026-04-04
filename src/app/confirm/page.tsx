'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import BootHopLogo from '@/components/BootHopLogo';

const ACTION_LABELS: Record<string, string> = {
  confirm_match:       'Confirming your match…',
  decline_match:       'Declining match…',
  accept_negotiation:  'Accepting proposed price…',
  reject_negotiation:  'Rejecting negotiation…',
  confirm_collected:   'Confirming item collected…',
  confirm_delivered:   'Confirming delivery…',
};

function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [redirectTo, setRedirectTo] = useState('/dashboard');
  const [actionType, setActionType] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No token found in this link. Please check your email and try again.');
      return;
    }

    async function processToken() {
      const res = await fetch('/api/auth/confirm-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'This link is invalid or has expired.');
        return;
      }

      setStatus('success');
      setMessage(data.message || 'Action completed successfully.');
      setRedirectTo(data.redirectTo || '/dashboard');
      setActionType(data.action_type || '');

      // Auto-redirect after 2 seconds
      setTimeout(() => router.replace(data.redirectTo || '/dashboard'), 2000);
    }

    processToken();
  }, [searchParams, router]);

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">
        <div className="mb-10 flex justify-center">
          <Link href="/">
            <BootHopLogo iconClass="text-white" textClass="text-white" />
          </Link>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-10 shadow-2xl backdrop-blur text-center">

          {status === 'loading' && (
            <>
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/20 border border-blue-500/30">
                <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
              </div>
              <h1 className="text-xl font-bold text-white mb-2">
                {ACTION_LABELS[actionType] || 'Processing…'}
              </h1>
              <p className="text-sm text-slate-400">Please wait while we verify your link.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/20 border border-green-500/30">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Done!</h1>
              <p className="text-sm text-slate-300 mb-6">{message}</p>
              <p className="text-xs text-slate-500 mb-4">Redirecting you now…</p>
              <Link
                href={redirectTo}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/20 border border-red-500/30">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Link invalid</h1>
              <p className="text-sm text-slate-400 mb-6">{message}</p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all"
              >
                Go to login <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense>
      <ConfirmContent />
    </Suspense>
  );
}
