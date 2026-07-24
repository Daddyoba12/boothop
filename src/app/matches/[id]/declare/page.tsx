'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Package, Shield, CheckCircle, AlertCircle,
  Loader2, Upload, X, FileText, Clock,
} from 'lucide-react';

const CATEGORIES = [
  'clothing', 'electronics', 'documents', 'cosmetics', 'books', 'toys',
  'food', 'perfume', 'alcohol', 'art', 'medicine', 'antiques',
  'jewellery', 'other',
];

const CONTENT_FLAGS: { key: string; label: string; risk: 'normal' | 'warn' | 'high' }[] = [
  { key: 'contains_battery',           label: 'Battery / power bank',      risk: 'warn' },
  { key: 'contains_electronics',       label: 'Electronics',                risk: 'warn' },
  { key: 'contains_medication',        label: 'Medication / medicine',      risk: 'warn' },
  { key: 'contains_food',              label: 'Food / perishables',         risk: 'normal' },
  { key: 'contains_liquids',           label: 'Liquids',                    risk: 'normal' },
  { key: 'contains_powder',            label: 'Powder',                     risk: 'warn' },
  { key: 'contains_chemical',          label: 'Chemical substances',        risk: 'high' },
  { key: 'contains_currency',          label: 'Currency / cash',            risk: 'warn' },
  { key: 'contains_jewellery',         label: 'Jewellery / precious metals', risk: 'warn' },
  { key: 'contains_documents',         label: 'Documents / certificates',   risk: 'normal' },
  { key: 'contains_clothing',          label: 'Clothing / textiles',        risk: 'normal' },
  { key: 'contains_plant_or_animal',   label: 'Plant / animal material',    risk: 'warn' },
  { key: 'contains_hazardous',         label: 'Hazardous material',         risk: 'high' },
  { key: 'contains_weapons',           label: 'Weapons or sharp objects',   risk: 'high' },
];

const ACKNOWLEDGEMENTS: { key: string; text: string }[] = [
  { key: 'ack_description_accurate',    text: 'The description is complete and accurate.' },
  { key: 'ack_nothing_concealed',       text: 'Nothing has been concealed inside the declared item.' },
  { key: 'ack_complies_with_laws',      text: 'The item complies with origin, destination, airline, customs and local laws.' },
  { key: 'ack_may_be_reported',         text: 'I understand BootHop may reject, suspend or report suspicious activity.' },
  { key: 'ack_false_decl_consequences', text: 'I understand false declarations may result in permanent account suspension.' },
  { key: 'ack_legally_responsible',     text: 'I remain legally responsible for this declaration.' },
];

type EvidenceItem = { id: string; evidence_type: string; file_url: string; mime_type: string; created_at: string };

const INITIAL_FORM = {
  item_name:              '',
  item_category:          '',
  quantity:               1,
  brand:                  '',
  country_of_origin:      '',
  declared_value:         '',
  declared_currency:      'GBP',
  declared_weight_kg:     '',
  item_description:       '',
  sender_owns_item:       '' as '' | 'true' | 'false',
  proof_of_ownership_url: '',
  proof_of_ownership_explanation: '',
  item_modified:          false,
  contains_battery:       false,
  contains_electronics:   false,
  contains_medication:    false,
  contains_food:          false,
  contains_liquids:       false,
  contains_powder:        false,
  contains_chemical:      false,
  contains_currency:      false,
  contains_jewellery:     false,
  contains_documents:     false,
  contains_clothing:      false,
  contains_plant_or_animal: false,
  contains_hazardous:     false,
  contains_weapons:       false,
  ack_description_accurate:    false,
  ack_nothing_concealed:       false,
  ack_complies_with_laws:      false,
  ack_may_be_reported:         false,
  ack_false_decl_consequences: false,
  ack_legally_responsible:     false,
};

type FormState = typeof INITIAL_FORM;

