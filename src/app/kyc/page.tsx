'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Shield, CheckCircle, Clock, UserCheck, CreditCard,
  Package, Plane, AlertCircle, ArrowRight, Loader2,
  Eye, Lock, RefreshCw, Info, Send,
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
    return <span className="flex items-center gap-1 text-green-400 text-xs font-semibold"><CheckCircle className="h-3.5 w-3.5" /> Verified</span>;
  if (status === 'pending')
    return <span className="flex items-center gap-1 text-amber-400 text-xs font-semibold"><Clock className="h-3.5 w-3.5" /> Pending review</span>;
  if (status === 'failed')
    return <span className="flex items-center gap-1 text-red-400 text-xs font-semibold"><AlertCircle className="h-3.5 w-3.5" /> Failed — retry</span>;
  return <span className="flex items-center gap-1 text-white/30 text-xs font-semibold"><Clock className="h-3.5 w-3.5" /> Not started</span>;
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
              i === current ? 'bg-blue-500/20 border-blue-400 text-blue-300 ring-4 ring-blue-400/20' :
                              'bg-white/5 border-white/10 text-white/20'
            }`}>{i < current ? '✓' : i + 1}</div>
            <span className={`text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap hidden sm:block ${
              i <= current ? 'text-white/60' : 'text-white/20'
            }`}>{label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 rounded-full mb-3 ${i < current ? 'bg-blue-500' : 'bg-white/10'}`} />
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
  const [payLoading,     setPayLoading]     = useState(false);
  const [payRequested,   setPayRequested]   = useState(false);
  const [goodsValue,     setGoodsValue]     = useState('');
  const [insureGoods,    setInsureGoods]    = useState(true);
  const [error,          setError]          = useState<string | null>(null);

  const loadData = async () => {
    if (!matchId) { setError('No match ID provided.'); setLoading(false); return; }
    try {
      const res = await fetch(`/api/matches/${matchId}/details`);
      if (res.status === 401) { router.replace(`/login?next=/kyc?matchId=${matchId}`); return; }
      if (!res.ok) { const j = await res.json(); setError(j.error || 'Failed to load match.'); setLoading(false); return; }
      const json = await res.json();
      setData(json);
    } catch {
      setError('Could not load match details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [matchId]);

  const requestPayment = async () => {
    if (!matchId) return;
    const parsed = parseFloat(goodsValue) || 0;
    if (parsed <= 0) { setError('Please enter the declared goods value.'); return; }
    setPayLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/payment/request', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ matchId, goodsValue: parsed, insuranceAccepted: insureGoods }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Could not submit payment request.'); return; }
      setPayRequested(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPayLoading(false);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (error && !data) {
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

  if (!data) return null;

  const { match, userRole, alreadyAccepted } = data;

  // Gate: terms must be accepted before KYC
  if (!alreadyAccepted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
          <p className="text-white text-lg font-semibold mb-2">Terms not yet accepted</p>
          <p className="text-white/50 mb-6 text-sm">You must read and accept the Terms & Conditions before completing identity verification.</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">

      {/* Nav */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-white">Boot<span className="text-blue-400">Hop</span></Link>
        <Link href="/dashboard" className="text-sm text-white/50 hover:text-white transition-colors">← Dashboard</Link>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <PipelineBar status={match.status} />

        {/* Route card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 mb-6 flex items-center gap-4">
          {userRole === 'sender'
            ? <Package className="h-6 w-6 text-blue-400 shrink-0" />
            : <Plane   className="h-6 w-6 text-cyan-400 shrink-0" />}
          <div>
            <p className="text-white font-semibold">{route}</p>
            <p className="text-xs text-white/40 capitalize mt-0.5">
              You are the <strong className="text-white/60">{userRole === 'sender' ? 'Hooper (sender)' : 'Booter (carrier)'}</strong>
              {match.agreed_price ? ` · £${match.agreed_price} agreed` : ''}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-3 rounded-xl bg-red-500/20 border border-red-500/30 px-5 py-4">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* KYC status grid */}
        <h2 className="text-white font-bold text-base mb-3 flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-400" /> Identity Verification
        </h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className={`rounded-2xl border p-5 ${myKycDone ? 'border-green-500/30 bg-green-500/10' : 'border-white/10 bg-white/5'}`}>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2">You ({userRole})</p>
            <KycBadge status={myKycStatus || 'none'} />
          </div>
          <div className={`rounded-2xl border p-5 ${theirKycDone ? 'border-green-500/30 bg-green-500/10' : 'border-white/10 bg-white/5'}`}>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2">{userRole === 'sender' ? 'Carrier' : 'Sender'}</p>
            <KycBadge status={theirKycStatus || 'none'} />
          </div>
        </div>

        {/* Action area */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8">

          {/* Both done, sender submits payment request */}
          {canPay && !payRequested && (
            <div>
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center shrink-0">
                  <CreditCard className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">Both identities verified — pay now</h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    Declare your goods value below. Our team will send you payment instructions by email and confirm receipt manually.
                  </p>
                </div>
              </div>

              {/* Goods value */}
              <div className="mb-4">
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
                    className="w-full pl-8 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <p className="text-xs text-white/30 mt-1.5">Must be accurate — understating voids insurance cover.</p>
              </div>

              {/* Insurance toggle */}
              <label className={`flex items-start gap-4 cursor-pointer rounded-2xl border p-5 mb-5 transition-all ${insureGoods ? 'border-amber-500/40 bg-amber-500/10' : 'border-white/10 bg-white/5'}`}>
                <div className={`w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${insureGoods ? 'bg-amber-500 border-amber-500' : 'border-white/30 bg-white/5'}`}>
                  {insureGoods && <CheckCircle className="h-3 w-3 text-white" />}
                </div>
                <input type="checkbox" checked={insureGoods} onChange={(e) => setInsureGoods(e.target.checked)} className="sr-only" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-white font-semibold text-sm">Add delivery protection</p>
                    <span className={`text-sm font-bold ${insureGoods ? 'text-amber-400' : 'text-white/30'}`}>
                      {parseFloat(goodsValue) > 0 ? `£${(parseFloat(goodsValue) * 0.075).toFixed(2)}` : '7.5%'}
                    </span>
                  </div>
                  <p className="text-white/40 text-xs">Covers loss or damage in transit.</p>
                </div>
              </label>

              {/* Price summary */}
              {parseFloat(goodsValue) > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/5 divide-y divide-white/5 mb-5 text-sm">
                  <div className="flex justify-between px-5 py-3">
                    <span className="text-white/50">Delivery fee</span>
                    <span className="text-white font-medium">£{(data?.match.agreed_price ?? 0).toFixed(2)}</span>
                  </div>
                  {insureGoods && (
                    <div className="flex justify-between px-5 py-3">
                      <span className="text-white/50">Protection (7.5%)</span>
                      <span className="text-amber-400 font-medium">£{(parseFloat(goodsValue) * 0.075).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between px-5 py-3 bg-white/5 rounded-b-xl">
                    <span className="text-white font-bold">Total due</span>
                    <span className="text-blue-400 font-bold text-base">
                      £{((data?.match.agreed_price ?? 0) + (insureGoods ? parseFloat(goodsValue) * 0.075 : 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2 text-xs text-amber-400 mb-5">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                Our team will email you with payment instructions. Contact details are released once payment is confirmed.
              </div>

              <button
                onClick={requestPayment}
                disabled={payLoading || !goodsValue || parseFloat(goodsValue) <= 0}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all"
              >
                {payLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                {payLoading ? 'Submitting…' : 'Submit payment request'}
              </button>
            </div>
          )}

          {/* Payment request submitted */}
          {canPay && payRequested && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-amber-400" />
              </div>
              <h3 className="text-white font-bold text-xl mb-2">Payment request submitted!</h3>
              <p className="text-white/50 text-sm">
                We&apos;ve emailed you with payment instructions. Once our team confirms receipt, contact details will be released to both parties automatically.
              </p>
            </div>
          )}

          {/* Both done, traveler waits */}
          {bothKycDone && userRole === 'traveler' && !['active', 'completed', 'released'].includes(match.status) && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-amber-400" />
              </div>
              <h3 className="text-white font-bold text-xl mb-2">Waiting for payment</h3>
              <p className="text-white/50 text-sm">
                Both identities are verified. Waiting for the sender to pay into escrow — you&apos;ll get an email when it&apos;s done.
              </p>
            </div>
          )}

          {/* Active/completed */}
          {['active', 'payment_held', 'completed'].includes(match.status) && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <Eye className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-white font-bold text-xl mb-2">Delivery is live!</h3>
              <p className="text-white/50 text-sm mb-6">
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
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center shrink-0">
                  <UserCheck className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">Verify your identity</h3>
                  <p className="text-white/50 text-sm leading-relaxed">
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
                {kycLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Shield className="h-5 w-5" />}
                {kycLoading ? 'Starting verification…' : 'Start identity verification'}
              </button>
              {myKycStatus === 'pending' && (
                <button
                  onClick={loadData}
                  className="w-full mt-3 flex items-center justify-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Check verification status
                </button>
              )}
            </div>
          )}

          {/* My KYC done, waiting for theirs */}
          {myKycDone && !theirKycDone && !['active', 'completed'].includes(match.status) && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-amber-400" />
              </div>
              <h3 className="text-white font-bold text-xl mb-2">Your identity is verified!</h3>
              <p className="text-white/50 text-sm mb-4">
                Waiting for the {userRole === 'sender' ? 'carrier' : 'sender'} to complete their verification.
              </p>
              <button
                onClick={loadData}
                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors mx-auto"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Refresh status
              </button>
            </div>
          )}
        </div>

        {/* Trust footer */}
        <div className="mt-6 rounded-2xl border border-white/5 bg-white/[0.03] p-5 flex items-start gap-4">
          <Lock className="h-5 w-5 text-white/30 shrink-0 mt-0.5" />
          <p className="text-xs text-white/30 leading-relaxed">
            <strong className="text-white/50">Contact details are never shared</strong> until both identities are verified, terms accepted, and payment held in escrow.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function KycPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-blue-400 animate-spin" />
      </div>
    }>
      <KycContent />
    </Suspense>
  );
}
