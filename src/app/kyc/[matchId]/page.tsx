'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Shield, CheckCircle, Clock, UserCheck, CreditCard,
  Package, Plane, AlertCircle, ArrowRight, Loader2,
  Eye, Lock, RefreshCw, FileText, Info,
} from 'lucide-react';
import { createSupabaseClient } from '@/lib/supabase';

// ─── Pipeline ──────────────────────────────────────────────────────────────────
const PIPELINE = [
  { key: 'created',      label: 'Created',      icon: Package },
  { key: 'matched',      label: 'Matched',      icon: CheckCircle },
  { key: 'accepted',     label: 'Accepted',     icon: UserCheck },
  { key: 'kyc_pending',  label: 'KYC',          icon: Shield },
  { key: 'kyc_complete', label: 'KYC Done',     icon: CheckCircle },
  { key: 'payment_held', label: 'Payment Held', icon: CreditCard },
  { key: 'active',       label: 'Active',       icon: Eye },
  { key: 'completed',    label: 'Completed',    icon: CheckCircle },
  { key: 'released',     label: 'Released',     icon: Lock },
];
const STATUS_ORDER = PIPELINE.map((s) => s.key);
function pipelineIndex(status: string) {
  const i = STATUS_ORDER.indexOf(status);
  return i === -1 ? 0 : i;
}

type MatchData = {
  id: string;
  status: string;
  agreed_price: number;
  sender_user_id: string;
  traveler_user_id: string;
  sender_kyc_status:   'none' | 'pending' | 'verified' | 'failed';
  traveler_kyc_status: 'none' | 'pending' | 'verified' | 'failed';
  sender_accepted:  boolean;
  traveler_accepted: boolean;
  sender_trip:   { from_city: string; to_city: string; travel_date: string };
  traveler_trip: { from_city: string; to_city: string; travel_date: string };
};

function KycBadge({ status }: { status: string }) {
  if (status === 'verified')
    return <span className="flex items-center gap-1 text-green-400 text-xs font-semibold"><CheckCircle className="h-3.5 w-3.5" /> Verified</span>;
  if (status === 'pending')
    return <span className="flex items-center gap-1 text-amber-400 text-xs font-semibold"><Clock className="h-3.5 w-3.5" /> Pending</span>;
  if (status === 'failed')
    return <span className="flex items-center gap-1 text-red-400 text-xs font-semibold"><AlertCircle className="h-3.5 w-3.5" /> Failed</span>;
  return <span className="flex items-center gap-1 text-white/30 text-xs font-semibold"><Clock className="h-3.5 w-3.5" /> Not started</span>;
}

