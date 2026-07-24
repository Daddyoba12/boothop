'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle2, XCircle, Package, Shield,
  AlertTriangle, ExternalLink, Loader2, Image as ImageIcon,
} from 'lucide-react';

interface Declaration {
  item_name:                   string | null;
  item_category:               string | null;
  item_description:            string | null;
  brand:                       string | null;
  quantity:                    number | null;
  declared_value:              number | null;
  declared_currency:           string | null;
  declared_weight_kg:          number | null;
  country_of_origin:           string | null;
  sender_owns_item:            boolean | null;
  proof_of_ownership_url:      string | null;
  proof_of_ownership_explanation: string | null;
  risk_classification:         string | null;
  risk_score:                  number | null;
}

interface Evidence {
  id:            string;
  evidence_type: string;
  mime_type:     string | null;
  created_at:    string;
  file_url:      string | null;
}

interface Inspection {
  status: string;
  overall_pass: boolean | null;
  inspector_note: string | null;
  completed_at: string | null;
}

interface MatchData {
  id: string;
  status: string;
  sender_email: string;
  traveler_email: string;
  sender_trip: { from_city: string; to_city: string } | null;
}

const CHECKS: { key: keyof CheckState; label: string; detail: string }[] = [
  {
    key:    'check_item_matches_description',
    label:  'Item matches the declaration',
    detail: 'The item you received is what the sender described — correct name, category, and appearance.',
  },
  {
    key:    'check_no_prohibited_items',
    label:  'No signs of prohibited items',
    detail: 'No unusual weight, sounds, smells, or indicators of undeclared or dangerous contents.',
  },
  {
    key:    'check_packaging_acceptable',
    label:  'Packaging is acceptable',
    detail: 'The item is properly packed for travel, sealed, and shows no signs of tampering.',
  },
  {
    key:    'check_weight_reasonable',
    label:  'Weight is consistent',
    detail: 'The physical weight feels consistent with the declared weight.',
  },
  {
    key:    'check_evidence_verified',
    label:  'Evidence / ownership verified',
    detail: 'Any uploaded proof of ownership or receipts appear genuine and match this item. (Tick Yes if no evidence was required.)',
  },
];

type CheckState = {
  check_item_matches_description: boolean | null;
  check_no_prohibited_items:      boolean | null;
  check_packaging_acceptable:     boolean | null;
  check_weight_reasonable:        boolean | null;
  check_evidence_verified:        boolean | null;
};

// Stage 3.5 failure reasons — enum values must match server exactly (route:94-100)
// Two auto-escalate directly to external_verification_required; three go to suspended_pending_review
const FAILURE_REASONS = [
  {
    value:     'mismatch_found',
    label:     'Item doesn\'t match the declaration',
    detail:    'The item differs from what was described — wrong product, brand, size, or quantity.',
    escalates: false,
  },
  {
    value:     'unable_to_inspect',
    label:     'Unable to inspect the item',
    detail:    'You couldn\'t physically examine the item (e.g. still sealed, inaccessible). BootHop will review.',
    escalates: false,
  },
  {
    value:     'unsure_of_contents',
    label:     'Unsure about the contents',
    detail:    'Something seemed off but you can\'t confirm what it is. BootHop will review.',
    escalates: false,
  },
  {
    value:     'prohibited_or_suspicious',
    label:     'Item appears prohibited or dangerous',
    detail:    'Immediate escalation to BootHop\'s verification team — there is no further admin review step.',
    escalates: true,
  },
  {
    value:     'sender_refused_inspection',
    label:     'Sender refused to allow inspection',
    detail:    'Immediate escalation to BootHop\'s verification team — both parties will be contacted directly.',
    escalates: true,
  },
] as const;

type FailureReasonValue = (typeof FAILURE_REASONS)[number]['value'];

const INITIAL_CHECKS: CheckState = {
  check_item_matches_description: null,
  check_no_prohibited_items:      null,
  check_packaging_acceptable:     null,
  check_weight_reasonable:        null,
  check_evidence_verified:        null,
};

