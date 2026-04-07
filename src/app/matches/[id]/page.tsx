'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle, Clock, AlertCircle, Loader2,
  Package, Plane, Shield, Lock, Mail,
  XCircle, RefreshCw, Truck, MessageSquare, Send,
  Star, AlertTriangle, Scale,
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
  userEmail: string;
  alreadyAccepted: boolean;
};

type Message = {
  id: string;
  sender_email: string;
  content: string;
  created_at: string;
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
  disputed:             { label: 'Disputed',            color: 'text-red-400' },
  cancellation_requested: { label: 'Cancellation requested', color: 'text-orange-400' },
};

const CANCELLABLE = ['matched', 'agreed', 'committed', 'kyc_pending', 'kyc_complete'];
const MESSAGING_STATUSES = ['active', 'delivery_confirmed', 'disputed'];
const DISPUTE_STATUSES = ['active', 'delivery_confirmed'];

const DISPUTE_REASONS = [
  'Item not delivered',
  'Item damaged in transit',
  'Wrong item delivered',
  'Carrier did not show up',
  'Sender provided wrong details',
  'Other',
];

function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          className="transition-colors"
        >
          <Star
            className={`h-8 w-8 ${(hovered || value) >= n ? 'text-amber-400 fill-amber-400' : 'text-white/20'}`}
          />
        </button>
      ))}
    </div>
  );
}

