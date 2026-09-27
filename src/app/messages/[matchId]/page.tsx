'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Phone, Shield, Lock, AlertTriangle,
  Send, CheckCircle, Archive, Loader2,
} from 'lucide-react';

type Message = {
  id:           string;
  sender_email: string;
  content:      string;
  is_flagged:   boolean;
  is_blocked:   boolean;
  created_at:   string;
};

export default function ChatPage() {
  const params    = useParams<{ matchId: string }>();
  const matchId   = params.matchId;
  const router    = useRouter();

  const [messages,    setMessages]    = useState<Message[]>([]);
  const [input,       setInput]       = useState('');
  const [sending,     setSending]     = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [myEmail,     setMyEmail]     = useState<string | null>(null);
  const [shipmentId,  setShipmentId]  = useState('');
  const [isLocked,    setIsLocked]    = useState(false);
  const [lockedSince, setLockedSince] = useState<string | null>(null);
  const [calling,     setCalling]     = useState(false);
  const [blockError,  setBlockError]  = useState('');
  const [callMsg,     setCallMsg]     = useState('');

  const endRef     = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Get session email
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d?.user?.email) setMyEmail(d.user.email);
        else router.push('/login');
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages/list?matchId=${matchId}`);
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages ?? []);
      setShipmentId(data.shipmentId ?? '');
      setIsLocked(data.isLocked ?? false);
      setLockedSince(data.lockedSince ?? null);
    } finally {
      setLoading(false);
    }
  }, [matchId, router]);

  useEffect(() => {
    fetchMessages();
    intervalRef.current = setInterval(fetchMessages, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending || isLocked) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    setBlockError('');
    try {
      const res = await fetch('/api/messages/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ matchId, content: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInput(text);
        if (data.code === 'CONTACT_BLOCKED') {
          setBlockError(data.error);
        } else if (data.code === 'THREAD_LOCKED') {
          setIsLocked(true);
        } else {
          setBlockError(data.error ?? 'Failed to send.');
        }
      } else {
        await fetchMessages();
      }
    } finally {
      setSending(false);
    }
  }

  async function handleCall() {
    setCalling(true);
    setCallMsg('');
    try {
      const res = await fetch('/api/call/initiate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ matchId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCallMsg(data.error ?? 'Call failed. Try again.');
      } else {
        setCallMsg("BootHop is connecting your call. Neither party's number will be shared.");
      }
    } finally {
      setCalling(false);
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-slate-900 font-semibold text-sm truncate">Shipment</span>
              {shipmentId && (
                <span className="bg-blue-50 text-blue-700 text-xs font-mono px-2 py-0.5 rounded border border-blue-200">
                  {shipmentId}
                </span>
              )}
            </div>
            {isLocked ? (
              <p className="text-xs text-red-600 flex items-center gap-1 mt-0.5">
                <Archive className="h-3 w-3" /> Archived — dispute window closed
              </p>
            ) : lockedSince ? (
              <p className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
                <Lock className="h-3 w-3" /> 7-day dispute window active
              </p>
            ) : (
              <p className="text-xs text-slate-600 mt-0.5">BootHop secure messaging</p>
            )}
          </div>
          {/* BootHop Call */}
          <button
            onClick={handleCall}
            disabled={calling || isLocked}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-lg text-white text-xs font-semibold transition"
          >
            {calling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Phone className="h-3.5 w-3.5" />}
            Call
          </button>
        </div>
        {callMsg && (
          <div className="max-w-2xl mx-auto mt-2 px-4">
            <p className={`text-xs px-3 py-2 rounded-lg ${callMsg.includes('connect') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {callMsg}
            </p>
          </div>
        )}
      </div>

      {/* Escrow & mantra banner */}
      <div className="bg-blue-50 border-b border-blue-100 px-4 py-2.5">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-blue-600 shrink-0" />
          <p className="text-xs text-blue-700">
            <span className="font-semibold text-blue-700">Escrow protected</span>
            {' '}— payment held by Stripe until you confirm delivery.{' '}
            <span className="text-slate-600">Talk through BootHop. Pay through BootHop. Stay protected through BootHop.</span>
          </p>
        </div>
      </div>

      {/* Archived banner */}
      {isLocked && (
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center gap-3 text-slate-600">
            <Archive className="h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-700">Conversation archived</p>
              <p className="text-xs">The 7-day dispute window has closed. This thread is read-only.</p>
            </div>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-3">

          {/* Empty state */}
          {messages.length === 0 && (
            <div className="text-center py-16">
              <CheckCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 text-sm">No messages yet — say hello!</p>
              <p className="text-slate-400 text-xs mt-1">All messages stay within BootHop for your protection.</p>
            </div>
          )}

          {messages.map((msg) => {
            const isMine = msg.sender_email === myEmail;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-sm ${isMine ? '' : ''}`}>
                  {!isMine && (
                    <p className="text-xs text-slate-600 mb-1 ml-1">{msg.sender_email.split('@')[0]}</p>
                  )}
                  <div className={`rounded-2xl px-4 py-2.5 ${
                    isMine
                      ? 'bg-blue-500 text-white rounded-br-sm'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                  <p className={`text-xs text-slate-600 mt-1 ${isMine ? 'text-right' : 'text-left'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
      </div>

      {/* Contact block error */}
      {blockError && (
        <div className="px-4 pb-2">
          <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex gap-3">
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{blockError}</p>
            <button onClick={() => setBlockError('')} className="ml-auto text-red-500 hover:text-red-700 text-lg leading-none">×</button>
          </div>
        </div>
      )}

      {/* Input */}
      {!isLocked && (
        <div className="bg-white/90 backdrop-blur border-t border-slate-200 px-4 py-3">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => { setInput(e.target.value); if (blockError) setBlockError(''); }}
                placeholder="Type a message…"
                maxLength={1000}
                disabled={sending}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 transition disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-xl px-4 py-3 text-white transition flex items-center gap-1.5"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
            <p className="text-xs text-slate-600 mt-2 text-center">
              Personal contact details are blocked to keep you protected under BootHop.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
