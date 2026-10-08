'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Shield, MapPin, Package, CheckCircle, RefreshCw, X, Edit2, Trash2, Eye, Clock, Wrench, PoundSterling, UserCheck, Banknote } from 'lucide-react';

function fmt(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}
function fmtTs(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const SKIP_KEYS = new Set(['id', 'email', 'from_city', 'to_city', 'travel_date', 'weight', 'price', 'status', 'created_at', 'type', 'updated_at']);

export default function JourneyDetail({
  trip: initialTrip,
  matches,
}: {
  trip: any;
  matches: any[];
}) {
  const router = useRouter();
  const [trip, setTrip]           = useState(initialTrip);
  const [actionResult, setActionResult] = useState<string | null>(null);

  const [showUpdate, setShowUpdate]     = useState(false);
  const [editForm, setEditForm]         = useState<Record<string, string>>({});
  const [updateReason, setUpdateReason] = useState('');
  const [updateBusy, setUpdateBusy]     = useState(false);

  const [showDelete, setShowDelete]     = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteBusy, setDeleteBusy]     = useState(false);

  type AdminMatch = { id: string; status: string; agreed_price: number | null; sender_email?: string; traveler_email?: string };
  const [matchList, setMatchList]       = useState(matches);
  const [adminMatch, setAdminMatch]     = useState<AdminMatch | null>(null);
  const [adminAction, setAdminAction]   = useState<'force_agree' | 'bypass_kyc_sender' | 'bypass_kyc_traveler' | 'force_terms' | 'request_payment' | 'force_delivery_confirmed'>('force_agree');
  const [adminPrice, setAdminPrice]     = useState('');
  const [adminReason, setAdminReason]   = useState('');
  const [adminBusy, setAdminBusy]       = useState(false);
  const [adminError, setAdminError]     = useState('');
  const [adminPreviewed, setAdminPreviewed] = useState(false);
  const [forcePayBusy, setForcePayBusy] = useState<string | null>(null);

  const openAdminAction = (m: AdminMatch, action: typeof adminAction) => {
    setAdminMatch(m);
    setAdminAction(action);
    setAdminPrice(m.agreed_price != null ? String(m.agreed_price) : '');
    setAdminReason('');
    setAdminError('');
    setAdminPreviewed(false);
  };

  // Always re-pull the real state from the server after an override — the
  // override endpoints don't all return every changed field, so trusting a
  // partial client-side merge can leave the UI showing a stale status.
  const refreshMatches = async () => {
    try {
      const res = await fetch(`/api/admin/journeys/${trip.id}/detail`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.matches) setMatchList(data.matches);
    } catch { /* keep showing what we have — actionResult already reported success */ }
  };

  const submitAdminAction = async () => {
    if (!adminMatch) return;
    if (adminReason.trim().length < 10) { setAdminError('Reason must be at least 10 characters.'); return; }
    if (adminAction === 'force_agree') {
      const p = Number(adminPrice);
      if (!Number.isFinite(p) || p <= 0) { setAdminError('Enter a valid price.'); return; }
    }
    if (adminAction === 'force_terms') {
      const ok = window.confirm(
        'This marks BOTH parties as having accepted BootHop\'s Terms & Conditions on their behalf, without either of them clicking anything themselves.\n\n' +
        'Only proceed if you have documented confirmation that both parties actually agreed outside the app.\n\n' +
        'Continue?'
      );
      if (!ok) return;
    }
    if (adminAction === 'request_payment' && !adminPreviewed) {
      setAdminError('Review the email preview above before sending.');
      return;
    }
    setAdminBusy(true);
    setAdminError('');
    try {
      const payload: Record<string, unknown> = { reason: adminReason.trim() };
      if (adminAction === 'force_agree') {
        payload.action = 'force_agree';
        payload.price = Number(adminPrice);
      } else if (adminAction === 'force_terms') {
        payload.action = 'force_terms';
        payload.confirmed = true;
      } else if (adminAction === 'request_payment') {
        payload.action = 'request_payment';
      } else if (adminAction === 'force_delivery_confirmed') {
        payload.action = 'force_delivery_confirmed';
      } else {
        payload.action = 'bypass_kyc';
        payload.role = adminAction === 'bypass_kyc_sender' ? 'sender' : 'traveler';
      }
      const res = await fetch(`/api/admin/matches/${adminMatch.id}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setAdminError(data.error || 'Action failed.'); setAdminBusy(false); return; }
      await refreshMatches();
      setActionResult('✅ Admin action applied.');
      setAdminMatch(null);
    } catch {
      setAdminError('Network error — please try again.');
    }
    setAdminBusy(false);
  };

  const forcePaymentReceived = async (matchId: string) => {
    if (!confirm('⚠️ Force this match\'s payment to confirmed? Only use this when the sender has genuinely paid but the system failed to record it.')) return;
    setForcePayBusy(matchId);
    try {
      const res = await fetch('/api/admin/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId }),
      });
      const data = await res.json();
      if (!res.ok) { setActionResult(`❌ ${data.error || 'Failed to confirm payment.'}`); setForcePayBusy(null); return; }
      await refreshMatches();
      setActionResult('✅ Payment marked as received.');
    } catch {
      setActionResult('❌ Network error — please try again.');
    }
    setForcePayBusy(null);
  };

  const releasePayment = async (matchId: string) => {
    if (!confirm('⚠️ Release payment to the traveller and mark this match completed? Only use this once delivery is genuinely confirmed.')) return;
    setForcePayBusy(matchId);
    try {
      const res = await fetch('/api/admin/release-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId }),
      });
      const data = await res.json();
      if (!res.ok) { setActionResult(`❌ ${data.error || 'Failed to release payment.'}`); setForcePayBusy(null); return; }
      await refreshMatches();
      setActionResult('✅ Payment released — match completed.');
    } catch {
      setActionResult('❌ Network error — please try again.');
    }
    setForcePayBusy(null);
  };

  // date-aware active check
  const travelMs     = trip.travel_date ? new Date(trip.travel_date).getTime() : null;
  const isLiveActive = trip.status === 'active' && (!travelMs || travelMs >= Date.now());
  const isPast       = ['expired', 'cancelled', 'inactive', 'completed'].includes(trip.status) ||
                       (trip.status === 'active' && !!travelMs && travelMs < Date.now());

  const isTraveller = trip.type === 'travel' || trip.type === 'traveller';

  const openUpdate = () => {
    setEditForm({
      status:          trip.status          ?? '',
      type:            trip.type            ?? '',
      email:           trip.email           ?? '',
      from_city:       trip.from_city       ?? '',
      to_city:         trip.to_city         ?? '',
      from_city_en:    trip.from_city_en    ?? '',
      to_city_en:      trip.to_city_en      ?? '',
      travel_date:     trip.travel_date ? (trip.travel_date as string).split('T')[0] : '',
      weight:          trip.weight          != null ? String(trip.weight)          : '',
      weight_capacity: trip.weight_capacity != null ? String(trip.weight_capacity) : '',
      price:           trip.price           != null ? String(trip.price)           : '',
      asking_price:    trip.asking_price    != null ? String(trip.asking_price)    : '',
    });
    setUpdateReason('');
    setShowUpdate(true);
  };

  const handleUpdate = async () => {
    if (updateReason.trim().length < 10) return;
    setUpdateBusy(true);
    try {
      const changed: Record<string, string | null> = {};
      for (const [k, v] of Object.entries(editForm)) {
        const orig = k === 'travel_date' && trip[k]
          ? String(trip[k]).split('T')[0]
          : String(trip[k] ?? '');
        if (v !== orig) changed[k] = v === '' ? null : v;
      }
      if (Object.keys(changed).length === 0) {
        setShowUpdate(false);
        setActionResult('No changes detected.');
        setUpdateBusy(false);
        return;
      }
      const res = await fetch(`/api/admin/journeys/${trip.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: changed, reason: updateReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTrip((prev: any) => ({ ...prev, ...changed }));
      setShowUpdate(false);
      setUpdateReason('');
      setEditForm({});
      setActionResult('✅ Journey updated successfully.');
    } catch (err: any) {
      setShowUpdate(false);
      setActionResult(`❌ ${err.message}`);
    }
    setUpdateBusy(false);
  };

  const handleDelete = async () => {
    if (deleteReason.trim().length < 10) return;
    setDeleteBusy(true);
    try {
      const res  = await fetch(`/api/admin/journeys/${trip.id}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: deleteReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push('/admin');
    } catch (err: any) {
      setShowDelete(false);
      setActionResult(`❌ ${err.message}`);
    }
    setDeleteBusy(false);
  };

  const extraFields = Object.entries(trip).filter(([k]) => !SKIP_KEYS.has(k));

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <nav className="bg-gradient-to-r from-red-50 via-orange-50 to-red-50 backdrop-blur-xl border-b border-red-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push('/admin')}
              className="p-2 bg-slate-100 hover:bg-slate-100 rounded-xl transition-all shrink-0 flex items-center gap-2 text-slate-900 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Admin</span>
            </button>
            <div className="hidden md:flex w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl items-center justify-center shrink-0">
              <Shield className="text-slate-900 w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-slate-900 text-base md:text-xl leading-tight truncate">
                {trip.from_city} → {trip.to_city}
              </h1>
              <p className="text-slate-600 text-xs truncate">{trip.email}</p>
            </div>
          </div>

          {/* status badge */}
          <div className="flex items-center gap-2 shrink-0">
            {isLiveActive && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
              isLiveActive ? 'bg-green-500/20 text-green-700 border-green-400/30' :
              isPast       ? 'bg-red-500/20 text-red-700 border-red-400/30'       :
              trip.status === 'matched' ? 'bg-blue-500/20 text-blue-700 border-blue-400/30' :
              'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {isPast && trip.status === 'active' ? 'expired' : (trip.status || 'unknown')}
            </span>
          </div>
        </div>
      </nav>

      {/* ── BODY ───────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-6">

        {/* action result */}
        {actionResult && (
          <div className={`px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between ${
            actionResult.startsWith('✅') ? 'bg-green-500/20 text-green-700 border border-green-400/30' : 'bg-red-500/20 text-red-700 border border-red-400/30'
          }`}>
            <span>{actionResult}</span>
            <button onClick={() => setActionResult(null)} className="text-slate-600 hover:text-slate-900 ml-3">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">

          {/* ── LEFT: journey info ──────────────────────────────────────── */}
          <div className="space-y-6">

            {/* core fields */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-600" />
                <h2 className="text-slate-900 font-bold text-sm uppercase tracking-wide">Journey Details</h2>
              </div>
              <div className="divide-y divide-white/5">
                {[
                  { label: 'Email',       value: trip.email || '—' },
                  { label: 'Type',        value: isTraveller ? '✈️ Traveller' : '📦 Sender' },
                  { label: 'From',        value: trip.from_city || '—' },
                  { label: 'To',          value: trip.to_city   || '—' },
                  { label: 'Travel Date', value: fmt(trip.travel_date) },
                  { label: 'Weight',      value: trip.weight ? `${trip.weight} kg` : '—' },
                  { label: 'Price',       value: trip.price  ? `£${Number(trip.price).toFixed(2)}` : '—' },
                  { label: 'Status',      value: isPast && trip.status === 'active' ? 'expired (date passed)' : (trip.status || 'unknown') },
                  { label: 'Created',     value: fmtTs(trip.created_at) },
                  ...(trip.updated_at ? [{ label: 'Updated', value: fmtTs(trip.updated_at) }] : []),
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between px-6 py-3">
                    <span className="text-slate-600 text-sm">{row.label}</span>
                    <span className="text-slate-900 text-sm font-medium text-right max-w-[260px]">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* extra DB fields */}
            {extraFields.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h2 className="text-slate-600 font-bold text-xs uppercase tracking-wide">Additional Fields</h2>
                </div>
                <div className="divide-y divide-white/5">
                  {extraFields.map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between px-6 py-3">
                      <span className="text-slate-600 text-sm capitalize">{k.replace(/_/g, ' ')}</span>
                      <span className="text-slate-700 text-sm text-right max-w-[260px] truncate">{String(v ?? '—')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: match history ────────────────────────────────────── */}
          <div>
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-600" />
                  <h2 className="text-slate-900 font-bold text-sm uppercase tracking-wide">Match History</h2>
                </div>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">{matchList.length}</span>
              </div>

              {matchList.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-600 text-sm">No matches for this journey yet</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {matchList.map(m => {
                    const statusColor =
                      m.status === 'completed'                 ? 'bg-green-500/20 text-green-700'   :
                      m.status === 'cancelled' || m.status === 'cancellation_requested'
                                                               ? 'bg-red-500/20 text-red-700'        :
                      m.status === 'payment_processing' || m.status === 'delivery_confirmed'
                                                               ? 'bg-purple-500/20 text-purple-700'  :
                      m.status === 'kyc_pending' || m.status === 'kyc_complete' || m.status === 'awaiting_authorisation'
                                                               ? 'bg-amber-500/20 text-amber-700'    :
                      m.status === 'agreed' || m.status === 'committed'
                                                               ? 'bg-blue-500/20 text-blue-700'      :
                      'bg-yellow-500/20 text-yellow-700';

                    return (
                      <div key={m.id} className="px-6 py-5 space-y-3">

                        {/* Status + date */}
                        <div className="flex items-center justify-between">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColor}`}>
                            {m.status?.replace(/_/g, ' ')}
                          </span>
                          <span className="text-slate-600 text-xs">{fmtTs(m.created_at)}</span>
                        </div>

                        {/* Parties */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-50 rounded-lg px-3 py-2">
                            <p className="text-slate-600 mb-0.5">Sender</p>
                            <p className="text-slate-700 truncate">{m.sender_email || '—'}</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg px-3 py-2">
                            <p className="text-slate-600 mb-0.5">Traveller</p>
                            <p className="text-slate-700 truncate">{m.traveler_email || '—'}</p>
                          </div>
                        </div>

                        {/* Price */}
                        {(m.agreed_price || m.proposed_price) && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">{m.agreed_price ? 'Agreed price' : 'Proposed price'}</span>
                            <span className="text-slate-900 font-bold">£{Number(m.agreed_price || m.proposed_price).toFixed(2)}</span>
                          </div>
                        )}

                        {/* KYC */}
                        {(m.sender_kyc_status || m.traveler_kyc_status) && (
                          <div className="flex gap-3 text-xs">
                            <span className={`flex items-center gap-1 ${m.sender_kyc_status === 'approved' ? 'text-green-600' : 'text-slate-600'}`}>
                              <CheckCircle className="w-3 h-3" /> Sender KYC: {m.sender_kyc_status || 'pending'}
                            </span>
                            <span className={`flex items-center gap-1 ${m.traveler_kyc_status === 'approved' ? 'text-green-600' : 'text-slate-600'}`}>
                              <CheckCircle className="w-3 h-3" /> Traveller KYC: {m.traveler_kyc_status || 'pending'}
                            </span>
                          </div>
                        )}

                        {/* Delivery confirmations */}
                        <div className="flex gap-4 text-xs">
                          <span className={`flex items-center gap-1 ${m.booter_confirmed_delivery ? 'text-green-600' : 'text-slate-600'}`}>
                            {m.booter_confirmed_delivery ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            Booter confirmed
                          </span>
                          <span className={`flex items-center gap-1 ${m.hooper_confirmed_receipt ? 'text-green-600' : 'text-slate-600'}`}>
                            {m.hooper_confirmed_receipt ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            Hooper confirmed
                          </span>
                        </div>

                        {/* Cancellation reason */}
                        {m.cancellation_reason && (
                          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-700">
                            <span className="font-semibold">Reason: </span>{m.cancellation_reason}
                          </div>
                        )}

                        {/* Admin overrides */}
                        {!['cancelled', 'declined', 'completed', 'disputed'].includes(m.status) && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {m.status === 'matched' && (
                              <button
                                onClick={() => openAdminAction(m, 'force_agree')}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold rounded-lg"
                              >
                                <PoundSterling className="w-3 h-3" /> Force agree + set price
                              </button>
                            )}
                            {m.status === 'agreed' && (
                              <button
                                onClick={() => openAdminAction(m, 'force_terms')}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-semibold rounded-lg"
                              >
                                <UserCheck className="w-3 h-3" /> Force Terms acceptance
                              </button>
                            )}
                            {m.sender_kyc_status !== 'verified' && (
                              <button
                                onClick={() => openAdminAction(m, 'bypass_kyc_sender')}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-xs font-semibold rounded-lg"
                              >
                                <UserCheck className="w-3 h-3" /> Bypass sender KYC
                              </button>
                            )}
                            {m.traveler_kyc_status !== 'verified' && (
                              <button
                                onClick={() => openAdminAction(m, 'bypass_kyc_traveler')}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-xs font-semibold rounded-lg"
                              >
                                <UserCheck className="w-3 h-3" /> Bypass traveller KYC
                              </button>
                            )}
                            {['kyc_complete', 'payment_pending'].includes(m.status) && (
                              <button
                                onClick={() => openAdminAction(m, 'request_payment')}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 text-xs font-semibold rounded-lg"
                              >
                                <Banknote className="w-3 h-3" /> Request payment
                              </button>
                            )}
                            {m.status === 'payment_processing' && (
                              <button
                                onClick={() => forcePaymentReceived(m.id)}
                                disabled={forcePayBusy === m.id}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 text-xs font-semibold rounded-lg disabled:opacity-50"
                              >
                                <Banknote className="w-3 h-3" /> {forcePayBusy === m.id ? 'Confirming…' : 'Force payment received'}
                              </button>
                            )}
                            {['active', 'escrowed'].includes(m.status) && (
                              <button
                                onClick={() => openAdminAction(m, 'force_delivery_confirmed')}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-semibold rounded-lg"
                              >
                                <CheckCircle className="w-3 h-3" /> Force delivery confirmed
                              </button>
                            )}
                            {m.status === 'delivery_confirmed' && (
                              <button
                                onClick={() => releasePayment(m.id)}
                                disabled={forcePayBusy === m.id}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg disabled:opacity-50"
                              >
                                <Banknote className="w-3 h-3" /> {forcePayBusy === m.id ? 'Releasing…' : 'Release payment (complete)'}
                              </button>
                            )}
                          </div>
                        )}

                        <Link
                          href={`/matches/${m.id}`}
                          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 w-fit"
                        >
                          <Eye className="w-3 h-3" /> View full match
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── STICKY ACTION BAR ──────────────────────────────────────────── */}
      {trip.status !== 'cancelled' && (
        <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-xl border-t border-slate-200">
          <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 flex gap-3">
            <button
              onClick={openUpdate}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600/80 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all"
            >
              <Edit2 className="w-4 h-4" /> Edit Journey
            </button>
            <button
              onClick={() => { setDeleteReason(''); setShowDelete(true); }}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600/80 hover:bg-red-600 text-white rounded-xl font-semibold transition-all"
            >
              <Trash2 className="w-4 h-4" /> Cancel Journey
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          EDIT MODAL — all fields
      ══════════════════════════════════════════════════════════════════ */}
      {showUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowUpdate(false)} />
          <div className="relative w-full max-w-lg bg-white border border-blue-200 rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">

            {/* header */}
            <div className="px-8 py-5 border-b border-slate-200 flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Edit2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-slate-900 font-bold text-lg">Edit Journey</h3>
                <p className="text-slate-600 text-xs">{trip.from_city} → {trip.to_city}</p>
              </div>
              <button onClick={() => setShowUpdate(false)} className="ml-auto p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* scrollable body */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">

              {/* Status + Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wide mb-1.5">Status</label>
                  <select value={editForm.status ?? ''} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm appearance-none cursor-pointer">
                    <option value="active">Active</option>
                    <option value="matched">Matched</option>
                    <option value="awaiting_authorisation">Awaiting Authorisation</option>
                    <option value="completed">Completed</option>
                    <option value="expired">Expired</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wide mb-1.5">Type</label>
                  <select value={editForm.type ?? ''} onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm appearance-none cursor-pointer">
                    <option value="travel">Traveller</option>
                    <option value="traveller">Traveller (alt)</option>
                    <option value="send">Sender</option>
                  </select>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wide mb-1.5">Email</label>
                <input type="email" value={editForm.email ?? ''} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
              </div>

              {/* From + To City */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wide mb-1.5">From City</label>
                  <input type="text" value={editForm.from_city ?? ''} onChange={e => setEditForm(f => ({ ...f, from_city: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
                </div>
                <div>
                  <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wide mb-1.5">To City</label>
                  <input type="text" value={editForm.to_city ?? ''} onChange={e => setEditForm(f => ({ ...f, to_city: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
                </div>
              </div>

              {/* From + To City (English) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wide mb-1.5">From (English)</label>
                  <input type="text" value={editForm.from_city_en ?? ''} onChange={e => setEditForm(f => ({ ...f, from_city_en: e.target.value }))}
                    placeholder="English name"
                    className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 text-slate-900 placeholder:text-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
                </div>
                <div>
                  <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wide mb-1.5">To (English)</label>
                  <input type="text" value={editForm.to_city_en ?? ''} onChange={e => setEditForm(f => ({ ...f, to_city_en: e.target.value }))}
                    placeholder="English name"
                    className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 text-slate-900 placeholder:text-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
                </div>
              </div>

              {/* Travel Date */}
              <div>
                <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wide mb-1.5">Travel Date</label>
                <input type="date" value={editForm.travel_date ?? ''} onChange={e => setEditForm(f => ({ ...f, travel_date: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
              </div>

              {/* Weight + Capacity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wide mb-1.5">Weight (kg)</label>
                  <input type="number" min="0" step="0.1" value={editForm.weight ?? ''} onChange={e => setEditForm(f => ({ ...f, weight: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 text-slate-900 placeholder:text-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
                </div>
                <div>
                  <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wide mb-1.5">Capacity (kg)</label>
                  <input type="number" min="0" step="0.1" value={editForm.weight_capacity ?? ''} onChange={e => setEditForm(f => ({ ...f, weight_capacity: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 text-slate-900 placeholder:text-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
                </div>
              </div>

              {/* Price + Asking Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wide mb-1.5">Price (£)</label>
                  <input type="number" min="0" step="0.01" value={editForm.price ?? ''} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 text-slate-900 placeholder:text-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
                </div>
                <div>
                  <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wide mb-1.5">Asking Price (£)</label>
                  <input type="number" min="0" step="0.01" value={editForm.asking_price ?? ''} onChange={e => setEditForm(f => ({ ...f, asking_price: e.target.value }))}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 text-slate-900 placeholder:text-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-slate-700 text-xs font-semibold uppercase tracking-wide mb-1.5">
                  Reason for change <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={2}
                  value={updateReason}
                  onChange={e => setUpdateReason(e.target.value)}
                  placeholder="Why is this being changed?..."
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 text-slate-900 placeholder:text-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none text-sm"
                />
                <p className={`text-xs mt-1 ${updateReason.trim().length >= 10 ? 'text-green-600' : 'text-red-600'}`}>
                  {updateReason.trim().length} / 10 min characters
                </p>
              </div>
            </div>

            {/* footer */}
            <div className="px-8 py-4 border-t border-slate-200 flex gap-3 shrink-0">
              <button onClick={() => setShowUpdate(false)} className="flex-1 px-6 py-3 bg-slate-100 text-slate-900 rounded-xl font-semibold hover:bg-slate-100 transition-all">
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={updateReason.trim().length < 10 || updateBusy}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateBusy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {updateBusy ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          DELETE MODAL
      ══════════════════════════════════════════════════════════════════ */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowDelete(false)} />
          <div className="relative w-full max-w-md bg-white border border-red-200 rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-8 py-5 border-b border-slate-200 flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-slate-900 font-bold text-lg">Cancel Journey</h3>
                <p className="text-slate-600 text-xs">{trip.from_city} → {trip.to_city}</p>
              </div>
              <button onClick={() => setShowDelete(false)} className="ml-auto p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <div className="px-8 py-6 space-y-5">
              <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-4">
                <p className="text-red-200 text-sm leading-relaxed">
                  This cancels the journey and all linked active matches, and emails every affected party.{' '}
                  <strong className="text-red-700">Cannot be undone.</strong> You will be taken back to the admin dashboard.
                </p>
              </div>
              <div>
                <label className="block text-slate-700 text-xs font-semibold uppercase tracking-wide mb-2">
                  Reason <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={4}
                  value={deleteReason}
                  onChange={e => setDeleteReason(e.target.value)}
                  placeholder="Enter reason (sent to all affected parties)..."
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 text-slate-900 placeholder:text-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 resize-none text-sm leading-relaxed"
                />
                <p className={`text-xs mt-1.5 ${deleteReason.trim().length >= 10 ? 'text-green-600' : 'text-red-600'}`}>
                  {deleteReason.trim().length} / 10 min characters
                </p>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowDelete(false)} className="flex-1 px-6 py-3 bg-slate-100 text-slate-900 rounded-xl font-semibold hover:bg-slate-100 transition-all">
                  Back
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteReason.trim().length < 10 || deleteBusy}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-red-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteBusy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {deleteBusy ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {adminMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !adminBusy && setAdminMatch(null)} />
          <div className="relative w-full max-w-md bg-white border border-amber-200 rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-8 py-5 border-b border-slate-200 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <Wrench className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-slate-900 font-bold text-lg">Admin Override</h3>
                <p className="text-slate-600 text-xs">Match {adminMatch.id.slice(0, 8)}…</p>
              </div>
              <button onClick={() => !adminBusy && setAdminMatch(null)} className="ml-auto p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <div className="px-8 py-6 space-y-4">
              <div>
                <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wide mb-1.5">Action</label>
                <select
                  value={adminAction}
                  onChange={e => setAdminAction(e.target.value as typeof adminAction)}
                  className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm appearance-none cursor-pointer"
                >
                  <option value="force_agree">Force agree and set price</option>
                  <option value="force_terms">Force Terms acceptance (both parties)</option>
                  <option value="bypass_kyc_sender">Mark sender ID check complete</option>
                  <option value="bypass_kyc_traveler">Mark traveller ID check complete</option>
                  <option value="request_payment">Request payment (admin-initiated)</option>
                  <option value="force_delivery_confirmed">Force delivery confirmed (goods received)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">Use the ID-check options only when BootHop itself is a party to this delivery, or another documented exception applies.</p>
                {adminAction === 'force_terms' && (
                  <p className="text-xs text-red-600 mt-1 font-medium">Legal signature on behalf of both parties — only use with documented outside-app agreement. You&apos;ll be asked to confirm again before this is applied.</p>
                )}
                {adminAction === 'request_payment' && (
                  <p className="text-xs text-amber-600 mt-1 font-medium">This is the manual payment path (money moves outside Stripe Checkout) — only use when the live payment flow can&apos;t run, e.g. the traveller hasn&apos;t completed Stripe Connect onboarding. Once the sender has actually paid, use &quot;Force payment received&quot; to confirm it.</p>
                )}
                {adminAction === 'force_delivery_confirmed' && (
                  <p className="text-xs text-purple-600 mt-1 font-medium">Only use once you have real confirmation the goods were physically received by the sender — this skips the in-app PIN/confirmation handshake both parties would normally complete themselves.</p>
                )}
              </div>

              {adminAction === 'request_payment' && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-slate-700 text-xs font-bold uppercase tracking-wide">Email preview — 3 emails will be sent</span>
                  </div>
                  <div className="p-4 space-y-3 text-xs">
                    <div>
                      <p className="font-semibold text-slate-900">→ {adminMatch?.sender_email || 'sender'}</p>
                      <p className="text-slate-600">Subject: &quot;Payment request received — {'{route}'}&quot;</p>
                      <p className="text-slate-500 mt-0.5">&quot;Amount due: £{adminMatch?.agreed_price ?? '—'}. Please pay by bank transfer to:&quot;</p>
                      <p className="text-slate-700 font-mono mt-1 bg-slate-50 rounded px-2 py-1">BootHop BD · Acc 31957648 · Sort 04-06-05 · Ref {adminMatch?.id.slice(0, 8)}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">→ {adminMatch?.traveler_email || 'traveller'}</p>
                      <p className="text-slate-600">Subject: &quot;Payment in progress — {'{route}'}&quot;</p>
                      <p className="text-slate-500 mt-0.5">&quot;The sender has submitted payment for £{adminMatch?.agreed_price ?? '—'}. We&apos;re verifying it now.&quot;</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">→ admin@boothop.com</p>
                      <p className="text-slate-600">Subject: &quot;[ACTION] Payment request — £{adminMatch?.agreed_price ?? '—'}&quot;</p>
                      <p className="text-slate-500 mt-0.5">Full details table + a &quot;Confirm payment received&quot; link.</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      <p className="text-amber-800 font-medium">⚠ This email now includes real BootHop bank details for manual transfer. Double-check the amount above before sending.</p>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input type="checkbox" checked={adminPreviewed} onChange={e => setAdminPreviewed(e.target.checked)} />
                      I&apos;ve reviewed this and want to send it
                    </label>
                  </div>
                </div>
              )}

              {adminAction === 'force_agree' && (
                <div>
                  <label className="block text-slate-600 text-xs font-semibold uppercase tracking-wide mb-1.5">Agreed price (£)</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={adminPrice}
                    onChange={e => setAdminPrice(e.target.value)}
                    placeholder="e.g. 200"
                    className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 text-slate-900 placeholder:text-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-700 text-xs font-semibold uppercase tracking-wide mb-1.5">
                  Reason <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={3}
                  value={adminReason}
                  onChange={e => setAdminReason(e.target.value)}
                  placeholder="Why is this being done manually?..."
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 text-slate-900 placeholder:text-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none text-sm"
                />
                <p className={`text-xs mt-1 ${adminReason.trim().length >= 10 ? 'text-green-600' : 'text-red-600'}`}>
                  {adminReason.trim().length} / 10 min characters
                </p>
              </div>

              {adminError && <p className="text-xs text-red-600">{adminError}</p>}

              <div className="flex gap-3 pt-1">
                <button onClick={() => setAdminMatch(null)} disabled={adminBusy} className="flex-1 px-6 py-3 bg-slate-100 text-slate-900 rounded-xl font-semibold hover:bg-slate-100 transition-all disabled:opacity-50">
                  Cancel
                </button>
                <button
                  onClick={submitAdminAction}
                  disabled={adminBusy || adminReason.trim().length < 10 || (adminAction === 'request_payment' && !adminPreviewed)}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-amber-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {adminBusy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {adminBusy ? 'Applying…' : adminAction === 'request_payment' ? 'Send payment request' : 'Apply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