export default function DeclarePage() {
  const params  = useParams();
  const router  = useRouter();
  const matchId = params.id as string;

  const [form,         setForm]         = useState<FormState>(INITIAL_FORM);
  const [declId,       setDeclId]       = useState<string | null>(null);
  const [matchStatus,  setMatchStatus]  = useState<string>('');
  const [evidence,     setEvidence]     = useState<EvidenceItem[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [draftSaved,   setDraftSaved]   = useState(false);
  const [submitDone,   setSubmitDone]   = useState(false);
  const [errors,       setErrors]       = useState<string[]>([]);
  const [saveError,    setSaveError]    = useState<string | null>(null);
  const [uploadError,  setUploadError]  = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/declare`);
      if (res.status === 401) { router.replace('/login'); return; }
      const j = await res.json();
      setMatchStatus(j.matchStatus ?? '');
      setEvidence(j.evidence ?? []);
      if (j.declaration) {
        setDeclId(j.declaration.id);
        if (j.declaration.declaration_status === 'submitted') {
          setSubmitDone(true);
        } else {
          populateForm(j.declaration);
        }
      }
    } catch {}
    finally { setLoading(false); }
  }, [matchId, router]);

  useEffect(() => { load(); }, [load]);

  function populateForm(decl: Record<string, unknown>) {
    setForm(prev => ({
      ...prev,
      item_name:              String(decl.item_name ?? ''),
      item_category:          String(decl.item_category ?? ''),
      quantity:               Number(decl.quantity ?? 1),
      brand:                  String(decl.brand ?? ''),
      country_of_origin:      String(decl.country_of_origin ?? ''),
      declared_value:         decl.declared_value != null ? String(decl.declared_value) : '',
      declared_currency:      String(decl.declared_currency ?? 'GBP'),
      declared_weight_kg:     decl.declared_weight_kg != null ? String(decl.declared_weight_kg) : '',
      item_description:       String(decl.item_description ?? ''),
      sender_owns_item:       decl.sender_owns_item === true ? 'true' : decl.sender_owns_item === false ? 'false' : '',
      proof_of_ownership_url: String(decl.proof_of_ownership_url ?? ''),
      proof_of_ownership_explanation: String(decl.proof_of_ownership_explanation ?? ''),
      item_modified:          Boolean(decl.item_modified),
      contains_battery:       Boolean(decl.contains_battery),
      contains_electronics:   Boolean(decl.contains_electronics),
      contains_medication:    Boolean(decl.contains_medication),
      contains_food:          Boolean(decl.contains_food),
      contains_liquids:       Boolean(decl.contains_liquids),
      contains_powder:        Boolean(decl.contains_powder),
      contains_chemical:      Boolean(decl.contains_chemical),
      contains_currency:      Boolean(decl.contains_currency),
      contains_jewellery:     Boolean(decl.contains_jewellery),
      contains_documents:     Boolean(decl.contains_documents),
      contains_clothing:      Boolean(decl.contains_clothing),
      contains_plant_or_animal: Boolean(decl.contains_plant_or_animal),
      contains_hazardous:     Boolean(decl.contains_hazardous),
      contains_weapons:       Boolean(decl.contains_weapons),
    }));
  }

  function set(key: keyof FormState, value: unknown) {
    setForm(prev => ({ ...prev, [key]: value }));
    setDraftSaved(false);
  }

  function buildPayload() {
    return {
      ...form,
      declared_value:     form.declared_value !== '' ? Number(form.declared_value) : null,
      declared_weight_kg: form.declared_weight_kg !== '' ? Number(form.declared_weight_kg) : null,
      quantity:           Number(form.quantity),
      sender_owns_item:   form.sender_owns_item === 'true' ? true : form.sender_owns_item === 'false' ? false : null,
    };
  }

  const proofRequired =
    (Number(form.declared_value) > 250 || ['jewellery', 'electronics', 'antiques', 'art'].includes(form.item_category));

  async function saveDraft() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/matches/${matchId}/declare`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(buildPayload()),
      });
      const j = await res.json();
      if (!res.ok) { setSaveError(j.error ?? 'Failed to save draft.'); return; }
      if (j.declaration?.id && !declId) setDeclId(j.declaration.id);
      setDraftSaved(true);
    } catch { setSaveError('Could not save draft.'); }
    finally { setSaving(false); }
  }

  async function submitDeclaration() {
    setErrors([]);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/declare`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(buildPayload()),
      });
      const j = await res.json();
      if (!res.ok) {
        setErrors(j.errors ?? [j.error ?? 'Submission failed.']);
        return;
      }
      setSubmitDone(true);
    } catch { setErrors(['Something went wrong. Please try again.']); }
    finally { setSubmitting(false); }
  }

  async function uploadEvidence(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!declId) { setUploadError('Save your draft first before uploading evidence.'); return; }
    setUploadingFile(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('evidence_type', 'photo');
      const res = await fetch(`/api/matches/${matchId}/declare/evidence`, { method: 'POST', body: fd });
      const j   = await res.json();
      if (!res.ok) { setUploadError(j.error ?? 'Upload failed.'); return; }
      setEvidence(prev => [...prev, j.evidence]);
    } catch { setUploadError('Upload failed. Please try again.'); }
    finally { setUploadingFile(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  }

  const allAcks = ACKNOWLEDGEMENTS.every(a => (form as any)[a.key]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-blue-400 animate-spin" />
      </div>
    );
  }

  // Submitted — show confirmation
  if (submitDone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
        <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">Boot<span className="text-blue-400">Hop</span></Link>
          <Link href={`/matches/${matchId}`} className="text-sm text-white/50 hover:text-white flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to match
          </Link>
        </div>
        <div className="max-w-lg mx-auto px-6 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Declaration submitted</h1>
          <p className="text-white/60 mb-2">BootHop Safety &amp; Compliance is now reviewing your item declaration.</p>
          <p className="text-white/40 text-sm mb-8">You will receive an email once the review is complete — usually within a few hours.</p>
          <Link
            href={`/matches/${matchId}`}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-2xl transition-all text-sm"
          >
            <Package className="h-4 w-4" /> View match status
          </Link>
        </div>
      </div>
    );
  }

  // Wrong status (e.g. already active, rejected)
  if (matchStatus && matchStatus !== 'locked_pending_compliance') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
        <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">Boot<span className="text-blue-400">Hop</span></Link>
          <Link href={`/matches/${matchId}`} className="text-sm text-white/50 hover:text-white flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to match
          </Link>
        </div>
        <div className="max-w-lg mx-auto px-6 py-16 text-center">
          <Clock className="h-12 w-12 text-amber-400 mx-auto mb-4" />
          <p className="text-white font-semibold">Declaration not available</p>
          <p className="text-white/50 text-sm mt-2">This declaration form is only available while your shipment is awaiting your item declaration.</p>
          <Link href={`/matches/${matchId}`} className="inline-block mt-6 text-blue-400 text-sm hover:underline">
            View match →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Nav */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-white">Boot<span className="text-blue-400">Hop</span></Link>
        <Link href={`/matches/${matchId}`} className="text-sm text-white/50 hover:text-white flex items-center gap-1.5 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to match
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-5">

        {/* Header */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-2">
            <Shield className="h-3.5 w-3.5" /> Item declaration required
          </p>
          <p className="text-white font-bold text-lg mb-1">Tell us what you are sending</p>
          <p className="text-white/50 text-sm">
            BootHop is required to verify the contents of every shipment before releasing contact details.
            Complete your declaration to proceed.
          </p>
        </div>

        {/* Section 1 — Basic info */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Item details</p>

          <div>
            <label className="block text-sm text-white/60 mb-1.5">Item name <span className="text-red-400">*</span></label>
            <input
              className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-500 focus:bg-white/15"
              placeholder="e.g. Nike Air Force 1 Low"
              value={form.item_name}
              onChange={e => set('item_name', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Category <span className="text-red-400">*</span></label>
              <select
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 focus:bg-white/15"
                value={form.item_category}
                onChange={e => set('item_category', e.target.value)}
              >
                <option value="">Select…</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c} className="bg-slate-900">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Quantity <span className="text-red-400">*</span></label>
              <input
                type="number" min="1"
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 focus:bg-white/15"
                value={form.quantity}
                onChange={e => set('quantity', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Brand <span className="text-white/30 text-xs">(optional)</span></label>
              <input
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-500 focus:bg-white/15"
                placeholder="e.g. Nike"
                value={form.brand}
                onChange={e => set('brand', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Country of origin <span className="text-red-400">*</span></label>
              <input
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-500 focus:bg-white/15"
                placeholder="e.g. United States"
                value={form.country_of_origin}
                onChange={e => set('country_of_origin', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 2 — Value & weight */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Value &amp; weight</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-sm text-white/60 mb-1.5">Declared value <span className="text-red-400">*</span></label>
              <input
                type="number" min="0" step="0.01"
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-500 focus:bg-white/15"
                placeholder="0.00"
                value={form.declared_value}
                onChange={e => set('declared_value', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Currency</label>
              <select
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 focus:bg-white/15"
                value={form.declared_currency}
                onChange={e => set('declared_currency', e.target.value)}
              >
                {['GBP', 'USD', 'EUR', 'NGN'].map(c => (
                  <option key={c} value={c} className="bg-slate-900">{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Declared weight (kg) <span className="text-red-400">*</span></label>
            <input
              type="number" min="0" step="0.1"
              className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-500 focus:bg-white/15"
              placeholder="e.g. 1.5"
              value={form.declared_weight_kg}
              onChange={e => set('declared_weight_kg', e.target.value)}
            />
          </div>
        </div>

        {/* Section 3 — Description */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Detailed description</p>
          <p className="text-xs text-white/40">
            Be specific — include brand, model, size, colour, condition, and purpose.
            Vague descriptions like "clothes" or "electronics" will be rejected.
          </p>
          <textarea
            rows={4}
            className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-500 focus:bg-white/15 resize-none"
            placeholder='e.g. "Nike Air Force 1 Low, size UK 10, white leather upper, bought at JD Sports 2023, worn twice"'
            value={form.item_description}
            onChange={e => set('item_description', e.target.value)}
          />
          <div className="flex justify-end">
            <span className={`text-xs ${form.item_description.trim().length < 20 ? 'text-amber-400' : 'text-white/30'}`}>
              {form.item_description.trim().length} / 20 min
            </span>
          </div>
        </div>

        {/* Section 4 — Content flags */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Contents</p>
          <p className="text-xs text-white/40">Tick everything that applies, even if not the main item.</p>
          <div className="grid grid-cols-2 gap-2">
            {CONTENT_FLAGS.map(({ key, label, risk }) => (
              <label key={key} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded accent-blue-500"
                  checked={(form as any)[key]}
                  onChange={e => set(key as keyof FormState, e.target.checked)}
                />
                <span className={`text-sm ${
                  risk === 'high'   ? 'text-red-300' :
                  risk === 'warn'   ? 'text-amber-300' :
                                      'text-white/70'
                }`}>{label}</span>
              </label>
            ))}
          </div>

          <div className="pt-2 border-t border-white/10">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded accent-amber-500"
                checked={form.item_modified}
                onChange={e => set('item_modified', e.target.checked)}
              />
              <span className="text-sm text-amber-300">This item has been modified, altered, or opened since purchase</span>
            </label>
          </div>
        </div>

        {/* Section 5 — Ownership */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Ownership</p>

          <div>
            <label className="block text-sm text-white/60 mb-2">Do you own this item? <span className="text-red-400">*</span></label>
            <div className="flex gap-3">
              {[{ val: 'true', label: 'Yes, I own it' }, { val: 'false', label: 'No (e.g. sending for someone else)' }].map(opt => (
                <label key={opt.val} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sender_owns_item"
                    className="accent-blue-500"
                    checked={form.sender_owns_item === opt.val}
                    onChange={() => set('sender_owns_item', opt.val)}
                  />
                  <span className="text-sm text-white/70">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {proofRequired && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 space-y-3">
              <p className="text-xs font-semibold text-amber-400">
                Proof of ownership required — item value exceeds £250 or category requires verification.
              </p>
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Evidence URL <span className="text-white/30 text-xs">(after uploading below)</span></label>
                <input
                  className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-500 focus:bg-white/15"
                  placeholder="Paste URL here or upload a file below"
                  value={form.proof_of_ownership_url}
                  onChange={e => set('proof_of_ownership_url', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Or explain why you don&apos;t have proof</label>
                <textarea
                  rows={2}
                  className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-500 focus:bg-white/15 resize-none"
                  placeholder="e.g. Gift from family — no receipt available"
                  value={form.proof_of_ownership_explanation}
                  onChange={e => set('proof_of_ownership_explanation', e.target.value)}
                />
                <p className="text-xs text-white/30 mt-1">
                  A written explanation flags this for manual review rather than blocking submission.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Section 6 — Evidence upload */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Evidence <span className="text-white/20 font-normal normal-case">(photos, receipts, documents)</span></p>

          {!declId && (
            <p className="text-xs text-white/40 italic">Save your draft first to enable file uploads.</p>
          )}

          {evidence.length > 0 && (
            <div className="space-y-2">
              {evidence.map(e => (
                <div key={e.id} className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-2.5">
                  <FileText className="h-4 w-4 text-blue-400 shrink-0" />
                  <a href={e.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-white/70 hover:text-white truncate flex-1">
                    {e.evidence_type} — {new Date(e.created_at).toLocaleDateString('en-GB')}
                  </a>
                </div>
              ))}
            </div>
          )}

          {declId && (
            <>
              {uploadError && (
                <div className="flex items-center gap-2 text-red-300 text-sm">
                  <X className="h-4 w-4" /> {uploadError}
                </div>
              )}
              <label className={`flex items-center gap-3 justify-center rounded-xl border-2 border-dashed px-6 py-4 transition-colors cursor-pointer ${
                uploadingFile ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/20 hover:border-blue-500/50 hover:bg-white/5'
              }`}>
                {uploadingFile
                  ? <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
                  : <Upload className="h-5 w-5 text-white/40" />}
                <span className="text-sm text-white/50">{uploadingFile ? 'Uploading…' : 'Upload photo, receipt, or document'}</span>
                <input ref={fileInputRef} type="file" className="hidden" accept="image/*,application/pdf,video/mp4,video/quicktime" onChange={uploadEvidence} disabled={uploadingFile} />
              </label>
              <p className="text-xs text-white/30">JPEG, PNG, PDF, MP4 — max 20 MB</p>
            </>
          )}
        </div>

        {/* Section 7 — Acknowledgements */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Declarations</p>
          <p className="text-xs text-white/40">All boxes must be checked before you can submit.</p>
          <div className="space-y-3">
            {ACKNOWLEDGEMENTS.map(({ key, text }) => (
              <label key={key} className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-4 h-4 mt-0.5 rounded accent-blue-500 shrink-0"
                  checked={(form as any)[key]}
                  onChange={e => set(key as keyof FormState, e.target.checked)}
                />
                <span className={`text-sm ${(form as any)[key] ? 'text-white/70' : 'text-white/40'}`}>{text}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Validation errors */}
        {errors.length > 0 && (
          <div className="rounded-xl bg-red-500/20 border border-red-500/30 p-4 space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-sm font-semibold text-red-300">Please fix the following before submitting:</p>
            </div>
            {errors.map((e, i) => (
              <p key={i} className="text-sm text-red-200 pl-6">• {e}</p>
            ))}
          </div>
        )}

        {saveError && (
          <div className="flex items-center gap-2 rounded-xl bg-red-500/20 border border-red-500/30 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            <p className="text-sm text-red-300">{saveError}</p>
          </div>
        )}

        {draftSaved && !saveError && (
          <div className="flex items-center gap-2 rounded-xl bg-green-500/20 border border-green-500/30 px-4 py-3">
            <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
            <p className="text-sm text-green-300">Draft saved.</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pb-10">
          <button
            onClick={saveDraft}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold py-3 rounded-2xl transition-all text-sm disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button
            onClick={submitDeclaration}
            disabled={submitting || !allAcks}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-2xl transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
            {submitting ? 'Submitting…' : 'Submit Declaration'}
          </button>
        </div>

      </div>
    </div>
  );
}
