'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, ArrowLeft, Package, Plane, CheckCircle, AlertTriangle } from 'lucide-react';

type MatchTrip = { from_city?: string; to_city?: string; travel_date?: string; auto_created?: boolean } | null;

type Match = {
  id: string;
  status: string;
  sender_email: string;
  traveler_email: string;
  sender_trip: MatchTrip | MatchTrip[];
  traveler_trip: MatchTrip | MatchTrip[];
  created_at: string;
};

const MESSAGING_STATUSES = ['active', 'delivery_confirmed', 'disputed'];

function resolveTrip(t: MatchTrip | MatchTrip[]): MatchTrip {
  return Array.isArray(t) ? (t[0] ?? null) : t;
}

function statusBadge(status: string) {
  if (status === 'active')             return { label: 'Active',     cls: 'bg-green-50 text-green-700 border-green-200' };
  if (status === 'delivery_confirmed') return { label: 'Confirming', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
  if (status === 'disputed')           return { label: 'Disputed',   cls: 'bg-red-50 text-red-700 border-red-200' };
  return { label: status, cls: 'bg-slate-100 text-slate-600 border-slate-200' };
}

export default function MessagesPage() {
  const router  = useRouter();
  const [matches,  setMatches]  = useState<Match[]>([]);
  const [myEmail,  setMyEmail]  = useState<string | null>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) { router.push('/login'); return; }
        const meData = await meRes.json();
        const email  = meData?.user?.email;
        if (!email)  { router.push('/login'); return; }
        setMyEmail(email);

        const dashRes = await fetch('/api/dashboard');
        if (!dashRes.ok) { router.push('/login'); return; }
        const dashData = await dashRes.json();

        const all: Match[] = dashData.matches ?? [];
        setMatches(all.filter(m => MESSAGING_STATUSES.includes(m.status)));
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-slate-900 font-semibold">Messages</h1>
            <p className="text-xs text-slate-600">Your active delivery conversations</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {loading ? (
          <div className="text-center py-16">
            <MessageSquare className="h-10 w-10 text-blue-500 animate-pulse mx-auto mb-3" />
            <p className="text-slate-600 text-sm">Loading conversations…</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
            <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-700 font-semibold mb-1">No active conversations</p>
            <p className="text-slate-600 text-sm">Messaging opens once your delivery match is active.</p>
            <Link
              href="/dashboard"
              className="mt-6 inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition"
            >
              Back to dashboard
            </Link>
          </div>
        ) : (
          matches.map((match) => {
            const sTrip  = resolveTrip(match.sender_trip);
            const tTrip  = resolveTrip(match.traveler_trip);
            const isSender = match.sender_email === myEmail;
            const otherEmail = isSender ? match.traveler_email : match.sender_email;
            const fromCity = sTrip?.from_city ?? tTrip?.from_city ?? '—';
            const toCity   = tTrip?.to_city   ?? sTrip?.to_city   ?? '—';
            const badge    = statusBadge(match.status);

            return (
              <Link
                key={match.id}
                href={`/messages/${match.id}`}
                className="block bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md rounded-2xl p-4 transition group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {otherEmail.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-slate-900 font-semibold text-sm truncate">{otherEmail.split('@')[0]}</p>
                      <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                      {isSender ? <Package className="h-3 w-3 shrink-0" /> : <Plane className="h-3 w-3 shrink-0" />}
                      <span className="truncate">{fromCity} → {toCity}</span>
                    </div>
                    <p className="text-slate-600 text-xs mt-1">
                      {isSender ? 'You are the sender' : 'You are the traveller'}
                    </p>
                  </div>
                  <div className="shrink-0 text-blue-400 group-hover:text-blue-600 transition text-lg">›</div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
