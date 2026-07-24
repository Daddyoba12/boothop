'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, CheckCircle2, XCircle, Package, Shield,
  Clock, AlertTriangle, FileText, User, Plane, Image, ExternalLink,
} from 'lucide-react';

interface Declaration {
  id:                          string;
  declaration_status:          string;
  // Stage 1
  item_description:            string | null;
  item_category:               string | null;
  declared_value:              number | null;
  declared_currency:           string | null;
  declared_weight_kg:          number | null;
  contains_electronics:        boolean;
  contains_medication:         boolean;
  contains_food:               boolean;
  contains_liquids:            boolean;
  contains_currency:           boolean;
  contains_jewellery:          boolean;
  contains_documents:          boolean;
  contains_clothing:           boolean;
  contains_hazardous:          boolean;
  contains_weapons:            boolean;
  proof_of_ownership_url:      string | null;
  version:                     number;
  risk_score:                  number | null;
  submitted_at:                string | null;
  reviewed_at:                 string | null;
  reviewed_by:                 string | null;
  review_note:                 string | null;
  // Stage 2
  item_name:                   string | null;
  quantity:                    number | null;
  brand:                       string | null;
  country_of_origin:           string | null;
  contains_battery:            boolean;
  contains_powder:             boolean;
  contains_chemical:           boolean;
  contains_plant_or_animal:    boolean;
  item_modified:               boolean;
  sender_owns_item:            boolean | null;
  proof_of_ownership_explanation: string | null;
  ack_description_accurate:    boolean;
  ack_nothing_concealed:       boolean;
  ack_complies_with_laws:      boolean;
  ack_may_be_reported:         boolean;
  ack_false_decl_consequences: boolean;
  ack_legally_responsible:     boolean;
  declaration_text_version:    string | null;
  created_by:                  string | null;
  risk_classification:         string | null;
  risk_assessed_at:            string | null;
}

interface Evidence {
  id:            string;
  evidence_type: string;
  storage_key:   string;
  mime_type:     string | null;
  created_at:    string;
  signed_url:    string | null;
}

interface RiskAssessment {
  risk_score:          number;
  risk_classification: string;
  flags:               string[];
  breakdown:           Record<string, number>;
  assessed_at:         string;
}

interface ShipmentEvent {
  id:           string;
  event_type:   string;
  performed_by: string;
  metadata:     Record<string, unknown>;
  created_at:   string;
}

interface Match {
  id:                           string;
  status:                       string;
  sender_email:                 string;
  traveler_email:               string;
  agreed_price:                 number;
  compliance_locked_at:         string | null;
  compliance_review_started_at: string | null;
  sealed_at:                    string | null;
  declaration_id:               string | null;
  sender_trip:                  { from_city: string; to_city: string; travel_date: string } | { from_city: string; to_city: string; travel_date: string }[] | null;
}

const CONTENT_FLAGS: { key: keyof Declaration; label: string; level: 'high' | 'warn' | 'normal' }[] = [
  { key: 'contains_weapons',          label: 'Weapons',             level: 'high'   },
  { key: 'contains_hazardous',        label: 'Hazardous',           level: 'high'   },
  { key: 'contains_chemical',         label: 'Chemical substances', level: 'high'   },
  { key: 'contains_currency',         label: 'Currency',            level: 'warn'   },
  { key: 'contains_medication',       label: 'Medication',          level: 'warn'   },
  { key: 'contains_jewellery',        label: 'Jewellery',           level: 'warn'   },
  { key: 'contains_battery',          label: 'Battery',             level: 'warn'   },
  { key: 'contains_powder',           label: 'Powder',              level: 'warn'   },
  { key: 'contains_plant_or_animal',  label: 'Plant / animal',      level: 'warn'   },
  { key: 'contains_electronics',      label: 'Electronics',         level: 'normal' },
  { key: 'contains_food',             label: 'Food',                level: 'normal' },
  { key: 'contains_liquids',          label: 'Liquids',             level: 'normal' },
  { key: 'contains_documents',        label: 'Documents',           level: 'normal' },
  { key: 'contains_clothing',         label: 'Clothing',            level: 'normal' },
];

