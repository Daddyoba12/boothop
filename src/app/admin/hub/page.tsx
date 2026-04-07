'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle, XCircle, AlertTriangle, Clock,
  Loader2, RefreshCw, DollarSign, Truck, Scale,
} from 'lucide-react';

type Match = {
  id: string;
  status: string;
  sender_email: string;
  traveler_email: string;
  agreed_price: number;
  goods_value: number | null;
  insurance_fee: number | null;
  created_at: string;
  sender_trip: { from_city: string; to_city: string; travel_date: string } | null;
};

type Dispute = {
  id: string;
  match_id: string;
  raised_by: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
  match: Match | null;
};

function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    payment_processing:    'bg-amber-500/20 text-amber-400',
    delivery_confirmed:    'bg-blue-500/20 text-blue-400',
    disputed:              'bg-red-500/20 text-red-400',
    cancellation_requested:'bg-orange-500/20 text-orange-400',
    completed:             'bg-green-500/20 text-green-400',
    cancelled:             'bg-white/10 text-white/40',
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${map[status] ?? 'bg-white/10 text-white/40'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function AdminHubContent() {
  const searchParams = useSearchParams();
  const adminKey     = searchParams.get('adminKey');

  const [tab,           setTab]           = useState<'payments' | 'disputes' | 'refunds'>('payments');
  const [matches,       setMatches]       = useState<Match[]>([]);
  const [disputes,      setDisputes]      = useState<Dispute[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [resolveModal,  setResolveModal]  = useState<Dispute | null>(null);
  const [resolutionVal, setResolutionVal] = useState('pay_carrier');
  const [noteVal,       setNoteVal]       = useState('');
  const [feedback,      setFeedback]      = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [mRes, dRes] = await Promise.all([
        fetch(`/api/admin/hub/matches?adminKey=${adminKey}`),
        fetch(`/api/admin/hub/disputes?adminKey=${adminKey}`),
      ]);
      if (mRes.ok) setMatches(await mRes.json().then(j => j.matches ?? []));
      if (dRes.ok) setDisputes(await dRes.json().then(j => j.disputes ?? []));
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const confirmPayment = async (matchId: string) => {
    setActionLoading(matchId);
    const res = await fetch('/api/admin/confirm-payment', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ matchId, adminKey }),
    });
    const j = await res.json();
    setFeedback(res.ok ? 'Payment confirmed — contact details released.' : j.error);
    setActionLoading(null);
    load();
  };

  const releasePayment = async (matchId: string) => {
    setActionLoading(matchId);
    const res = await fetch('/api/admin/release-payment', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey ?? '' },
      body:    JSON.stringify({ matchId }),
    });
    const j = await res.json();
    setFeedback(res.ok ? 'Payment released to carrier — match completed.' : j.error);
    setActionLoading(null);
    load();
  };

  const resolveDispute = async () => {
    if (!resolveModal) return;
    setActionLoading(resolveModal.id);
    const res = await fetch('/api/admin/disputes/resolve', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey ?? '' },
      body:    JSON.stringify({ disputeId: resolveModal.id, resolution: resolutionVal, note: noteVal }),
    });
    const j = await res.json();
    setFeedback(res.ok ? 'Dispute resolved.' : j.error);
    setActionLoading(null);
    setResolveModal(null);
    load();
  };

  const paymentPending = matches.filter(m => m.status === 'payment_processing');
  const deliveryDone   = matches.filter(m => m.status === 'delivery_confirmed');
  const refundReqs     = matches.filter(m => m.status === 'cancellation_requested');
  const openDisputes   = disputes.filter(d => d.status === 'open');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-xl font-bold">Boot<span className="text-blue-400">Hop</span></span>
          <span className="ml-3 text-xs bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide">Admin Hub</span>
        </div>
        <button onClick={load} className="text-white/40 hover:text-white transition-colors">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">

        {feedback && (
          <div className="mb-6 rounded-xl bg-green-500/20 border border-green-500/30 px-5 py-3 text-green-300 text-sm flex items-center justify-between">
            {feedback}
            <button onClick={() => setFeedback(null)} className="text-green-400 hover:text-green-200 ml-4">✕</button>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Awaiting payment', count: paymentPending.length, icon: DollarSign, color: 'text-amber-400' },
            { label: 'Release to carrier', count: deliveryDone.length, icon: Truck,      color: 'text-blue-400'  },
            { label: 'Open disputes',     count: openDisputes.length,  icon: Scale,      color: 'text-red-400'   },
            { label: 'Refund requests',   count: refundReqs.length,    icon: AlertTriangle, color: 'text-orange-400' },
          ].map(({ label, count, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <Icon className={`h-5 w-5 ${color} mb-2`} />
              <p className="text-2xl font-bold text-white">{count}</p>
              <p className="text-xs text-white/40 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1">
          {([['payments', 'Payments'], ['disputes', 'Disputes'], ['refunds', 'Refunds']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === key ? 'bg-blue-600 text-white' : 'text-white/40 hover:text-white/70'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* ── PAYMENTS TAB ── */}
            {tab === 'payments' && (
              <div className="space-y-4">
                <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                  <DollarSign className="h-3.5 w-3.5" /> Awaiting payment confirmation
                </h2>
                {paymentPending.length === 0 && <p className="text-white/30 text-sm text-center py-10">No pending payments.</p>}
                {paymentPending.map(m => {
                  const trip     = m.sender_trip;
                  const total    = (m.agreed_price ?? 0) + (m.insurance_fee ?? 0);
                  return (
                    <div key={m.id} className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-white font-semibold">{trip ? `${trip.from_city} → ${trip.to_city}` : 'Unknown route'}</p>
                          <p className="text-white/40 text-xs mt-0.5">{trip?.travel_date}</p>
                        </div>
                        <span className="text-amber-400 font-bold text-lg">£{total.toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-white/50 space-y-1 mb-4">
                        <p>Sender: <span className="text-white/70">{m.sender_email}</span></p>
                        <p>Carrier: <span className="text-white/70">{m.traveler_email}</span></p>
                        {m.goods_value && <p>Goods value: £{m.goods_value.toFixed(2)} · Insurance: £{(m.insurance_fee ?? 0).toFixed(2)}</p>}
                      </div>
                      <button
                        onClick={() => confirmPayment(m.id)}
                        disabled={actionLoading === m.id}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
                      >
                        {actionLoading === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        Confirm payment received
                      </button>
                    </div>
                  );
                })}

                <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider mt-8 mb-3 flex items-center gap-2">
                  <Truck className="h-3.5 w-3.5" /> Delivery confirmed — release to carrier
                </h2>
                {deliveryDone.length === 0 && <p className="text-white/30 text-sm text-center py-6">No pending releases.</p>}
                {deliveryDone.map(m => {
                  const trip = m.sender_trip;
                  return (
                    <div key={m.id} className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-white font-semibold">{trip ? `${trip.from_city} → ${trip.to_city}` : 'Unknown route'}</p>
                          <p className="text-white/40 text-xs mt-0.5">{trip?.travel_date}</p>
                        </div>
                        <span className="text-blue-400 font-bold text-lg">£{(m.agreed_price ?? 0).toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-white/50 space-y-1 mb-4">
                        <p>Carrier to pay: <span className="text-white/70">{m.traveler_email}</span></p>
                      </div>
                      <button
                        onClick={() => releasePayment(m.id)}
                        disabled={actionLoading === m.id}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
                      >
                        {actionLoading === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        Confirm payment sent to carrier
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── DISPUTES TAB ── */}
            {tab === 'disputes' && (
              <div className="space-y-4">
                {openDisputes.length === 0 && <p className="text-white/30 text-sm text-center py-10">No open disputes.</p>}
                {openDisputes.map(d => {
                  const m    = d.match;
                  const trip = m?.sender_trip;
                  return (
                    <div key={d.id} className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-white font-semibold">{trip ? `${trip.from_city} → ${trip.to_city}` : 'Unknown route'}</p>
                          <p className="text-white/40 text-xs mt-0.5">{new Date(d.created_at).toLocaleDateString('en-GB')}</p>
                        </div>
                        <Badge status={d.status} />
                      </div>
                      <div className="text-xs text-white/50 space-y-1 mb-3">
                        <p>Raised by: <span className="text-white/70">{d.raised_by}</span></p>
                        <p>Reason: <span className="text-white/70">{d.reason}</span></p>
                      </div>
                      <p className="text-sm text-white/60 bg-white/5 rounded-xl p-3 mb-4 italic">{d.description}</p>
                      <button
                        onClick={() => { setResolveModal(d); setResolutionVal('pay_carrier'); setNoteVal(''); }}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
                      >
                        <Scale className="h-4 w-4" /> Resolve dispute
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── REFUNDS TAB ── */}
            {tab === 'refunds' && (
              <div className="space-y-4">
                {refundReqs.length === 0 && <p className="text-white/30 text-sm text-center py-10">No refund requests.</p>}
                {refundReqs.map(m => {
                  const trip   = m.sender_trip;
                  const refund = ((m.agreed_price ?? 0) * 0.90).toFixed(2);
                  return (
                    <div key={m.id} className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5">
                      <div className="flex items-start justify-between mb-3">
                        <p className="text-white font-semibold">{trip ? `${trip.from_city} → ${trip.to_city}` : 'Unknown route'}</p>
                        <span className="text-orange-400 font-bold">Refund £{refund}</span>
                      </div>
                      <p className="text-xs text-white/50 mb-1">Requested by: {m.sender_email}</p>
                      <p className="text-xs text-white/40">Process refund manually then mark as cancelled in Supabase (matches table, id: {m.id})</p>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Resolve dispute modal */}
      {resolveModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-6">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-white font-bold text-lg mb-4">Resolve Dispute</h3>
            <div className="mb-4">
              <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-2">Decision</label>
              <select
                value={resolutionVal}
                onChange={e => setResolutionVal(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pay_carrier">Release payment to carrier</option>
                <option value="refund_sender">Refund sender</option>
                <option value="split">Split payment</option>
                <option value="no_action">No action — reactivate match</option>
              </select>
            </div>
            <div className="mb-5">
              <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-2">Note (sent to both parties)</label>
              <textarea
                value={noteVal}
                onChange={e => setNoteVal(e.target.value)}
                rows={3}
                placeholder="Explain the decision..."
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-white/20"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={resolveDispute}
                disabled={actionLoading === resolveModal.id}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm"
              >
                {actionLoading === resolveModal.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Confirm resolution
              </button>
              <button
                onClick={() => setResolveModal(null)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminHubPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-blue-400 animate-spin" />
      </div>
    }>
      <AdminHubContent />
    </Suspense>
  );
}
