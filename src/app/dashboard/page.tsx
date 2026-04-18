'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Package, Plane, CheckCircle, Clock, XCircle,
  ArrowRight, Shield, AlertCircle, FileEdit, Rocket, Trash2, PlusCircle,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [publishingDraft, setPublishingDraft] = useState<string | null>(null);
  const [deletingTrip, setDeletingTrip] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      // Use the dashboard API which uses the admin client (bypasses RLS)
      const dashRes = await fetch('/api/dashboard', { credentials: 'include' });
      if (!dashRes.ok) {
        router.push('/login');
        return;
      }
      const dash = await dashRes.json();

      // Resolve email from session
      const meRes = await fetch('/api/auth/me', { credentials: 'include' });
      if (!meRes.ok) { router.push('/login'); return; }
      const me = await meRes.json();
      if (!me.authenticated || !me.user?.email) { router.push('/login'); return; }

      setUser({ email: me.user.email });
      setTrips(dash.trips || []);
      setMatches(dash.matches || []);
      setLoading(false);

      // Load journey drafts
      fetch('/api/drafts')
        .then(r => r.json())
        .then(d => setDrafts(d.drafts || []))
        .catch(() => {});

    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
    }
  };

  const publishDraft = async (draftId: string) => {
    setPublishingDraft(draftId);
    try {
      const res = await fetch('/api/trips/publish-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to publish');
      setDrafts(prev => prev.filter(d => d.id !== draftId));
      loadDashboard();
    } catch (err: any) {
      alert(err.message || 'Could not publish draft');
    } finally {
      setPublishingDraft(null);
    }
  };

  const deleteTrip = async (tripId: string) => {
    setDeletingTrip(tripId);
    try {
      const res = await fetch('/api/trips/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Could not delete trip'); return; }
      setTrips(prev => prev.filter(t => t.id !== tripId));
    } finally {
      setDeletingTrip(null);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const getMatchStatus = (match: any) => {
    switch (match.status) {
      case 'matched':                return { label: 'Matched',            color: 'blue',   icon: Clock };
      case 'agreed':                 return { label: 'Price agreed',       color: 'blue',   icon: Clock };
      case 'committed':              return { label: 'Terms signed',       color: 'blue',   icon: Clock };
      case 'kyc_pending':            return { label: 'ID Check',           color: 'violet', icon: Shield };
      case 'kyc_complete':           return { label: 'ID Verified',        color: 'green',  icon: CheckCircle };
      case 'payment_processing':     return { label: 'Payment processing', color: 'yellow', icon: Clock };
      case 'active':                 return { label: 'Active',             color: 'blue',   icon: CheckCircle };
      case 'delivery_confirmed':     return { label: 'Delivery confirmed', color: 'green',  icon: CheckCircle };
      case 'completed':              return { label: 'Completed',          color: 'green',  icon: CheckCircle };
      case 'disputed':               return { label: 'Disputed',           color: 'red',    icon: AlertCircle };
      case 'cancellation_requested': return { label: 'Cancellation req.',  color: 'yellow', icon: AlertCircle };
      case 'declined':               return { label: 'Declined',           color: 'red',    icon: XCircle };
      case 'cancelled':              return { label: 'Cancelled',          color: 'red',    icon: XCircle };
      default:                       return { label: match.status ?? 'Unknown', color: 'gray', icon: AlertCircle };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <Package className="w-16 h-16 text-blue-400 animate-bounce" />
      </div>
    );
  }


  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      active:   'bg-blue-500/20 text-blue-300 border-blue-500/30',
      matched:  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      cancelled:'bg-red-500/20 text-red-400 border-red-500/30',
    };
    const label: Record<string, string> = {
      active:   'Looking for match',
      matched:  'Matched',
      cancelled:'Cancelled',
    };
    const cls = map[s] ?? 'bg-white/10 text-white/50 border-white/10';
    return (
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cls}`}>
        {label[s] ?? s}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0c1e3d] to-slate-950">

      {/* NAV */}
      <nav className="bg-white/5 backdrop-blur-xl border-b border-white/8 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-white text-sm">Boot<span className="text-blue-400">Hop</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-white/40 text-xs hidden sm:block truncate max-w-[200px]">{user?.email}</span>
            <button
              onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/'); }}
              className="text-xs text-white/60 hover:text-white transition-colors border border-white/15 px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-5 py-8 space-y-8">

        {/* PAGE HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">My Portal</h1>
            <p className="text-slate-500 text-sm mt-0.5">Your listings and matches</p>
          </div>
          <div className="flex gap-2">
            <Link href="/register?type=travel"
              className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all">
              <PlusCircle className="w-4 h-4" /> New listing
            </Link>
          </div>
        </div>

        {/* DRAFTS BANNER */}
        {drafts.length > 0 && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-start gap-3">
            <FileEdit className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-amber-300 text-sm font-semibold mb-1">You have {drafts.length} unpublished draft{drafts.length > 1 ? 's' : ''}</p>
              <p className="text-amber-400/70 text-xs">Publish them below to go live and start matching.</p>
            </div>
          </div>
        )}

        {/* ── MY LISTINGS ─────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">My Listings</h2>

          {/* Drafts inline */}
          {drafts.map(draft => (
            <div key={draft.id} className="mb-3 bg-amber-500/8 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${draft.type === 'travel' ? 'bg-blue-500/20' : 'bg-purple-500/20'}`}>
                {draft.type === 'travel' ? <Plane className="w-4 h-4 text-blue-400" /> : <Package className="w-4 h-4 text-purple-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm">{draft.from_city} → {draft.to_city}</p>
                <p className="text-slate-500 text-xs">{draft.travel_date ? new Date(draft.travel_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'} · {draft.type === 'travel' ? 'Travelling' : 'Sending'}{draft.price ? ` · £${Number(draft.price).toFixed(2)}` : ''}</p>
              </div>
              <span className="text-xs font-semibold text-amber-400 bg-amber-500/15 border border-amber-500/25 px-2.5 py-1 rounded-full shrink-0">Draft</span>
              <button
                onClick={() => publishDraft(draft.id)}
                disabled={publishingDraft === draft.id}
                className="shrink-0 flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-60"
              >
                {publishingDraft === draft.id ? <Clock className="w-3 h-3 animate-spin" /> : <Rocket className="w-3 h-3" />}
                Publish
              </button>
            </div>
          ))}

          {/* Active trips */}
          {trips.length === 0 && drafts.length === 0 ? (
            <div className="bg-white/4 border border-white/8 rounded-2xl p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <Package className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-white font-semibold mb-1">No listings yet</h3>
              <p className="text-slate-500 text-sm mb-5">Create a listing to get matched with senders or travellers.</p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Link href="/register?type=travel" className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all">
                  <Plane className="w-4 h-4" /> I&apos;m Travelling
                </Link>
                <Link href="/register?type=send" className="flex items-center justify-center gap-2 border border-white/12 hover:bg-white/5 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all">
                  <Package className="w-4 h-4" /> I Want to Send
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {trips.map(trip => {
                const isPast = trip.travel_date < today;
                return (
                  <div key={trip.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${isPast ? 'bg-white/3 border-white/6 opacity-60' : 'bg-white/6 border-white/10 hover:bg-white/8'}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${trip.type === 'travel' ? 'bg-blue-500/20' : 'bg-purple-500/20'}`}>
                      {trip.type === 'travel' ? <Plane className="w-4 h-4 text-blue-400" /> : <Package className="w-4 h-4 text-purple-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-medium text-sm">{trip.from_city} → {trip.to_city}</p>
                        {statusBadge(isPast ? 'cancelled' : (trip.status ?? 'active'))}
                        {isPast && <span className="text-xs text-slate-600">Past</span>}
                      </div>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {trip.travel_date ? new Date(trip.travel_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        {' · '}{trip.type === 'travel' ? 'Travelling' : 'Sending'}
                        {trip.price ? ` · £${Number(trip.price).toFixed(2)}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteTrip(trip.id)}
                      disabled={deletingTrip === trip.id}
                      className="shrink-0 p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                      title="Delete listing"
                    >
                      {deletingTrip === trip.id ? <Clock className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── MY MATCHES ──────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
            My Matches {matches.length > 0 && <span className="text-slate-600 normal-case">({matches.length})</span>}
          </h2>

          {matches.length === 0 ? (
            <div className="bg-white/4 border border-white/8 rounded-2xl p-6 text-center">
              <p className="text-slate-600 text-sm">No matches yet — your listings are being searched every few minutes.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((match) => {
                const st = getMatchStatus(match);
                const StatusIcon = st.icon;
                const senderTrip = Array.isArray(match.sender_trip) ? match.sender_trip[0] : match.sender_trip;
                return (
                  <div key={match.id} className="bg-white/6 border border-white/10 rounded-2xl p-4 hover:bg-white/8 transition-all">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="text-white font-medium text-sm">
                          {senderTrip ? `${senderTrip.from_city} → ${senderTrip.to_city}` : '—'}
                        </p>
                        <p className="text-slate-500 text-xs mt-0.5">
                          {senderTrip?.travel_date ? new Date(senderTrip.travel_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          {match.agreed_price ? ` · £${Number(match.agreed_price).toFixed(2)}` : ''}
                        </p>
                      </div>
                      <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${
                        st.color === 'green'  ? 'bg-green-500/15 text-green-300 border-green-500/25' :
                        st.color === 'blue'   ? 'bg-blue-500/15 text-blue-300 border-blue-500/25' :
                        st.color === 'yellow' ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/25' :
                        st.color === 'violet' ? 'bg-violet-500/15 text-violet-300 border-violet-500/25' :
                        st.color === 'red'    ? 'bg-red-500/15 text-red-300 border-red-500/25' :
                        'bg-white/8 text-white/50 border-white/10'
                      }`}>
                        <StatusIcon className="w-3 h-3" />
                        {st.label}
                      </div>
                    </div>
                    <Link
                      href={`/matches/${match.id}`}
                      className="flex items-center justify-center gap-1.5 w-full py-2 bg-white/6 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold rounded-xl transition-all"
                    >
                      View details <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
