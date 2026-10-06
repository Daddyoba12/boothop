'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';
import PushPermissionBanner from '@/components/PushPermissionBanner';
import {
  Package, Plane, CheckCircle, Clock, XCircle,
  ArrowRight, Shield, AlertCircle, FileEdit, Rocket, Trash2, PlusCircle, ThumbsUp, ThumbsDown, CalendarDays,
} from 'lucide-react';

interface PendingJourney {
  role: 'sender' | 'traveller';
  from: string;
  to: string;
  size: string;
  date: string;
}

const SIZE_TO_KG: Record<string, number> = {
  letter: 0.5, small: 3, medium: 10, large: 25,
};

const SIZE_LABEL: Record<string, string> = {
  letter: 'Letter / document',
  small: 'Small parcel',
  medium: 'Medium parcel',
  large: 'Large item',
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [publishingDraft, setPublishingDraft] = useState<string | null>(null);
  const [deletingTrip, setDeletingTrip] = useState<string | null>(null);
  const [credit, setCredit] = useState<{ amount_pence: number; redeemed: boolean } | null>(null);
  const [respondingMatch, setRespondingMatch] = useState<string | null>(null);
  const [counteringMatch, setCounteringMatch] = useState<string | null>(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterReason, setCounterReason] = useState('');
  const [counterSending, setCounterSending] = useState(false);
  const [counterError, setCounterError] = useState('');
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editDateError, setEditDateError] = useState('');
  const [savingDate, setSavingDate] = useState(false);

  // Pending journey from /start flow
  const [pendingJourney, setPendingJourney] = useState<PendingJourney | null>(null);
  const [pendingPrice, setPendingPrice] = useState('');
  const [pendingPriceError, setPendingPriceError] = useState('');
  const [publishingPending, setPublishingPending] = useState(false);
  const [justPublished, setJustPublished] = useState(false);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Read pending journey from localStorage (set by /start flow)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('boothop_pending_journey');
      if (raw) {
        const parsed = JSON.parse(raw) as PendingJourney;
        if (parsed.from && parsed.to && parsed.date) setPendingJourney(parsed);
      }
    } catch { /* private browsing or corrupt data */ }
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

      // Load signup credit (best-effort)
      fetch('/api/user/credit', { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d && !d.redeemed) setCredit(d); })
        .catch(() => {});

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

  const respondToMatch = async (matchId: string, action: 'accept' | 'decline') => {
    setRespondingMatch(matchId);
    try {
      const res = await fetch(`/api/matches/${matchId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || `Failed to ${action} match — please try again`);
        return;
      }
      if (action === 'accept') trackEvent('match_accepted', { match_id: matchId });
      loadDashboard();
    } catch {
      alert('Network error — please check your connection and try again');
    } finally {
      setRespondingMatch(null);
    }
  };

  const sendCounterOffer = async (matchId: string) => {
    const price = Number(counterPrice);
    if (!Number.isFinite(price) || price <= 0) {
      setCounterError('Enter a valid price.');
      return;
    }
    setCounterSending(true);
    setCounterError('');
    try {
      const res = await fetch(`/api/matches/${matchId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'counter', proposedPrice: price, reason: counterReason.trim() || undefined }),
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCounterError(data.error || 'Failed to send — please try again');
        return;
      }
      setCounteringMatch(null);
      setCounterPrice('');
      setCounterReason('');
      loadDashboard();
    } catch {
      setCounterError('Network error — please check your connection and try again');
    } finally {
      setCounterSending(false);
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

  const saveDate = async (tripId: string) => {
    if (!editDate) { setEditDateError('Please pick a date.'); return; }
    setSavingDate(true);
    setEditDateError('');
    try {
      const res = await fetch('/api/trips/update-date', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId, newDate: editDate }),
      });
      const data = await res.json();
      if (!res.ok) { setEditDateError(data.error || 'Could not update date.'); return; }
      setEditingTripId(null);
      setEditDate('');
      loadDashboard();
    } finally {
      setSavingDate(false);
    }
  };

  const publishPendingJourney = async () => {
    if (!pendingJourney) return;
    const price = parseFloat(pendingPrice.replace(/[^0-9.]/g, ''));
    if (!price || price <= 0) { setPendingPriceError('Please enter a budget greater than £0.'); return; }
    setPendingPriceError('');
    setPublishingPending(true);
    try {
      const res = await fetch('/api/trips/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          from:   pendingJourney.from,
          to:     pendingJourney.to,
          date:   pendingJourney.date,
          weight: SIZE_TO_KG[pendingJourney.size] ?? 5,
          price:  String(price),
          mode:   pendingJourney.role === 'sender' ? 'send' : 'travel',
        }),
      });
      const data = await res.json();
      if (!res.ok) { setPendingPriceError(data.error || 'Could not publish. Please try again.'); return; }
      localStorage.removeItem('boothop_pending_journey');
      setPendingJourney(null);
      setPendingPrice('');
      setJustPublished(true);
      loadDashboard();
    } finally {
      setPublishingPending(false);
    }
  };

  // Derive role: pending journey → existing trips → default sender
  const role: 'sender' | 'traveller' = pendingJourney?.role
    ?? (trips.some(t => t.type === 'travel') ? 'traveller'
      : trips.some(t => t.type === 'send') ? 'sender'
      : 'sender');

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Package className="w-16 h-16 text-blue-500 animate-bounce" />
      </div>
    );
  }


  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      active:   'bg-blue-50 text-blue-700 border-blue-200',
      matched:  'bg-emerald-50 text-emerald-700 border-emerald-200',
      cancelled:'bg-red-50 text-red-600 border-red-200',
    };
    const label: Record<string, string> = {
      active:   'Looking for match',
      matched:  'Matched',
      cancelled:'Cancelled',
    };
    const cls = map[s] ?? 'bg-slate-100 text-slate-600 border-slate-200';
    return (
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cls}`}>
        {label[s] ?? s}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">

      <PushPermissionBanner />

      {/* NAV */}
      <nav className="bg-white/90 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-blue-500" />
            <span className="font-bold text-slate-900 text-sm">Boot<span className="text-blue-500">Hop</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-slate-600 text-xs hidden sm:block truncate max-w-[200px]">{user?.email}</span>
            <button
              onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/'); }}
              className="text-xs text-slate-600 hover:text-slate-900 transition-colors border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-5 py-8 space-y-8">

          {/* £20 signup credit banner — shown until redeemed */}
          {credit && !credit.redeemed && (
            <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 p-5 flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 text-2xl">🎁</div>
              <div className="flex-1 min-w-0">
                <p className="text-amber-700 font-bold text-base mb-0.5">
                  You have £{(credit.amount_pence / 100).toFixed(0)} credit waiting
                </p>
                <p className="text-slate-600 text-xs">Automatically applied on your first delivery payment. No action needed.</p>
              </div>
              <Link href="/start?role=sender" className="shrink-0 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2 text-xs transition-all">
                Send now →
              </Link>
            </div>
          )}

        {/* ── PENDING JOURNEY CARD ── */}
        {pendingJourney && !justPublished && (
          <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-blue-50/60 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">{pendingJourney.role === 'sender' ? '📦' : '✈️'}</span>
              <p className="text-slate-900 font-bold text-base">One last step — set your budget to go live</p>
            </div>

            {/* Journey summary */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-slate-900 font-semibold text-lg">{pendingJourney.from.split(',')[0]}</span>
              <ArrowRight className="h-4 w-4 text-slate-300 shrink-0" />
              <span className="text-slate-900 font-semibold text-lg">{pendingJourney.to.split(',')[0]}</span>
            </div>
            <p className="text-slate-600 text-sm mb-5">
              {new Date(pendingJourney.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              {pendingJourney.size && <> · {SIZE_LABEL[pendingJourney.size] ?? pendingJourney.size}</>}
            </p>

            {/* Price input */}
            <div className="flex gap-3 items-start">
              <div className="flex-1">
                <label className="block text-xs text-slate-600 mb-1.5">
                  {pendingJourney.role === 'sender' ? 'Your budget (£) — what you\'re willing to pay' : 'Your price (£) — what you charge to carry'}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-semibold">£</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 40"
                    value={pendingPrice}
                    onChange={e => { setPendingPrice(e.target.value); setPendingPriceError(''); }}
                    onKeyDown={e => e.key === 'Enter' && publishPendingJourney()}
                    className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-4 py-3 text-slate-900 text-base placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all"
                  />
                </div>
                {pendingPriceError && <p className="mt-1 text-xs text-red-500">{pendingPriceError}</p>}
              </div>
              <button
                onClick={publishPendingJourney}
                disabled={publishingPending}
                className="mt-6 shrink-0 flex items-center gap-2 rounded-xl bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white font-bold px-5 py-3 text-sm transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(59,130,246,0.3)]"
              >
                {publishingPending ? 'Publishing...' : <><Rocket className="w-4 h-4" /> Publish now</>}
              </button>
            </div>

            <button
              onClick={() => { localStorage.removeItem('boothop_pending_journey'); setPendingJourney(null); }}
              className="mt-4 text-xs text-slate-500 hover:text-slate-900 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ── JUST PUBLISHED SUCCESS ── */}
        {justPublished && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-5 flex items-center gap-4">
            <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
            <div>
              <p className="text-slate-900 font-semibold text-sm">
                {role === 'sender' ? 'Your request is live.' : 'Your trip is live.'}
              </p>
              <p className="text-slate-600 text-xs mt-0.5">
                {role === 'sender'
                  ? 'We\'re matching you with verified travellers heading that way.'
                  : 'We\'ll notify you as soon as senders match your journey.'}
              </p>
            </div>
          </div>
        )}

        {/* PAGE HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              {role === 'sender' ? 'My Packages' : 'My Trips'}
            </h1>
            <p className="text-slate-600 text-sm mt-0.5">
              {role === 'sender' ? 'Your delivery requests and matches' : 'Your journeys and parcel requests'}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/start"
              className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all">
              <PlusCircle className="w-4 h-4" /> New listing
            </Link>
          </div>
        </div>

        {/* DRAFTS BANNER */}
        {drafts.length > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <FileEdit className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-amber-700 text-sm font-semibold mb-1">You have {drafts.length} unpublished draft{drafts.length > 1 ? 's' : ''}</p>
              <p className="text-amber-600/80 text-xs">Publish them below to go live and start matching.</p>
            </div>
          </div>
        )}

        {/* ── MY LISTINGS ─────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-3">My Listings</h2>

          {/* Drafts inline */}
          {drafts.map(draft => (
            <div key={draft.id} className="mb-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${draft.type === 'travel' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                {draft.type === 'travel' ? <Plane className="w-4 h-4 text-blue-600" /> : <Package className="w-4 h-4 text-purple-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-900 font-medium text-sm">{draft.from_city} → {draft.to_city}</p>
                <p className="text-slate-600 text-xs">{draft.travel_date ? new Date(draft.travel_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'} · {draft.type === 'travel' ? 'Travelling' : 'Sending'}{draft.price ? ` · £${Number(draft.price).toFixed(2)}` : ''}</p>
              </div>
              <span className="text-xs font-semibold text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full shrink-0">Draft</span>
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
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-4">
                {role === 'sender' ? <Package className="w-7 h-7 text-blue-600" /> : <Plane className="w-7 h-7 text-blue-600" />}
              </div>
              <h3 className="text-slate-900 font-semibold mb-1">
                {role === 'sender' ? 'No packages yet' : 'No trips yet'}
              </h3>
              <p className="text-slate-600 text-sm mb-5">
                {role === 'sender'
                  ? 'Post your first delivery request to get matched with a verified traveller.'
                  : 'Post your first trip to start receiving parcel requests from senders.'}
              </p>
              <Link
                href="/start"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-all"
              >
                <PlusCircle className="w-4 h-4" /> Post a new listing
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {trips.map(trip => {
                const isPast = trip.travel_date < today;
                return (
                  <div key={trip.id} className={`rounded-2xl border transition-all ${isPast ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200 hover:shadow-sm'}`}>
                    <div className="flex items-center gap-4 p-4">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${trip.type === 'travel' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                        {trip.type === 'travel' ? <Plane className="w-4 h-4 text-blue-600" /> : <Package className="w-4 h-4 text-purple-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-slate-900 font-medium text-sm">{trip.from_city} → {trip.to_city}</p>
                          {statusBadge(isPast ? 'cancelled' : (trip.status ?? 'active'))}
                          {isPast && <span className="text-xs text-slate-600">Past</span>}
                        </div>
                        <p className="text-slate-600 text-xs mt-0.5">
                          {trip.travel_date ? new Date(trip.travel_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          {' · '}{trip.type === 'travel' ? 'Travelling' : 'Sending'}
                          {trip.price ? ` · £${Number(trip.price).toFixed(2)}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!isPast && ['active', 'pending'].includes(trip.status ?? '') && (
                          <button
                            onClick={() => { setEditingTripId(trip.id); setEditDate(trip.travel_date ?? ''); setEditDateError(''); }}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all"
                            title="Change date"
                          >
                            <CalendarDays className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteTrip(trip.id)}
                          disabled={deletingTrip === trip.id}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                          title="Delete listing"
                        >
                          {deletingTrip === trip.id ? <Clock className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    {/* Inline date editor */}
                    {editingTripId === trip.id && (
                      <div className="px-4 pb-4 pt-0 border-t border-slate-100 mt-0">
                        <p className="text-xs text-slate-600 mb-2 mt-3">Change your travel date (must be future)</p>
                        <div className="flex gap-2 items-start">
                          <div className="flex-1">
                            <input
                              type="date"
                              value={editDate}
                              min={(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })()}
                              onChange={e => { setEditDate(e.target.value); setEditDateError(''); }}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all"
                            />
                            {editDateError && <p className="mt-1 text-xs text-red-500">{editDateError}</p>}
                          </div>
                          <button
                            onClick={() => saveDate(trip.id)}
                            disabled={savingDate}
                            className="shrink-0 flex items-center gap-1.5 rounded-xl bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white font-bold px-4 py-2 text-xs transition-all"
                          >
                            {savingDate ? <Clock className="w-3 h-3 animate-spin" /> : 'Save'}
                          </button>
                          <button
                            onClick={() => { setEditingTripId(null); setEditDate(''); setEditDateError(''); }}
                            className="shrink-0 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-800 px-4 py-2 text-xs transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── MY MATCHES ──────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-3">
            My Matches {matches.length > 0 && <span className="text-slate-600 normal-case">({matches.length})</span>}
          </h2>

          {matches.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
              <p className="text-slate-600 text-sm">No matches yet — your listings are being searched every few minutes.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((match) => {
                const st = getMatchStatus(match);
                const StatusIcon = st.icon;
                const senderTrip = Array.isArray(match.sender_trip) ? match.sender_trip[0] : match.sender_trip;
                const travelerTrip = Array.isArray(match.traveler_trip) ? match.traveler_trip[0] : match.traveler_trip;
                const displayTrip = senderTrip || travelerTrip;

                // Don't show matches where both trips are gone
                if (!displayTrip) return null;

                const tripDate = displayTrip?.travel_date ? displayTrip.travel_date.split('T')[0] : null;
                const isExpired = tripDate && tripDate < today;

                // Hide expired matched-only matches and terminal statuses — nothing actionable
                if (isExpired && match.status === 'matched') return null;
                if (['declined', 'cancelled', 'completed'].includes(match.status)) return null;

                return (
                  <div key={match.id} className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="text-slate-900 font-medium text-sm">
                          {displayTrip.from_city} → {displayTrip.to_city}
                        </p>
                        <p className="text-slate-600 text-xs mt-0.5">
                          {tripDate ? new Date(tripDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          {(match.agreed_price ?? match.offered_price) ? ` · £${Number(match.agreed_price ?? match.offered_price).toFixed(2)}` : ''}
                          {senderTrip?.weight ? ` · ${senderTrip.weight} kg` : ''}
                        </p>
                      </div>
                      <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${
                        st.color === 'green'  ? 'bg-green-50 text-green-700 border-green-200' :
                        st.color === 'blue'   ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        st.color === 'yellow' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        st.color === 'violet' ? 'bg-violet-50 text-violet-700 border-violet-200' :
                        st.color === 'red'    ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        <StatusIcon className="w-3 h-3" />
                        {st.label}
                      </div>
                    </div>
                    {/* Accept / Decline — only if trip date hasn't passed */}
                    {match.status === 'matched' && !isExpired && (() => {
                      const userIsSender = match.sender_email === user?.email;
                      const userTrip     = userIsSender ? senderTrip : travelerTrip;

                      // Express-interest match: one side is auto_created (the expresser).
                      // The listing owner (non-auto_created) can respond; expresser waits.
                      // Cron match: neither is auto_created — both parties can respond.
                      const isExpressInterest = !!(senderTrip?.auto_created || travelerTrip?.auto_created);
                      const canRespond = isExpressInterest ? !userTrip?.auto_created : true;

                      return canRespond
                        ? (
                          <div className="flex gap-2 mb-2">
                            <button
                              onClick={() => respondToMatch(match.id, 'accept')}
                              disabled={respondingMatch === match.id}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" /> Accept
                            </button>
                            <button
                              onClick={() => respondToMatch(match.id, 'decline')}
                              disabled={respondingMatch === match.id}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" /> Decline
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-600 text-center mb-2">Waiting for listing owner to respond…</p>
                        )
                    })()}
                    {/* Adjust price instead of a flat accept (e.g. extra leg, cross-border connection) */}
                    {match.status === 'matched' && !isExpired && (() => {
                      const userIsSender = match.sender_email === user?.email;
                      const userTrip     = userIsSender ? senderTrip : travelerTrip;
                      const isExpressInterest = !!(senderTrip?.auto_created || travelerTrip?.auto_created);
                      const canRespond = isExpressInterest ? !userTrip?.auto_created : true;
                      if (!canRespond) return null;

                      if (counteringMatch !== match.id) {
                        return (
                          <button
                            onClick={() => { setCounteringMatch(match.id); setCounterPrice(String(match.agreed_price ?? match.offered_price ?? '')); setCounterError(''); }}
                            className="w-full text-center text-xs text-slate-600 hover:text-slate-900 underline mb-2"
                          >
                            Need a different price? Adjust instead
                          </button>
                        );
                      }

                      return (
                        <div className="mb-2 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                          <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Your price (£)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={counterPrice}
                            onChange={e => setCounterPrice(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                            placeholder="e.g. 180"
                          />
                          <input
                            type="text"
                            value={counterReason}
                            onChange={e => setCounterReason(e.target.value)}
                            maxLength={200}
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                            placeholder="Optional note (e.g. connecting leg cost) — visible to the other party"
                          />
                          {counterError && <p className="text-xs text-red-600">{counterError}</p>}
                          <div className="flex gap-2">
                            <button
                              onClick={() => sendCounterOffer(match.id)}
                              disabled={counterSending}
                              className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg disabled:opacity-50"
                            >
                              {counterSending ? 'Sending…' : 'Send new price'}
                            </button>
                            <button
                              onClick={() => { setCounteringMatch(null); setCounterError(''); }}
                              disabled={counterSending}
                              className="px-3 py-2 bg-white border border-slate-300 text-slate-600 text-xs font-semibold rounded-lg"
                            >
                              Cancel
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-500">The other party will be asked to accept or decline this price. Declining ends the match.</p>
                        </div>
                      );
                    })()}
                    <div className="flex gap-2">
                      <Link
                        href={`/matches/${match.id}`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl transition-all"
                      >
                        View details <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      {['escrowed', 'active'].includes(match.status) && (
                        <Link
                          href={`/track/${match.id}`}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold rounded-xl transition-all shrink-0"
                        >
                          <Rocket className="w-3.5 h-3.5" /> Track
                        </Link>
                      )}
                    </div>
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
