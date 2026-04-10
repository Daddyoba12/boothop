'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Loader2, AlertCircle, AlertTriangle,
  CheckCircle, MapPin, Package, Clock, Users, Shield,
  Plane, Globe, Truck, Zap, Star, Info,
} from 'lucide-react';
import {
  calculateQuote, RouteType, DeliveryMode, UrgencyTier,
  ROUTE_META, MODE_META, URGENCY_META, CATEGORIES, QuoteBreakdown,
} from '@/lib/business/pricing';

// ── Types ─────────────────────────────────────────────────────────────────────

export type WizardTier = 'standard' | 'priority';

export interface WizardProps {
  tier:        WizardTier;
  bizEmail:    string;
  companyName: string;
  onSuccess:   (jobRef: string) => void;
  onCancel:    () => void;
}

interface Form {
  routeType:           RouteType | '';
  deliveryMode:        DeliveryMode;
  itemDesc:            string;
  category:            string;
  quantity:            string;
  weightKg:            string;
  declaredValue:       string;
  fragile:             boolean;
  specialHandling:     boolean;
  dangerousGoods:      boolean;
  collectionAddress:   string;
  deliveryAddress:     string;
  originAirport:       string;
  destAirport:         string;
  extraPickupMiles:    string;
  extraDropMiles:      string;
  urgency:             UrgencyTier | '';
  collectionDate:      string;
  collectionTime:      string;
  mustArriveBy:        string;
  nightService:        boolean;
  weekend:             boolean;
  immediateDispatch:   boolean;
  dedicatedDriver:     boolean;
  senderCompany:       string;
  senderName:          string;
  senderPhone:         string;
  senderEmail:         string;
  senderAddress:       string;
  senderInstructions:  string;
  receiverCompany:     string;
  receiverName:        string;
  receiverPhone:       string;
  receiverEmail:       string;
  receiverAddress:     string;
  receiverInstructions:string;
  customsAccepted:     boolean;
  taxesAccepted:       boolean;
  legalityAccepted:    boolean;
  paperworkAccepted:   boolean;
  delaysAccepted:      boolean;
  customsHandledBy:    'sender' | 'receiver' | 'broker' | '';
  brokerName:          string;
  brokerPhone:         string;
  enhancedInsurance:   boolean;
  meetGreetOrigin:     boolean;
  meetGreetDest:       boolean;
  insuranceConfirmed:  boolean;
  termsAccepted:       boolean;
  packagingConfirmed:  boolean;
  detailsConfirmed:    boolean;
  extraChargesConfirmed: boolean;
}

// ── Step navigation ───────────────────────────────────────────────────────────

function nextStep(s: number, rt: RouteType | ''): number {
  const ukuk = rt === 'uk_uk';
  if (s === 1 && ukuk)  return 3; // skip delivery mode
  if (s === 6 && ukuk)  return 8; // skip customs
  return s + 1;
}

function prevStep(s: number, rt: RouteType | ''): number {
  const ukuk = rt === 'uk_uk';
  if (s === 3 && ukuk)  return 1;
  if (s === 8 && ukuk)  return 6;
  return s - 1;
}

function displayStep(s: number, rt: RouteType | ''): number {
  if (rt === 'uk_uk') {
    if (s >= 3 && s <= 6) return s - 1;
    if (s >= 7)            return s - 2;
  }
  return s;
}

function totalSteps(rt: RouteType | ''): number {
  return rt === 'uk_uk' ? 7 : 9;
}

// ── Shared UI atoms ───────────────────────────────────────────────────────────

const FADE = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 } };

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5">{children}</p>;
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors ${props.className ?? ''}`}
    />
  );
}

function Textarea({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      rows={props.rows ?? 2}
      className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors resize-none ${props.className ?? ''}`}
    />
  );
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select
      {...props}
      className={`w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 transition-colors ${props.className ?? ''}`}
    >
      {children}
    </select>
  );
}

function Toggle({ checked, onChange, label, sub }: { checked: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-start gap-3 w-full text-left p-3 rounded-xl border transition-all ${checked ? 'border-white/20 bg-white/5' : 'border-white/8 hover:border-white/15'}`}
    >
      <div className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${checked ? 'bg-white border-white' : 'border-white/30'}`}>
        {checked && <div className="w-2 h-2 bg-black rounded-sm" />}
      </div>
      <div>
        <p className="text-sm text-white font-medium">{label}</p>
        {sub && <p className="text-xs text-white/35 mt-0.5">{sub}</p>}
      </div>
    </button>
  );
}

function SectionHead({ icon: Icon, title, sub }: { icon: React.ComponentType<{ className?: string }>; title: string; sub: string }) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
        <Icon className="h-5 w-5 text-white/50" />
      </div>
      <div>
        <h3 className="font-black text-lg text-white">{title}</h3>
        <p className="text-white/35 text-sm">{sub}</p>
      </div>
    </div>
  );
}

// ── Quote Panel ───────────────────────────────────────────────────────────────

