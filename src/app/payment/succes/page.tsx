'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import {
  CheckCircle, Loader2, Lock, Package, ArrowRight,
  Shield, Eye, CreditCard,
} from 'lucide-react';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-key'
);

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
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    if (matchId) finalizePayment();
  }, [matchId]);

  const finalizePayment = async () => {
    try {
      // Payment is confirmed — mark as active (payment held + KYC done = ready)
      await supabase
        .from('matches')
        .update({
          status:            'active',
          payment_status:    'escrowed',
          payment_completed: true,
        })
        .eq('id', matchId);

      const { data: match } = await supabase
        .from('matches')
        .select('sender_trip_id, traveler_trip_id')
        .eq('id', matchId)
        .single();

      if (match) {
        await supabase
          .from('trips')
          .update({ status: 'matched' })
          .in('id', [match.sender_trip_id, match.traveler_trip_id]);
      }
    } catch (error) {
      console.error('Finalization error:', error);
    } finally {
      setProcessing(false);
    }
  };

  if (processing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-spin" />
          <p className="text-white/70">Confirming your payment…</p>
        </div>
      </div>
    );
  }

  // Pipeline: active = stage index 5 (0-based)
  const activeStage = 5;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">

        {/* Success card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 mb-6 text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Payment secured!</h1>
          <p className="text-white/60 leading-relaxed text-sm mb-8">
            Your funds are held in Stripe escrow — completely safe. They&apos;ll only be
            released when <strong className="text-white/80">both parties confirm delivery</strong>.
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
                      active ? 'bg-blue-500/30 border-blue-400 ring-2 ring-blue-400/30' :
                               'bg-white/5 border-white/10'
                    }`}>
                      {done && <CheckCircle className="h-3 w-3 text-white" />}
                    </div>
                    <span className={`text-[8px] font-semibold uppercase tracking-wide whitespace-nowrap ${
                      done || active ? 'text-white/60' : 'text-white/15'
                    }`}>{s.label}</span>
                  </div>
                  {i < STAGES.length - 1 && (
                    <div className={`w-5 h-px mb-4 mx-0.5 ${i < activeStage ? 'bg-blue-500' : 'bg-white/10'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* What's unlocked */}
          <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-5 text-left mb-8">
            <p className="text-green-300 font-semibold text-sm mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4" /> Now unlocked
            </p>
            <ul className="space-y-2 text-sm text-white/60">
              <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-400 shrink-0" /> Verified phone numbers shared</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-400 shrink-0" /> Meeting point confirmed</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-400 shrink-0" /> In-app messaging unlocked</li>
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
              className="block border border-white/10 text-white/60 hover:text-white py-3 rounded-2xl hover:bg-white/5 transition-all text-sm"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>

        {/* Escrow reminder */}
        <div className="flex items-start gap-3 px-5 py-4 rounded-2xl border border-white/5 bg-white/[0.03]">
          <Lock className="h-4 w-4 text-white/30 shrink-0 mt-0.5" />
          <p className="text-xs text-white/30 leading-relaxed">
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
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-spin" />
            <p className="text-white/70">Loading...</p>
          </div>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
