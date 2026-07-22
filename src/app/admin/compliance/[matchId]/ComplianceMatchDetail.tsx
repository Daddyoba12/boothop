'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, CheckCircle2, XCircle, Package, Shield,
  Clock, AlertTriangle, FileText, User, Plane,
} from 'lucide-react';

interface Declaration {
  id:                   string;
  declaration_status:   string;
  item_description:     string | null;
  item_category:        string | null;
  declared_value:       number | null;
  declared_currency:    string | null;
  declared_weight_kg:   number | null;
  contains_electronics: boolean;
  contains_medication:  boolean;
  contains_food:        boolean;
  contains_liquids:     boolean;
  contains_currency:    boolean;
  contains_jewellery:   boolean;
  contains_documents:   boolean;
  contains_clothing:    boolean;
  contains_hazardous:   boolean;
  contains_weapons:     boolean;
  proof_of_ownership_url: string | null;
  version:              number;
  risk_score:           number | null;
  submitted_at:         string | null;
  reviewed_at:          string | null;
  reviewed_by:          string | null;
  review_note:          string | null;
}

interface ShipmentEvent {
  id:           string;
  event_type:   string;
  performed_by: string;
  metadata:     Record<string, unknown>;
  created_at:   string;
}

interface Match {
  id:                          string;
  status:                      string;
  sender_email:                string;
  traveler_email:              string;
  agreed_price:                number;
  compliance_locked_at:        string | null;
  compliance_review_started_at: string | null;
  sealed_at:                   string | null;
  declaration_id:              string | null;
  sender_trip:                 { from_city: string; to_city: string; travel_date: string } | null;
}

const CONTENT_FLAGS = [
  { key: 'contains_weapons',     label: 'Weapons',     danger: true  },
  { key: 'contains_hazardous',   label: 'Hazardous',   danger: true  },
  { key: 'contains_currency',    label: 'Currency',    danger: false },
  { key: 'contains_medication',  label: 'Medication',  danger: false },
  { key: 'contains_jewellery',   label: 'Jewellery',   danger: false },
  { key: 'contains_electronics', label: 'Electronics', danger: false },
  { key: 'contains_food',        label: 'Food',        danger: false },
  { key: 'contains_liquids',     label: 'Liquids',     danger: false },
  { key: 'contains_documents',   label: 'Documents',   danger: false },
  { key: 'contains_clothing',    label: 'Clothing',    danger: false },
] as const;

const EVENT_STYLES: Record<string, string> = {
  SHIPMENT_LOCKED:          'border-blue-300 bg-blue-50 text-blue-800',
  DECLARATION_DRAFT_SAVED:  'border-slate-200 bg-slate-50 text-slate-600',
  DECLARATION_SUBMITTED:    'border-indigo-300 bg-indigo-50 text-indigo-800',
  COMPLIANCE_REVIEW_STARTED:'border-purple-300 bg-purple-50 text-purple-800',
  COMPLIANCE_APPROVED:      'border-green-300 bg-green-50 text-green-800',
  COMPLIANCE_REJECTED:      'border-red-300 bg-red-50 text-red-800',
  COMPLIANCE_TIMEOUT:       'border-orange-300 bg-orange-50 text-orange-800',
  SHIPMENT_SEALED:          'border-teal-300 bg-teal-50 text-teal-800',
  SHIPMENT_SUSPENDED:       'border-yellow-300 bg-yellow-50 text-yellow-800',
  SHIPMENT_LOCK_OVERRIDDEN: 'border-violet-300 bg-violet-50 text-violet-800',
  SHIPMENT_CANCELLED_TIMEOUT:'border-red-200 bg-red-50 text-red-700',
};

const riskColor = (score: number | null) => {
  if (!score) return 'text-slate-500 bg-slate-100';
  if (score >= 80) return 'text-red-700 bg-red-100';
  if (score >= 50) return 'text-amber-700 bg-amber-100';
  return 'text-green-700 bg-green-100';
};

