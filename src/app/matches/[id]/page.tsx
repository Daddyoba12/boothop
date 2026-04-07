'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle, Clock, AlertCircle, Loader2,
  Package, Plane, Shield, Lock, Phone, Mail,
  XCircle, RefreshCw, Truck,
} from 'lucide-react';

type KycStatus = 'none' | 'pending' | 'verified' | 'failed';

type Match = {
  id: string;
  status: string;
  sender_email: string;
  traveler_email: string;
  agreed_price: number;
  sender_kyc_status: KycStatus;
  traveler_kyc_status: KycStatus;
  booter_confirmed_delivery: boolean;
  hooper_confirmed_receipt: boolean;
  booter_confirmed_at: string | null;
  hooper_confirmed_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  sender_trip: { from_city: string; to_city: string; travel_date: string } | null;
};

type PageData = {
  match: Match;
  userRole: 'sender' | 'traveler';
  alreadyAccepted: boolean;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  matched:              { label: 'Matched',             color: 'text-blue-400' },
  agreed:               { label: 'Price agreed',        color: 'text-blue-400' },
  committed:            { label: 'Terms signed',        color: 'text-blue-400' },
  kyc_pending:          { label: 'Verifying identity',  color: 'text-amber-400' },
  kyc_complete:         { label: 'Identity verified',   color: 'text-green-400' },
  payment_pending:      { label: 'Payment pending',     color: 'text-amber-400' },
  payment_processing:   { label: 'Payment processing',  color: 'text-amber-400' },
  active:               { label: 'Active — live',       color: 'text-green-400' },
  delivery_confirmed:   { label: 'Delivery confirmed',  color: 'text-green-400' },
  completed:            { label: 'Completed',           color: 'text-green-400' },
  cancelled:            { label: 'Cancelled',           color: 'text-red-400' },
  declined:             { label: 'Declined',            color: 'text-red-400' },
};

const CANCELLABLE = ['matched', 'agreed', 'committed', 'kyc_pending', 'kyc_complete'];

