'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Loader2, AlertCircle, AlertTriangle,
  CheckCircle, MapPin, Package, Clock, Shield,
  Plane, Globe, Truck, Zap, Star, Info, Phone, Mail,
  CreditCard, X, RotateCcw, Building2, User,
} from 'lucide-react';
import {
  calculateQuote, RouteType, DeliveryMode, UrgencyTier,
  ROUTE_META, URGENCY_META, CATEGORIES, QuoteBreakdown,
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
  // Route
  routeType: RouteType | '';
  // Step 1 — Pickup
  pickupType:         'address' | 'airport';
  pickupAddress:      string;
  pickupAirport:      string;
  pickupContactName:  string;
  pickupContactPhone: string;
  pickupInstructions: string;
  // Step 1 — Dropoff
  dropoffType:         'address' | 'airport';
  dropoffAddress:      string;
  dropoffAirport:      string;
  dropoffContactName:  string;
  dropoffContactPhone: string;
  dropoffInstructions: string;
  // Step 1 — Timing
  urgency:           UrgencyTier | '';
  collectionDate:    string;
  collectionTime:    string;
  mustArriveBy:      string;
  nightService:      boolean;
  weekend:           boolean;
  immediateDispatch: boolean;
  dedicatedDriver:   boolean;
  meetGreetOrigin:   boolean;
  meetGreetDest:     boolean;
  extraPickupMiles:  string;
  extraDropMiles:    string;
  // Step 2 — Goods
  itemDesc:             string;
  category:             string;
  quantity:             string;
  weightKg:             string;
  declaredValue:        string;
  fragile:              boolean;
  specialHandling:      boolean;
  dangerousGoods:       boolean;
  batteryPowered:       boolean;
  containsLiquid:       boolean;
  exportControlled:     boolean;
  temperatureSensitive: boolean;
  noXray:               boolean;
  enhancedInsurance:    boolean;
  insuranceConfirmed:   boolean;
  // Step 3 — Customs (international only)
  personalEffectsConfirmed: boolean;
  valueLimitConfirmed:      boolean;
  noProhibitedGoods:        boolean;
  customsAccepted:    boolean;
  taxesAccepted:      boolean;
  legalityAccepted:   boolean;
  paperworkAccepted:  boolean;
  delaysAccepted:     boolean;
  customsHandledBy:   'sender' | 'receiver' | 'broker' | '';
  brokerName:         string;
  brokerPhone:        string;
  // Step 4 — Review
  termsAccepted:         boolean;
  packagingConfirmed:    boolean;
  detailsConfirmed:      boolean;
  extraChargesConfirmed: boolean;
}

const EMPTY_FORM: Form = {
  routeType: '',
  pickupType: 'address',  pickupAddress: '',  pickupAirport: '',
  pickupContactName: '',  pickupContactPhone: '', pickupInstructions: '',
  dropoffType: 'address', dropoffAddress: '', dropoffAirport: '',
  dropoffContactName: '', dropoffContactPhone: '', dropoffInstructions: '',
  urgency: '', collectionDate: '', collectionTime: '', mustArriveBy: '',
  nightService: false, weekend: false, immediateDispatch: false,
  dedicatedDriver: false, meetGreetOrigin: false, meetGreetDest: false,
  extraPickupMiles: '0', extraDropMiles: '0',
  itemDesc: '', category: '', quantity: '1', weightKg: '', declaredValue: '',
  fragile: false, specialHandling: false, dangerousGoods: false,
  batteryPowered: false, containsLiquid: false, exportControlled: false,
  temperatureSensitive: false, noXray: false,
  enhancedInsurance: false, insuranceConfirmed: false,
  personalEffectsConfirmed: false, valueLimitConfirmed: false, noProhibitedGoods: false,
  customsAccepted: false, taxesAccepted: false, legalityAccepted: false,
  paperworkAccepted: false, delaysAccepted: false,
  customsHandledBy: '', brokerName: '', brokerPhone: '',
  termsAccepted: false, packagingConfirmed: false,
  detailsConfirmed: false, extraChargesConfirmed: false,
};

const DRAFT_KEY    = 'boothop_biz_quote_draft';
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;
const FADE         = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 } };

// ── Shared UI atoms ───────────────────────────────────────────────────────────

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
      <span className="text-white/35 flex-shrink-0 text-sm">{label}</span>
      <span className="text-white text-right text-sm">{value}</span>
    </div>
  );
}

// ── Location block (used for both pickup and dropoff) ─────────────────────────

