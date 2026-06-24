'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Shield, MapPin, Mail, Package,
  CheckCircle, RefreshCw, X, Edit2, Trash2, Eye,
  DollarSign, AlertTriangle, Clock, Calendar,
} from 'lucide-react';

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
  const [updateField, setUpdateField]   = useState('status');
  const [updateValue, setUpdateValue]   = useState('');
  const [updateReason, setUpdateReason] = useState('');
  const [updateBusy, setUpdateBusy]     = useState(false);

  const [showDelete, setShowDelete]     = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteBusy, setDeleteBusy]     = useState(false);

  // date-aware active check
  const travelMs     = trip.travel_date ? new Date(trip.travel_date).getTime() : null;
  const isLiveActive = trip.status === 'active' && (!travelMs || travelMs >= Date.now());
  const isPast       = ['expired', 'cancelled', 'inactive', 'completed'].includes(trip.status) ||
                       (trip.status === 'active' && !!travelMs && travelMs < Date.now());

  const isTraveller = trip.type === 'travel' || trip.type === 'traveller';

  const handleUpdate = async () => {
    if (!updateValue || updateReason.trim().length < 10) return;
    setUpdateBusy(true);
    try {
      const res  = await fetch(`/api/admin/journeys/${trip.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: updateField, value: updateValue, reason: updateReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTrip((prev: any) => ({ ...prev, [updateField]: updateValue }));
      setShowUpdate(false);
      setUpdateReason('');
      setUpdateValue('');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <nav className="bg-gradient-to-r from-red-600/20 via-orange-600/20 to-red-600/20 backdrop-blur-xl border-b border-red-400/30 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push('/admin')}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all shrink-0 flex items-center gap-2 text-white text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Admin</span>
            </button>
            <div className="hidden md:flex w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl items-center justify-center shrink-0">
              <Shield className="text-white w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-white text-base md:text-xl leading-tight truncate">
                {trip.from_city} → {trip.to_city}
              </h1>
              <p className="text-white/50 text-xs truncate">{trip.email}</p>
            </div>
          </div>

          {/* status badge */}
          <div className="flex items-center gap-2 shrink-0">
            {isLiveActive && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
              isLiveActive ? 'bg-green-500/20 text-green-300 border-green-400/30' :
              isPast       ? 'bg-red-500/20 text-red-300 border-red-400/30'       :
              trip.status === 'matched' ? 'bg-blue-500/20 text-blue-300 border-blue-400/30' :
              'bg-white/10 text-white/60 border-white/10'
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
            actionResult.startsWith('✅') ? 'bg-green-500/20 text-green-300 border border-green-400/30' : 'bg-red-500/20 text-red-300 border border-red-400/30'
          }`}>
            <span>{actionResult}</span>
            <button onClick={() => setActionResult(null)} className="text-white/40 hover:text-white ml-3">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">

          {/* ── LEFT: journey info ──────────────────────────────────────── */}
          <div className="space-y-6">

            {/* core fields */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <h2 className="text-white font-bold text-sm uppercase tracking-wide">Journey Details</h2>
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
                    <span className="text-white/50 text-sm">{row.label}</span>
                    <span className="text-white text-sm font-medium text-right max-w-[260px]">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* extra DB fields */}
            {extraFields.length > 0 && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10">
                  <h2 className="text-white/50 font-bold text-xs uppercase tracking-wide">Additional Fields</h2>
                </div>
                <div className="divide-y divide-white/5">
                  {extraFields.map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between px-6 py-3">
                      <span className="text-white/40 text-sm capitalize">{k.replace(/_/g, ' ')}</span>
                      <span className="text-white/70 text-sm text-right max-w-[260px] truncate">{String(v ?? '—')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: match history ────────────────────────────────────── */}
          <div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-400" />
                  <h2 className="text-white font-bold text-sm uppercase tracking-wide">Match History</h2>
                </div>
                <span className="px-2 py-0.5 bg-white/10 text-white/60 rounded-full text-xs font-bold">{matches.length}</span>
              </div>

              {matches.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Package className="w-10 h-10 text-white/20 mx-auto mb-3" />
                  <p className="text-white/40 text-sm">No matches for this journey yet</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {matches.map(m => {
                    const statusColor =
                      m.status === 'completed'                 ? 'bg-green-500/20 text-green-300'   :
                      m.status === 'cancelled' || m.status === 'cancellation_requested'
                                                               ? 'bg-red-500/20 text-red-300'        :
                      m.status === 'payment_processing' || m.status === 'delivery_confirmed'
                                                               ? 'bg-purple-500/20 text-purple-300'  :
                      m.status === 'kyc_pending' || m.status === 'kyc_complete' || m.status === 'awaiting_authorisation'
                                                               ? 'bg-amber-500/20 text-amber-300'    :
                      m.status === 'agreed' || m.status === 'committed'
                                                               ? 'bg-blue-500/20 text-blue-300'      :
                      'bg-yellow-500/20 text-yellow-300';

                    return (
                      <div key={m.id} className="px-6 py-5 space-y-3">

                        {/* Status + date */}
                        <div className="flex items-center justify-between">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColor}`}>
                            {m.status?.replace(/_/g, ' ')}
                          </span>
                          <span className="text-white/35 text-xs">{fmtTs(m.created_at)}</span>
                        </div>

                        {/* Parties */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-white/5 rounded-lg px-3 py-2">
                            <p className="text-white/40 mb-0.5">Sender</p>
                            <p className="text-white/80 truncate">{m.sender_email || '—'}</p>
                          </div>
                          <div className="bg-white/5 rounded-lg px-3 py-2">
                            <p className="text-white/40 mb-0.5">Traveller</p>
                            <p className="text-white/80 truncate">{m.traveler_email || '—'}</p>
                          </div>
                        </div>

                        {/* Price */}
                        {(m.agreed_price || m.proposed_price) && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white/40">{m.agreed_price ? 'Agreed price' : 'Proposed price'}</span>
                            <span className="text-white font-bold">£{Number(m.agreed_price || m.proposed_price).toFixed(2)}</span>
                          </div>
                        )}

                        {/* KYC */}
                        {(m.sender_kyc_status || m.traveler_kyc_status) && (
                          <div className="flex gap-3 text-xs">
                            <span className={`flex items-center gap-1 ${m.sender_kyc_status === 'approved' ? 'text-green-400' : 'text-white/30'}`}>
                              <CheckCircle className="w-3 h-3" /> Sender KYC: {m.sender_kyc_status || 'pending'}
                            </span>
                            <span className={`flex items-center gap-1 ${m.traveler_kyc_status === 'approved' ? 'text-green-400' : 'text-white/30'}`}>
                              <CheckCircle className="w-3 h-3" /> Traveller KYC: {m.traveler_kyc_status || 'pending'}
                            </span>
                          </div>
                        )}

                        {/* Delivery confirmations */}
                        <div className="flex gap-4 text-xs">
                          <span className={`flex items-center gap-1 ${m.booter_confirmed_delivery ? 'text-green-400' : 'text-white/25'}`}>
                            {m.booter_confirmed_delivery ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            Booter confirmed
                          </span>
                          <span className={`flex items-center gap-1 ${m.hooper_confirmed_receipt ? 'text-green-400' : 'text-white/25'}`}>
                            {m.hooper_confirmed_receipt ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            Hooper confirmed
                          </span>
                        </div>

                        {/* Cancellation reason */}
                        {m.cancellation_reason && (
                          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-300">
                            <span className="font-semibold">Reason: </span>{m.cancellation_reason}
                          </div>
                        )}

                        <Link
                          href={`/matches/${m.id}`}
                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 w-fit"
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
        <div className="sticky bottom-0 z-20 bg-slate-900/95 backdrop-blur-xl border-t border-white/10">
          <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 flex gap-3">
            <button
              onClick={() => { setUpdateField('status'); setUpdateValue(''); setUpdateReason(''); setShowUpdate(true); }}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600/80 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all"
            >
              <Edit2 className="w-4 h-4" /> Update Journey
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
          UPDATE MODAL
      ══════════════════════════════════════════════════════════════════ */}
      {showUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowUpdate(false)} />
          <div className="relative w-full max-w-md bg-gradient-to-br from-slate-900 to-blue-950/60 border border-blue-400/30 rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-8 py-5 border-b border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Edit2 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Update Journey</h3>
                <p className="text-white/50 text-xs">{trip.from_city} → {trip.to_city}</p>
              </div>
              <button onClick={() => setShowUpdate(false)} className="ml-auto p-1.5 hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5 text-white/50" />
              </button>
            </div>
            <div className="px-8 py-6 space-y-5">
              <div>
                <label className="block text-white/70 text-xs font-semibold uppercase tracking-wide mb-2">Field to Update</label>
                <select
                  value={updateField}
                  onChange={e => { setUpdateField(e.target.value); setUpdateValue(''); }}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none cursor-pointer"
                >
                  <option value="status">Status</option>
                  <option value="weight">Weight (kg)</option>
                  <option value="price">Price (£)</option>
                  <option value="travel_date">Travel Date</option>
                </select>
              </div>
              <div>
                <label className="block text-white/70 text-xs font-semibold uppercase tracking-wide mb-2">New Value</label>
                {updateField === 'status' ? (
                  <select
                    value={updateValue}
                    onChange={e => setUpdateValue(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none cursor-pointer"
                  >
                    <option value="">Select status...</option>
                    <option value="active">Active</option>
                    <option value="matched">Matched</option>
                    <option value="completed">Completed</option>
                    <option value="expired">Expired</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                ) : updateField === 'travel_date' ? (
                  <input
                    type="date"
                    value={updateValue}
                    onChange={e => setUpdateValue(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                ) : (
                  <input
                    type="number"
                    value={updateValue}
                    onChange={e => setUpdateValue(e.target.value)}
                    placeholder={updateField === 'weight' ? 'e.g. 10' : 'e.g. 80'}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder:text-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                )}
              </div>
              <div>
                <label className="block text-white/70 text-xs font-semibold uppercase tracking-wide mb-2">
                  Reason <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={updateReason}
                  onChange={e => setUpdateReason(e.target.value)}
                  placeholder="Why is this being changed?..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder:text-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none text-sm"
                />
                <p className={`text-xs mt-1.5 ${updateReason.trim().length >= 10 ? 'text-green-400' : 'text-red-400'}`}>
                  {updateReason.trim().length} / 10 min characters
                </p>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowUpdate(false)} className="flex-1 px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all">
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={!updateValue || updateReason.trim().length < 10 || updateBusy}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateBusy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {updateBusy ? 'Updating...' : 'Confirm Update'}
                </button>
              </div>
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
          <div className="relative w-full max-w-md bg-gradient-to-br from-slate-900 to-red-950/60 border border-red-400/30 rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-8 py-5 border-b border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Cancel Journey</h3>
                <p className="text-white/50 text-xs">{trip.from_city} → {trip.to_city}</p>
              </div>
              <button onClick={() => setShowDelete(false)} className="ml-auto p-1.5 hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5 text-white/50" />
              </button>
            </div>
            <div className="px-8 py-6 space-y-5">
              <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-4">
                <p className="text-red-200 text-sm leading-relaxed">
                  This cancels the journey and all linked active matches, and emails every affected party.{' '}
                  <strong className="text-red-300">Cannot be undone.</strong> You will be taken back to the admin dashboard.
                </p>
              </div>
              <div>
                <label className="block text-white/70 text-xs font-semibold uppercase tracking-wide mb-2">
                  Reason <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={4}
                  value={deleteReason}
                  onChange={e => setDeleteReason(e.target.value)}
                  placeholder="Enter reason (sent to all affected parties)..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder:text-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 resize-none text-sm leading-relaxed"
                />
                <p className={`text-xs mt-1.5 ${deleteReason.trim().length >= 10 ? 'text-green-400' : 'text-red-400'}`}>
                  {deleteReason.trim().length} / 10 min characters
                </p>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowDelete(false)} className="flex-1 px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all">
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
    </div>
  );
}