function QuotePanel({ quote, form, accent }: { quote: QuoteBreakdown | null; form: Form; accent: string }) {
  const fmt = (n: number) => n > 0 ? `£${n.toLocaleString()}` : '—';

  const accentText  = accent === 'amber' ? 'text-amber-400'  : 'text-emerald-400';
  const accentBg    = accent === 'amber' ? 'bg-amber-500/10' : 'bg-emerald-500/10';
  const accentBorder= accent === 'amber' ? 'border-amber-500/20' : 'border-emerald-500/20';

  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl p-6 lg:sticky lg:top-6">
      <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4">Live Quote</p>

      {!form.routeType && (
        <div className="text-center py-8">
          <Globe className="h-8 w-8 text-white/15 mx-auto mb-3" />
          <p className="text-white/25 text-sm">Select a route to see pricing</p>
        </div>
      )}

      {form.routeType && !form.urgency && (
        <div className="text-center py-8">
          <Clock className="h-8 w-8 text-white/15 mx-auto mb-3" />
          <p className="text-white/25 text-sm">Select urgency to calculate</p>
          <p className="text-white/15 text-xs mt-1">{ROUTE_META[form.routeType as RouteType].from}</p>
        </div>
      )}

      {quote && (
        <>
          <div className="space-y-2.5 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-white/50">Base ({form.routeType ? ROUTE_META[form.routeType as RouteType].label : ''})</span>
              <span className="text-white font-semibold">{fmt(quote.base)}</span>
            </div>
            {quote.pickupExtra > 0 && (
              <div className="flex justify-between">
                <span className="text-white/50">Extra pickup mileage</span>
                <span className="text-white">{fmt(quote.pickupExtra)}</span>
              </div>
            )}
            {quote.dropExtra > 0 && (
              <div className="flex justify-between">
                <span className="text-white/50">Extra drop mileage</span>
                <span className="text-white">{fmt(quote.dropExtra)}</span>
              </div>
            )}
            {quote.handlingFee > 0 && (
              <div className="flex justify-between">
                <span className="text-white/50">Airport handling</span>
                <span className="text-white">{fmt(quote.handlingFee)}</span>
              </div>
            )}
            {quote.insuranceFee > 0 && (
              <div className="flex justify-between">
                <span className="text-white/50">Enhanced insurance</span>
                <span className="text-white">{fmt(quote.insuranceFee)}</span>
              </div>
            )}
            {quote.addons > 0 && (
              <div className="flex justify-between">
                <span className="text-white/50">Add-ons</span>
                <span className="text-white">{fmt(quote.addons)}</span>
              </div>
            )}
            {quote.weekendSurcharge > 0 && (
              <div className="flex justify-between">
                <span className="text-white/50">Weekend (+20%)</span>
                <span className="text-white">{fmt(quote.weekendSurcharge)}</span>
              </div>
            )}
          </div>

          <div className={`border-t border-white/10 pt-4 flex justify-between items-baseline`}>
            <span className="text-white/50 text-sm">Estimated total</span>
            <span className={`${accentText} font-black text-2xl`}>£{quote.total.toLocaleString()}</span>
          </div>

          {quote.reviewRequired && (
            <div className={`mt-4 ${accentBg} ${accentBorder} border rounded-xl p-3`}>
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-400 mb-1">Manual review required</p>
                  {quote.reviewReasons.map((r, i) => (
                    <p key={i} className="text-xs text-white/40">{r}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-white/8">
            <p className="text-xs text-white/20 leading-relaxed">
              Estimate only. Final price confirmed on operator assignment. VAT not included.
            </p>
          </div>
        </>
      )}

      {/* Key inclusions */}
      <div className="mt-6 space-y-2">
        {[
          'Verified operator assigned',
          'Real-time coordination',
          'Direct point-to-point',
        ].map(item => (
          <div key={item} className="flex items-center gap-2 text-xs text-white/30">
            <CheckCircle className="h-3.5 w-3.5 text-white/20 flex-shrink-0" />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function BusinessBookingWizard({ tier, bizEmail, companyName, onSuccess, onCancel }: WizardProps) {
  const accent      = tier === 'priority' ? 'amber' : 'emerald';
  const accentText  = accent === 'amber' ? 'text-amber-400'   : 'text-emerald-400';
  const accentBg    = accent === 'amber' ? 'bg-amber-400'     : 'bg-emerald-400';
  const accentHover = accent === 'amber' ? 'hover:bg-amber-300' : 'hover:bg-emerald-300';
  const accentBorder= accent === 'amber' ? 'border-amber-500' : 'border-emerald-500';
  const accentSelBg = accent === 'amber' ? 'bg-amber-500/10'  : 'bg-emerald-500/10';
  const accentSelBd = accent === 'amber' ? 'border-amber-500/60' : 'border-emerald-500/60';
  const accentCardH = accent === 'amber' ? 'hover:border-amber-500/30 hover:bg-amber-500/5' : 'hover:border-emerald-500/30 hover:bg-emerald-500/5';

  const [step,       setStep]       = useState(1);
  const [form,       setForm]       = useState<Form>({
    routeType: '', deliveryMode: 'airport_airport',
    itemDesc: '', category: '', quantity: '1', weightKg: '', declaredValue: '',
    fragile: false, specialHandling: false, dangerousGoods: false,
    collectionAddress: '', deliveryAddress: '', originAirport: '', destAirport: '',
    extraPickupMiles: '0', extraDropMiles: '0',
    urgency: tier === 'priority' ? 'priority' : '',
    collectionDate: '', collectionTime: '', mustArriveBy: '',
    nightService: false, weekend: false, immediateDispatch: false, dedicatedDriver: false,
    senderCompany: companyName, senderName: '', senderPhone: '', senderEmail: bizEmail,
    senderAddress: '', senderInstructions: '',
    receiverCompany: '', receiverName: '', receiverPhone: '',
    receiverEmail: '', receiverAddress: '', receiverInstructions: '',
    customsAccepted: false, taxesAccepted: false, legalityAccepted: false,
    paperworkAccepted: false, delaysAccepted: false,
    customsHandledBy: '', brokerName: '', brokerPhone: '',
    enhancedInsurance: false, meetGreetOrigin: false, meetGreetDest: false, insuranceConfirmed: false,
    termsAccepted: false, packagingConfirmed: false, detailsConfirmed: false, extraChargesConfirmed: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const up = (key: keyof Form, val: unknown) => setForm(f => ({ ...f, [key]: val }));

  const quote = useMemo<QuoteBreakdown | null>(() => {
    if (!form.routeType || !form.urgency) return null;
    return calculateQuote({
      routeType:        form.routeType as RouteType,
      deliveryMode:     form.deliveryMode,
      urgency:          form.urgency as UrgencyTier,
      extraPickupMiles: parseFloat(form.extraPickupMiles) || 0,
      extraDropMiles:   parseFloat(form.extraDropMiles)   || 0,
      weightKg:         parseFloat(form.weightKg)         || 0,
      declaredValue:    parseFloat(form.declaredValue)    || 0,
      enhancedInsurance: form.enhancedInsurance,
      nightService:     form.nightService,
      weekend:          form.weekend,
      immediateDispatch: form.immediateDispatch,
      dedicatedDriver:  form.dedicatedDriver,
      meetGreetOrigin:  form.meetGreetOrigin,
      meetGreetDest:    form.meetGreetDest,
    });
  }, [form]);

  const isIntl = form.routeType !== 'uk_uk' && form.routeType !== '';

  // ── Validation ──────────────────────────────────────────────────────────────
  function validate(): string | null {
    switch (step) {
      case 1: if (!form.routeType) return 'Please select a service route.'; break;
      case 2: if (!form.deliveryMode) return 'Please select a delivery mode.'; break;
      case 3:
        if (!form.itemDesc.trim())    return 'Item description is required.';
        if (!form.weightKg)           return 'Weight is required.';
        if (!form.declaredValue)      return 'Declared value is required.';
        break;
      case 4:
        if (isIntl) {
          if (!form.originAirport.trim())  return 'Origin airport is required.';
          if (!form.destAirport.trim())    return 'Destination airport is required.';
        } else {
          if (!form.collectionAddress.trim()) return 'Collection address is required.';
          if (!form.deliveryAddress.trim())   return 'Delivery address is required.';
        }
        break;
      case 5:
        if (!form.urgency)              return 'Please select urgency level.';
        if (!form.collectionDate)       return 'Collection date is required.';
        break;
      case 6:
        if (!form.senderName.trim())    return 'Sender name is required.';
        if (!form.senderPhone.trim())   return 'Sender phone is required.';
        if (!form.receiverName.trim())  return 'Receiver name is required.';
        if (!form.receiverPhone.trim()) return 'Receiver phone is required.';
        break;
      case 7:
        if (!form.customsAccepted || !form.taxesAccepted || !form.legalityAccepted || !form.paperworkAccepted || !form.delaysAccepted)
          return 'All customs declarations must be confirmed to proceed.';
        if (!form.customsHandledBy)     return 'Please confirm who handles customs clearance.';
        break;
      case 8:
        if (form.enhancedInsurance && !form.insuranceConfirmed)
          return 'Please confirm the declared value for insurance.';
        break;
      case 9:
        if (!form.termsAccepted || !form.packagingConfirmed || !form.detailsConfirmed || !form.extraChargesConfirmed)
          return 'All declarations must be confirmed before submitting.';
        break;
    }
    return null;
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  const advance = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    if (step === 9) { handleSubmit(); return; }
    setStep(s => nextStep(s, form.routeType));
  };

  const back = () => {
    setError(null);
    setStep(s => prevStep(s, form.routeType));
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/business/create-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route_type:       form.routeType,
          delivery_mode:    form.deliveryMode,
          company_name:     form.senderCompany,
          phone:            form.senderPhone,
          pickup:           isIntl ? form.originAirport : form.collectionAddress,
          dropoff:          isIntl ? form.destAirport   : form.deliveryAddress,
          description:      form.itemDesc,
          category:         form.category,
          weight:           form.weightKg,
          value:            form.declaredValue,
          urgency:          form.urgency,
          urgency_tier:     form.urgency,
          delivery_date:    form.collectionDate,
          expected_delivery_date: form.mustArriveBy,
          extra_pickup_miles: form.extraPickupMiles,
          extra_drop_miles:   form.extraDropMiles,
          insurance:          form.enhancedInsurance,
          price:              quote?.total ?? 0,
          insurance_fee:      quote?.insuranceFee ?? 0,
          dangerous_goods:    form.dangerousGoods,
          fragile:            form.fragile,
          review_required:    quote?.reviewRequired ?? false,
          night_service:      form.nightService,
          weekend:            form.weekend,
          dedicated_driver:   form.dedicatedDriver,
          immediate_dispatch: form.immediateDispatch,
          meet_greet_origin:  form.meetGreetOrigin,
          meet_greet_dest:    form.meetGreetDest,
          sender_name:        form.senderName,
          sender_email:       form.senderEmail,
          receiver_company:   form.receiverCompany,
          receiver_name:      form.receiverName,
          receiver_phone:     form.receiverPhone,
          receiver_email:     form.receiverEmail,
          receiver_address:   form.receiverAddress,
          customs_handled_by: form.customsHandledBy || null,
          delivery_type:      form.routeType === 'uk_uk' ? 'local_uk' : 'international',
          is_priority:        tier === 'priority',
          metadata: {
            senderAddress: form.senderAddress, senderInstructions: form.senderInstructions,
            receiverInstructions: form.receiverInstructions,
            collectionTime: form.collectionTime,
            dimensions: form.weightKg ? { weightKg: form.weightKg } : null,
            brokerName: form.brokerName, brokerPhone: form.brokerPhone,
          },
        }),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error || 'Submission failed.'); setSubmitting(false); return; }
      onSuccess(j.jobRef);
    } catch {
      setError('Network error. Please try again.');
      setSubmitting(false);
    }
  };

  // ── Renders ─────────────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (step) {
      // ── Step 1: Route type ──────────────────────────────────────────────────
      case 1: return (
        <div>
          <SectionHead icon={Globe} title="Select your route" sub="Choose the service lane that matches your delivery." />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.keys(ROUTE_META) as RouteType[]).map(rt => {
              const m = ROUTE_META[rt];
              const sel = form.routeType === rt;
              return (
                <button
                  key={rt}
                  type="button"
                  onClick={() => { up('routeType', rt); setError(null); }}
                  className={`text-left p-4 rounded-2xl border transition-all ${sel ? `${accentSelBg} ${accentSelBd}` : `border-white/10 bg-white/3 ${accentCardH}`}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{m.flag}</span>
                    {sel && <CheckCircle className={`h-4 w-4 ${accentText}`} />}
                  </div>
                  <p className="font-black text-white">{m.label}</p>
                  <p className="text-white/40 text-xs mt-0.5">{m.desc}</p>
                  <p className={`${accentText} font-bold text-sm mt-2`}>{m.from}</p>
                </button>
              );
            })}
          </div>
          <div className="mt-4 p-3 bg-white/3 border border-white/8 rounded-xl flex items-start gap-2">
            <Info className="h-4 w-4 text-white/25 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-white/30">For unusual routes or bulk consignments, contact us for a custom quote after submission.</p>
          </div>
        </div>
      );

      // ── Step 2: Delivery mode ───────────────────────────────────────────────
      case 2: return (
        <div>
          <SectionHead icon={Plane} title="Delivery mode" sub="How should we handle each end of the journey?" />
          <div className="grid grid-cols-1 gap-3 mb-4">
            {(Object.keys(MODE_META) as DeliveryMode[]).map(m => {
              const meta = MODE_META[m];
              const sel  = form.deliveryMode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => { up('deliveryMode', m); setError(null); }}
                  className={`text-left p-4 rounded-2xl border transition-all flex items-start gap-4 ${sel ? `${accentSelBg} ${accentSelBd}` : `border-white/10 bg-white/3 ${accentCardH}`}`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${sel ? `${accentBorder} bg-current` : 'border-white/30'}`}>
                    {sel && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white">{meta.label}</p>
                      {meta.recommended && (
                        <span className="text-xs bg-white/10 text-white/50 px-2 py-0.5 rounded-full font-semibold">Recommended</span>
                      )}
                    </div>
                    <p className="text-white/35 text-xs mt-0.5">{meta.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="p-4 bg-white/3 border border-white/8 rounded-xl flex items-start gap-3">
            <Info className="h-4 w-4 text-white/25 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-white/35 leading-relaxed">
              Airport-to-airport is the most efficient option for international routes. Collection or final delivery beyond the airport is charged separately at a per-mile rate.
            </p>
          </div>
        </div>
      );

      // ── Step 3: Goods ───────────────────────────────────────────────────────
      case 3: return (
        <div>
          <SectionHead icon={Package} title="Item details" sub="Accurate details ensure correct pricing and handling." />
          <div className="space-y-4">
            <div>
              <Label>Item description *</Label>
              <Input placeholder="e.g. CNC machine spindle — urgent replacement part" value={form.itemDesc} onChange={e => up('itemDesc', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onChange={e => up('category', e.target.value)}>
                  <option value="">Select…</option>
                  {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#0d1117]">{c}</option>)}
                </Select>
              </div>
              <div>
                <Label>Quantity</Label>
                <Input type="number" min="1" value={form.quantity} onChange={e => up('quantity', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Weight (kg) *</Label>
                <Input type="number" min="0.1" step="0.1" placeholder="0.0" value={form.weightKg} onChange={e => up('weightKg', e.target.value)} />
                {parseFloat(form.weightKg) > 20 && (
                  <p className="text-xs text-amber-400 mt-1.5 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Above 20 kg — manual review required</p>
                )}
              </div>
              <div>
                <Label>Declared value (GBP) *</Label>
                <Input type="number" min="0" placeholder="0" value={form.declaredValue} onChange={e => up('declaredValue', e.target.value)} />
              </div>
            </div>
            <div className="pt-2">
              <Label>Item characteristics</Label>
              <div className="grid grid-cols-1 gap-2">
                <Toggle checked={form.fragile} onChange={v => up('fragile', v)} label="Fragile — requires careful handling" />
                <Toggle checked={form.specialHandling} onChange={v => up('specialHandling', v)} label="Special handling required" sub="e.g. temperature sensitive, orientation specific" />
                <Toggle checked={form.dangerousGoods} onChange={v => up('dangerousGoods', v)} label="Contains dangerous goods" sub="Batteries, liquids, pressurised items, etc." />
              </div>
              {form.dangerousGoods && (
                <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-400/80">Dangerous goods require manual assessment. Your booking will be reviewed before confirmation.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );

      // ── Step 4: Addresses ───────────────────────────────────────────────────
      case 4: return (
        <div>
          <SectionHead icon={MapPin} title="Route details" sub={isIntl ? 'Airports and any extra collection or delivery addresses.' : 'Exact collection and delivery addresses.'} />
          <div className="space-y-4">
            {isIntl ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Origin airport *</Label>
                    <Input placeholder="e.g. London Heathrow (LHR)" value={form.originAirport} onChange={e => up('originAirport', e.target.value)} />
                  </div>
                  <div>
                    <Label>Destination airport *</Label>
                    <Input placeholder="e.g. Amsterdam Schiphol (AMS)" value={form.destAirport} onChange={e => up('destAirport', e.target.value)} />
                  </div>
                </div>
                {(form.deliveryMode === 'door_airport' || form.deliveryMode === 'door_door') && (
                  <div>
                    <Label>Collection address (for pickup from site)</Label>
                    <Textarea placeholder="Full address including postcode" value={form.collectionAddress} onChange={e => up('collectionAddress', e.target.value)} />
                    <div className="mt-2">
                      <Label>Extra pickup miles from nearest airport</Label>
                      <Input type="number" min="0" placeholder="0" value={form.extraPickupMiles} onChange={e => up('extraPickupMiles', e.target.value)} />
                      <p className="text-xs text-white/25 mt-1">Charged at {form.urgency === 'planned' ? '£3' : '£6.50'}/mile</p>
                    </div>
                  </div>
                )}
                {(form.deliveryMode === 'airport_door' || form.deliveryMode === 'door_door') && (
                  <div>
                    <Label>Delivery address (for final drop)</Label>
                    <Textarea placeholder="Full address including postcode" value={form.deliveryAddress} onChange={e => up('deliveryAddress', e.target.value)} />
                    <div className="mt-2">
                      <Label>Extra drop miles from destination airport</Label>
                      <Input type="number" min="0" placeholder="0" value={form.extraDropMiles} onChange={e => up('extraDropMiles', e.target.value)} />
                      <p className="text-xs text-white/25 mt-1">Charged at {form.urgency === 'planned' ? '£3' : '£6.50'}/mile</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <Label>Collection address / postcode *</Label>
                  <Textarea placeholder="Full address or postcode" value={form.collectionAddress} onChange={e => up('collectionAddress', e.target.value)} />
                </div>
                <div>
                  <Label>Delivery address / postcode *</Label>
                  <Textarea placeholder="Full address or postcode" value={form.deliveryAddress} onChange={e => up('deliveryAddress', e.target.value)} />
                </div>
                <div>
                  <Label>Total journey distance (miles)</Label>
                  <Input type="number" min="0" placeholder="Enter approx. miles" value={form.extraPickupMiles} onChange={e => up('extraPickupMiles', e.target.value)} />
                  <p className="text-xs text-white/25 mt-1">First 50 miles included. Extra miles charged at {form.urgency === 'planned' ? '£3' : '£6.50'}/mile.</p>
                </div>
              </>
            )}
          </div>
        </div>
      );

      // ── Step 5: Timing + add-ons ────────────────────────────────────────────
      case 5: return (
        <div>
          <SectionHead icon={Clock} title="Timing & urgency" sub="Urgency level directly affects pricing and operator allocation." />
          <div className="space-y-5">
            <div>
              <Label>Urgency level *</Label>
              <div className="grid grid-cols-1 gap-3">
                {(Object.keys(URGENCY_META) as UrgencyTier[]).map(u => {
                  const m   = URGENCY_META[u];
                  const sel = form.urgency === u;
                  const colors = { planned: 'text-emerald-400', priority: 'text-blue-400', critical: 'text-red-400' };
                  return (
                    <button
                      key={u}
                      type="button"
                      onClick={() => { up('urgency', u); setError(null); }}
                      className={`text-left p-4 rounded-2xl border transition-all flex items-center gap-4 ${sel ? `${accentSelBg} ${accentSelBd}` : `border-white/10 bg-white/3 ${accentCardH}`}`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${sel ? `${accentBorder}` : 'border-white/30'}`}>
                        {sel && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-white">{m.label}</p>
                          <span className={`text-xs font-bold ${colors[u]}`}>{m.time}</span>
                        </div>
                        <p className="text-white/35 text-xs mt-0.5">{m.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Collection date *</Label>
                <Input type="date" value={form.collectionDate} onChange={e => up('collectionDate', e.target.value)} />
              </div>
              <div>
                <Label>Collection time</Label>
                <Input type="time" value={form.collectionTime} onChange={e => up('collectionTime', e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Must arrive by</Label>
              <Input type="date" value={form.mustArriveBy} onChange={e => up('mustArriveBy', e.target.value)} />
            </div>

            <div>
              <Label>Service add-ons</Label>
              <div className="grid grid-cols-1 gap-2">
                <Toggle checked={form.immediateDispatch} onChange={v => up('immediateDispatch', v)} label="Immediate dispatch +£200" sub="Operator assigned within 30 minutes of confirmation" />
                <Toggle checked={form.nightService} onChange={v => up('nightService', v)} label="Night service +£200" sub="Collection or delivery between 22:00 and 06:00" />
                <Toggle checked={form.weekend} onChange={v => up('weekend', v)} label="Weekend service +20%" sub="Saturday or Sunday collection / delivery" />
                <Toggle checked={form.dedicatedDriver} onChange={v => up('dedicatedDriver', v)} label="Dedicated driver +£300" sub="Single operator handles full journey, no relay" />
              </div>
            </div>

            {isIntl && (
              <div>
                <Label>Airport services</Label>
                <div className="grid grid-cols-1 gap-2">
                  <Toggle checked={form.meetGreetOrigin} onChange={v => up('meetGreetOrigin', v)} label="Meet & greet at origin airport +£175" sub="Our operator meets you / collects at departures" />
                  <Toggle checked={form.meetGreetDest} onChange={v => up('meetGreetDest', v)} label="Meet & greet at destination airport +£175" sub="Our operator receives and forwards at arrivals" />
                </div>
              </div>
            )}
          </div>
        </div>
      );

      // ── Step 6: Contacts ────────────────────────────────────────────────────
      case 6: return (
        <div>
          <SectionHead icon={Users} title="Contact details" sub="Both sides must be reachable. This prevents delays and failed handovers." />
          <div className="space-y-6">
            {/* Sender */}
            <div>
              <p className="text-xs font-black text-white/50 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white text-xs">S</span>
                Sending side
              </p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Company name</Label>
                    <Input placeholder="Company" value={form.senderCompany} onChange={e => up('senderCompany', e.target.value)} />
                  </div>
                  <div>
                    <Label>Contact name *</Label>
                    <Input placeholder="Full name" value={form.senderName} onChange={e => up('senderName', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Phone *</Label>
                    <Input type="tel" placeholder="+44…" value={form.senderPhone} onChange={e => up('senderPhone', e.target.value)} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" placeholder="sender@company.com" value={form.senderEmail} onChange={e => up('senderEmail', e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Site address / access instructions</Label>
                  <Textarea placeholder="Address, gate code, floor, etc." value={form.senderInstructions} onChange={e => up('senderInstructions', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="border-t border-white/8" />

            {/* Receiver */}
            <div>
              <p className="text-xs font-black text-white/50 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white text-xs">R</span>
                Receiving side
              </p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Company name</Label>
                    <Input placeholder="Company" value={form.receiverCompany} onChange={e => up('receiverCompany', e.target.value)} />
                  </div>
                  <div>
                    <Label>Contact name *</Label>
                    <Input placeholder="Full name" value={form.receiverName} onChange={e => up('receiverName', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Phone *</Label>
                    <Input type="tel" placeholder="+44…" value={form.receiverPhone} onChange={e => up('receiverPhone', e.target.value)} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" placeholder="receiver@company.com" value={form.receiverEmail} onChange={e => up('receiverEmail', e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Delivery address / receiving instructions</Label>
                  <Textarea placeholder="Address, dock number, access hours, etc." value={form.receiverInstructions} onChange={e => up('receiverInstructions', e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </div>
      );

      // ── Step 7: Customs (international only) ────────────────────────────────
      case 7: return (
        <div>
          <SectionHead icon={Shield} title="Customs & border responsibility" sub="Required for all cross-border shipments. This is a hard stop." />
          <div className="space-y-3">
            {[
              { key: 'customsAccepted',   label: 'Customs clearance is the responsibility of the customer or receiver' },
              { key: 'taxesAccepted',     label: 'All duties, taxes, import fees, and brokerage charges are payable by sender/receiver' },
              { key: 'legalityAccepted',  label: 'All goods are legal to transport on this route under UK and destination country law' },
              { key: 'paperworkAccepted', label: 'All paperwork submitted is accurate, complete, and legally compliant' },
              { key: 'delaysAccepted',    label: 'Delays caused by customs, incorrect paperwork, or destination regulations are outside BootHop\'s control' },
            ].map(({ key, label }) => (
              <Toggle
                key={key}
                checked={form[key as keyof Form] as boolean}
                onChange={v => up(key as keyof Form, v)}
                label={label}
              />
            ))}

            <div className="mt-2">
              <Label>Who handles customs clearance? *</Label>
              <Select value={form.customsHandledBy} onChange={e => up('customsHandledBy', e.target.value)}>
                <option value="">Select…</option>
                <option value="sender" className="bg-[#0d1117]">Sender</option>
                <option value="receiver" className="bg-[#0d1117]">Receiver</option>
                <option value="broker" className="bg-[#0d1117]">Appointed broker</option>
              </Select>
            </div>

            {form.customsHandledBy === 'broker' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Broker name</Label>
                  <Input placeholder="Full name" value={form.brokerName} onChange={e => up('brokerName', e.target.value)} />
                </div>
                <div>
                  <Label>Broker phone</Label>
                  <Input type="tel" placeholder="+44…" value={form.brokerPhone} onChange={e => up('brokerPhone', e.target.value)} />
                </div>
              </div>
            )}

            <div className="p-4 bg-white/3 border border-white/8 rounded-xl mt-2">
              <p className="text-xs text-white/30 leading-relaxed">
                BootHop operates as a logistics carrier only. We do not act as customs broker or provide customs advice.
                All declarations above form part of your binding agreement with BootHop.
              </p>
            </div>
          </div>
        </div>
      );

      // ── Step 8: Insurance ───────────────────────────────────────────────────
      case 8: return (
        <div>
          <SectionHead icon={Shield} title="Insurance & protection" sub="Standard cover up to £1,000 is included at no charge." />
          <div className="space-y-4">
            <div className="p-4 bg-white/3 border border-white/8 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-white/40" />
                <p className="text-sm font-bold text-white">Standard cover included</p>
              </div>
              <p className="text-xs text-white/35">Goods up to £1,000 declared value are covered at no additional charge.</p>
            </div>

            {parseFloat(form.declaredValue) > 1000 && (
              <div>
                <Toggle
                  checked={form.enhancedInsurance}
                  onChange={v => up('enhancedInsurance', v)}
                  label={`Enhanced cover — 5% of £${parseFloat(form.declaredValue).toLocaleString()} = £${Math.max(75, Math.round(parseFloat(form.declaredValue) * 0.05)).toLocaleString()}`}
                  sub="Minimum charge £75. Covers full declared value."
                />
                {form.enhancedInsurance && (
                  <div className="mt-3">
                    <Toggle
                      checked={form.insuranceConfirmed}
                      onChange={v => up('insuranceConfirmed', v)}
                      label={`I confirm the declared value of £${parseFloat(form.declaredValue).toLocaleString()} is accurate and supported by invoice or replacement value`}
                    />
                  </div>
                )}
              </div>
            )}

            {parseFloat(form.declaredValue) <= 1000 && (
              <div className="p-3 bg-white/3 border border-white/8 rounded-xl">
                <p className="text-xs text-white/35">Your declared value of £{form.declaredValue || '0'} is within the standard cover limit. No additional insurance required.</p>
              </div>
            )}

            <div className="mt-2 p-4 bg-white/3 border border-white/8 rounded-xl space-y-2 text-xs text-white/30">
              <p>BootHop's liability is limited to the declared insured value or £5,000 per consignment, whichever is lower.</p>
              <p>High-value or specialist items above £50,000 may require structured cover arranged separately. Contact us before booking.</p>
            </div>
          </div>
        </div>
      );

      // ── Step 9: Summary + terms ─────────────────────────────────────────────
      case 9: return (
        <div>
          <SectionHead icon={Zap} title="Review & confirm" sub="Check the summary, accept declarations, and submit your booking." />
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-white/3 border border-white/8 rounded-2xl p-5 space-y-3 text-sm">
              <SummaryRow label="Route" value={form.routeType ? ROUTE_META[form.routeType as RouteType].label : '—'} />
              {isIntl && <SummaryRow label="Mode" value={MODE_META[form.deliveryMode].label} />}
              <SummaryRow label="Item" value={form.itemDesc || '—'} />
              <SummaryRow label="Weight" value={form.weightKg ? `${form.weightKg} kg` : '—'} />
              <SummaryRow label="Declared value" value={form.declaredValue ? `£${parseFloat(form.declaredValue).toLocaleString()}` : '—'} />
              <SummaryRow label="Urgency" value={form.urgency ? URGENCY_META[form.urgency as UrgencyTier].label : '—'} />
              <SummaryRow label="Collection" value={[form.collectionDate, form.collectionTime].filter(Boolean).join(' ')} />
              <SummaryRow label="From" value={(isIntl ? form.originAirport : form.collectionAddress) || '—'} />
              <SummaryRow label="To"   value={(isIntl ? form.destAirport   : form.deliveryAddress)   || '—'} />
              <SummaryRow label="Sender contact" value={[form.senderName, form.senderPhone].filter(Boolean).join(' · ')} />
              <SummaryRow label="Receiver contact" value={[form.receiverName, form.receiverPhone].filter(Boolean).join(' · ')} />
              {quote && (
                <div className="pt-3 border-t border-white/10">
                  <div className="flex justify-between font-black text-base">
                    <span className="text-white">Estimated total</span>
                    <span className={accentText}>£{quote.total.toLocaleString()}</span>
                  </div>
                  {quote.reviewRequired && (
                    <p className="text-xs text-amber-400 mt-1">Subject to manual review — final price confirmed by our team</p>
                  )}
                </div>
              )}
            </div>

            {/* Final declarations */}
            <div>
              <Label>Final declarations</Label>
              <div className="space-y-2">
                <Toggle checked={form.termsAccepted} onChange={v => up('termsAccepted', v)} label="I agree to BootHop Terms & Conditions and the pricing rules applicable to this booking" />
                <Toggle checked={form.packagingConfirmed} onChange={v => up('packagingConfirmed', v)} label="The item is properly packaged for the journey type and distance" />
                <Toggle checked={form.detailsConfirmed} onChange={v => up('detailsConfirmed', v)} label="All route, contact, and item details provided are correct and complete" />
                <Toggle checked={form.extraChargesConfirmed} onChange={v => up('extraChargesConfirmed', v)} label="I understand re-delivery, waiting time, failed handover, or customs delays may incur additional charges" />
              </div>
            </div>

            {quote?.reviewRequired && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-400 mb-1">This booking will go to manual review</p>
                  <p className="text-xs text-white/40">Our team will assess and contact you within 2 business hours to confirm the booking and pricing before any payment is taken.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      );

      default: return null;
    }
  };

  const ds   = displayStep(step, form.routeType);
  const ts   = totalSteps(form.routeType);
  const pct  = Math.round((ds / ts) * 100);

  return (
    <div className="min-h-screen bg-[#080c10] px-4 py-8 lg:px-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={onCancel} className="flex items-center gap-2 text-white/30 hover:text-white text-sm font-semibold transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back to portal
          </button>
          {tier === 'priority' && (
            <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/25 px-3 py-1.5 rounded-full uppercase tracking-widest">
              <Star className="h-3 w-3" /> Priority Partner
            </span>
          )}
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-white/30 uppercase tracking-widest">Step {ds} of {ts}</p>
            <p className="text-xs text-white/20">{pct}% complete</p>
          </div>
          <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${accent === 'amber' ? 'bg-amber-400' : 'bg-emerald-400'}`}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 lg:gap-8 items-start">

          {/* Form column */}
          <div>
            <div className="bg-white/3 border border-white/8 rounded-2xl p-6 lg:p-8 min-h-[500px]">
              <AnimatePresence mode="wait">
                <motion.div key={step} {...FADE} transition={{ duration: 0.25 }}>
                  {renderStep()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Error */}
            {error && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
              >
                <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </motion.div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 mt-5">
              {step > 1 && (
                <button
                  onClick={back}
                  className="flex items-center gap-2 text-sm font-semibold text-white/40 hover:text-white bg-white/5 border border-white/10 hover:border-white/20 px-5 py-3 rounded-xl transition-all"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
              )}
              <button
                onClick={advance}
                disabled={submitting}
                className={`flex-1 flex items-center justify-center gap-2 text-sm font-black text-black ${accentBg} ${accentHover} px-6 py-3 rounded-xl transition-all disabled:opacity-50`}
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                ) : step === 9 ? (
                  quote?.reviewRequired
                    ? <><Star className="h-4 w-4" /> Submit for review</>
                    : <><CheckCircle className="h-4 w-4" /> Confirm booking</>
                ) : (
                  <>Continue <ChevronRight className="h-4 w-4" /></>
                )}
              </button>
            </div>
          </div>

          {/* Quote panel */}
          <QuotePanel quote={quote} form={form} accent={accent} />
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function SummaryRow({ label, value }: { label: string; value: string }) {
  if (!value || value === '—') return null;
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-white/35 flex-shrink-0">{label}</span>
      <span className="text-white text-right">{value}</span>
    </div>
  );
}
