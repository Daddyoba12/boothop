'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';
import {
  Shield, CheckCircle, Clock, UserCheck, CreditCard,
  Package, Plane, AlertCircle, ArrowRight, Loader2,
  Eye, Lock, RefreshCw,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────
type KycStatus = 'none' | 'pending' | 'verified' | 'failed';

type MatchDetails = {
  id: string;
  status: string;
  agreed_price: number;
  sender_email: string;
  traveler_email: string;
  sender_kyc_status: KycStatus;
  traveler_kyc_status: KycStatus;
  sender_trip: { from_city: string; to_city: string; travel_date: string } | null;
};

type PageData = {
  match: MatchDetails;
  userRole: 'sender' | 'traveler';
  alreadyAccepted: boolean;
};

// ─── KYC Badge ─────────────────────────────────────────────────────────────────
function KycBadge({ status }: { status: KycStatus }) {
  if (status === 'verified')
    return <span className="flex items-center gap-1 text-green-600 text-xs font-semibold"><CheckCircle className="h-3.5 w-3.5" /> Verified</span>;
  if (status === 'pending')
    return <span className="flex items-center gap-1 text-amber-600 text-xs font-semibold"><Clock className="h-3.5 w-3.5" /> Pending review</span>;
  if (status === 'failed')
    return <span className="flex items-center gap-1 text-red-600 text-xs font-semibold"><AlertCircle className="h-3.5 w-3.5" /> Failed — retry</span>;
  return <span className="flex items-center gap-1 text-slate-600 text-xs font-semibold"><Clock className="h-3.5 w-3.5" /> Not started</span>;
}

// ─── Pipeline steps ────────────────────────────────────────────────────────────
const STEPS = ['Matched', 'Agreed', 'Terms signed', 'KYC', 'Payment', 'Active'];
const STATUS_TO_STEP: Record<string, number> = {
  matched: 0, agreed: 1, committed: 2, kyc_pending: 3,
  kyc_complete: 3, payment_pending: 4, payment_processing: 4, active: 5, completed: 5,
};

function PipelineBar({ status }: { status: string }) {
  const current = STATUS_TO_STEP[status] ?? 0;
  return (
    <div className="flex items-center gap-0 w-full mb-8">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center flex-1 min-w-0">
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all ${
              i < current  ? 'bg-blue-500 border-blue-500 text-white' :
              i === current ? 'bg-blue-100 border-blue-400 text-blue-700 ring-4 ring-blue-100' :
                              'bg-slate-50 border-slate-200 text-slate-300'
            }`}>{i < current ? '✓' : i + 1}</div>
            <span className={`text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap hidden sm:block ${
              i <= current ? 'text-slate-600' : 'text-slate-300'
            }`}>{label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 rounded-full mb-3 ${i < current ? 'bg-blue-500' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main KYC content ──────────────────────────────────────────────────────────
function KycContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const matchId      = searchParams.get('matchId');

  const [data,           setData]           = useState<PageData | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [kycLoading,     setKycLoading]     = useState(false);
  const [stripeLoading,  setStripeLoading]  = useState(false);
  const [goodsValue,     setGoodsValue]     = useState('');
  const [insureGoods,    setInsureGoods]    = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [signupCredit,   setSignupCredit]   = useState<number>(0); // pence

  const loadData = async () => {
    if (!matchId) { setError('No match ID provided.'); setLoading(false); return; }
    try {
      const res = await fetch(`/api/matches/${matchId}/details`);
      if (res.status === 401) { router.replace(`/login?next=/kyc?matchId=${matchId}`); return; }
      if (!res.ok) { const j = await res.json(); setError(j.error || 'Failed to load match.'); setLoading(false); return; }
      const json = await res.json();
      setData(json);
      // Check for unspent signup credit (best-effort)
      fetch('/api/user/credit').then(r => r.ok ? r.json() : null).then(c => {
        if (c && !c.redeemed) setSignupCredit(c.amount_pence ?? 0);
      }).catch(() => {});
    } catch {
      setError('Could not load match details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [matchId]);

  const payWithStripe = async () => {
    if (!matchId) return;
    const parsed = parseFloat(goodsValue) || 0;
    if (insureGoods && parsed <= 0) { setError('Enter declared goods value to add insurance.'); return; }
    setStripeLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/payment/create-checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ matchId, goodsValue: parsed, insuranceAccepted: insureGoods }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Could not create checkout.'); return; }
      trackEvent('kyc_started', { match_id: matchId });
      window.location.href = json.url;
    } catch (e: any) {
      setError(e.message);
    } finally {
      setStripeLoading(false);
    }
  };

  const startKyc = async () => {
    if (!matchId) return;
    setKycLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/kyc/create-session', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ matchId }),
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-900 text-lg font-semibold mb-2">Something went wrong</p>
          <p className="text-slate-600 mb-6">{error}</p>
          <Link href="/dashboard" className="text-blue-600 underline text-sm">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { match, userRole, alreadyAccepted } = data;

  // Gate: terms must be accepted before KYC
  if (!alreadyAccepted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <p className="text-slate-900 text-lg font-semibold mb-2">Terms not yet accepted</p>
          <p className="text-slate-600 mb-6 text-sm">You must read and accept the Terms & Conditions before completing identity verification.</p>
          <Link href={`/commit?matchId=${matchId}`} className="inline-block bg-blue-600 text-white font-bold px-6 py-3 rounded-2xl text-sm">
            Go to Terms & Conditions →
          </Link>
        </div>
      </div>
    );
  }

  const myKycStatus    = userRole === 'sender' ? match.sender_kyc_status    : match.traveler_kyc_status;
  const theirKycStatus = userRole === 'sender' ? match.traveler_kyc_status  : match.sender_kyc_status;
  const myKycDone      = myKycStatus    === 'verified';
  const theirKycDone   = theirKycStatus === 'verified';
  const bothKycDone    = myKycDone && theirKycDone;

  const route = match.sender_trip
    ? `${match.sender_trip.from_city} → ${match.sender_trip.to_city}`
    : 'your trip';

  const canPay = userRole === 'sender' && bothKycDone &&
    ['kyc_complete', 'payment_pending', 'payment_processing'].includes(match.status);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Nav */}
      <div className="border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-slate-900">Boot<span className="text-blue-500">Hop</span></Link>
        <Link href="/dashboard" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">← Dashboard</Link>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <PipelineBar status={match.status} />

        {/* Route card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 mb-6 flex items-center gap-4">
          {userRole === 'sender'
            ? <Package className="h-6 w-6 text-blue-500 shrink-0" />
            : <Plane   className="h-6 w-6 text-cyan-500 shrink-0" />}
          <div>
            <p className="text-slate-900 font-semibold">{route}</p>
            <p className="text-xs text-slate-600 capitalize mt-0.5">
              You are the <strong className="text-slate-600">{userRole === 'sender' ? 'Hooper (sender)' : 'Booter (carrier)'}</strong>
              {match.agreed_price ? ` · £${match.agreed_price} agreed` : ''}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-5 py-4">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* KYC status grid */}
        <h2 className="text-slate-900 font-bold text-base mb-3 flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-500" /> Identity Verification
        </h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className={`rounded-2xl border p-5 ${myKycDone ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white'}`}>
            <p className="text-xs text-slate-600 uppercase tracking-wider mb-2">You ({userRole})</p>
            <KycBadge status={myKycStatus || 'none'} />
          </div>
          <div className={`rounded-2xl border p-5 ${theirKycDone ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white'}`}>
            <p className="text-xs text-slate-600 uppercase tracking-wider mb-2">{userRole === 'sender' ? 'Carrier' : 'Sender'}</p>
            <KycBadge status={theirKycStatus || 'none'} />
          </div>
        </div>

        {/* Action area */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8">

          {/* Both done, sender pays */}
          {canPay && (
            <div>
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center shrink-0">
                  <CreditCard className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-slate-900 font-bold text-lg mb-1">Both verified — pay to unlock contact details</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Payment is held in escrow and released to the carrier only after delivery is confirmed by both parties.
                  </p>
                </div>
              </div>

              {/* Insurance toggle (optional) */}
              <label className={`flex items-start gap-4 cursor-pointer rounded-2xl border p-5 mb-4 transition-all ${insureGoods ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'}`}>
                <div className={`w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${insureGoods ? 'bg-amber-500 border-amber-500' : 'border-slate-300 bg-white'}`}>
                  {insureGoods && <CheckCircle className="h-3 w-3 text-white" />}
                </div>
                <input type="checkbox" checked={insureGoods} onChange={(e) => { setInsureGoods(e.target.checked); if (!e.target.checked) setGoodsValue(''); }} className="sr-only" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-slate-900 font-semibold text-sm">Add goods insurance (optional)</p>
                    <span className={`text-sm font-bold ${insureGoods ? 'text-amber-600' : 'text-slate-300'}`}>8%</span>
                  </div>
                  <p className="text-slate-600 text-xs">Covers loss or damage in transit. 8% of declared goods value.</p>
                </div>
              </label>

              {/* Goods value — only shown when insurance selected */}
              {insureGoods && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                    Declared goods value (£) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-sm font-bold">£</span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      value={goodsValue}
                      onChange={(e) => setGoodsValue(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5">Must be accurate — understating voids insurance cover.</p>
                </div>
              )}

              {/* Price summary */}
              <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 mb-5 text-sm">
                <div className="flex justify-between px-5 py-3">
                  <span className="text-slate-600">Delivery fee</span>
                  <span className="text-slate-900 font-medium">£{(data?.match.agreed_price ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between px-5 py-3">
                  <span className="text-slate-600">Platform fee (5%)</span>
                  <span className="text-slate-700 font-medium">£{((data?.match.agreed_price ?? 0) * 0.05).toFixed(2)}</span>
                </div>
                {insureGoods && parseFloat(goodsValue) > 0 && (
                  <div className="flex justify-between px-5 py-3">
                    <span className="text-slate-600">Goods insurance (8%)</span>
                    <span className="text-amber-600 font-medium">£{(parseFloat(goodsValue) * 0.08).toFixed(2)}</span>
                  </div>
                )}
                {signupCredit > 0 && (
                  <div className="flex justify-between px-5 py-3 bg-amber-50 border-t border-amber-200">
                    <span className="text-amber-700 font-semibold flex items-center gap-1.5">🎁 Signup credit applied</span>
                    <span className="text-amber-700 font-bold">−£{(Math.min(signupCredit, Math.round(((data?.match.agreed_price ?? 0) * 1.05 + (insureGoods && parseFloat(goodsValue) > 0 ? parseFloat(goodsValue) * 0.08 : 0)) * 100)) / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between px-5 py-3 bg-slate-50 rounded-b-xl">
                  <span className="text-slate-900 font-bold">Total due</span>
                  <span className="text-blue-600 font-bold text-base">
                    £{Math.max(0,
                      (data?.match.agreed_price ?? 0) * 1.05 +
                      (insureGoods && parseFloat(goodsValue) > 0 ? parseFloat(goodsValue) * 0.08 : 0) -
                      signupCredit / 100
                    ).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs text-blue-600 mb-5">
                <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                Funds are held in escrow and released only after both parties confirm delivery.
              </div>

              {/* Payment button */}
              <button
                onClick={payWithStripe}
                disabled={stripeLoading || (insureGoods && (!goodsValue || parseFloat(goodsValue) <= 0))}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all"
              >
                {stripeLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
                {stripeLoading ? 'Redirecting to Stripe…' : 'Pay securely with Stripe'}
              </button>
            </div>
          )}

          {/* Both done, traveler waits */}
          {bothKycDone && userRole === 'traveler' && !['active', 'completed', 'released'].includes(match.status) && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-slate-900 font-bold text-xl mb-2">Waiting for payment</h3>
              <p className="text-slate-600 text-sm">
                Both identities are verified. Waiting for the sender to pay into escrow — you&apos;ll get an email when it&apos;s done.
              </p>
            </div>
          )}

          {/* Active/completed */}
          {['active', 'payment_held', 'completed'].includes(match.status) && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <Eye className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-slate-900 font-bold text-xl mb-2">Delivery is live!</h3>
              <p className="text-slate-600 text-sm mb-6">
                Payment held, both IDs verified. Contact details are now unlocked.
              </p>
              <Link
                href={`/matches/${matchId}`}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-2xl transition-all"
              >
                View match details <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          {/* My KYC not done */}
          {!myKycDone && !['active', 'completed', 'released'].includes(match.status) && (
            <div>
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
                  <UserCheck className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-slate-900 font-bold text-lg mb-1">Verify your identity</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Both parties must complete ID verification before any contact details are shared.
                    Takes ~2 minutes — passport or driving licence required.
                  </p>
                </div>
              </div>
              <div className="space-y-2.5 mb-8">
                {[
                  'Passport, driving licence, or national ID',
                  'Live selfie (face match)',
                  'Powered by Stripe Identity',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-slate-600">
                    <CheckCircle className="h-4 w-4 text-blue-500 shrink-0" />{item}
                  </div>
                ))}
              </div>
              <button
                onClick={startKyc}
                disabled={kycLoading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition-all"
              >
                {kycLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Shield className="h-5 w-5" />}
                {kycLoading ? 'Starting verification…' : 'Start identity verification'}
              </button>
              {myKycStatus === 'pending' && (
                <button
                  onClick={loadData}
                  className="w-full mt-3 flex items-center justify-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Check verification status
                </button>
              )}
            </div>
          )}

          {/* My KYC done, waiting for theirs */}
          {myKycDone && !theirKycDone && !['active', 'completed'].includes(match.status) && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-slate-900 font-bold text-xl mb-2">Your identity is verified!</h3>
              <p className="text-slate-600 text-sm mb-4">
                Waiting for the {userRole === 'sender' ? 'carrier' : 'sender'} to complete their verification.
              </p>
              <button
                onClick={loadData}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors mx-auto"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Refresh status
              </button>
            </div>
          )}
        </div>

        {/* Trust footer */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 flex items-start gap-4">
          <Lock className="h-5 w-5 text-slate-300 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong className="text-slate-600">Contact details are never shared</strong> until both identities are verified, terms accepted, and payment held in escrow.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function KycPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
      </div>
    }>
      <KycContent />
    </Suspense>
  );
}