function CheckRow({
  item,
  value,
  onChange,
}: {
  item: { key: keyof CheckState; label: string; detail: string };
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className={`rounded-2xl border p-4 transition-all ${
      value === true  ? 'border-green-500/40 bg-green-500/10' :
      value === false ? 'border-red-500/40 bg-red-500/10' :
      'border-white/10 bg-white/5'
    }`}>
      <p className="font-semibold text-white mb-1">{item.label}</p>
      <p className="text-xs text-white/50 mb-3">{item.detail}</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            value === true
              ? 'bg-green-600 text-white'
              : 'bg-white/10 text-white/50 hover:bg-green-500/20 hover:text-green-400'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" /> Yes
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            value === false
              ? 'bg-red-600 text-white'
              : 'bg-white/10 text-white/50 hover:bg-red-500/20 hover:text-red-400'
          }`}
        >
          <XCircle className="h-4 w-4" /> No
        </button>
      </div>
    </div>
  );
}

export default function InspectionPage() {
  const params  = useParams();
  const router  = useRouter();
  const matchId = params.id as string;

  const [match,       setMatch]       = useState<MatchData | null>(null);
  const [declaration, setDeclaration] = useState<Declaration | null>(null);
  const [evidence,    setEvidence]    = useState<Evidence[]>([]);
  const [inspection,  setInspection]  = useState<Inspection | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [checks,      setChecks]      = useState<CheckState>(INITIAL_CHECKS);
  const [note,          setNote]          = useState('');
  const [failureReason, setFailureReason] = useState<FailureReasonValue | ''>('');
  const [submitting,    setSubmitting]    = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [done,          setDone]          = useState<'passed' | 'failed' | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch(`/api/matches/${matchId}/inspection`);
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? 'Failed to load'); return; }
        setMatch(data.match);
        setDeclaration(data.declaration);
        setEvidence(data.evidence ?? []);
        setInspection(data.inspection);
        if (data.inspection?.status === 'passed' || data.inspection?.status === 'failed') {
          setDone(data.inspection.status);
        }
      } catch {
        setError('Failed to load inspection details.');
      } finally {
        setLoading(false);
      }
    })();
  }, [matchId]);

  const allAnswered = Object.values(checks).every(v => v !== null);
  const anyFailed   = Object.values(checks).some(v => v === false);
  const canSubmit   = allAnswered && (!anyFailed || (note.trim().length > 0 && failureReason !== ''));

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/matches/${matchId}/inspection`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          ...checks,
          inspector_note: note.trim() || undefined,
          ...(anyFailed && failureReason ? { failure_reason: failureReason } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Submission failed'); return; }
      setDone(data.result);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07111f] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (error && !match) {
    return (
      <div className="min-h-screen bg-[#07111f] flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!match) return null;

  const trip     = Array.isArray(match.sender_trip) ? (match.sender_trip as any)[0] : match.sender_trip;
  const fromCity = trip?.from_city ?? '?';
  const toCity   = trip?.to_city   ?? '?';

  // Already completed
  if (done === 'passed') {
    return (
      <div className="min-h-screen bg-[#07111f] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Inspection passed</h1>
        <p className="text-white/50 mb-6">Contact details for {fromCity} → {toCity} have been released. Check your email.</p>
        <Link
          href={`/matches/${matchId}`}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-2xl transition"
        >
          View delivery →
        </Link>
      </div>
    );
  }

  if (done === 'failed') {
    return (
      <div className="min-h-screen bg-[#07111f] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Inspection flagged</h1>
        <p className="text-white/50 mb-2">You have flagged issues with this shipment. Our team has been alerted and will investigate.</p>
        <p className="text-white/30 text-sm mb-6">Please do not accept the item until BootHop confirms it is safe to proceed.</p>
        <Link
          href={`/matches/${matchId}`}
          className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-8 rounded-2xl transition"
        >
          Back to match
        </Link>
      </div>
    );
  }

  if (match.status !== 'inspection_pending') {
    return (
      <div className="min-h-screen bg-[#07111f] flex flex-col items-center justify-center px-4 text-center">
        <p className="text-white/50">This shipment is not currently awaiting inspection.</p>
        <Link href={`/matches/${matchId}`} className="text-blue-400 underline mt-4 text-sm">Back to match</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-5 py-4 flex items-center gap-3">
        <Link href={`/matches/${matchId}`} className="text-white/40 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="font-bold text-white">{fromCity} → {toCity}</p>
          <p className="text-xs text-white/40">Handover inspection</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-5 py-7 space-y-6">

        {/* Instructions */}
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-bold text-amber-400 uppercase tracking-wider">Action required</span>
          </div>
          <p className="text-white font-semibold mb-1">Inspect the item before accepting</p>
          <p className="text-white/50 text-sm">
            Before contact details are released, please physically inspect the item from the sender.
            Answer each question honestly. If anything looks wrong, select No and add a note.
          </p>
        </div>

        {/* Declaration summary */}
        {declaration && (
          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
              <Package className="h-4 w-4 text-white/40" />
              <span className="font-semibold text-white/80 text-sm">Item to inspect</span>
              {declaration.risk_classification && (
                <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${
                  declaration.risk_classification === 'MANUAL_REVIEW' ? 'bg-orange-500/20 text-orange-300' :
                  declaration.risk_classification === 'STANDARD_REVIEW' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-green-500/20 text-green-300'
                }`}>
                  {declaration.risk_classification.replace('_', ' ')}
                </span>
              )}
            </div>
            <div className="px-5 py-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-white/40 text-xs mb-0.5">Name</p>
                <p className="text-white font-medium">{declaration.item_name ?? '—'}</p>
              </div>
              <div>
                <p className="text-white/40 text-xs mb-0.5">Category</p>
                <p className="text-white font-medium">{declaration.item_category ?? '—'}</p>
              </div>
              <div>
                <p className="text-white/40 text-xs mb-0.5">Declared value</p>
                <p className="text-white font-medium">
                  {declaration.declared_value != null
                    ? `${declaration.declared_currency ?? 'GBP'} ${declaration.declared_value}`
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-white/40 text-xs mb-0.5">Weight</p>
                <p className="text-white font-medium">
                  {declaration.declared_weight_kg != null ? `${declaration.declared_weight_kg} kg` : '—'}
                </p>
              </div>
              {declaration.brand && (
                <div>
                  <p className="text-white/40 text-xs mb-0.5">Brand</p>
                  <p className="text-white font-medium">{declaration.brand}</p>
                </div>
              )}
              {declaration.quantity && declaration.quantity > 1 && (
                <div>
                  <p className="text-white/40 text-xs mb-0.5">Quantity</p>
                  <p className="text-white font-medium">{declaration.quantity}</p>
                </div>
              )}
            </div>
            {declaration.item_description && (
              <div className="px-5 pb-4">
                <p className="text-white/40 text-xs mb-1">Description</p>
                <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{declaration.item_description}</p>
              </div>
            )}
          </div>
        )}

        {/* Evidence thumbnails */}
        {evidence.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-white/40" />
              <span className="text-sm font-semibold text-white/80">Evidence ({evidence.length})</span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {evidence.map((e) => {
                const isImage = e.mime_type?.startsWith('image/');
                return (
                  <div key={e.id} className="rounded-xl border border-white/10 overflow-hidden bg-white/5">
                    {isImage && e.file_url && (
                      <img src={e.file_url} alt={e.evidence_type} className="w-full h-32 object-cover" />
                    )}
                    <div className="px-3 py-2 flex items-center justify-between gap-2">
                      <p className="text-xs text-white/60 capitalize">{e.evidence_type.replace(/_/g, ' ')}</p>
                      {e.file_url && (
                        <a href={e.file_url} target="_blank" rel="noopener noreferrer"
                           className="text-blue-400 hover:text-blue-300">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Checklist */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Inspection checklist</p>
          {CHECKS.map((item) => (
            <CheckRow
              key={item.key}
              item={item}
              value={checks[item.key]}
              onChange={(v) => setChecks((prev) => ({ ...prev, [item.key]: v }))}
            />
          ))}
        </div>

        {/* Note (required if any check failed) */}
        {anyFailed && (
          <>
            {/* Failure reason picker — required when any check fails */}
            <div>
              <label className="block text-sm font-semibold text-red-400 mb-2">
                What best describes the issue? (required)
              </label>
              <div className="space-y-2">
                {FAILURE_REASONS.map((reason) => (
                  <button
                    key={reason.value}
                    type="button"
                    onClick={() => setFailureReason(reason.value)}
                    className={`w-full text-left rounded-xl border p-4 transition-all ${
                      failureReason === reason.value
                        ? reason.escalates
                          ? 'border-amber-500/60 bg-amber-500/10'
                          : 'border-orange-500/60 bg-orange-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <p className={`font-semibold text-sm ${
                      failureReason === reason.value
                        ? reason.escalates ? 'text-amber-300' : 'text-orange-300'
                        : 'text-white'
                    }`}>
                      {reason.label}
                    </p>
                    <p className="text-xs text-white/50 mt-1">{reason.detail}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-red-400 mb-2">
                What did you find? (required when a check fails)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Describe what you found. Be specific — our team will investigate."
                rows={3}
                className="w-full bg-white/5 border border-red-500/40 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>
          </>
        )}

        {/* Optional note when all pass */}
        {allAnswered && !anyFailed && (
          <div>
            <label className="block text-xs font-semibold text-white/40 mb-2 uppercase tracking-wider">
              Optional note
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any additional observations (optional)…"
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {/* Submit */}
        <button
          type="button"
          disabled={!canSubmit || submitting}
          onClick={handleSubmit}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all ${
            !canSubmit
              ? 'bg-white/10 text-white/30 cursor-not-allowed'
              : anyFailed
              ? 'bg-red-600 hover:bg-red-500 text-white'
              : 'bg-green-600 hover:bg-green-500 text-white'
          }`}
        >
          {submitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : anyFailed ? (
            <><XCircle className="h-5 w-5" /> Flag issues and suspend</>
          ) : (
            <><CheckCircle2 className="h-5 w-5" /> Pass inspection — release contacts</>
          )}
        </button>

        {!allAnswered && (
          <p className="text-center text-xs text-white/30">Answer all 5 checks above to submit</p>
        )}

        <div className="pb-8" />
      </div>
    </div>
  );
}
