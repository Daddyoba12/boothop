'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Loader2, AlertCircle, AlertTriangle,
  CheckCircle, MapPin, Package, Clock, Users, Shield,
  Plane, Globe, Truck, Zap, Star, Info, Phone, Mail,
  CreditCard, X, RotateCcw,
} from 'lucide-react';
import {
  calculateQuote, RouteType, DeliveryMode, UrgencyTier,
  ROUTE_META, MODE_META, URGENCY_META, CATEGORIES, QuoteBreakdown,
} from '@/lib/business/pricing';
import { AirportInput } from '@/components/business/AirportInput';
import { PlacesInput } from '@/components/ui/PlacesInput';

// ── Types ─────────────────────────────────────────────────────────────────────

export type WizardTier = 'standard' | 'priority';

export interface WizardProps {
  tier:        WizardTier;
  bizEmail:    string;
  companyName: string;
  onSuccess:   (jobRef: string, isPaid: boolean) => void;
  onCancel:    () => void;
}

interface Form {
  // Step 1
  routeType:             RouteType | '';
  // Step 2
  deliveryMode:          DeliveryMode;
  // Step 3 — Goods
  itemDesc:              string;
  category:              string;
  quantity:              string;
  weightKg:              string;
  declaredValue:         string;
  fragile:               boolean;
  specialHandling:       boolean;
  dangerousGoods:        boolean;
  // Exception handling (doc section 5E)
  batteryPowered:        boolean;
  containsLiquid:        boolean;
  exportControlled:      boolean;
  temperatureSensitive:  boolean;
  noXray:                boolean;
  // Step 4 — Addresses
  collectionAddress:     string;
  deliveryAddress:       string;
  originAirport:         string;
  destAirport:           string;
  extraPickupMiles:      string;
  extraDropMiles:        string;
  // Step 5 — Timing
  urgency:               UrgencyTier | '';
  collectionDate:        string;
  collectionTime:        string;
  mustArriveBy:          string;
  nightService:          boolean;
  weekend:               boolean;
  immediateDispatch:     boolean;
  dedicatedDriver:       boolean;
  // Step 6 — Contacts
  senderCompany:         string;
  senderName:            string;
  senderPhone:           string;
  senderEmail:           string;
  senderAddress:         string;
  senderInstructions:    string;
  receiverCompany:       string;
  receiverName:          string;
  receiverPhone:         string;
  receiverEmail:         string;
  receiverAddress:       string;
  receiverInstructions:  string;
  // Step 7 — Customs
  customsAccepted:       boolean;
  taxesAccepted:         boolean;
  legalityAccepted:      boolean;
  paperworkAccepted:     boolean;
  delaysAccepted:        boolean;
  customsHandledBy:      'sender' | 'receiver' | 'broker' | '';
  brokerName:            string;
  brokerPhone:           string;
  // Step 8 — Insurance
  enhancedInsurance:     boolean;
  meetGreetOrigin:       boolean;
  meetGreetDest:         boolean;
  insuranceConfirmed:    boolean;
  // Step 9 — Terms
  termsAccepted:         boolean;
  packagingConfirmed:    boolean;
  detailsConfirmed:      boolean;
  extraChargesConfirmed: boolean;
}

const EMPTY_FORM: Form = {
  routeType: '', deliveryMode: 'airport_airport',
  itemDesc: '', category: '', quantity: '1', weightKg: '', declaredValue: '',
  fragile: false, specialHandling: false, dangerousGoods: false,
  batteryPowered: false, containsLiquid: false, exportControlled: false,
  temperatureSensitive: false, noXray: false,
  collectionAddress: '', deliveryAddress: '', originAirport: '', destAirport: '',
  extraPickupMiles: '0', extraDropMiles: '0',
  urgency: '', collectionDate: '', collectionTime: '', mustArriveBy: '',
  nightService: false, weekend: false, immediateDispatch: false, dedicatedDriver: false,
  senderCompany: '', senderName: '', senderPhone: '', senderEmail: '',
  senderAddress: '', senderInstructions: '',
  receiverCompany: '', receiverName: '', receiverPhone: '',
  receiverEmail: '', receiverAddress: '', receiverInstructions: '',
  customsAccepted: false, taxesAccepted: false, legalityAccepted: false,
  paperworkAccepted: false, delaysAccepted: false,
  customsHandledBy: '', brokerName: '', brokerPhone: '',
  enhancedInsurance: false, meetGreetOrigin: false, meetGreetDest: false, insuranceConfirmed: false,
  termsAccepted: false, packagingConfirmed: false, detailsConfirmed: false, extraChargesConfirmed: false,
};

const DRAFT_KEY = 'boothop_biz_quote_draft';
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ── Step helpers ──────────────────────────────────────────────────────────────

function nextStep(s: number, rt: RouteType | ''): number {
  if (s === 1 && rt === 'uk_uk') return 3;
  if (s === 6 && rt === 'uk_uk') return 8;
  return s + 1;
}
function prevStep(s: number, rt: RouteType | ''): number {
  if (s === 3 && rt === 'uk_uk') return 1;
  if (s === 8 && rt === 'uk_uk') return 6;
  return s - 1;
}
function displayStep(s: number, rt: RouteType | ''): number {
  if (rt !== 'uk_uk') return s;
  if (s >= 3 && s <= 6) return s - 1;
  if (s >= 7)           return s - 2;
  return s;
}
function totalSteps(rt: RouteType | ''): number { return rt === 'uk_uk' ? 7 : 9; }

