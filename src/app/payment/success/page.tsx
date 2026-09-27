'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle, Lock, ArrowRight,
  Shield, Eye, CreditCard, Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { ttTrack } from '@/lib/tiktok';

// Pipeline display (same as KYC page)
const STAGES = [
  { label: 'Created'      },
  { label: 'Matched'      },
  { label: 'Accepted'     },
  { label: 'KYC'          },
  { label: 'Payment Held' },
  { label: 'Active'       },
  { label: 'Completed'    },
  { label: 'Released'     },
];

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const matchId      = searchParams?.get('match_id');

  useEffect(() => {
    ttTrack('CompletePayment', { content_id: matchId ?? '', content_type: 'delivery' });
  }, [matchId]);

  // Pipeline: active = stage index 5 (0-based)
  const activeStage = 5;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">

        {/* Success card */}
        <div className="bg-white border border-slate-200 shadow-[0_20px_60px_rgba(15,23,42,0.08)] rounded-3xl p-10 mb-6 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Payment secured!</h1>
          <p className="text-slate-600 leading-relaxed text-sm mb-8">
            Your funds are held in Stripe escrow — completely safe. They&apos;ll only be
            released when <strong className="text-slate-700">both parties confirm delivery</strong>.
          </p>

          {/* Mini pipeline */}
          <div className="flex items-center justify-center gap-0 overflow-x-auto pb-2 mb-8">
            {STAGES.map((s, i) => {
              const done   = i < activeStage;
              const active = i === activeStage;
              return (
                <div key={s.label} className="flex items-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      done   ? 'bg-blue-500 border-blue-500' :
                      active ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-200' :
                               'bg-slate-50 border-slate-200'
                    }`}>
                      {done && <CheckCircle className="h-3 w-3 text-white" />}
                    </div>
                    <span className={`text-[8px] font-semibold uppercase tracking-wide whitespace-nowrap ${
                      done || active ? 'text-slate-600' : 'text-slate-300'
                    }`}>{s.label}</span>
                  </div>
                  {i < STAGES.length - 1 && (
                    <div className={`w-5 h-px mb-4 mx-0.5 ${i < activeStage ? 'bg-blue-500' : 'bg-slate-200'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* What's unlocked */}
          <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-left mb-8">
            <p className="text-green-700 font-semibold text-sm mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4" /> Now unlocked
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" /> Verified phone numbers shared</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" /> Meeting point confirmed</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" /> In-app messaging unlocked</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Link
              href={`/matches/${matchId}`}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-2xl transition-all"
            >
              View match &amp; contact details <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="block border border-slate-200 text-slate-600 hover:text-slate-900 py-3 rounded-2xl hover:bg-slate-50 transition-all text-sm"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>

        {/* Escrow reminder */}
        <div className="flex items-start gap-3 px-5 py-4 rounded-2xl border border-slate-200 bg-white">
          <Lock className="h-4 w-4 text-slate-300 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 leading-relaxed">
            Funds are held by Stripe — not BootHop, not the traveller. They are released only
            when you confirm receipt after delivery. If something goes wrong, raise a dispute
            and we&apos;ll review.
          </p>
        </div>

      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <p className="text-slate-600">Loading...</p>
          </div>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