const ACKNOWLEDGEMENTS: { key: keyof Declaration; text: string }[] = [
  { key: 'ack_description_accurate',    text: 'Description is complete and accurate' },
  { key: 'ack_nothing_concealed',       text: 'Nothing concealed inside the item' },
  { key: 'ack_complies_with_laws',      text: 'Item complies with all applicable laws' },
  { key: 'ack_may_be_reported',         text: 'Acknowledges BootHop may reject/suspend/report' },
  { key: 'ack_false_decl_consequences', text: 'Acknowledges false declaration consequences' },
  { key: 'ack_legally_responsible',     text: 'Accepts legal responsibility for declaration' },
];

const RISK_CLASS_STYLES: Record<string, string> = {
  CLEARED:                      'bg-green-100 text-green-700 border-green-200',
  STANDARD_REVIEW:              'bg-amber-100 text-amber-700 border-amber-200',
  MANUAL_REVIEW:                'bg-orange-100 text-orange-700 border-orange-200',
  EXTERNAL_VERIFICATION_REQUIRED: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  REJECTED:                     'bg-red-100 text-red-700 border-red-200',
};

const EVENT_STYLES: Record<string, string> = {
  SHIPMENT_LOCKED:           'border-blue-300 bg-blue-50 text-blue-800',
  DECLARATION_DRAFT_SAVED:   'border-slate-200 bg-slate-50 text-slate-600',
  DECLARATION_SUBMITTED:     'border-indigo-300 bg-indigo-50 text-indigo-800',
  COMPLIANCE_REVIEW_STARTED: 'border-purple-300 bg-purple-50 text-purple-800',
  COMPLIANCE_APPROVED:       'border-green-300 bg-green-50 text-green-800',
  COMPLIANCE_REJECTED:       'border-red-300 bg-red-50 text-red-800',
  COMPLIANCE_TIMEOUT:        'border-orange-300 bg-orange-50 text-orange-800',
  SHIPMENT_SEALED:           'border-teal-300 bg-teal-50 text-teal-800',
  SHIPMENT_SUSPENDED:        'border-yellow-300 bg-yellow-50 text-yellow-800',
  SHIPMENT_LOCK_OVERRIDDEN:    'border-violet-300 bg-violet-50 text-violet-800',
  SHIPMENT_CANCELLED_TIMEOUT:  'border-red-200 bg-red-50 text-red-700',
  RISK_ASSESSMENT_COMPLETED:   'border-indigo-300 bg-indigo-50 text-indigo-800',
  INSPECTION_UNLOCKED:         'border-teal-300 bg-teal-50 text-teal-800',
  INSPECTION_PASSED:                  'border-green-400 bg-green-50 text-green-800',
  INSPECTION_FAILED:                  'border-red-400 bg-red-50 text-red-800',
  EXTERNAL_VERIFICATION_REQUESTED:    'border-yellow-400 bg-yellow-50 text-yellow-800',
  EXTERNAL_VERIFICATION_COMPLETED:    'border-teal-300 bg-teal-50 text-teal-800',
};

const riskColor = (score: number | null) => {
  if (!score) return 'text-slate-500 bg-slate-100';
  if (score >= 80) return 'text-red-700 bg-red-100';
  if (score >= 50) return 'text-amber-700 bg-amber-100';
  return 'text-green-700 bg-green-100';
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-slate-700 font-medium">{value ?? '—'}</p>
    </div>
  );
}