export default function MatchPage() {
  const params  = useParams();
  const router  = useRouter();
  const matchId = params.id as string;

  const [data,           setData]           = useState<PageData | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [cancelling,     setCancelling]     = useState(false);
  const [cancelConfirm,  setCancelConfirm]  = useState(false);
  const [error,          setError]          = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/matches/${matchId}/details`);
      if (res.status === 401) { router.replace('/login'); return; }
      if (!res.ok) { const j = await res.json(); setError(j.error || 'Failed to load match.'); setLoading(false); return; }
      setData(await res.json());
    } catch { setError('Could not load match.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [matchId]);

  const cancelMatch = async () => {
    if (!cancelConfirm) { setCancelConfirm(true); return; }
    setCancelling(true);
    try {
      const res = await fetch('/api/matches/cancel', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ matchId }),
      });
      if (!res.ok) { const j = await res.json(); setError(j.error); }
      else { await load(); setCancelConfirm(false); }
    } catch { setError('Could not cancel match.'); }
    finally { setCancelling(false); }
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
          <p className="text-white text-lg font-semibold mb-2">Could not load match</p>
          <p className="text-white/50 mb-6">{error}</p>
          <Link href="/dashboard" className="text-blue-400 underline text-sm">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { match, userRole } = data;
  const trip        = match.sender_trip;
  const route       = trip ? `${trip.from_city} → ${trip.to_city}` : 'your delivery';
  const isActive    = match.status === 'active';
  const isComplete  = ['delivery_confirmed', 'completed'].includes(match.status);
  const isCancelled = ['cancelled', 'declined'].includes(match.status);
  const canCancel   = CANCELLABLE.includes(match.status);
  const statusInfo  = STATUS_LABELS[match.status] ?? { label: match.status, color: 'text-white/50' };

  const otherEmail     = userRole === 'sender' ? match.traveler_email : match.sender_email;
  const myKyc          = userRole === 'sender' ? match.sender_kyc_status    : match.traveler_kyc_status;
  const theirKyc       = userRole === 'sender' ? match.traveler_kyc_status  : match.sender_kyc_status;
  const iConfirmed     = userRole === 'sender' ? match.hooper_confirmed_receipt   : match.booter_confirmed_delivery;
  const theyConfirmed  = userRole === 'sender' ? match.booter_confirmed_delivery  : match.hooper_confirmed_receipt;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Nav */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-white">Boot<span className="text-blue-400">Hop</span></Link>
        <Link href="/dashboard" className="text-sm text-white/50 hover:text-white flex items-center gap-1.5 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-5">

        {/* Header card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {userRole === 'sender'
                ? <Package className="h-6 w-6 text-blue-400 shrink-0" />
                : <Plane   className="h-6 w-6 text-cyan-400 shrink-0" />}
              <div>
                <p className="text-white font-bold text-lg">{route}</p>
                {trip?.travel_date && (
                  <p className="text-white/40 text-xs mt-0.5">
                    {new Date(trip.travel_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
            <span className={`text-xs font-bold uppercase tracking-wide ${statusInfo.color}`}>{statusInfo.label}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-white/5 px-4 py-3">
              <p className="text-white/40 text-xs mb-1">Your role</p>
              <p className="text-white font-semibold capitalize">{userRole === 'sender' ? 'Hooper (sender)' : 'Booter (carrier)'}</p>
            </div>
            <div className="rounded-xl bg-white/5 px-4 py-3">
              <p className="text-white/40 text-xs mb-1">Delivery fee</p>
              <p className="text-white font-bold">£{(match.agreed_price ?? 0).toFixed(2)}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-xl bg-red-500/20 border border-red-500/30 px-5 py-4">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* ── CONTACT DETAILS (only when active or beyond) ── */}
        {(isActive || isComplete) && (
          <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-green-400 mb-3 flex items-center gap-2">
              <Lock className="h-3.5 w-3.5" /> Contact details unlocked
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-white/40 shrink-0" />
                <div>
                  <p className="text-xs text-white/40">{userRole === 'sender' ? 'Carrier (Booter)' : 'Sender (Hooper)'}</p>
                  <p className="text-white font-semibold">{otherEmail}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PENDING STAGES ── */}
        {!isActive && !isComplete && !isCancelled && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4 flex items-center gap-2">
              <Shield className="h-3.5 w-3.5" /> Progress
            </p>
            <div className="space-y-3">
              {[
                { done: true,                                           label: 'Match found' },
                { done: match.sender_kyc_status !== 'none',            label: 'Identity verification started' },
                { done: myKyc === 'verified',                          label: 'Your identity verified' },
                { done: theirKyc === 'verified',                       label: "Other party's identity verified" },
                { done: ['payment_processing', 'active', 'delivery_confirmed', 'completed'].includes(match.status), label: 'Payment received' },
                { done: isActive || isComplete,                        label: 'Contact details released' },
              ].map(({ done, label }) => (
                <div key={label} className="flex items-center gap-3 text-sm">
                  {done
                    ? <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
                    : <Clock       className="h-4 w-4 text-white/20 shrink-0" />}
                  <span className={done ? 'text-white/70' : 'text-white/30'}>{label}</span>
                </div>
              ))}
            </div>

            {/* Steer them to the right next step */}
            {['committed', 'kyc_pending', 'kyc_complete'].includes(match.status) && (
              <Link
                href={`/kyc?matchId=${matchId}`}
                className="mt-5 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-2xl transition-all text-sm"
              >
                <Shield className="h-4 w-4" /> Continue verification
              </Link>
            )}
          </div>
        )}

        {/* ── DELIVERY CONFIRMATION (when active) ── */}
        {isActive && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4 flex items-center gap-2">
              <Truck className="h-3.5 w-3.5" /> Delivery confirmation
            </p>
            <div className="space-y-3 mb-2">
              <div className="flex items-center gap-3 text-sm">
                {match.booter_confirmed_delivery
                  ? <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
                  : <Clock       className="h-4 w-4 text-white/20 shrink-0" />}
                <span className={match.booter_confirmed_delivery ? 'text-white/70' : 'text-white/30'}>
                  Carrier confirmed delivery
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                {match.hooper_confirmed_receipt
                  ? <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
                  : <Clock       className="h-4 w-4 text-white/20 shrink-0" />}
                <span className={match.hooper_confirmed_receipt ? 'text-white/70' : 'text-white/30'}>
                  Sender confirmed receipt
                </span>
              </div>
            </div>
            <p className="text-xs text-white/30 mt-3">
              You will receive a confirmation email with a one-click link when it's time to confirm your side.
            </p>
          </div>
        )}

        {/* ── COMPLETE ── */}
        {isComplete && (
          <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-6 text-center">
            <CheckCircle className="h-10 w-10 text-green-400 mx-auto mb-3" />
            <h3 className="text-white font-bold text-lg mb-1">Delivery complete!</h3>
            <p className="text-white/50 text-sm">
              {userRole === 'sender'
                ? 'Your goods have been delivered. Thank you for using BootHop.'
                : 'Payment is being processed to your account. Thank you!'}
            </p>
          </div>
        )}

        {/* ── CANCELLED ── */}
        {isCancelled && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
            <XCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-white font-bold text-lg mb-1">Match cancelled</h3>
            {match.cancellation_reason && (
              <p className="text-white/50 text-sm">{match.cancellation_reason}</p>
            )}
          </div>
        )}

        {/* ── CANCEL BUTTON ── */}
        {canCancel && !isCancelled && (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            {cancelConfirm ? (
              <div>
                <p className="text-white text-sm font-semibold mb-3">Are you sure you want to cancel this match?</p>
                <div className="flex gap-3">
                  <button
                    onClick={cancelMatch}
                    disabled={cancelling}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-all"
                  >
                    {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    Yes, cancel
                  </button>
                  <button
                    onClick={() => setCancelConfirm(false)}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl text-sm transition-all"
                  >
                    Keep match
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setCancelConfirm(true)}
                className="text-red-400 hover:text-red-300 text-sm font-semibold transition-colors"
              >
                Cancel this match →
              </button>
            )}
          </div>
        )}

        {/* Refresh */}
        <button
          onClick={load}
          className="w-full flex items-center justify-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors py-2"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh status
        </button>
      </div>
    </div>
  );
}