function LocationBlock({
  title, icon, color,
  locType, onTypeChange,
  address, onAddressChange,
  airport, onAirportChange, disabledAirportIata,
  contactName, onContactName,
  contactPhone, onContactPhone,
  instructions, onInstructions,
  showExtraMiles, extraMiles, onExtraMiles, milesLabel, mileRate,
}: {
  title: string; icon: React.ReactNode; color: string;
  locType: 'address' | 'airport'; onTypeChange: (v: 'address' | 'airport') => void;
  address: string; onAddressChange: (v: string) => void;
  airport: string; onAirportChange: (v: string) => void; disabledAirportIata?: string;
  contactName: string; onContactName: (v: string) => void;
  contactPhone: string; onContactPhone: (v: string) => void;
  instructions: string; onInstructions: (v: string) => void;
  showExtraMiles?: boolean; extraMiles?: string; onExtraMiles?: (v: string) => void;
  milesLabel?: string; mileRate?: string;
}) {
  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>{icon}</div>
          <p className="font-bold text-white text-sm">{title}</p>
        </div>
        {/* Address / Airport toggle */}
        <div className="flex bg-white/5 border border-white/10 rounded-xl p-0.5 gap-0.5">
          {(['address', 'airport'] as const).map(t => (
            <button key={t} type="button" onClick={() => onTypeChange(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize flex items-center gap-1.5
                ${locType === t ? 'bg-white/15 text-white' : 'text-white/30 hover:text-white/60'}`}
            >
              {t === 'address' ? <MapPin className="h-3 w-3" /> : <Plane className="h-3 w-3" />}
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Address or Airport */}
      {locType === 'address' ? (
        <PlacesInput
          label="Full address (include house / unit number)"
          value={address}
          onChange={onAddressChange}
          placeholder="Start typing address or postcode…"
        />
      ) : (
        <div className="space-y-3">
          <AirportInput
            label="Airport"
            value={airport}
            onSelect={onAirportChange}
            onClear={() => onAirportChange('')}
            disabledIata={disabledAirportIata}
            placeholder="Search city or IATA code…"
          />
          {showExtraMiles && (
            <div>
              <Label>{milesLabel ?? 'Extra miles from airport'}</Label>
              <Input type="number" min="0" placeholder="0" value={extraMiles} onChange={e => onExtraMiles?.(e.target.value)} />
              {mileRate && <p className="text-xs text-white/25 mt-1">{mileRate}</p>}
            </div>
          )}
        </div>
      )}

      {/* Contact */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Contact name *</Label>
          <Input placeholder="Full name" value={contactName} onChange={e => onContactName(e.target.value)} />
        </div>
        <div>
          <Label>Phone *</Label>
          <Input type="tel" placeholder="+44…" value={contactPhone} onChange={e => onContactPhone(e.target.value)} />
        </div>
      </div>

      {/* Instructions */}
      <div>
        <Label>Access / handling notes</Label>
        <Textarea placeholder="Gate code, floor, dock number, access hours…" value={instructions} onChange={e => onInstructions(e.target.value)} />
      </div>
    </div>
  );
}

// ── Quote Panel ───────────────────────────────────────────────────────────────

function QuotePanel({ quote, routeType, urgency, accent }: { quote: QuoteBreakdown | null; routeType: RouteType | ''; urgency: UrgencyTier | ''; accent: string }) {
  const fmt       = (n: number) => n > 0 ? `£${n.toLocaleString()}` : '—';
  const accentText = accent === 'amber' ? 'text-amber-400' : 'text-emerald-400';
  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl p-6 lg:sticky lg:top-6">
      <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4">Live Quote</p>
      {!routeType && (
        <div className="text-center py-8">
          <Globe className="h-8 w-8 text-white/15 mx-auto mb-3" />
          <p className="text-white/25 text-sm">Select a route to see pricing</p>
        </div>
      )}
      {routeType && !urgency && (
        <div className="text-center py-8">
          <Clock className="h-8 w-8 text-white/15 mx-auto mb-3" />
          <p className="text-white/25 text-sm">Select urgency to calculate</p>
          <p className="text-white/15 text-xs mt-1">{ROUTE_META[routeType as RouteType].from}</p>
        </div>
      )}
      {quote && (
        <>
          <div className="space-y-2.5 text-sm mb-4">
            <div className="flex justify-between"><span className="text-white/50">Base ({ROUTE_META[routeType as RouteType]?.label})</span><span className="text-white font-semibold">{fmt(quote.base)}</span></div>
            {quote.pickupExtra   > 0 && <div className="flex justify-between"><span className="text-white/50">Pickup mileage</span><span className="text-white">{fmt(quote.pickupExtra)}</span></div>}
            {quote.dropExtra     > 0 && <div className="flex justify-between"><span className="text-white/50">Drop mileage</span><span className="text-white">{fmt(quote.dropExtra)}</span></div>}
            {quote.handlingFee   > 0 && <div className="flex justify-between"><span className="text-white/50">Airport handling</span><span className="text-white">{fmt(quote.handlingFee)}</span></div>}
            {quote.insuranceFee  > 0 && <div className="flex justify-between"><span className="text-white/50">Enhanced insurance</span><span className="text-white">{fmt(quote.insuranceFee)}</span></div>}
            {quote.addons        > 0 && <div className="flex justify-between"><span className="text-white/50">Add-ons</span><span className="text-white">{fmt(quote.addons)}</span></div>}
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
        <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
        <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>
        <h3 className="text-xl font-black text-white mb-2">Dangerous goods — contact us immediately</h3>
        <p className="text-white/40 text-sm leading-relaxed mb-6">
          We cannot accept dangerous goods through the standard booking portal. Your consignment requires manual assessment before we can accept it.
        </p>
        <div className="space-y-3">
          <a href="mailto:support@boothop.com" className="flex items-center justify-center gap-2 w-full bg-red-500/10 border border-red-500/25 text-red-400 font-bold text-sm px-4 py-3 rounded-xl hover:bg-red-500/20 transition-all">
            <Mail className="h-4 w-4" /> support@boothop.com
          </a>
          <a href="/api/whatsapp" className="flex items-center justify-center gap-2 w-full bg-[#25D366]/10 border border-[#25D366]/25 text-[#25D366] font-bold text-sm px-4 py-3 rounded-xl hover:bg-[#25D366]/20 transition-all">
            <Phone className="h-4 w-4" /> Contact via WhatsApp
          </a>
        </div>
      </motion.div>
    </div>
  );
}

// ── Step labels ───────────────────────────────────────────────────────────────

function stepLabel(s: number, isIntl: boolean) {
  switch (s) {
    case 1: return 'Collection & Delivery';
    case 2: return 'Goods & Compliance';
    case 3: return isIntl ? 'Customs' : 'Review & Confirm';
    case 4: return 'Review & Confirm';
    default: return '';
  }
}

// ── Main wizard ───────────────────────────────────────────────────────────────

export function BusinessBookingWizard({ tier, bizEmail, companyName, onSuccess, onCancel }: WizardProps) {
  const accent      = tier === 'priority' ? 'amber'   : 'emerald';
  const accentText  = accent === 'amber'  ? 'text-amber-400'     : 'text-emerald-400';
  const accentBg    = accent === 'amber'  ? 'bg-amber-400'       : 'bg-emerald-400';
  const accentHover = accent === 'amber'  ? 'hover:bg-amber-300' : 'hover:bg-emerald-300';

  const [step,            setStep]          = useState(1);
  const [form,            setForm]          = useState<Form>(() => ({
    ...EMPTY_FORM,
    urgency:       tier === 'priority' ? 'priority' : '',
    pickupContactName:  companyName,
  }));
  const [submitting,      setSubmitting]    = useState(false);
  const [error,           setError]         = useState<string | null>(null);
  const [showDangerModal, setShowDangerModal] = useState(false);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [savedDraftStep,  setSavedDraftStep] = useState<number | null>(null);
  const draftSavedRef = useRef(false);

  const up = (key: keyof Form, val: unknown) => setForm(f => ({ ...f, [key]: val }));

  // Derive routeType from airport selections
  const derivedRouteType = useMemo<RouteType | ''>(() => {
    if (form.routeType) return form.routeType;
    // If both are addresses (UK-UK assumed unless overridden)
    return '';
  }, [form.routeType]);

  const isIntl = form.routeType !== '' && form.routeType !== 'uk_uk';
  const totalSteps = isIntl ? 4 : 3;

  // Derive delivery mode
  const deliveryMode = useMemo<DeliveryMode>(() => {
    if (form.pickupType === 'airport' && form.dropoffType === 'airport') return 'airport_airport';
    if (form.pickupType === 'address' && form.dropoffType === 'airport') return 'door_airport';
    if (form.pickupType === 'airport' && form.dropoffType === 'address') return 'airport_door';
    return 'door_door';
  }, [form.pickupType, form.dropoffType]);

  const hasExceptions  = form.batteryPowered || form.containsLiquid || form.exportControlled || form.temperatureSensitive || form.noXray;
  const needsInsurance = parseFloat(form.declaredValue) > 1000;

  const quote = useMemo<QuoteBreakdown | null>(() => {
    if (!form.routeType || !form.urgency) return null;
    return calculateQuote({
      routeType:         form.routeType as RouteType,
      deliveryMode,
      urgency:           form.urgency as UrgencyTier,
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
  }, [form, deliveryMode]);

  const reviewRequired = (quote?.reviewRequired ?? false) || hasExceptions;

  // Draft save/restore
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const { form: savedForm, step: savedStep, savedAt } = JSON.parse(raw);
      if (Date.now() - savedAt > DRAFT_TTL_MS) { localStorage.removeItem(DRAFT_KEY); return; }
      if (savedForm?.routeType) { setSavedDraftStep(savedStep); setShowDraftBanner(true); }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!draftSavedRef.current && step === 1 && !form.routeType) return;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, step, savedAt: Date.now() })); }
    catch { /* ignore */ }
  }, [form, step]);

  const resumeDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const { form: savedForm, step: savedStep } = JSON.parse(raw);
      setForm({ ...EMPTY_FORM, ...savedForm });
      setStep(savedStep || 1);
    } catch { /* ignore */ }
    setShowDraftBanner(false);
    draftSavedRef.current = true;
  };
  const dismissDraft = () => { localStorage.removeItem(DRAFT_KEY); setShowDraftBanner(false); };

  // Validation
  function validate(): string | null {
    const reviewStep = isIntl ? 4 : 3;
    const customsStep = isIntl ? 3 : -1;

    if (step === 1) {
      if (!form.routeType) return 'Please select a route type.';
      if (!form.urgency)   return 'Please select an urgency level.';
      if (!form.collectionDate) return 'Collection date is required.';
      // Pickup validation
      if (form.pickupType === 'address' && !form.pickupAddress.trim())  return 'Pickup address is required.';
      if (form.pickupType === 'airport' && !form.pickupAirport.trim())  return 'Pickup airport is required.';
      if (!form.pickupContactName.trim())  return 'Pickup contact name is required.';
      if (!form.pickupContactPhone.trim()) return 'Pickup contact phone is required.';
      // Dropoff validation
      if (form.dropoffType === 'address' && !form.dropoffAddress.trim())  return 'Drop-off address is required.';
      if (form.dropoffType === 'airport' && !form.dropoffAirport.trim())  return 'Drop-off airport is required.';
      if (!form.dropoffContactName.trim())  return 'Drop-off contact name is required.';
      if (!form.dropoffContactPhone.trim()) return 'Drop-off contact phone is required.';
    }
    if (step === 2) {
      if (!form.itemDesc.trim()) return 'Item description is required.';
      if (!form.weightKg)        return 'Weight is required.';
      if (!form.declaredValue)   return 'Declared value is required.';
      if (needsInsurance && form.enhancedInsurance && !form.insuranceConfirmed)
        return 'Please confirm the declared value for insurance.';
    }
    if (step === customsStep) {
      if (!form.personalEffectsConfirmed) return 'Please confirm goods are personal effects only (not commercial cargo).';
      if (!form.valueLimitConfirmed) return 'Please confirm total value is under £1,000 and no single item exceeds £2,000.';
      if (!form.noProhibitedGoods) return 'Please confirm the shipment contains no prohibited items.';
      if (!form.customsAccepted || !form.taxesAccepted || !form.legalityAccepted || !form.paperworkAccepted || !form.delaysAccepted)
        return 'All customs declarations must be confirmed.';
      if (!form.customsHandledBy) return 'Please confirm who handles customs clearance.';
    }
    if (step === reviewStep) {
      if (!form.termsAccepted || !form.packagingConfirmed || !form.detailsConfirmed || !form.extraChargesConfirmed)
        return 'All declarations must be confirmed before submitting.';
    }
    return null;
  }

  const advance = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    const reviewStep = isIntl ? 4 : 3;
    if (step === reviewStep) { handleSubmit(); return; }
    setStep(s => s + 1);
  };
  const back = () => { setError(null); setStep(s => s - 1); };

  const handleSubmit = async () => {
    if (form.dangerousGoods) { setShowDangerModal(true); return; }
    setSubmitting(true); setError(null);

    const pickupAddr  = form.pickupType  === 'airport' ? form.pickupAirport  : form.pickupAddress;
    const dropoffAddr = form.dropoffType === 'airport' ? form.dropoffAirport : form.dropoffAddress;

    const payload = {
      route_type:    form.routeType,
      delivery_mode: deliveryMode,
      company_name:  companyName,
      phone:         form.pickupContactPhone,
      pickup:        pickupAddr,
      dropoff:       dropoffAddr,
      description:   form.itemDesc,
      category:      form.category,
      weight:        form.weightKg,
      value:         form.declaredValue,
      urgency:       form.urgency,
      urgency_tier:  form.urgency,
      delivery_type: form.routeType === 'uk_uk' ? 'local_uk' : 'international',
      delivery_date: form.collectionDate,
      expected_delivery_date: form.mustArriveBy,
      insurance:     form.enhancedInsurance,
      insurance_fee: quote?.insuranceFee ?? 0,
      price:         quote?.total ?? 0,
      total:         quote?.total ?? 0,
      fragile:       form.fragile,
      dangerous_goods: false,
      review_required: reviewRequired,
      night_service:   form.nightService,
      weekend:         form.weekend,
      dedicated_driver: form.dedicatedDriver,
      immediate_dispatch: form.immediateDispatch,
      meet_greet_origin: form.meetGreetOrigin,
      meet_greet_dest:   form.meetGreetDest,
      sender_name:    form.pickupContactName,
      sender_email:   bizEmail,
      receiver_company: '',
      receiver_name:  form.dropoffContactName,
      receiver_phone: form.dropoffContactPhone,
      receiver_email: '',
      receiver_address: dropoffAddr,
      customs_handled_by: form.customsHandledBy || null,
      extra_pickup_miles: form.extraPickupMiles,
      extra_drop_miles:   form.extraDropMiles,
      is_priority: tier === 'priority',
      routeLabel:   form.routeType ? ROUTE_META[form.routeType as RouteType].label : '',
      urgencyLabel: form.urgency   ? URGENCY_META[form.urgency as UrgencyTier].label : '',
      metadata: {
        pickupInstructions:  form.pickupInstructions,
        dropoffInstructions: form.dropoffInstructions,
        collectionTime:      form.collectionTime,
        brokerName:          form.brokerName,
        brokerPhone:         form.brokerPhone,
        batteryPowered:      form.batteryPowered,
        containsLiquid:      form.containsLiquid,
        exportControlled:    form.exportControlled,
        temperatureSensitive: form.temperatureSensitive,
        noXray:              form.noXray,
      },
    };

    try {
      if (reviewRequired) {
        const res = await fetch('/api/business/create-job', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const j = await res.json();
        if (!res.ok) { setError(j.error || 'Submission failed.'); setSubmitting(false); return; }
        localStorage.removeItem(DRAFT_KEY);
        onSuccess(j.jobRef, false);
        return;
      }
      const res = await fetch('/api/business/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const j = await res.json();
      if (!res.ok) { setError(j.error || 'Payment setup failed.'); setSubmitting(false); return; }
      localStorage.removeItem(DRAFT_KEY);
      window.location.href = j.checkoutUrl;
    } catch {
      setError('Network error. Please try again.');
      setSubmitting(false);
    }
  };

  // ── Step renderers ────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <div className="space-y-6">
      <SectionHead icon={MapPin} title="Collection & Delivery" sub="Tell us where to pick up and where to deliver. Use exact addresses where possible." />

      {/* Route type */}
      <div>
        <Label>Route *</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(ROUTE_META) as RouteType[]).map(rt => {
            const m = ROUTE_META[rt]; const sel = form.routeType === rt;
            return (
              <button key={rt} type="button" onClick={() => { up('routeType', rt); setError(null); }}
                className={`text-left p-3 rounded-xl border transition-all ${sel ? 'border-emerald-500/60 bg-emerald-500/10' : 'border-white/10 bg-white/3 hover:border-white/20'}`}
              >
                <span className="text-xl">{m.flag}</span>
                <p className="font-bold text-white text-xs mt-1.5">{m.label}</p>
                <p className={`text-xs font-bold mt-0.5 ${sel ? accentText : 'text-white/30'}`}>{m.from}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pickup + Dropoff side by side on lg */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LocationBlock
          title="Pickup" icon={<Package className="h-4 w-4 text-emerald-400" />} color="bg-emerald-500/15"
          locType={form.pickupType} onTypeChange={v => up('pickupType', v)}
          address={form.pickupAddress} onAddressChange={v => up('pickupAddress', v)}
          airport={form.pickupAirport} onAirportChange={v => up('pickupAirport', v)}
          disabledAirportIata={form.dropoffAirport ? form.dropoffAirport.match(/\(([A-Z]{3})\)/)?.[1] : undefined}
          contactName={form.pickupContactName} onContactName={v => up('pickupContactName', v)}
          contactPhone={form.pickupContactPhone} onContactPhone={v => up('pickupContactPhone', v)}
          instructions={form.pickupInstructions} onInstructions={v => up('pickupInstructions', v)}
          showExtraMiles={form.pickupType === 'airport' && isIntl}
          extraMiles={form.extraPickupMiles} onExtraMiles={v => up('extraPickupMiles', v)}
          milesLabel="Extra miles from airport to collection point"
          mileRate={`£${form.urgency === 'planned' ? '3' : '6.50'}/mile`}
        />
        <LocationBlock
          title="Drop-off" icon={<Truck className="h-4 w-4 text-blue-400" />} color="bg-blue-500/15"
          locType={form.dropoffType} onTypeChange={v => up('dropoffType', v)}
          address={form.dropoffAddress} onAddressChange={v => up('dropoffAddress', v)}
          airport={form.dropoffAirport} onAirportChange={v => up('dropoffAirport', v)}
          disabledAirportIata={form.pickupAirport ? form.pickupAirport.match(/\(([A-Z]{3})\)/)?.[1] : undefined}
          contactName={form.dropoffContactName} onContactName={v => up('dropoffContactName', v)}
          contactPhone={form.dropoffContactPhone} onContactPhone={v => up('dropoffContactPhone', v)}
          instructions={form.dropoffInstructions} onInstructions={v => up('dropoffInstructions', v)}
          showExtraMiles={form.dropoffType === 'airport' && isIntl}
          extraMiles={form.extraDropMiles} onExtraMiles={v => up('extraDropMiles', v)}
          milesLabel="Extra miles from airport to delivery point"
          mileRate={`£${form.urgency === 'planned' ? '3' : '6.50'}/mile`}
        />
      </div>

      {/* Urgency + Timing */}
      <div>
        <Label>Urgency *</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {(Object.keys(URGENCY_META) as UrgencyTier[]).map(u => {
            const m = URGENCY_META[u]; const sel = form.urgency === u;
            const colors: Record<string, string> = { planned: 'text-emerald-400', priority: 'text-blue-400', critical: 'text-red-400' };
            return (
              <button key={u} type="button" onClick={() => { up('urgency', u); setError(null); }}
                className={`text-left p-4 rounded-2xl border transition-all ${sel ? 'border-emerald-500/60 bg-emerald-500/10' : 'border-white/10 bg-white/3 hover:border-white/20'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-white text-sm">{m.label}</p>
                  <span className={`text-xs font-bold ${colors[u]}`}>{m.time}</span>
                </div>
                <p className="text-white/35 text-xs">{m.desc}</p>
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <Label>Collection date *</Label>
            <Input type="date" value={form.collectionDate} onChange={e => up('collectionDate', e.target.value)} />
          </div>
          <div>
            <Label>Collection time</Label>
            <Input type="time" value={form.collectionTime} onChange={e => up('collectionTime', e.target.value)} />
          </div>
          <div>
            <Label>Must arrive by</Label>
            <Input type="date" value={form.mustArriveBy} onChange={e => up('mustArriveBy', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Service add-ons */}
      <div>
        <Label>Service add-ons</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Toggle checked={form.immediateDispatch} onChange={v => up('immediateDispatch', v)} label="Immediate dispatch +£200" sub="Operator assigned within 30 min" />
          <Toggle checked={form.nightService}      onChange={v => up('nightService', v)}      label="Night service +£200"       sub="Collection or delivery 22:00–06:00" />
          <Toggle checked={form.weekend}           onChange={v => up('weekend', v)}           label="Weekend service +20%"      sub="Saturday or Sunday" />
          <Toggle checked={form.dedicatedDriver}   onChange={v => up('dedicatedDriver', v)}   label="Dedicated driver +£300"    sub="Single operator, full journey" />
          {isIntl && <>
            <Toggle checked={form.meetGreetOrigin} onChange={v => up('meetGreetOrigin', v)} label="Meet & greet at origin +£175" sub="Operator meets at departures" />
            <Toggle checked={form.meetGreetDest}   onChange={v => up('meetGreetDest', v)}   label="Meet & greet at dest. +£175"  sub="Operator receives at arrivals" />
          </>}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <SectionHead icon={Package} title="Goods & Compliance" sub="Accurate details ensure correct pricing and safe handling." />

      {/* Item details */}
      <div className="space-y-4">
        <div>
          <Label>Description of goods *</Label>
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
            <Label>Declared value (£) *</Label>
            <Input type="number" min="0" placeholder="0" value={form.declaredValue} onChange={e => up('declaredValue', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Insurance — auto-shown if value > £1,000 */}
      {needsInsurance && (
        <div className="bg-amber-500/8 border border-amber-500/20 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-amber-400" />
            <p className="text-sm font-bold text-amber-300">Declared value exceeds £1,000 — insurance required</p>
          </div>
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white/40">
            Standard cover included up to £1,000. Your declared value is <span className="text-white font-bold">£{parseFloat(form.declaredValue).toLocaleString()}</span>.
          </div>
          <Toggle
            checked={form.enhancedInsurance}
            onChange={v => up('enhancedInsurance', v)}
            label={`Enhanced cover — 5% of £${parseFloat(form.declaredValue).toLocaleString()} = £${Math.max(75, Math.round(parseFloat(form.declaredValue) * 0.05)).toLocaleString()}`}
            sub="Minimum charge £75. Covers full declared value."
          />
          {form.enhancedInsurance && (
            <Toggle
              checked={form.insuranceConfirmed}
              onChange={v => up('insuranceConfirmed', v)}
              label={`I confirm the declared value of £${parseFloat(form.declaredValue).toLocaleString()} is accurate`}
            />
          )}
        </div>
      )}

      {/* Risk flags */}
      <div>
        <Label>Item characteristics</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          <Toggle checked={form.fragile}         onChange={v => up('fragile', v)}         label="Fragile" sub="Requires careful handling" />
          <Toggle checked={form.specialHandling} onChange={v => up('specialHandling', v)} label="Special handling" sub="Orientation sensitive, etc." />
          <Toggle checked={form.dangerousGoods}  onChange={v => up('dangerousGoods', v)}  label="Contains dangerous goods" sub="Batteries, chemicals, flammables" danger />
        </div>
        {form.dangerousGoods && (
          <div className="mb-3 p-3 bg-red-500/10 border border-red-500/25 rounded-xl flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-400">Contact us before proceeding — dangerous goods require manual assessment.</p>
          </div>
        )}
      </div>

      <div>
        <Label>Shipment risk flags</Label>
        <p className="text-xs text-white/25 mb-3">Any flagged item routes to manual review before confirmation.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Toggle checked={form.batteryPowered}       onChange={v => up('batteryPowered', v)}       label="Battery-powered or contains batteries" />
          <Toggle checked={form.containsLiquid}       onChange={v => up('containsLiquid', v)}       label="Contains liquid" />
          <Toggle checked={form.exportControlled}     onChange={v => up('exportControlled', v)}     label="Export controlled / dual-use" sub="ITAR, EAR, UK Export Control" />
          <Toggle checked={form.temperatureSensitive} onChange={v => up('temperatureSensitive', v)} label="Temperature sensitive" sub="Cold chain or heat-sensitive" />
          <Toggle checked={form.noXray}               onChange={v => up('noXray', v)}               label="Cannot go through X-ray" />
        </div>
        {hasExceptions && (
          <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-400/80">One or more risk flags require manual review — no payment until approved.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3Customs = () => (
    <div className="space-y-4">
      <SectionHead icon={Globe} title="Customs & Border Responsibility" sub="Required for all cross-border shipments. All declarations are binding." />
      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
        <p className="text-sm font-semibold text-amber-400 mb-2">International Goods Policy</p>
        <ul className="text-xs text-white/50 space-y-1">
          <li>• Personal effects only — clothing, gifts, documents (no commercial cargo)</li>
          <li>• Total declared value must be under £1,000 per traveller shipment</li>
          <li>• No single item may exceed £2,000 in declared value</li>
          <li>• No prohibited items under any circumstances</li>
        </ul>
      </div>
      <Toggle checked={form.personalEffectsConfirmed} onChange={v => up('personalEffectsConfirmed', v)}
        label="All goods are personal effects — clothing, gifts, documents, or household items for personal use (not commercial goods for resale)" />
      <Toggle checked={form.valueLimitConfirmed} onChange={v => up('valueLimitConfirmed', v)}
        label="Total declared value is under £1,000 and no single item in this shipment exceeds £2,000" />
      <Toggle checked={form.noProhibitedGoods} onChange={v => up('noProhibitedGoods', v)}
        label="Shipment contains no prohibited items — no drugs, weapons, counterfeit goods, live animals, or hazardous materials" />
      {[
        { key: 'customsAccepted',   label: 'Customs clearance is the responsibility of the customer or receiver' },
        { key: 'taxesAccepted',     label: 'All duties, taxes, import fees, and brokerage charges are payable by sender/receiver' },
        { key: 'legalityAccepted',  label: 'All goods are legal to transport on this route under UK and destination country law' },
        { key: 'paperworkAccepted', label: 'All paperwork submitted is accurate, complete, and legally compliant' },
        { key: 'delaysAccepted',    label: "Delays caused by customs, incorrect paperwork, or regulations are outside BootHop's control" },
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
    </div>
  );

  const renderReview = () => {
    const pickupAddr  = form.pickupType  === 'airport' ? form.pickupAirport  : form.pickupAddress;
    const dropoffAddr = form.dropoffType === 'airport' ? form.dropoffAirport : form.dropoffAddress;
    return (
      <div className="space-y-5">
        <SectionHead icon={Zap} title="Review & Confirm" sub={reviewRequired ? 'Your booking goes to manual review — no payment until approved.' : 'Check everything, confirm, and proceed to payment.'} />

        <div className="bg-white/3 border border-white/8 rounded-2xl p-5 space-y-3">
          <SummaryRow label="Route"        value={form.routeType ? ROUTE_META[form.routeType as RouteType].label : '—'} />
          <SummaryRow label="Urgency"      value={form.urgency ? URGENCY_META[form.urgency as UrgencyTier].label : '—'} />
          <SummaryRow label="Collection"   value={[form.collectionDate, form.collectionTime].filter(Boolean).join(' at ')} />
          <SummaryRow label="Pickup"       value={pickupAddr  || '—'} />
          <SummaryRow label="Pickup contact" value={[form.pickupContactName, form.pickupContactPhone].filter(Boolean).join(' · ')} />
          <SummaryRow label="Drop-off"     value={dropoffAddr || '—'} />
          <SummaryRow label="Drop-off contact" value={[form.dropoffContactName, form.dropoffContactPhone].filter(Boolean).join(' · ')} />
          <div className="border-t border-white/8 my-1" />
          <SummaryRow label="Goods"        value={form.itemDesc || '—'} />
          <SummaryRow label="Weight"       value={form.weightKg ? `${form.weightKg} kg` : '—'} />
          <SummaryRow label="Declared value" value={form.declaredValue ? `£${parseFloat(form.declaredValue).toLocaleString()}` : '—'} />
          {quote && (
            <div className="border-t border-white/10 pt-3 flex justify-between font-black text-base">
              <span className="text-white">Estimated total</span>
              <span className={accentText}>£{quote.total.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div>
          <Label>Final declarations</Label>
          <div className="space-y-2">
            <Toggle checked={form.termsAccepted}         onChange={v => up('termsAccepted', v)}         label="I agree to BootHop Terms & Conditions and the pricing rules for this booking" />
            <Toggle checked={form.packagingConfirmed}    onChange={v => up('packagingConfirmed', v)}    label="The item is properly packaged for the journey type and distance" />
            <Toggle checked={form.detailsConfirmed}      onChange={v => up('detailsConfirmed', v)}      label="All route, contact, and item details provided are correct and complete" />
            <Toggle checked={form.extraChargesConfirmed} onChange={v => up('extraChargesConfirmed', v)} label="I understand re-delivery, waiting time, or customs delays may incur additional charges" />
          </div>
        </div>

        {form.dangerousGoods && (
          <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-xl">
            <p className="text-sm font-bold text-red-400 mb-2">Dangerous goods — contact us before submitting</p>
            <div className="space-y-2">
              <a href="mailto:support@boothop.com" className="flex items-center gap-2 text-xs text-red-400/80 hover:text-red-400 transition-colors"><Mail className="h-3.5 w-3.5" /> support@boothop.com</a>
              <a href="/api/whatsapp" className="flex items-center gap-2 text-xs text-[#25D366]/80 hover:text-[#25D366] transition-colors"><Phone className="h-3.5 w-3.5" /> WhatsApp</a>
            </div>
          </div>
        )}

        {reviewRequired && !form.dangerousGoods && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-400 mb-1">This booking goes to manual review</p>
              <p className="text-xs text-white/40">Our team will contact you within 2 business hours. No payment is taken until confirmed.</p>
            </div>
          </div>
        )}

        {!reviewRequired && !form.dangerousGoods && quote && (
          <div className="p-4 bg-white/3 border border-white/8 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-white/30" />
              <div>
                <p className="text-sm font-bold text-white">Secure card payment</p>
                <p className="text-xs text-white/35">Redirected to Stripe to complete payment</p>
              </div>
            </div>
            <span className={`${accentText} font-black text-xl`}>£{quote.total.toLocaleString()}</span>
          </div>
        )}
      </div>
    );
  };

  const renderCurrentStep = () => {
    if (step === 1) return renderStep1();
    if (step === 2) return renderStep2();
    if (isIntl && step === 3) return renderStep3Customs();
    return renderReview();
  };

  const reviewStep    = isIntl ? 4 : 3;
  const pct           = Math.round((step / totalSteps) * 100);
  const isLastStep    = step === reviewStep;

  const submitLabel = () => {
    if (form.dangerousGoods) return 'Contact us — dangerous goods';
    if (reviewRequired)      return 'Submit for review';
    if (quote)               return `Proceed to payment — £${quote.total.toLocaleString()}`;
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

          {/* Draft banner */}
          <AnimatePresence>
            {showDraftBanner && (
              <motion.div {...FADE} className="mb-6 flex items-center justify-between gap-4 bg-white/5 border border-white/12 rounded-xl px-5 py-3">
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

          {/* Progress */}
          <div className="mb-8">
            {/* Step pills */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map(s => (
                <div key={s} className="flex items-center gap-2 flex-shrink-0">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all
                    ${s < step  ? `${accentText} bg-emerald-500/10 border border-emerald-500/20` :
                      s === step ? 'text-white bg-white/10 border border-white/20' :
                                   'text-white/25 border border-white/8'}`}
                  >
                    {s < step ? <CheckCircle className="h-3 w-3" /> : <span>{s}</span>}
                    <span className="hidden sm:inline">{stepLabel(s, isIntl)}</span>
                  </div>
                  {s < totalSteps && <div className={`h-px w-6 flex-shrink-0 ${s < step ? 'bg-emerald-500/40' : 'bg-white/10'}`} />}
                </div>
              ))}
            </div>
            <div className="h-1 bg-white/8 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${accent === 'amber' ? 'bg-amber-400' : 'bg-emerald-400'}`}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-8 items-start">

            {/* Form */}
            <div>
              <div className="bg-white/3 border border-white/8 rounded-2xl p-6 lg:p-8">
                <AnimatePresence mode="wait">
                  <motion.div key={step} {...FADE} transition={{ duration: 0.2 }}>
                    {renderCurrentStep()}
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
                  className={`flex-1 flex items-center justify-center gap-2 text-sm font-black text-black ${accentBg} ${accentHover} px-6 py-3 rounded-xl transition-all disabled:opacity-50
                    ${form.dangerousGoods && isLastStep ? 'bg-red-500 hover:bg-red-400 text-white' : ''}`}
                >
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
                  ) : isLastStep ? (
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
            <QuotePanel quote={quote} routeType={form.routeType} urgency={form.urgency} accent={accent} />
          </div>

        </div>
      </div>

      {showDangerModal && <DangerousGoodsModal onClose={() => setShowDangerModal(false)} />}
    </>
  );
}