function PipelineBar({ status }: { status: string }) {
  const current = pipelineIndex(status);
  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex items-center min-w-max gap-0">
        {PIPELINE.map((step, i) => {
          const done   = i < current;
          const active = i === current;
          const Icon   = step.icon;
          return (
            <div key={step.key} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  done   ? 'bg-blue-500 border-blue-500' :
                  active ? 'bg-blue-500/20 border-blue-400 ring-4 ring-blue-400/20' :
                           'bg-white/5 border-white/10'
                }`}>
                  <Icon className={`h-3.5 w-3.5 ${done || active ? 'text-white' : 'text-white/20'}`} />
                </div>
                <span className={`text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap ${
                  done || active ? 'text-white/70' : 'text-white/20'
                }`}>{step.label}</span>
              </div>
              {i < PIPELINE.length - 1 && (
                <div className={`w-8 h-0.5 mb-5 mx-1 rounded-full ${i < current ? 'bg-blue-500' : 'bg-white/10'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Pre-payment form (T&C + insurance + goods value) ─────────────────────────
function PrePaymentForm({
  deliveryPrice,
  onPay,
  loading,
}: {
  deliveryPrice: number;
  onPay: (goodsValue: number, termsAccepted: boolean, insuranceAccepted: boolean) => void;
  loading: boolean;
}) {
  const [goodsValue,       setGoodsValue]       = useState('');
  const [termsAccepted,    setTermsAccepted]    = useState(false);
  const [insuranceAccepted, setInsuranceAccepted] = useState(true); // default ON

  const parsedGoods     = parseFloat(goodsValue) || 0;
  const insuranceFee    = insuranceAccepted && parsedGoods > 0 ? parsedGoods * 0.075 : 0;
  const total           = deliveryPrice + insuranceFee;
  const canSubmit       = termsAccepted && goodsValue !== '' && parsedGoods > 0;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center shrink-0">
            <CreditCard className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-1">Almost there — finalise your payment</h3>
            <p className="text-white/50 text-sm leading-relaxed">
              Before we lock the escrow, please confirm your goods value, read the terms, and set your insurance.
            </p>
          </div>
        </div>

        {/* Goods value */}
        <div className="mb-5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">
            Declared goods value (£) <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm font-bold">£</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={goodsValue}
              onChange={(e) => setGoodsValue(e.target.value)}
              className="w-full pl-8 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <p className="text-xs text-white/30 mt-1.5">
            This is used to calculate insurance and must be accurate. Understating value voids insurance cover.
          </p>
        </div>

        {/* Insurance toggle */}
        <div className={`rounded-2xl border p-5 mb-5 transition-all ${
          insuranceAccepted ? 'border-amber-500/40 bg-amber-500/10' : 'border-white/10 bg-white/5'
        }`}>
          <label className="flex items-start gap-4 cursor-pointer">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={insuranceAccepted}
                onChange={(e) => setInsuranceAccepted(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                insuranceAccepted ? 'bg-amber-500 border-amber-500' : 'border-white/30 bg-white/5'
              }`}>
                {insuranceAccepted && <CheckCircle className="h-3 w-3 text-white" />}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <p className="text-white font-semibold text-sm">BootHop Delivery Protection</p>
                <span className={`text-sm font-bold ${insuranceAccepted ? 'text-amber-400' : 'text-white/30'}`}>
                  {parsedGoods > 0 ? `£${insuranceFee.toFixed(2)}` : '7.5%'}
                </span>
              </div>
              <p className="text-white/50 text-xs leading-relaxed">
                7.5% of declared goods value. Covers loss or damage during transit.{' '}
                <Link href="/terms#insurance" className="text-amber-400 underline" target="_blank">
                  See coverage details →
                </Link>
              </p>
            </div>
          </label>
        </div>

        {/* Price breakdown */}
        {parsedGoods > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 divide-y divide-white/5 mb-5 text-sm">
            <div className="flex justify-between px-5 py-3">
              <span className="text-white/50">Delivery fee</span>
              <span className="text-white font-medium">£{deliveryPrice.toFixed(2)}</span>
            </div>
            {insuranceAccepted && (
              <div className="flex justify-between px-5 py-3">
                <span className="text-white/50">Delivery protection (7.5%)</span>
                <span className="text-amber-400 font-medium">£{insuranceFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between px-5 py-3 bg-white/5 rounded-b-xl">
              <span className="text-white font-bold">Total due</span>
              <span className="text-blue-400 font-bold text-base">£{total.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* T&C checkbox */}
        <div className={`rounded-2xl border p-5 transition-all ${
          termsAccepted ? 'border-green-500/40 bg-green-500/10' : 'border-white/10 bg-white/5'
        }`}>
          <label className="flex items-start gap-4 cursor-pointer">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                termsAccepted ? 'bg-green-500 border-green-500' : 'border-white/30 bg-white/5'
              }`}>
                {termsAccepted && <CheckCircle className="h-3 w-3 text-white" />}
              </div>
            </div>
            <div>
              <p className="text-white text-sm leading-relaxed">
                I have read and agree to BootHop&apos;s{' '}
                <Link href="/terms" target="_blank" className="text-blue-400 underline font-semibold hover:text-blue-300">
                  Terms &amp; Conditions
                </Link>
                . I confirm that the goods are accurately described, legal in both origin and destination countries, and I accept full responsibility for customs duties.
              </p>
            </div>
          </label>
        </div>
      </div>

      {!termsAccepted && (
        <div className="flex items-center gap-2 text-xs text-amber-400">
          <Info className="h-3.5 w-3.5 shrink-0" />
          You must accept the Terms &amp; Conditions to proceed to payment.
        </div>
      )}

      <button
        onClick={() => onPay(parsedGoods, termsAccepted, insuranceAccepted)}
        disabled={!canSubmit || loading}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
        {loading ? 'Redirecting to payment…' : `Pay £${total.toFixed(2)} into Escrow`}
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function KycPage() {
  const params       = useParams();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const matchId      = params.matchId as string;
  const supabase     = createSupabaseClient();

  const [match,      setMatch]      = useState<MatchData | null>(null);
  const [userId,     setUserId]     = useState<string>('');
  const [role,       setRole]       = useState<'sender' | 'traveler' | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [kycLoading, setKycLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const loadMatch = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace('/login'); return; }
    setUserId(user.id);

    const { data, error: err } = await supabase
      .from('matches')
      .select(`
        *,
        sender_trip:sender_trip_id(from_city, to_city, travel_date),
        traveler_trip:traveler_trip_id(from_city, to_city, travel_date)
      `)
      .eq('id', matchId)
      .single();

    if (err || !data) { setError('Match not found.'); setLoading(false); return; }

    setMatch(data as MatchData);
    setRole(data.sender_user_id === user.id ? 'sender' : 'traveler');
    setLoading(false);
  }, [matchId, router, supabase]);

  useEffect(() => { loadMatch(); }, [loadMatch]);

  useEffect(() => {
    if (searchParams.get('kyc_return') === '1') {
      const t = setTimeout(() => loadMatch(), 2000);
      return () => clearTimeout(t);
    }
  }, [searchParams, loadMatch]);

  const startKyc = async () => {
    setKycLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/kyc/create-session', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ matchId }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Could not start verification.'); return; }
      window.location.href = json.url;
    } catch (e: any) {
      setError(e.message);
    } finally {
      setKycLoading(false);
    }
  };

  const startPayment = async (goodsValue: number, termsAccepted: boolean, insuranceAccepted: boolean) => {
    setPayLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/create-checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          amount:           match?.agreed_price,
          goodsValue,
          termsAccepted,
          insuranceAccepted,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Payment failed.'); return; }
      if (json.url) window.location.href = json.url;
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPayLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (error && !match) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-white text-lg font-semibold mb-2">Something went wrong</p>
          <p className="text-white/50 mb-6">{error}</p>
          <Link href="/dashboard" className="text-blue-400 underline text-sm">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  if (!match || !role) return null;

  const myKycStatus    = role === 'sender' ? match.sender_kyc_status   : match.traveler_kyc_status;
  const theirKycStatus = role === 'sender' ? match.traveler_kyc_status : match.sender_kyc_status;
  const myKycDone      = myKycStatus    === 'verified';
  const theirKycDone   = theirKycStatus === 'verified';
  const bothKycDone    = myKycDone && theirKycDone;

  const canPay = role === 'sender' && bothKycDone &&
    (match.status === 'kyc_complete' || match.status === 'payment_pending');

  const route       = match.sender_trip ? `${match.sender_trip.from_city} → ${match.sender_trip.to_city}` : '';
  const returnCheck = searchParams.get('kyc_return') === '1' ? 'Checking your verification…' : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">

      {/* Nav */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-white">Boot<span className="text-blue-400">Hop</span></Link>
        <Link href="/dashboard" className="text-sm text-white/50 hover:text-white transition-colors">← Dashboard</Link>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* Pipeline */}
        <div className="mb-10">
          <p className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-4">Delivery pipeline</p>
          <PipelineBar status={match.status} />
        </div>

        {/* Route card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 mb-8">
          <div className="flex items-center gap-3 mb-1">
            {role === 'sender' ? <Package className="h-5 w-5 text-blue-400" /> : <Plane className="h-5 w-5 text-cyan-400" />}
            <span className="text-white font-semibold">{route}</span>
          </div>
          <p className="text-sm text-white/40 capitalize">
            You are the <strong className="text-white/70">{role}</strong> on this delivery
          </p>
          {match.agreed_price && (
            <p className="text-sm text-white/40 mt-1">Delivery price: <span className="text-white font-bold">£{match.agreed_price}</span></p>
          )}
        </div>

        {/* Return notice */}
        {returnCheck && (
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-blue-500/20 border border-blue-500/30 px-5 py-4">
            <Loader2 className="h-5 w-5 text-blue-400 animate-spin shrink-0" />
            <p className="text-blue-200 text-sm">{returnCheck} <button onClick={loadMatch} className="underline ml-2">Refresh</button></p>
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-red-500/20 border border-red-500/30 px-5 py-4">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* KYC STATUS CARDS */}
        <div className="mb-8">
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-400" /> Identity Verification (KYC)
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className={`rounded-2xl border p-5 ${myKycDone ? 'border-green-500/30 bg-green-500/10' : 'border-white/10 bg-white/5'}`}>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-2">You ({role})</p>
              <KycBadge status={myKycStatus || 'none'} />
              {myKycStatus === 'failed' && <p className="text-xs text-red-300 mt-2">Verification failed. Please try again.</p>}
            </div>
            <div className={`rounded-2xl border p-5 ${theirKycDone ? 'border-green-500/30 bg-green-500/10' : 'border-white/10 bg-white/5'}`}>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-2">{role === 'sender' ? 'Traveller' : 'Sender'}</p>
              <KycBadge status={theirKycStatus || 'none'} />
            </div>
          </div>
        </div>

        {/* ACTION AREA */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8">

          {/* CAN PAY → show pre-payment form */}
          {canPay && (
            <PrePaymentForm
              deliveryPrice={match.agreed_price || 0}
              onPay={startPayment}
              loading={payLoading}
            />
          )}

          {/* BOTH KYC DONE, traveler → wait for payment */}
          {bothKycDone && role === 'traveler' && match.status !== 'payment_held' && match.status !== 'active' && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-white font-bold text-xl mb-2">Both identities verified!</h3>
              <p className="text-white/50 text-sm">Waiting for the sender to review terms and pay into escrow. You&apos;ll be notified by email.</p>
            </div>
          )}

          {/* ACTIVE */}
          {(match.status === 'active' || match.status === 'payment_held') && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <Eye className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-white font-bold text-xl mb-2">All clear — delivery is live!</h3>
              <p className="text-white/50 text-sm mb-6">Payment held in escrow, both IDs verified. Contact details and meeting point are now unlocked.</p>
              <Link href={`/matches/${matchId}`} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-2xl transition-all">
                View full match details <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          {/* MY KYC NOT DONE */}
          {!myKycDone && match.status !== 'active' && match.status !== 'completed' && match.status !== 'released' && (
            <div>
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Shield className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">Verify your identity</h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    Both parties must complete ID verification before any details are shared. Takes ~2 minutes — passport or driving licence required.
                  </p>
                </div>
              </div>
              <div className="space-y-3 mb-8">
                {['Passport, driving licence or national ID', 'Live selfie (face-match)', 'Secured by Stripe Identity'].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-blue-400 shrink-0" />{item}
                  </div>
                ))}
              </div>
              <button
                onClick={startKyc}
                disabled={kycLoading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition-all"
              >
                {kycLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserCheck className="h-5 w-5" />}
                {kycLoading ? 'Starting verification…' : 'Start identity verification'}
              </button>
              {myKycStatus === 'pending' && (
                <button onClick={loadMatch} className="w-full mt-3 flex items-center justify-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors">
                  <RefreshCw className="h-3.5 w-3.5" /> Check verification status
                </button>
              )}
            </div>
          )}

          {/* MY KYC DONE, WAITING */}
          {myKycDone && !theirKycDone && match.status !== 'active' && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-amber-400" />
              </div>
              <h3 className="text-white font-bold text-xl mb-2">Your identity is verified!</h3>
              <p className="text-white/50 text-sm mb-4">
                Waiting for the {role === 'sender' ? 'traveller' : 'sender'} to complete their verification.
              </p>
              <button onClick={loadMatch} className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors mx-auto">
                <RefreshCw className="h-3.5 w-3.5" /> Refresh status
              </button>
            </div>
          )}
        </div>

        {/* Safety note */}
        <div className="mt-8 rounded-2xl border border-white/5 bg-white/[0.03] p-5 flex items-start gap-4">
          <Lock className="h-5 w-5 text-white/30 shrink-0 mt-0.5" />
          <p className="text-xs text-white/30 leading-relaxed">
            <strong className="text-white/50">No contact details shared until</strong> both identities verified, Terms accepted, and payment held in escrow.{' '}
            <Link href="/trust-safety" className="text-blue-400 hover:underline">Learn more →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
