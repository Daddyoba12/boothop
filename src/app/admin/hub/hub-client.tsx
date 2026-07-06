'use client';

import { useEffect, useState } from 'react';
import {
  CheckCircle, XCircle, AlertTriangle, Clock,
  Loader2, RefreshCw, DollarSign, Truck, Scale, Globe, Zap,
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

export default function AdminHubClient() {
  const [tab,           setTab]           = useState<'africa_auth' | 'payments' | 'disputes' | 'refunds' | 'commander'>('africa_auth');
  const [matches,       setMatches]       = useState<Match[]>([]);
  const [disputes,      setDisputes]      = useState<Dispute[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [resolveModal,  setResolveModal]  = useState<Dispute | null>(null);
  const [resolutionVal, setResolutionVal] = useState('pay_carrier');
  const [noteVal,       setNoteVal]       = useState('');
  const [feedback,      setFeedback]      = useState<string | null>(null);
  const [matchRunning,  setMatchRunning]  = useState(false);
  const [matchResult,   setMatchResult]   = useState<string | null>(null);

  // Commander account creation
  const [cmdCompany,    setCmdCompany]    = useState('');
  const [cmdSlug,       setCmdSlug]       = useState('');
  const [cmdEmail,      setCmdEmail]      = useState('');
  const [cmdPassword,   setCmdPassword]   = useState('');
  const [cmdPlan,       setCmdPlan]       = useState('basic');
  const [cmdBusy,       setCmdBusy]       = useState(false);
  const [cmdResult,     setCmdResult]     = useState<string | null>(null);
  const [cmdClients,    setCmdClients]    = useState<{ id: string; slug: string; company: string; email: string; plan: string; status: string; created_at: string }[]>([]);

  const loadCmdClients = async () => {
    const res = await fetch('/api/admin/commander/clients');
    if (res.ok) setCmdClients((await res.json()).clients ?? []);
  };

  const createCmdAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cmdPassword.length < 8) { setCmdResult('❌ Password must be at least 8 characters.'); return; }
    setCmdBusy(true); setCmdResult(null);
    try {
      const res = await fetch('/api/commander/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': 'Devastation3241@@' },
        body: JSON.stringify({ company: cmdCompany, slug: cmdSlug, email: cmdEmail, password: cmdPassword, plan: cmdPlan }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed');
      setCmdResult(`✅ Account created — Company ID: ${cmdSlug}`);
      setCmdCompany(''); setCmdSlug(''); setCmdEmail(''); setCmdPassword('');
      loadCmdClients();
    } catch (err: any) {
      setCmdResult(`❌ ${err.message}`);
    }
    setCmdBusy(false);
  };

  const runMatch = async () => {
    setMatchRunning(true);
    setMatchResult(null);
    try {
      const res  = await fetch('/api/cron/auto-match', { method: 'POST' });
      const json = await res.json();
      if (res.ok) {
        const created = json.matched ?? json.matches_created ?? 0;
        setMatchResult(created > 0
          ? `Match run complete — ${created} new match${created !== 1 ? 'es' : ''} created. Emails sent.`
          : 'Match run complete — no new matches found right now.');
        if (created > 0) load();
      } else {
        setMatchResult(`Error: ${json.error ?? 'Match run failed'}`);
      }
    } catch (e) {
      setMatchResult('Network error — match run failed.');
    }
    setMatchRunning(false);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [mRes, dRes] = await Promise.all([
        fetch('/api/admin/hub/matches'),
        fetch('/api/admin/hub/disputes'),
      ]);
      if (mRes.ok) setMatches(await mRes.json().then((j: { matches?: Match[] }) => j.matches ?? []));
      if (dRes.ok) setDisputes(await dRes.json().then((j: { disputes?: Dispute[] }) => j.disputes ?? []));
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (tab === 'commander') loadCmdClients(); }, [tab]);

  const confirmPayment = async (matchId: string) => {
    setActionLoading(matchId);
    const res = await fetch('/api/admin/confirm-payment', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ matchId }),
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ disputeId: resolveModal.id, resolution: resolutionVal, note: noteVal }),
    });
    const j = await res.json();
    setFeedback(res.ok ? 'Dispute resolved.' : j.error);
    setActionLoading(null);
    setResolveModal(null);
    load();
  };

  const africaPending  = matches.filter(m => m.status === 'awaiting_authorisation');
  const paymentPending = matches.filter(m => m.status === 'payment_processing');
  const deliveryDone   = matches.filter(m => m.status === 'delivery_confirmed');
  const refundReqs     = matches.filter(m => m.status === 'cancellation_requested');
  const openDisputes   = disputes.filter(d => d.status === 'open');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 bg-slate-950/90 backdrop-blur-sm z-20">
        <div className="flex items-center gap-3">
          <a href="/admin" className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all" title="Back to Admin">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M19 12H5"/><path d="m12 5-7 7 7 7"/></svg>
          </a>
          <span className="text-xl font-bold">Boot<span className="text-blue-400">Hop</span></span>
          <span className="text-xs bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide">Admin Hub</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={runMatch}
            disabled={matchRunning}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all"
          >
            {matchRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {matchRunning ? 'Running…' : 'Run Match Now'}
          </button>
          <a href="/admin" className="text-white/40 hover:text-white text-xs transition-colors">← Admin</a>
          <button onClick={load} className="text-white/40 hover:text-white transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">

        {matchResult && (
          <div className={`mb-4 rounded-xl border px-5 py-3 text-sm flex items-center justify-between ${
            matchResult.startsWith('Error') || matchResult.startsWith('Network')
              ? 'bg-red-500/20 border-red-500/30 text-red-300'
              : 'bg-blue-500/20 border-blue-500/30 text-blue-300'
          }`}>
            <span><Zap className="h-4 w-4 inline mr-2 opacity-70" />{matchResult}</span>
            <button onClick={() => setMatchResult(null)} className="ml-4 opacity-60 hover:opacity-100">✕</button>
          </div>
        )}

        {feedback && (
          <div className="mb-6 rounded-xl bg-green-500/20 border border-green-500/30 px-5 py-3 text-green-300 text-sm flex items-center justify-between">
            {feedback}
            <button onClick={() => setFeedback(null)} className="text-green-400 hover:text-green-200 ml-4">✕</button>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Africa auth',       count: africaPending.length, icon: Globe,         color: 'text-emerald-400' },
            { label: 'Awaiting payment',  count: paymentPending.length,icon: DollarSign,    color: 'text-amber-400'   },
            { label: 'Release to carrier',count: deliveryDone.length,  icon: Truck,         color: 'text-blue-400'    },
            { label: 'Open disputes',     count: openDisputes.length,  icon: Scale,         color: 'text-red-400'     },
            { label: 'Refund requests',   count: refundReqs.length,    icon: AlertTriangle, color: 'text-orange-400'  },
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
          {([
            ['africa_auth', `Africa Auth${africaPending.length ? ` (${africaPending.length})` : ''}`],
            ['payments',    'Payments'],
            ['disputes',    'Disputes'],
            ['refunds',     'Refunds'],
            ['commander',   'Commander'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === key
                  ? key === 'africa_auth' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                  : 'text-white/40 hover:text-white/70'
              }`}
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
            {/* ── AFRICA AUTH TAB ── */}
            {tab === 'africa_auth' && (
              <div className="space-y-4">
                <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-emerald-400" /> Africa-outbound matches awaiting authorisation
                </h2>
                <p className="text-white/40 text-xs mb-4">These matches were auto-detected as originating in Africa. Neither party has been notified. Approve to send match emails and continue the normal flow, or reject to silently cancel.</p>
                {africaPending.length === 0 && <p className="text-white/30 text-sm text-center py-10">No matches pending authorisation.</p>}
                {africaPending.map(m => {
                  const trip = m.sender_trip;
                  return (
                    <div key={m.id} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full font-semibold mr-2">Africa outbound</span>
                          <p className="text-white font-semibold mt-1">{trip ? `${trip.from_city} → ${trip.to_city}` : 'Unknown route'}</p>
                          <p className="text-white/40 text-xs mt-0.5">{trip?.travel_date}</p>
                        </div>
                        <span className="text-emerald-400 font-bold text-lg">£{(m.agreed_price ?? 0).toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-white/50 space-y-1 mb-4">
                        <p>Sender: <span className="text-white/70">{m.sender_email}</span></p>
                        <p>Carrier: <span className="text-white/70">{m.traveler_email}</span></p>
                        <p className="text-white/30 text-xs mt-1">Match ID: {m.id}</p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={async () => {
                            setActionLoading(m.id);
                            const res = await fetch('/api/admin/authorise-match', {
                              method:  'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body:    JSON.stringify({ matchId: m.id, action: 'approve' }),
                            });
                            setFeedback(res.ok ? `Match approved — both parties notified.` : 'Error approving match.');
                            setActionLoading(null);
                            load();
                          }}
                          disabled={actionLoading === m.id}
                          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
                        >
                          {actionLoading === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                          Approve &amp; notify parties
                        </button>
                        <button
                          onClick={async () => {
                            setActionLoading(m.id + '_reject');
                            const res = await fetch('/api/admin/authorise-match', {
                              method:  'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body:    JSON.stringify({ matchId: m.id, action: 'reject' }),
                            });
                            setFeedback(res.ok ? 'Match rejected and cancelled.' : 'Error rejecting match.');
                            setActionLoading(null);
                            load();
                          }}
                          disabled={actionLoading === m.id + '_reject'}
                          className="flex items-center gap-2 bg-red-600/80 hover:bg-red-500 disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
                        >
                          {actionLoading === m.id + '_reject' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── PAYMENTS TAB ── */}
            {tab === 'payments' && (
              <div className="space-y-4">
                <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                  <DollarSign className="h-3.5 w-3.5" /> Awaiting payment confirmation
                </h2>
                {paymentPending.length === 0 && <p className="text-white/30 text-sm text-center py-10">No pending payments.</p>}
                {paymentPending.map(m => {
                  const trip  = m.sender_trip;
                  const total = (m.agreed_price ?? 0) + (m.insurance_fee ?? 0);
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
            {/* ── COMMANDER TAB ── */}
            {tab === 'commander' && (
              <div className="space-y-8">
                {/* Create account form */}
                <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-6">
                  <h2 className="text-white font-bold text-sm uppercase tracking-wide mb-1">Create Commander Account</h2>
                  <p className="text-white/40 text-xs mb-5">Accounts are invite-only. Fill this form to provision access for a client.</p>
                  {cmdResult && (
                    <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${cmdResult.startsWith('✅') ? 'bg-green-500/10 border-green-500/20 text-green-300' : 'bg-red-500/10 border-red-500/20 text-red-300'}`}>
                      {cmdResult}
                    </div>
                  )}
                  <form onSubmit={createCmdAccount} className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-white/50 text-xs font-semibold uppercase tracking-wide mb-1.5">Company Name *</label>
                      <input type="text" value={cmdCompany} required onChange={e => {
                        setCmdCompany(e.target.value);
                        if (!cmdSlug) setCmdSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                      }} placeholder="Acme Media"
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm" />
                    </div>
                    <div>
                      <label className="block text-white/50 text-xs font-semibold uppercase tracking-wide mb-1.5">Company ID (slug) *</label>
                      <input type="text" value={cmdSlug} required onChange={e => setCmdSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        placeholder="acme-media"
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm" />
                      <p className="text-white/25 text-[10px] mt-1">This is their login username — cannot be changed.</p>
                    </div>
                    <div>
                      <label className="block text-white/50 text-xs font-semibold uppercase tracking-wide mb-1.5">Email</label>
                      <input type="email" value={cmdEmail} onChange={e => setCmdEmail(e.target.value)} placeholder="john@acme.com"
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm" />
                    </div>
                    <div>
                      <label className="block text-white/50 text-xs font-semibold uppercase tracking-wide mb-1.5">Password *</label>
                      <input type="text" value={cmdPassword} required onChange={e => setCmdPassword(e.target.value)} placeholder="Min 8 characters"
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm" />
                    </div>
                    <div>
                      <label className="block text-white/50 text-xs font-semibold uppercase tracking-wide mb-1.5">Plan</label>
                      <select value={cmdPlan} onChange={e => setCmdPlan(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm appearance-none cursor-pointer">
                        <option value="basic" className="bg-slate-900">Basic</option>
                        <option value="pro" className="bg-slate-900">Pro</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <button type="submit" disabled={cmdBusy}
                        className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-black font-bold rounded-xl text-sm disabled:opacity-60 transition-all hover:shadow-lg">
                        {cmdBusy ? 'Creating…' : 'Create Commander Account →'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Existing accounts */}
                <div>
                  <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">Existing Accounts ({cmdClients.length})</h2>
                  {cmdClients.length === 0
                    ? <p className="text-white/30 text-sm text-center py-8">No Commander accounts yet.</p>
                    : (
                      <div className="space-y-3">
                        {cmdClients.map(c => (
                          <div key={c.id} className="rounded-xl border border-white/10 bg-white/5 px-5 py-4 flex items-center justify-between">
                            <div>
                              <p className="text-white font-semibold text-sm">{c.company}</p>
                              <p className="text-white/40 text-xs mt-0.5">slug: <span className="text-orange-400 font-mono">{c.slug}</span> · {c.email || 'no email'}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${c.plan === 'pro' ? 'bg-orange-500/20 text-orange-400' : 'bg-white/10 text-white/40'}`}>{c.plan}</span>
                              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${c.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{c.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  }
                </div>
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