export default function MatchPage() {
  const params  = useParams();
  const router  = useRouter();
  const matchId = params.id as string;

  const [data,          setData]          = useState<PageData | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [cancelling,    setCancelling]    = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  // Messages
  const [messages,     setMessages]     = useState<Message[]>([]);
  const [msgContent,   setMsgContent]   = useState('');
  const [sendingMsg,   setSendingMsg]   = useState(false);
  const [msgError,     setMsgError]     = useState<string | null>(null);
  const msgEndRef = useRef<HTMLDivElement>(null);

  // Dispute
  const [disputeReason,  setDisputeReason]  = useState(DISPUTE_REASONS[0]);
  const [disputeDesc,    setDisputeDesc]    = useState('');
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [disputeError,   setDisputeError]   = useState<string | null>(null);
  const [disputeSent,    setDisputeSent]    = useState(false);
  const [showDispute,    setShowDispute]    = useState(false);

  // Rating
  const [ratingValue,   setRatingValue]   = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingError,   setRatingError]   = useState<string | null>(null);
  const [ratingSent,    setRatingSent]    = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/details`);
      if (res.status === 401) { router.replace('/login'); return; }
      if (!res.ok) { const j = await res.json(); setError(j.error || 'Failed to load match.'); setLoading(false); return; }
      const d = await res.json();
      setData(d);

      // Load messages if in messaging-eligible status
      if (MESSAGING_STATUSES.includes(d.match.status)) {
        loadMessages();
      }
    } catch { setError('Could not load match.'); }
    finally { setLoading(false); }
  };

  const loadMessages = async () => {
    try {
      const res = await fetch(`/api/messages/list?matchId=${matchId}`);
      if (res.ok) {
        const j = await res.json();
        setMessages(j.messages ?? []);
        setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    } catch {}
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

  const sendMessage = async () => {
    if (!msgContent.trim()) return;
    setSendingMsg(true);
    setMsgError(null);
    try {
      const res = await fetch('/api/messages/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ matchId, content: msgContent.trim() }),
      });
      const j = await res.json();
      if (!res.ok) { setMsgError(j.error || 'Failed to send.'); }
      else { setMsgContent(''); await loadMessages(); }
    } catch { setMsgError('Could not send message.'); }
    finally { setSendingMsg(false); }
  };

  const submitDispute = async () => {
    if (!disputeDesc.trim()) { setDisputeError('Please describe the issue.'); return; }
    setDisputeLoading(true);
    setDisputeError(null);
    try {
      const res = await fetch('/api/disputes/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ matchId, reason: disputeReason, description: disputeDesc.trim() }),
      });
      const j = await res.json();
      if (!res.ok) { setDisputeError(j.error || 'Failed to raise dispute.'); }
      else { setDisputeSent(true); setShowDispute(false); await load(); }
    } catch { setDisputeError('Could not raise dispute.'); }
    finally { setDisputeLoading(false); }
  };

  const submitRating = async () => {
    if (!ratingValue) { setRatingError('Please select a star rating.'); return; }
    setRatingLoading(true);
    setRatingError(null);
    try {
      const res = await fetch(`/api/matches/${matchId}/rate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ rating: ratingValue, comment: ratingComment.trim() || undefined }),
      });
      const j = await res.json();
      if (!res.ok) { setRatingError(j.error || 'Failed to submit rating.'); }
      else { setRatingSent(true); }
    } catch { setRatingError('Could not submit rating.'); }
    finally { setRatingLoading(false); }
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

  const { match, userRole, userEmail } = data;
  const trip        = match.sender_trip;
  const route       = trip ? `${trip.from_city} → ${trip.to_city}` : 'your delivery';
  const isActive    = match.status === 'active';
  const isComplete  = ['delivery_confirmed', 'completed'].includes(match.status);
  const isCancelled = ['cancelled', 'declined'].includes(match.status);
  const canCancel   = CANCELLABLE.includes(match.status);
  const canMessage  = MESSAGING_STATUSES.includes(match.status);
  const canDispute  = DISPUTE_STATUSES.includes(match.status) && match.status !== 'disputed';
  const canRate     = ['completed', 'delivery_confirmed'].includes(match.status);
  const statusInfo  = STATUS_LABELS[match.status] ?? { label: match.status, color: 'text-white/50' };

  const otherEmail    = userRole === 'sender' ? match.traveler_email : match.sender_email;
  const myKyc         = userRole === 'sender' ? match.sender_kyc_status   : match.traveler_kyc_status;
  const theirKyc      = userRole === 'sender' ? match.traveler_kyc_status : match.sender_kyc_status;

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
                { done: true,                                                                                   label: 'Match found' },
                { done: match.sender_kyc_status !== 'none',                                                    label: 'Identity verification started' },
                { done: myKyc === 'verified',                                                                  label: 'Your identity verified' },
                { done: theirKyc === 'verified',                                                               label: "Other party's identity verified" },
                { done: ['payment_processing', 'active', 'delivery_confirmed', 'completed'].includes(match.status), label: 'Payment received' },
                { done: isActive || isComplete,                                                                label: 'Contact details released' },
              ].map(({ done, label }) => (
                <div key={label} className="flex items-center gap-3 text-sm">
                  {done
                    ? <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
                    : <Clock       className="h-4 w-4 text-white/20 shrink-0" />}
                  <span className={done ? 'text-white/70' : 'text-white/30'}>{label}</span>
                </div>
              ))}
            </div>

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
              You will receive a confirmation email with a one-click link when it is time to confirm your side.
            </p>
          </div>
        )}

        {/* ── MESSAGING ── */}
        {canMessage && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4 flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5" /> Messages
            </p>

            {/* Message list */}
            <div className="space-y-3 max-h-72 overflow-y-auto mb-4 pr-1">
              {messages.length === 0 && (
                <p className="text-white/30 text-xs text-center py-6">No messages yet. Say hello!</p>
              )}
              {messages.map(msg => {
                const isMe = msg.sender_email === userEmail;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${isMe ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/80'}`}>
                      <p>{msg.content}</p>
                      <p className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-white/30'}`}>
                        {new Date(msg.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={msgEndRef} />
            </div>

            {msgError && (
              <p className="text-red-400 text-xs mb-2">{msgError}</p>
            )}

            {/* Compose */}
            <div className="flex gap-2">
              <input
                type="text"
                value={msgContent}
                onChange={e => setMsgContent(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                maxLength={1000}
                placeholder="Type a message..."
                className="flex-1 bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendMessage}
                disabled={sendingMsg || !msgContent.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl px-4 py-2.5 transition-all"
              >
                {sendingMsg ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-white/20 mt-2">Do not share phone numbers or contact details outside BootHop.</p>
          </div>
        )}

        {/* ── DISPUTE ── */}
        {canDispute && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            {!showDispute ? (
              <button
                onClick={() => setShowDispute(true)}
                className="text-orange-400 hover:text-orange-300 text-sm font-semibold transition-colors flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" /> Raise a dispute →
              </button>
            ) : (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-orange-400 mb-4 flex items-center gap-2">
                  <Scale className="h-3.5 w-3.5" /> Raise a dispute
                </p>

                {disputeError && <p className="text-red-400 text-xs mb-3">{disputeError}</p>}

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1.5">Reason</label>
                    <select
                      value={disputeReason}
                      onChange={e => setDisputeReason(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {DISPUTE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1.5">Description</label>
                    <textarea
                      value={disputeDesc}
                      onChange={e => setDisputeDesc(e.target.value)}
                      rows={3}
                      placeholder="Explain what happened..."
                      className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={submitDispute}
                    disabled={disputeLoading}
                    className="flex-1 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-all"
                  >
                    {disputeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scale className="h-4 w-4" />}
                    Submit dispute
                  </button>
                  <button
                    onClick={() => { setShowDispute(false); setDisputeError(null); }}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl text-sm transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {disputeSent && (
          <div className="flex items-center gap-3 rounded-xl bg-orange-500/20 border border-orange-500/30 px-5 py-4">
            <Scale className="h-5 w-5 text-orange-400 shrink-0" />
            <p className="text-orange-200 text-sm">Your dispute has been raised. Our team will review it and contact both parties within 48 hours.</p>
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

        {/* ── RATING ── */}
        {canRate && (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-4 flex items-center gap-2">
              <Star className="h-3.5 w-3.5" /> Rate your experience
            </p>

            {ratingSent ? (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <p className="text-white font-semibold">Rating submitted. Thank you!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {ratingError && <p className="text-red-400 text-xs">{ratingError}</p>}

                <div>
                  <p className="text-white/50 text-xs mb-2">How was your experience?</p>
                  <StarRating value={ratingValue} onChange={setRatingValue} />
                </div>

                <div>
                  <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-1.5">Comment (optional)</label>
                  <textarea
                    value={ratingComment}
                    onChange={e => setRatingComment(e.target.value)}
                    rows={2}
                    maxLength={500}
                    placeholder="Share your experience..."
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={submitRating}
                  disabled={ratingLoading || !ratingValue}
                  className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-sm transition-all"
                >
                  {ratingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
                  Submit rating
                </button>
              </div>
            )}
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