export default function ComplianceMatchDetail({
  match,
  declaration,
  evidence,
  riskAssessment,
  events,
}: {
  match:           Match;
  declaration:     Declaration | null;
  evidence:        Evidence[];
  riskAssessment:  RiskAssessment | null;
  events:          ShipmentEvent[];
}) {
  const router = useRouter();
  const [note,     setNote]     = useState('');
  const [acting,   setActing]   = useState<'approve' | 'reject' | 'escalate_to_verification' | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const trip     = Array.isArray(match.sender_trip) ? (match.sender_trip as any)[0] : match.sender_trip;
  const fromCity = trip?.from_city ?? '?';
  const toCity   = trip?.to_city   ?? '?';

  const allAcksChecked = declaration ? ACKNOWLEDGEMENTS.every(a => declaration[a.key]) : false;
  const canAct     = match.status === 'compliance_in_progress' && !!declaration && !feedback;
  const canApprove = canAct && allAcksChecked;

  const decide = async (decision: 'approve' | 'reject' | 'escalate_to_verification') => {
    if (decision === 'reject' && !note.trim()) {
      setFeedback({ ok: false, msg: 'A reason is required when rejecting.' });
      return;
    }
    if (decision === 'escalate_to_verification' && !note.trim()) {
      setFeedback({ ok: false, msg: 'A reason is required when escalating to external verification.' });
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
            ? '✅ Approved — shipment advanced to inspection pending. Carrier has been notified to inspect the item.'
            : decision === 'escalate_to_verification'
            ? '⚠️ Escalated — shipment moved to external verification required. Both parties notified.'
            : '❌ Rejected — sender notified and will receive a full refund.',
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
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sender (Hooper)</span>
            </div>
            <p className="font-semibold text-slate-800">{match.sender_email}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Plane className="h-4 w-4 text-indigo-500" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Carrier (Booter)</span>
            </div>
            <p className="font-semibold text-slate-800">{match.traveler_email}</p>
          </div>
        </div>

        {/* Risk Assessment */}
        {riskAssessment && (
          <div className={`rounded-2xl border p-5 ${
            riskAssessment.risk_classification === 'MANUAL_REVIEW'   ? 'bg-orange-50 border-orange-200' :
            riskAssessment.risk_classification === 'STANDARD_REVIEW' ? 'bg-amber-50 border-amber-200' :
            riskAssessment.risk_classification === 'REJECTED'        ? 'bg-red-50 border-red-200' :
            'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <Shield className="h-4 w-4 text-slate-500" />
              <span className="font-semibold text-slate-800">Risk Assessment</span>
              <span className={`ml-auto text-xs font-bold px-3 py-1 rounded-full border ${
                RISK_CLASS_STYLES[riskAssessment.risk_classification] ?? 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {riskAssessment.risk_classification.replace(/_/g, ' ')}
              </span>
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${riskColor(riskAssessment.risk_score)}`}>
                {riskAssessment.risk_score}/100
              </span>
            </div>

            {riskAssessment.risk_classification === 'MANUAL_REVIEW' && (
              <div className="rounded-xl bg-orange-100 border border-orange-300 px-4 py-3 mb-3">
                <p className="text-sm font-semibold text-orange-800">
                  ⚠️ This shipment requires your manual review before proceeding to inspection.
                  Approve to unlock the carrier&apos;s handover inspection, or reject to close the match.
                </p>
              </div>
            )}

            {riskAssessment.flags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {riskAssessment.flags.map((flag) => (
                  <span key={flag} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-red-200 text-red-700">
                    {flag}
                  </span>
                ))}
              </div>
            )}

            {Object.keys(riskAssessment.breakdown).length > 0 && (
              <div className="text-xs text-slate-500 space-x-2">
                <span className="font-semibold">Breakdown:</span>
                {Object.entries(riskAssessment.breakdown).map(([k, v]) => (
                  <span key={k}>{k.replace(/_/g, ' ')}: +{v}</span>
                ))}
              </div>
            )}

            <p className="text-xs text-slate-400 mt-2">
              Assessed {new Date(riskAssessment.assessed_at).toLocaleString('en-GB')} by risk engine
            </p>
          </div>
        )}

        {/* Declaration */}
        {declaration ? (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                <span className="font-semibold text-slate-800">Item Declaration</span>
                <span className="text-xs text-slate-400">v{declaration.version}</span>
                {declaration.declaration_text_version && (
                  <span className="text-xs text-slate-300">· form {declaration.declaration_text_version}</span>
                )}
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                declaration.declaration_status === 'approved' ? 'bg-green-100 text-green-700' :
                declaration.declaration_status === 'rejected' ? 'bg-red-100 text-red-700'   :
                declaration.declaration_status === 'submitted'? 'bg-blue-100 text-blue-700'  :
                'bg-slate-100 text-slate-600'
              }`}>
                {declaration.declaration_status}
              </span>
            </div>

            {/* Item identity */}
            <div className="px-5 py-5 border-b border-slate-100 grid sm:grid-cols-3 gap-5">
              <Field label="Item name"         value={declaration.item_name} />
              <Field label="Category"          value={declaration.item_category} />
              <Field label="Brand"             value={declaration.brand} />
              <Field label="Quantity"          value={declaration.quantity} />
              <Field label="Country of origin" value={declaration.country_of_origin} />
              <Field label="Submitted"         value={declaration.submitted_at ? new Date(declaration.submitted_at).toLocaleString('en-GB') : null} />
              <Field
                label="Declared value"
                value={declaration.declared_value != null
                  ? `${declaration.declared_currency ?? 'GBP'} ${declaration.declared_value}`
                  : null}
              />
              <Field
                label="Weight"
                value={declaration.declared_weight_kg != null ? `${declaration.declared_weight_kg} kg` : null}
              />
              <Field
                label="Sender owns item"
                value={declaration.sender_owns_item === true ? '✅ Yes' : declaration.sender_owns_item === false ? '⚠️ No' : null}
              />
            </div>

            {/* Description */}
            <div className="px-5 py-5 border-b border-slate-100">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Detailed description</p>
              <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{declaration.item_description || '—'}</p>
            </div>

            {/* Proof of ownership */}
            {(declaration.proof_of_ownership_url || declaration.proof_of_ownership_explanation) && (
              <div className="px-5 py-5 border-b border-slate-100 space-y-2">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Proof of ownership</p>
                {declaration.proof_of_ownership_url && (
                  <a
                    href={declaration.proof_of_ownership_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-blue-600 hover:underline text-sm"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> View document
                  </a>
                )}
                {declaration.proof_of_ownership_explanation && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                    <span className="font-semibold">Explanation (no document): </span>
                    {declaration.proof_of_ownership_explanation}
                  </div>
                )}
              </div>
            )}

            {/* Content flags + item modified */}
            <div className="px-5 py-5 border-b border-slate-100">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Contents declared</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                {CONTENT_FLAGS.map(({ key, label, level }) => {
                  const ticked = declaration[key] as boolean;
                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border ${
                        ticked && level === 'high'   ? 'bg-red-50 border-red-200 text-red-700 font-semibold' :
                        ticked && level === 'warn'   ? 'bg-amber-50 border-amber-200 text-amber-700 font-medium' :
                        ticked                       ? 'bg-slate-100 border-slate-200 text-slate-700' :
                        'bg-slate-50 border-slate-100 text-slate-300'
                      }`}
                    >
                      {ticked && level === 'high'
                        ? <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        : ticked
                        ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        : <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-slate-200 inline-block" />
                      }
                      {label}
                    </div>
                  );
                })}
              </div>
              {declaration.item_modified && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm border bg-amber-50 border-amber-300 text-amber-800 font-semibold w-fit">
                  <AlertTriangle className="h-3.5 w-3.5" /> Item has been modified / altered
                </div>
              )}
            </div>

            {/* Acknowledgements */}
            <div className="px-5 py-5 border-b border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Sender acknowledgements</p>
                {allAcksChecked
                  ? <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full">All signed</span>
                  : <span className="text-xs text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded-full">Incomplete</span>
                }
              </div>
              <div className="space-y-1.5">
                {ACKNOWLEDGEMENTS.map(({ key, text }) => {
                  const checked = declaration[key] as boolean;
                  return (
                    <div key={key} className={`flex items-center gap-2 text-sm ${checked ? 'text-slate-600' : 'text-red-500 font-medium'}`}>
                      {checked
                        ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        : <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                      }
                      {text}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Review result if already decided */}
            {declaration.reviewed_at && (
              <div className={`px-5 py-4 text-sm ${
                declaration.declaration_status === 'approved' ? 'bg-green-50 border-t border-green-100' : 'bg-red-50 border-t border-red-100'
              }`}>
                <p className="font-semibold text-slate-700">
                  {declaration.declaration_status === 'approved' ? '✅ Approved' : '❌ Rejected'} by {declaration.reviewed_by}
                  {' '}· {new Date(declaration.reviewed_at).toLocaleString('en-GB')}
                </p>
                {declaration.review_note && (
                  <p className="text-slate-600 mt-1">Note: &ldquo;{declaration.review_note}&rdquo;</p>
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

        {/* Evidence files */}
        {evidence.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Image className="h-4 w-4 text-slate-400" />
              <span className="font-semibold text-slate-800">Evidence</span>
              <span className="text-xs text-slate-400">{evidence.length} file{evidence.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="p-5 grid sm:grid-cols-2 gap-3">
              {evidence.map((e) => {
                const isImage = e.mime_type?.startsWith('image/');
                return (
                  <div key={e.id} className="border border-slate-200 rounded-xl overflow-hidden">
                    {isImage && e.signed_url && (
                      <img
                        src={e.signed_url}
                        alt={e.evidence_type}
                        className="w-full h-48 object-cover bg-slate-100"
                      />
                    )}
                    <div className="px-4 py-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-700 capitalize">{e.evidence_type.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-slate-400">{new Date(e.created_at).toLocaleString('en-GB')}</p>
                      </div>
                      {e.signed_url && (
                        <a
                          href={e.signed_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline whitespace-nowrap"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Open
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Approve / Reject */}
        {canAct && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <span className="font-semibold text-slate-800">Admin Decision</span>
              {!allAcksChecked && (
                <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full ml-auto">
                  ⚠️ Not all acknowledgements checked by sender
                </span>
              )}
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
                disabled={!!acting || !canApprove}
                title={!allAcksChecked ? 'Cannot approve — sender acknowledgements are incomplete' : undefined}
                onClick={() => decide('approve')}
                className="flex-1 flex items-center justify-center gap-2 py-3 font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {acting === 'approve'
                  ? <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <CheckCircle2 className="h-4 w-4" />}
                Approve for inspection
              </button>
              <button
                disabled={!!acting}
                onClick={() => decide('escalate_to_verification')}
                title="Escalate to external verification — requires a reason in the note field"
                className="flex-1 flex items-center justify-center gap-2 py-3 font-semibold text-amber-900 bg-amber-400 hover:bg-amber-500 rounded-xl transition disabled:opacity-50"
              >
                {acting === 'escalate_to_verification'
                  ? <span className="h-4 w-4 border-2 border-amber-900/40 border-t-amber-900 rounded-full animate-spin" />
                  : <AlertTriangle className="h-4 w-4" />}
                Escalate — external verification
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
          </div>
        )}

        {/* Decision feedback — shown after admin acts (canAct becomes false once feedback is set) */}
        {feedback && (
          <div className={`rounded-2xl border px-5 py-4 text-sm font-medium ${
            feedback.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {feedback.msg}
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
              {events.map((e) => {
                const meta = e.metadata ?? {};
                const failureReason = meta.failure_reason as string | undefined;
                const evSource      = meta.source as string | undefined;
                const autoEscalated = !!meta.auto_escalated;

                return (
                  <div key={e.id} className="px-5 py-3 flex items-start gap-3">
                    <div className={`mt-0.5 text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${
                      EVENT_STYLES[e.event_type] ?? 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}>
                      {e.event_type.replace(/_/g, ' ')}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-xs text-slate-500">{e.performed_by}</p>

                      {/* INSPECTION_FAILED: show failure_reason badge */}
                      {e.event_type === 'INSPECTION_FAILED' && failureReason && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                            autoEscalated
                              ? 'bg-amber-50 border-amber-300 text-amber-800'
                              : 'bg-orange-50 border-orange-300 text-orange-800'
                          }`}>
                            {failureReason.replace(/_/g, ' ')}
                          </span>
                          {autoEscalated && (
                            <span className="text-xs text-amber-600 font-medium">→ auto-escalated to external verification</span>
                          )}
                        </div>
                      )}

                      {/* COMPLIANCE_APPROVED with CLEARED classification: no-inspection badge */}
                      {e.event_type === 'COMPLIANCE_APPROVED' && meta.classification === 'CLEARED' && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-green-50 border-green-300 text-green-800">
                            CLEARED — risk engine
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            No physical inspection — relies on declaration + risk score only
                          </span>
                        </div>
                      )}

                      {/* EXTERNAL_VERIFICATION_REQUESTED: show source badge */}
                      {e.event_type === 'EXTERNAL_VERIFICATION_REQUESTED' && evSource && (
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                            evSource === 'admin_escalation'
                              ? 'bg-violet-50 border-violet-300 text-violet-800'
                              : evSource === 'inspection_failure'
                              ? 'bg-amber-50 border-amber-300 text-amber-800'
                              : 'bg-indigo-50 border-indigo-300 text-indigo-800'
                          }`}>
                            {evSource === 'admin_escalation'
                              ? 'admin escalation'
                              : evSource === 'inspection_failure'
                              ? 'auto-escalated from inspection'
                              : 'risk engine'}
                          </span>
                          {meta.reason && (
                            <span className="text-xs text-slate-400 truncate">{String(meta.reason).replace(/_/g, ' ')}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 shrink-0">
                      {new Date(e.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="pb-8" />
      </div>
    </div>
  );
}
