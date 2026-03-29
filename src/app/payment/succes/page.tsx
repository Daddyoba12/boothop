'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const matchId = searchParams?.get('match_id');
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    if (matchId) {
      finalizePayment();
    }
  }, [matchId]);

  const finalizePayment = async () => {
    try {
      // Update match status
      await supabase
        .from('matches')
        .update({ status: 'accepted', payment_completed: true })
        .eq('id', matchId);

      // Update trip statuses
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

      setProcessing(false);
    } catch (error) {
      console.error('Finalization error:', error);
      setProcessing(false);
    }
  };

  if (processing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-spin" />
          <p className="text-white/70">Processing your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12">
          
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>

          <h1 className="text-3xl font-bold text-white mb-4">
            🎉 Payment Successful!
          </h1>

          <p className="text-white/70 mb-8 leading-relaxed">
            Your payment is securely held in escrow. Funds will be released to the traveler once delivery is confirmed.
          </p>

          <div className="space-y-3">
            <Link
              href={`/matches/${matchId}`}
              className="block bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-xl font-semibold hover:shadow-xl hover:shadow-blue-500/50 transition-all"
            >
              View Match Details
            </Link>
            
            <Link
              href="/dashboard"
              className="block border border-white/20 text-white py-3 rounded-xl hover:bg-white/10 transition-all"
            >
              Go to Dashboard
            </Link>
          </div>

        </div>

        <div className="mt-8 p-4 bg-blue-500/10 border border-blue-400/30 rounded-xl">
          <p className="text-blue-300 text-sm">
            💡 <strong>Next Steps:</strong> Exchange contact details with your match to arrange pickup/delivery
          </p>
        </div>

      </div>
    </div>
  );
}