// ── Shared UI atoms ───────────────────────────────────────────────────────────

const FADE = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 } };

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5">{children}</p>;
}
function Input({ ...p }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors ${p.className ?? ''}`} />;
}
function Textarea({ ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...p} rows={p.rows ?? 2} className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors resize-none ${p.className ?? ''}`} />;
}
function Select({ children, ...p }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select {...p} className={`w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 transition-colors ${p.className ?? ''}`}>
      {children}
    </select>
  );
}
function Toggle({ checked, onChange, label, sub, danger }: { checked: boolean; onChange: (v: boolean) => void; label: string; sub?: string; danger?: boolean }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`flex items-start gap-3 w-full text-left p-3 rounded-xl border transition-all ${checked ? 'border-white/20 bg-white/5' : 'border-white/8 hover:border-white/15'}`}
    >
      <div className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${checked ? 'bg-white border-white' : 'border-white/30'}`}>
        {checked && <div className="w-2 h-2 bg-black rounded-sm" />}
      </div>
      <div>
        <p className={`text-sm font-medium ${danger && checked ? 'text-red-400' : 'text-white'}`}>{label}</p>
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
function SummaryRow({ label, value }: { label: string; value: string }) {
  if (!value || value === '—') return null;
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-white/35 flex-shrink-0">{label}</span>
      <span className="text-white text-right">{value}</span>
    </div>
  );
}

// ── Quote Panel ───────────────────────────────────────────────────────────────

function QuotePanel({ quote, form, accent }: { quote: QuoteBreakdown | null; form: Form; accent: string }) {
  const fmt       = (n: number) => n > 0 ? `£${n.toLocaleString()}` : '—';
  const accentText = accent === 'amber' ? 'text-amber-400'    : 'text-emerald-400';

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
              <span className="text-white/50">Base ({ROUTE_META[form.routeType as RouteType]?.label})</span>
              <span className="text-white font-semibold">{fmt(quote.base)}</span>
            </div>
            {quote.pickupExtra > 0 && <div className="flex justify-between"><span className="text-white/50">Pickup mileage</span><span className="text-white">{fmt(quote.pickupExtra)}</span></div>}
            {quote.dropExtra   > 0 && <div className="flex justify-between"><span className="text-white/50">Drop mileage</span><span className="text-white">{fmt(quote.dropExtra)}</span></div>}
            {quote.handlingFee > 0 && <div className="flex justify-between"><span className="text-white/50">Airport handling</span><span className="text-white">{fmt(quote.handlingFee)}</span></div>}
            {quote.insuranceFee> 0 && <div className="flex justify-between"><span className="text-white/50">Enhanced insurance</span><span className="text-white">{fmt(quote.insuranceFee)}</span></div>}
            {quote.addons      > 0 && <div className="flex justify-between"><span className="text-white/50">Add-ons</span><span className="text-white">{fmt(quote.addons)}</span></div>}
            {quote.weekendSurcharge > 0 && <div className="flex justify-between"><span className="text-white/50">Weekend (+20%)</span><span className="text-white">{fmt(quote.weekendSurcharge)}</span></div>}
          </div>
          <div className="border-t border-white/10 pt-4 flex justify-between items-baseline">
            <span className="text-white/50 text-sm">Estimated total</span>
            <span className={`${accentText} font-black text-2xl`}>£{quote.total.toLocaleString()}</span>
          </div>
          {quote.reviewRequired && (
            <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-400 mb-1">Manual review required</p>
                {quote.reviewReasons.map((r, i) => <p key={i} className="text-xs text-white/40">{r}</p>)}
              </div>
            </div>
          )}
          <p className="text-xs text-white/20 mt-4 pt-4 border-t border-white/8 leading-relaxed">
            Estimate only. Final price confirmed on operator assignment. VAT not included.
          </p>
        </>
      )}

      <div className="mt-6 space-y-2">
        {['Verified operator assigned', 'Direct point-to-point', 'Real-time coordination'].map(item => (
          <div key={item} className="flex items-center gap-2 text-xs text-white/30">
            <CheckCircle className="h-3.5 w-3.5 text-white/20 flex-shrink-0" />{item}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Dangerous goods modal ─────────────────────────────────────────────────────

function DangerousGoodsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md bg-[#0d1117] border border-red-500/30 rounded-2xl p-8 shadow-2xl text-center"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors">
          <X className="h-5 w-5" />
        </button>
        <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>
        <h3 className="text-xl font-black text-white mb-2">Dangerous goods — contact us immediately</h3>
        <p className="text-white/40 text-sm leading-relaxed mb-6">
          We cannot accept dangerous goods through the standard booking portal.
          Your consignment requires manual assessment before we can accept it.
          Please contact our team directly so we can advise.
        </p>
        <div className="space-y-3">
          <a href="mailto:support@boothop.com"
            className="flex items-center justify-center gap-2 w-full bg-red-500/10 border border-red-500/25 text-red-400 font-bold text-sm px-4 py-3 rounded-xl hover:bg-red-500/20 transition-all"
          >
            <Mail className="h-4 w-4" /> support@boothop.com
          </a>
          <a href="/api/whatsapp"
            className="flex items-center justify-center gap-2 w-full bg-[#25D366]/10 border border-[#25D366]/25 text-[#25D366] font-bold text-sm px-4 py-3 rounded-xl hover:bg-[#25D366]/20 transition-all"
          >
            <Phone className="h-4 w-4" /> Contact via WhatsApp
          </a>
        </div>
        <p className="text-white/20 text-xs mt-4">
          Do not attempt to ship dangerous goods without prior written approval from BootHop.
        </p>
      </motion.div>
    </div>
  );
}

// ── Main wizard ───────────────────────────────────────────────────────────────

export function BusinessBookingWizard({ tier, bizEmail, companyName, onSuccess, onCancel }: WizardProps) {
  const accent      = tier === 'priority' ? 'amber'   : 'emerald';
  const accentText  = accent === 'amber'  ? 'text-amber-400'     : 'text-emerald-400';
  const accentBg    = accent === 'amber'  ? 'bg-amber-400'       : 'bg-emerald-400';
  const accentHover = accent === 'amber'  ? 'hover:bg-amber-300' : 'hover:bg-emerald-300';
  const accentBorder= accent === 'amber'  ? 'border-amber-500'   : 'border-emerald-500';
  const accentSelBg = accent === 'amber'  ? 'bg-amber-500/10'    : 'bg-emerald-500/10';
  const accentSelBd = accent === 'amber'  ? 'border-amber-500/60': 'border-emerald-500/60';
  const accentCardH = accent === 'amber'  ? 'hover:border-amber-500/30 hover:bg-amber-500/5' : 'hover:border-emerald-500/30 hover:bg-emerald-500/5';

  const [step,              setStep]              = useState(1);
  const [form,              setForm]              = useState<Form>(() => ({
    ...EMPTY_FORM,
    urgency:       tier === 'priority' ? 'priority' : '',
    senderCompany: companyName,
    senderEmail:   bizEmail,
  }));
  const [submitting,        setSubmitting]        = useState(false);
  const [error,             setError]             = useState<string | null>(null);
  const [showDangerModal,   setShowDangerModal]   = useState(false);
  const [savedDraftStep,    setSavedDraftStep]    = useState<number | null>(null);
  const [showDraftBanner,   setShowDraftBanner]   = useState(false);
  const draftSavedRef = useRef(false);

  const up = (key: keyof Form, val: unknown) => setForm(f => ({ ...f, [key]: val }));

  const quote = useMemo<QuoteBreakdown | null>(() => {
    if (!form.routeType || !form.urgency) return null;
    return calculateQuote({
      routeType:         form.routeType   as RouteType,
      deliveryMode:      form.deliveryMode,
      urgency:           form.urgency     as UrgencyTier,
      extraPickupMiles:  parseFloat(form.extraPickupMiles) || 0,
      extraDropMiles:    parseFloat(form.extraDropMiles)   || 0,
      weightKg:          parseFloat(form.weightKg)         || 0,
      declaredValue:     parseFloat(form.declaredValue)    || 0,
      enhancedInsurance: form.enhancedInsurance,
      nightService:      form.nightService,
      weekend:           form.weekend,
      dedicatedDriver:   form.dedicatedDriver,
      immediateDispatch: form.immediateDispatch,
      meetGreetOrigin:   form.meetGreetOrigin,
      meetGreetDest:     form.meetGreetDest,
    });
  }, [form]);

  const isIntl         = form.routeType !== 'uk_uk' && form.routeType !== '';
  const hasExceptions  = form.batteryPowered || form.containsLiquid || form.exportControlled || form.temperatureSensitive || form.noXray;
  const reviewRequired = (quote?.reviewRequired ?? false) || hasExceptions;

  // ── Saved quote: restore on mount ─────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const { form: savedForm, step: savedStep, savedAt } = JSON.parse(raw);
      if (Date.now() - savedAt > DRAFT_TTL_MS) { localStorage.removeItem(DRAFT_KEY); return; }
      if (savedForm?.routeType) {
        setSavedDraftStep(savedStep);
        setShowDraftBanner(true);
      }
    } catch { /* ignore */ }
  }, []);

  // ── Saved quote: persist on change ───────────────────────────────────────
  useEffect(() => {
    if (!draftSavedRef.current && step === 1 && !form.routeType) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, step, savedAt: Date.now() }));
    } catch { /* ignore */ }
  }, [form, step]);

  const resumeDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const { form: savedForm, step: savedStep } = JSON.parse(raw);
      setForm({ ...EMPTY_FORM, ...savedForm, senderCompany: savedForm.senderCompany || companyName, senderEmail: savedForm.senderEmail || bizEmail });
      setStep(savedStep || 1);
    } catch { /* ignore */ }
    setShowDraftBanner(false);
    draftSavedRef.current = true;
  };

  const dismissDraft = () => { localStorage.removeItem(DRAFT_KEY); setShowDraftBanner(false); };

  // ── Validation ────────────────────────────────────────────────────────────
  function validate(): string | null {
    switch (step) {
      case 1: if (!form.routeType) return 'Please select a service route.'; break;
      case 2: if (!form.deliveryMode) return 'Please select a delivery mode.'; break;
      case 3:
        if (!form.itemDesc.trim())  return 'Item description is required.';
        if (!form.weightKg)         return 'Weight is required.';
        if (!form.declaredValue)    return 'Declared value is required.';
        break;
      case 4:
        if (isIntl) {
          if (!form.originAirport.trim()) return 'Origin airport is required.';
          if (!form.destAirport.trim())   return 'Destination airport is required.';
        } else {
          if (!form.collectionAddress.trim()) return 'Collection address is required.';
          if (!form.deliveryAddress.trim())   return 'Delivery address is required.';
        }
        break;
      case 5:
        if (!form.urgency)          return 'Please select urgency level.';
        if (!form.collectionDate)   return 'Collection date is required.';
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
        if (!form.customsHandledBy) return 'Please confirm who handles customs clearance.';
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

  // ── Navigation ────────────────────────────────────────────────────────────
  const advance = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    if (step === 9) { handleSubmit(); return; }
    setStep(s => nextStep(s, form.routeType));
  };
  const back = () => { setError(null); setStep(s => prevStep(s, form.routeType)); };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    // Dangerous goods → contact us, NO submission
    if (form.dangerousGoods) { setShowDangerModal(true); return; }

    setSubmitting(true);
    setError(null);

    const payload = {
      route_type: form.routeType, delivery_mode: form.deliveryMode,
      company_name: form.senderCompany, phone: form.senderPhone,
      pickup:  isIntl ? form.originAirport   : form.collectionAddress,
      dropoff: isIntl ? form.destAirport      : form.deliveryAddress,
      description: form.itemDesc, category: form.category,
      weight: form.weightKg, value: form.declaredValue,
      urgency: form.urgency, urgency_tier: form.urgency,
      delivery_type: form.routeType === 'uk_uk' ? 'local_uk' : 'international',
      delivery_date: form.collectionDate, expected_delivery_date: form.mustArriveBy,
      insurance: form.enhancedInsurance, insurance_fee: quote?.insuranceFee ?? 0,
      price: quote?.total ?? 0, total: quote?.total ?? 0,
      fragile: form.fragile, dangerous_goods: false,
      review_required: reviewRequired,
      night_service: form.nightService, weekend: form.weekend,
      dedicated_driver: form.dedicatedDriver, immediate_dispatch: form.immediateDispatch,
      meet_greet_origin: form.meetGreetOrigin, meet_greet_dest: form.meetGreetDest,
      sender_name: form.senderName, sender_email: form.senderEmail,
      receiver_company: form.receiverCompany, receiver_name: form.receiverName,
      receiver_phone: form.receiverPhone, receiver_email: form.receiverEmail,
      receiver_address: form.receiverAddress, customs_handled_by: form.customsHandledBy || null,
      extra_pickup_miles: form.extraPickupMiles, extra_drop_miles: form.extraDropMiles,
      is_priority: tier === 'priority',
      routeLabel: form.routeType ? ROUTE_META[form.routeType as RouteType].label : '',
      urgencyLabel: form.urgency ? URGENCY_META[form.urgency as UrgencyTier].label : '',
      metadata: {
        senderAddress: form.senderAddress, senderInstructions: form.senderInstructions,
        receiverInstructions: form.receiverInstructions, collectionTime: form.collectionTime,
        brokerName: form.brokerName, brokerPhone: form.brokerPhone,
        batteryPowered: form.batteryPowered, containsLiquid: form.containsLiquid,
        exportControlled: form.exportControlled, temperatureSensitive: form.temperatureSensitive,
        noXray: form.noXray,
      },
    };

    try {
      // ── Manual review path (weight > 20kg, export controlled, etc.) ──────
      if (reviewRequired) {
        const res = await fetch('/api/business/create-job', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const j = await res.json();
        if (!res.ok) { setError(j.error || 'Submission failed.'); setSubmitting(false); return; }
        localStorage.removeItem(DRAFT_KEY);
        onSuccess(j.jobRef, false);
        return;
      }

      // ── Standard path: Stripe checkout ───────────────────────────────────
      const res = await fetch('/api/business/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error || 'Payment setup failed.'); setSubmitting(false); return; }

      localStorage.removeItem(DRAFT_KEY);
      // Redirect to Stripe checkout
      window.location.href = j.checkoutUrl;
    } catch {
      setError('Network error. Please try again.');
      setSubmitting(false);
    }
  };

  // ── Step renders ──────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (step) {

      case 1: return (
        <div>
          <SectionHead icon={Globe} title="Select your route" sub="Choose the service lane that matches your delivery." />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.keys(ROUTE_META) as RouteType[]).map(rt => {
              const m = ROUTE_META[rt]; const sel = form.routeType === rt;
              return (
                <button key={rt} type="button" onClick={() => { up('routeType', rt); setError(null); }}
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

      case 2: return (
        <div>
          <SectionHead icon={Plane} title="Delivery mode" sub="How should we handle each end of the journey?" />
          <div className="grid grid-cols-1 gap-3 mb-4">
            {(Object.keys(MODE_META) as DeliveryMode[]).map(m => {
              const meta = MODE_META[m]; const sel = form.deliveryMode === m;
              return (
                <button key={m} type="button" onClick={() => { up('deliveryMode', m); setError(null); }}
                  className={`text-left p-4 rounded-2xl border transition-all flex items-start gap-4 ${sel ? `${accentSelBg} ${accentSelBd}` : `border-white/10 bg-white/3 ${accentCardH}`}`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${sel ? accentBorder : 'border-white/30'}`}>
                    {sel && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white">{meta.label}</p>
                      {meta.recommended && <span className="text-xs bg-white/10 text-white/50 px-2 py-0.5 rounded-full font-semibold">Recommended</span>}
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
              Airport-to-airport is fastest for international routes. Collection or final delivery beyond the airport is charged per mile.
            </p>
          </div>
        </div>
      );

      case 3: return (
        <div>
          <SectionHead icon={Package} title="Item details" sub="Accurate details ensure correct pricing and safe handling." />
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
                  <p className="text-xs text-amber-400 mt-1.5 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Above 20 kg — manual review</p>
                )}
              </div>
              <div>
                <Label>Declared value (GBP) *</Label>
                <Input type="number" min="0" placeholder="0" value={form.declaredValue} onChange={e => up('declaredValue', e.target.value)} />
              </div>
            </div>

            {/* Item characteristics */}
            <div>
              <Label>Item characteristics</Label>
              <div className="grid grid-cols-1 gap-2">
                <Toggle checked={form.fragile} onChange={v => up('fragile', v)} label="Fragile — requires careful handling" />
                <Toggle checked={form.specialHandling} onChange={v => up('specialHandling', v)} label="Special handling required" sub="e.g. temperature sensitive, orientation specific" />
                <Toggle checked={form.dangerousGoods} onChange={v => up('dangerousGoods', v)} label="Contains dangerous goods" sub="Batteries, chemicals, pressurised items, flammables, etc." danger />
              </div>
              {form.dangerousGoods && (
                <div className="mt-3 p-4 bg-red-500/10 border border-red-500/25 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-400 mb-1">Dangerous goods — do not proceed</p>
                    <p className="text-xs text-white/40">You must contact us before attempting to book. Proceed to step 9 to see our contact details, or use the WhatsApp button below.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Exception handling — doc section 5E */}
            <div>
              <Label>Shipment risk flags</Label>
              <p className="text-xs text-white/25 mb-3">Answer accurately — any flagged item routes the booking to manual review before confirmation.</p>
              <div className="grid grid-cols-1 gap-2">
                <Toggle checked={form.batteryPowered}       onChange={v => up('batteryPowered', v)}       label="Item is battery-powered or contains batteries" />
                <Toggle checked={form.containsLiquid}       onChange={v => up('containsLiquid', v)}       label="Contains liquid" />
                <Toggle checked={form.exportControlled}     onChange={v => up('exportControlled', v)}     label="Export controlled or dual-use goods" sub="ITAR, EAR, UK Export Control" />
                <Toggle checked={form.temperatureSensitive} onChange={v => up('temperatureSensitive', v)} label="Temperature sensitive" sub="Cold chain, refrigerated, or heat-sensitive items" />
                <Toggle checked={form.noXray}               onChange={v => up('noXray', v)}               label="Cannot go through X-ray security" />
              </div>
              {hasExceptions && (
                <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-400/80">One or more risk flags require manual review. Your booking will be assessed by our team before confirmation — no payment until approved.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );

      case 4: return (
        <div>
          <SectionHead icon={MapPin} title="Route details" sub={isIntl ? 'Select airports and add any extra collection or delivery address.' : 'Enter exact collection and delivery addresses.'} />
          <div className="space-y-4">
            {isIntl ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <AirportInput
                    label="Origin airport *"
                    value={form.originAirport}
                    onSelect={(display) => up('originAirport', display)}
                    onClear={() => up('originAirport', '')}
                    disabledIata={form.destAirport ? form.destAirport.match(/\(([A-Z]{3})\)/)?.[1] : undefined}
                    placeholder="Search city or IATA code…"
                  />
                  <AirportInput
                    label="Destination airport *"
                    value={form.destAirport}
                    onSelect={(display) => up('destAirport', display)}
                    onClear={() => up('destAirport', '')}
                    disabledIata={form.originAirport ? form.originAirport.match(/\(([A-Z]{3})\)/)?.[1] : undefined}
                    placeholder="Search city or IATA code…"
                  />
                </div>
                <div className="p-3 bg-white/3 border border-white/8 rounded-xl flex items-start gap-2">
                  <Info className="h-4 w-4 text-white/25 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-white/30">Airport-to-airport is included in the base price. Extra collection or delivery beyond the airport is charged per mile.</p>
                </div>
                {(form.deliveryMode === 'door_airport' || form.deliveryMode === 'door_door') && (
                  <div className="space-y-3">
                    <PlacesInput
                      label="Collection address"
                      value={form.collectionAddress}
                      onChange={v => up('collectionAddress', v)}
                      placeholder="Full address including postcode"
                    />
                    <div>
                      <Label>Extra pickup miles from nearest airport</Label>
                      <Input type="number" min="0" placeholder="0" value={form.extraPickupMiles} onChange={e => up('extraPickupMiles', e.target.value)} />
                      <p className="text-xs text-white/25 mt-1">Charged at {form.urgency === 'planned' ? '£3' : '£6.50'}/mile</p>
                    </div>
                  </div>
                )}
                {(form.deliveryMode === 'airport_door' || form.deliveryMode === 'door_door') && (
                  <div className="space-y-3">
                    <PlacesInput
                      label="Final delivery address"
                      value={form.deliveryAddress}
                      onChange={v => up('deliveryAddress', v)}
                      placeholder="Full address including postcode"
                    />
                    <div>
                      <Label>Extra drop miles from destination airport</Label>
                      <Input type="number" min="0" placeholder="0" value={form.extraDropMiles} onChange={e => up('extraDropMiles', e.target.value)} />
                      <p className="text-xs text-white/25 mt-1">Charged at {form.urgency === 'planned' ? '£3' : '£6.50'}/mile</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <PlacesInput
                  label="Collection address / postcode *"
                  value={form.collectionAddress}
                  onChange={v => up('collectionAddress', v)}
                  placeholder="Start typing address or postcode…"
                />
                <PlacesInput
                  label="Delivery address / postcode *"
                  value={form.deliveryAddress}
                  onChange={v => up('deliveryAddress', v)}
                  placeholder="Start typing address or postcode…"
                />
                <div>
                  <Label>Total journey distance (miles)</Label>
                  <Input type="number" min="0" placeholder="Enter approx. miles" value={form.extraPickupMiles} onChange={e => up('extraPickupMiles', e.target.value)} />
                  <p className="text-xs text-white/25 mt-1">First 50 miles included. Extra miles: {form.urgency === 'planned' ? '£3' : '£6.50'}/mile.</p>
                </div>
              </>
            )}
          </div>
        </div>
      );

      case 5: return (
        <div>
          <SectionHead icon={Clock} title="Timing & urgency" sub="Urgency level directly affects pricing and operator allocation." />
          <div className="space-y-5">
            <div>
              <Label>Urgency level *</Label>
              <div className="grid grid-cols-1 gap-3">
                {(Object.keys(URGENCY_META) as UrgencyTier[]).map(u => {
                  const m = URGENCY_META[u]; const sel = form.urgency === u;
                  const colors = { planned: 'text-emerald-400', priority: 'text-blue-400', critical: 'text-red-400' };
                  return (
                    <button key={u} type="button" onClick={() => { up('urgency', u); setError(null); }}
                      className={`text-left p-4 rounded-2xl border transition-all flex items-center gap-4 ${sel ? `${accentSelBg} ${accentSelBd}` : `border-white/10 bg-white/3 ${accentCardH}`}`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${sel ? accentBorder : 'border-white/30'}`}>
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
                <Toggle checked={form.nightService}      onChange={v => up('nightService', v)}      label="Night service +£200"       sub="Collection or delivery between 22:00 and 06:00" />
                <Toggle checked={form.weekend}           onChange={v => up('weekend', v)}           label="Weekend service +20%"      sub="Saturday or Sunday collection / delivery" />
                <Toggle checked={form.dedicatedDriver}   onChange={v => up('dedicatedDriver', v)}   label="Dedicated driver +£300"    sub="Single operator handles full journey, no relay" />
              </div>
            </div>
            {isIntl && (
              <div>
                <Label>Airport services</Label>
                <div className="grid grid-cols-1 gap-2">
                  <Toggle checked={form.meetGreetOrigin} onChange={v => up('meetGreetOrigin', v)} label="Meet & greet at origin airport +£175" sub="Our operator meets you / collects at departures" />
                  <Toggle checked={form.meetGreetDest}   onChange={v => up('meetGreetDest', v)}   label="Meet & greet at destination +£175"   sub="Our operator receives and forwards at arrivals" />
                </div>
              </div>
            )}
          </div>
        </div>
      );

      case 6: return (
        <div>
          <SectionHead icon={Users} title="Contact details" sub="Both sides must be reachable. Missing contacts cause failed handovers." />
          <div className="space-y-6">
            <div>
              <p className="text-xs font-black text-white/50 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white text-xs">S</span>
                Sending side
              </p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Company name</Label><Input placeholder="Company" value={form.senderCompany} onChange={e => up('senderCompany', e.target.value)} /></div>
                  <div><Label>Contact name *</Label><Input placeholder="Full name" value={form.senderName} onChange={e => up('senderName', e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Phone *</Label><Input type="tel" placeholder="+44…" value={form.senderPhone} onChange={e => up('senderPhone', e.target.value)} /></div>
                  <div><Label>Email</Label><Input type="email" placeholder="sender@company.com" value={form.senderEmail} onChange={e => up('senderEmail', e.target.value)} /></div>
                </div>
                <div><Label>Site address / access instructions</Label><Textarea placeholder="Address, gate code, floor, etc." value={form.senderInstructions} onChange={e => up('senderInstructions', e.target.value)} /></div>
              </div>
            </div>
            <div className="border-t border-white/8" />
            <div>
              <p className="text-xs font-black text-white/50 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white text-xs">R</span>
                Receiving side
              </p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Company name</Label><Input placeholder="Company" value={form.receiverCompany} onChange={e => up('receiverCompany', e.target.value)} /></div>
                  <div><Label>Contact name *</Label><Input placeholder="Full name" value={form.receiverName} onChange={e => up('receiverName', e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Phone *</Label><Input type="tel" placeholder="+44…" value={form.receiverPhone} onChange={e => up('receiverPhone', e.target.value)} /></div>
                  <div><Label>Email</Label><Input type="email" placeholder="receiver@company.com" value={form.receiverEmail} onChange={e => up('receiverEmail', e.target.value)} /></div>
                </div>
                <div><Label>Delivery address / receiving instructions</Label><Textarea placeholder="Address, dock number, access hours, etc." value={form.receiverInstructions} onChange={e => up('receiverInstructions', e.target.value)} /></div>
              </div>
            </div>
          </div>
        </div>
      );

      case 7: return (
        <div>
          <SectionHead icon={Shield} title="Customs & border responsibility" sub="Required for all cross-border shipments. Hard stop." />
          <div className="space-y-3">
            {[
              { key: 'customsAccepted',   label: 'Customs clearance is the responsibility of the customer or receiver' },
              { key: 'taxesAccepted',     label: 'All duties, taxes, import fees, and brokerage charges are payable by sender/receiver' },
              { key: 'legalityAccepted',  label: 'All goods are legal to transport on this route under UK and destination country law' },
              { key: 'paperworkAccepted', label: 'All paperwork submitted is accurate, complete, and legally compliant' },
              { key: 'delaysAccepted',    label: "Delays caused by customs, incorrect paperwork, or destination regulations are outside BootHop's control" },
            ].map(({ key, label }) => (
              <Toggle key={key} checked={form[key as keyof Form] as boolean} onChange={v => up(key as keyof Form, v)} label={label} />
            ))}
            <div className="mt-2">
              <Label>Who handles customs clearance? *</Label>
              <Select value={form.customsHandledBy} onChange={e => up('customsHandledBy', e.target.value)}>
                <option value="">Select…</option>
                <option value="sender"   className="bg-[#0d1117]">Sender</option>
                <option value="receiver" className="bg-[#0d1117]">Receiver</option>
                <option value="broker"   className="bg-[#0d1117]">Appointed broker</option>
              </Select>
            </div>
            {form.customsHandledBy === 'broker' && (
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Broker name</Label><Input placeholder="Full name" value={form.brokerName} onChange={e => up('brokerName', e.target.value)} /></div>
                <div><Label>Broker phone</Label><Input type="tel" placeholder="+44…" value={form.brokerPhone} onChange={e => up('brokerPhone', e.target.value)} /></div>
              </div>
            )}
            <div className="p-4 bg-white/3 border border-white/8 rounded-xl mt-2">
              <p className="text-xs text-white/30 leading-relaxed">
                BootHop operates as a logistics carrier only. All declarations above form part of your binding agreement.
              </p>
            </div>
          </div>
        </div>
      );

      case 8: return (
        <div>
          <SectionHead icon={Shield} title="Insurance & protection" sub="Standard cover up to £1,000 included at no charge." />
          <div className="space-y-4">
            <div className="p-4 bg-white/3 border border-white/8 rounded-xl">
              <div className="flex items-center gap-2 mb-2"><CheckCircle className="h-4 w-4 text-white/40" /><p className="text-sm font-bold text-white">Standard cover included</p></div>
              <p className="text-xs text-white/35">Goods up to £1,000 declared value are covered at no charge.</p>
            </div>
            {parseFloat(form.declaredValue) > 1000 ? (
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
            ) : (
              <div className="p-3 bg-white/3 border border-white/8 rounded-xl">
                <p className="text-xs text-white/35">Your declared value of £{form.declaredValue || '0'} is within the standard cover limit.</p>
              </div>
            )}
            <div className="p-4 bg-white/3 border border-white/8 rounded-xl space-y-2 text-xs text-white/30">
              <p>BootHop's liability is limited to the declared insured value or £5,000 per consignment, whichever is lower.</p>
              <p>Items above £50,000 may require structured cover. Contact us before booking.</p>
            </div>
          </div>
        </div>
      );

      case 9: return (
        <div>
          <SectionHead icon={Zap} title="Review & confirm" sub={reviewRequired ? "Your booking will go to manual review — no payment until approved." : "Check details, accept declarations, and proceed to payment."} />
          <div className="space-y-4">
            <div className="bg-white/3 border border-white/8 rounded-2xl p-5 space-y-3 text-sm">
              <SummaryRow label="Route"     value={form.routeType ? ROUTE_META[form.routeType as RouteType].label : '—'} />
              {isIntl && <SummaryRow label="Mode" value={MODE_META[form.deliveryMode].label} />}
              <SummaryRow label="Item"      value={form.itemDesc || '—'} />
              <SummaryRow label="Weight"    value={form.weightKg ? `${form.weightKg} kg` : '—'} />
              <SummaryRow label="Value"     value={form.declaredValue ? `£${parseFloat(form.declaredValue).toLocaleString()}` : '—'} />
              <SummaryRow label="Urgency"   value={form.urgency ? URGENCY_META[form.urgency as UrgencyTier].label : '—'} />
              <SummaryRow label="Collection" value={[form.collectionDate, form.collectionTime].filter(Boolean).join(' ')} />
              <SummaryRow label="From" value={(isIntl ? form.originAirport : form.collectionAddress) || '—'} />
              <SummaryRow label="To"   value={(isIntl ? form.destAirport   : form.deliveryAddress)   || '—'} />
              <SummaryRow label="Sender"    value={[form.senderName, form.senderPhone].filter(Boolean).join(' · ')} />
              <SummaryRow label="Receiver"  value={[form.receiverName, form.receiverPhone].filter(Boolean).join(' · ')} />
              {quote && (
                <div className="pt-3 border-t border-white/10">
                  <div className="flex justify-between font-black text-base">
                    <span className="text-white">Estimated total</span>
                    <span className={accentText}>£{quote.total.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label>Final declarations</Label>
              <div className="space-y-2">
                <Toggle checked={form.termsAccepted}         onChange={v => up('termsAccepted', v)}         label="I agree to BootHop Terms & Conditions and the pricing rules for this booking" />
                <Toggle checked={form.packagingConfirmed}    onChange={v => up('packagingConfirmed', v)}    label="The item is properly packaged for the journey type and distance" />
                <Toggle checked={form.detailsConfirmed}      onChange={v => up('detailsConfirmed', v)}      label="All route, contact, and item details provided are correct and complete" />
                <Toggle checked={form.extraChargesConfirmed} onChange={v => up('extraChargesConfirmed', v)} label="I understand re-delivery, waiting time, failed handover, or customs delays may incur additional charges" />
              </div>
            </div>

            {form.dangerousGoods && (
              <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-xl">
                <p className="text-sm font-bold text-red-400 mb-2">Dangerous goods — contact us before submitting</p>
                <div className="space-y-2">
                  <a href="mailto:support@boothop.com" className="flex items-center gap-2 text-xs text-red-400/80 hover:text-red-400 transition-colors">
                    <Mail className="h-3.5 w-3.5" /> support@boothop.com
                  </a>
                  <a href="/api/whatsapp" className="flex items-center gap-2 text-xs text-[#25D366]/80 hover:text-[#25D366] transition-colors">
                    <Phone className="h-3.5 w-3.5" /> WhatsApp
                  </a>
                </div>
              </div>
            )}

            {reviewRequired && !form.dangerousGoods && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-400 mb-1">This booking goes to manual review</p>
                  <p className="text-xs text-white/40">Our team will contact you within 2 business hours. No payment is taken until the booking is confirmed.</p>
                </div>
              </div>
            )}

            {!reviewRequired && !form.dangerousGoods && quote && (
              <div className="p-4 bg-white/3 border border-white/8 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-white/30" />
                  <div>
                    <p className="text-sm font-bold text-white">Secure card payment</p>
                    <p className="text-xs text-white/35">You will be redirected to Stripe to complete payment</p>
                  </div>
                </div>
                <span className={`${accentText} font-black text-xl`}>£{quote.total.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      );

      default: return null;
    }
  };

  const ds  = displayStep(step, form.routeType);
  const ts  = totalSteps(form.routeType);
  const pct = Math.round((ds / ts) * 100);

  const submitLabel = () => {
    if (form.dangerousGoods)    return 'Contact us — dangerous goods';
    if (reviewRequired)         return 'Submit for review';
    if (quote)                  return `Proceed to payment — £${quote.total.toLocaleString()}`;
    return 'Continue';
  };

  return (
    <>
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

          {/* Saved draft banner */}
          <AnimatePresence>
            {showDraftBanner && (
              <motion.div {...FADE}
                className="mb-6 flex items-center justify-between gap-4 bg-white/5 border border-white/12 rounded-xl px-5 py-3"
              >
                <div className="flex items-center gap-3">
                  <RotateCcw className="h-4 w-4 text-white/40 flex-shrink-0" />
                  <p className="text-sm text-white/60">You have a saved quote from earlier. Resume where you left off?</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button onClick={resumeDraft} className={`text-xs font-bold ${accentText} hover:opacity-80 transition-opacity`}>Resume</button>
                  <button onClick={dismissDraft} className="text-xs text-white/30 hover:text-white transition-colors">Dismiss</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress bar */}
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

            {/* Form */}
            <div>
              <div className="bg-white/3 border border-white/8 rounded-2xl p-6 lg:p-8 min-h-[500px]">
                <AnimatePresence mode="wait">
                  <motion.div key={step} {...FADE} transition={{ duration: 0.25 }}>
                    {renderStep()}
                  </motion.div>
                </AnimatePresence>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
                >
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </motion.div>
              )}

              <div className="flex gap-3 mt-5">
                {step > 1 && (
                  <button onClick={back} className="flex items-center gap-2 text-sm font-semibold text-white/40 hover:text-white bg-white/5 border border-white/10 hover:border-white/20 px-5 py-3 rounded-xl transition-all">
                    <ChevronLeft className="h-4 w-4" /> Back
                  </button>
                )}
                <button
                  onClick={advance}
                  disabled={submitting}
                  className={`flex-1 flex items-center justify-center gap-2 text-sm font-black text-black ${accentBg} ${accentHover} px-6 py-3 rounded-xl transition-all disabled:opacity-50 ${form.dangerousGoods && step === 9 ? 'bg-red-500 hover:bg-red-400' : ''}`}
                >
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
                  ) : step === 9 ? (
                    form.dangerousGoods
                      ? <><AlertTriangle className="h-4 w-4" /> {submitLabel()}</>
                      : reviewRequired
                        ? <><AlertTriangle className="h-4 w-4" /> {submitLabel()}</>
                        : <><CreditCard className="h-4 w-4" /> {submitLabel()}</>
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

      {/* Dangerous goods modal */}
      {showDangerModal && <DangerousGoodsModal onClose={() => setShowDangerModal(false)} />}
    </>
  );
}