export default function ComplianceMatchDetail({
  match,
  declaration,
  events,
}: {
  match: Match;
  declaration: Declaration | null;
  events: ShipmentEvent[];
}) {
  const router  = useRouter();
  const [note,    setNote]    = useState('');
  const [acting,  setActing]  = useState<'approve' | 'reject' | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const trip     = Array.isArray(match.sender_trip) ? (match.sender_trip as any)[0] : match.sender_trip;
  const fromCity = trip?.from_city ?? '?';
  const toCity   = trip?.to_city   ?? '?';
  const canAct   = match.status === 'compliance_in_progress' && !!declaration && !feedback;

  const decide = async (decision: 'approve' | 'reject') => {
    if (decision === 'reject' && !note.trim()) {
      setFeedback({ ok: false, msg: 'A reason is required when rejecting.' });
      return;
    }
    setActing(decision);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/compliance/approve', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ matchId: match.id, decision, note: note.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ ok: false, msg: data.error ?? 'Something went wrong' });
      } else {
        setFeedback({
          ok:  true,
          msg: decision === 'approve'
            ? '✅ Approved — both parties have been notified and contact details released.'
            : '❌ Rejected — sender has been notified and will receive a full refund.',
        });
        setTimeout(() => router.refresh(), 1500);
      }
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/compliance" className="text-slate-400 hover:text-slate-700">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-900">{fromCity} → {toCity}</h1>
              <p className="text-sm text-slate-500">Match {match.id.slice(0, 8)}… · {match.status.replace(/_/g, ' ')}</p>
            </div>
          </div>
          {declaration?.risk_score != null && (
            <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${riskColor(declaration.risk_score)}`}>
              Risk {declaration.risk_score}/100
            </span>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Parties */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sender (Hooper)</span>
            </div>
            <p className="font-semibold text-slate-800">{match.sender_email}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Plane className="h-4 w-4 text-indigo-500" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Carrier (Booter)</span>
            </div>
            <p className="font-semibold text-slate-800">{match.traveler_email}</p>
          </div>
        </div>

        {/* Declaration */}
        {declaration ? (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                <span className="font-semibold text-slate-800">Item Declaration</span>
                <span className="text-xs text-slate-400">v{declaration.version}</span>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                declaration.declaration_status === 'approved' ? 'bg-green-100 text-green-700' :
                declaration.declaration_status === 'rejected' ? 'bg-red-100 text-red-700' :
                declaration.declaration_status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                {declaration.declaration_status}
              </span>
            </div>

            <div className="px-5 py-5 grid sm:grid-cols-2 gap-6">
              {/* Item info */}
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Description</p>
                  <p className="text-slate-800 font-medium">{declaration.item_description || '—'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Category</p>
                    <p className="text-slate-700">{declaration.item_category || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Declared Value</p>
                    <p className="text-slate-700 font-semibold">
                      {declaration.declared_value != null
                        ? `${declaration.declared_currency ?? 'GBP'} ${declaration.declared_value}`
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Weight</p>
                    <p className="text-slate-700">
                      {declaration.declared_weight_kg != null ? `${declaration.declared_weight_kg} kg` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Submitted</p>
                    <p className="text-slate-700 text-xs">
                      {declaration.submitted_at ? new Date(declaration.submitted_at).toLocaleString('en-GB') : '—'}
                    </p>
                  </div>
                </div>
                {declaration.proof_of_ownership_url && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Proof of Ownership</p>
                    <a
                      href={declaration.proof_of_ownership_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View document →
                    </a>
                  </div>
                )}
              </div>

              {/* Content flags */}
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Contents Declared</p>
                <div className="grid grid-cols-2 gap-2">
                  {CONTENT_FLAGS.map(({ key, label, danger }) => {
                    const ticked = declaration[key as keyof Declaration] as boolean;
                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border ${
                          ticked && danger   ? 'bg-red-50 border-red-200 text-red-700 font-semibold' :
                          ticked && !danger  ? 'bg-amber-50 border-amber-200 text-amber-700 font-medium' :
                          'bg-slate-50 border-slate-100 text-slate-400'
                        }`}
                      >
                        {ticked
                          ? danger
                            ? <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            : <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          : <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-slate-200" />
                        }
                        {label}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Review result if already decided */}
            {declaration.reviewed_at && (
              <div className={`px-5 py-4 border-t text-sm ${
                declaration.declaration_status === 'approved'
                  ? 'bg-green-50 border-green-100'
                  : 'bg-red-50 border-red-100'
              }`}>
                <p className="font-semibold text-slate-700">
                  {declaration.declaration_status === 'approved' ? '✅ Approved' : '❌ Rejected'} by {declaration.reviewed_by}
                  {' '}· {new Date(declaration.reviewed_at).toLocaleString('en-GB')}
                </p>
                {declaration.review_note && (
                  <p className="text-slate-600 mt-1">Note: "{declaration.review_note}"</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400">
            <Clock className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Declaration not yet submitted</p>
            <p className="text-sm mt-1">The sender has been emailed to complete it within 48 hours of payment confirmation.</p>
          </div>
        )}

        {/* Approve / Reject */}
        {canAct && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <span className="font-semibold text-slate-800">Admin Decision</span>
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (required for rejection, optional for approval)…"
              rows={3}
              className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex gap-3">
              <button
                disabled={!!acting}
                onClick={() => decide('approve')}
                className="flex-1 flex items-center justify-center gap-2 py-3 font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl transition disabled:opacity-50"
              >
                {acting === 'approve'
                  ? <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <CheckCircle2 className="h-4 w-4" />}
                Approve — release contacts
              </button>
              <button
                disabled={!!acting}
                onClick={() => decide('reject')}
                className="flex-1 flex items-center justify-center gap-2 py-3 font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition disabled:opacity-50"
              >
                {acting === 'reject'
                  ? <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <XCircle className="h-4 w-4" />}
                Reject — issue refund
              </button>
            </div>
            {feedback && (
              <p className={`text-sm font-medium ${feedback.ok ? 'text-green-700' : 'text-red-600'}`}>
                {feedback.msg}
              </p>
            )}
          </div>
        )}

        {/* Chain of custody */}
        {events.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <span className="font-semibold text-slate-800">Chain of Custody</span>
              <span className="ml-2 text-xs text-slate-400">{events.length} events</span>
            </div>
            <div className="divide-y divide-slate-100">
              {events.map((e) => (
                <div key={e.id} className="px-5 py-3 flex items-start gap-3">
                  <div className={`mt-0.5 text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${
                    EVENT_STYLES[e.event_type] ?? 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}>
                    {e.event_type.replace(/_/g, ' ')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500">
                      {e.performed_by}
                      {Object.keys(e.metadata ?? {}).length > 0 && (
                        <span className="ml-2 text-slate-400">
                          · {Object.entries(e.metadata).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                        </span>
                      )}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 shrink-0">
                    {new Date(e.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pb-8" />
      </div>
    </div>
  );
}
