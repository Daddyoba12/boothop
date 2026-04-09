'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, Mail, ShieldCheck, CheckCircle, ArrowRight,
  Zap, Lock, Clock, MapPin, Package, Star, Building2, Truck,
  LogOut, List, XCircle, AlertCircle, User, ChevronLeft,
  Phone, Plane, Globe, FileText, AlertTriangle,
  MessageCircle, Send,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Pricing engine
// ─────────────────────────────────────────────────────────────────────────────
const UK_CITIES: Record<string, [number, number]> = {
  london:          [51.5074, -0.1278],
  'central london':[51.5074, -0.1278],
  birmingham:      [52.4862, -1.8904],
  manchester:      [53.4808, -2.2426],
  leeds:           [53.8008, -1.5491],
  sheffield:       [53.3811, -1.4701],
  liverpool:       [53.4084, -2.9916],
  bristol:         [51.4545, -2.5879],
  nottingham:      [52.9548, -1.1581],
  leicester:       [52.6369, -1.1398],
  derby:           [52.9225, -1.4746],
  coventry:        [52.4068, -1.5197],
  edinburgh:       [55.9533, -3.1883],
  glasgow:         [55.8642, -4.2518],
  cardiff:         [51.4816, -3.1791],
  cambridge:       [52.2053,  0.1218],
  oxford:          [51.7520, -1.2577],
  norwich:         [52.6309,  1.2974],
  southampton:     [50.9097, -1.4044],
  portsmouth:      [50.8198, -1.0880],
  reading:         [51.4543, -0.9781],
  newcastle:       [54.9783, -1.6178],
  sunderland:      [54.9069, -1.3838],
  middlesbrough:   [54.5743, -1.2350],
  hull:            [53.7457, -0.3367],
  york:            [53.9600, -1.0873],
  bradford:        [53.7960, -1.7594],
  stoke:           [53.0027, -2.1794],
  exeter:          [50.7184, -3.5339],
  brighton:        [50.8229, -0.1363],
  ipswich:         [52.0567,  1.1482],
  peterborough:    [52.5695, -0.2405],
  northampton:     [52.2405, -0.9027],
  // UK airports
  heathrow:        [51.4700, -0.4543],
  'heathrow airport': [51.4700, -0.4543],
  lhr:             [51.4700, -0.4543],
  gatwick:         [51.1481, -0.1903],
  'gatwick airport':  [51.1481, -0.1903],
  lgw:             [51.1481, -0.1903],
  stansted:        [51.8860,  0.2389],
  'stansted airport': [51.8860,  0.2389],
  stn:             [51.8860,  0.2389],
  luton:           [51.8747, -0.3683],
  'luton airport': [51.8747, -0.3683],
  ltn:             [51.8747, -0.3683],
  'east midlands airport': [52.8311, -1.3281],
  ema:             [52.8311, -1.3281],
  'manchester airport':    [53.3537, -2.2750],
  man:             [53.3537, -2.2750],
  'birmingham airport':    [52.4539, -1.7480],
  bhx:             [52.4539, -1.7480],
  'edinburgh airport':     [55.9500, -3.3725],
  edi:             [55.9500, -3.3725],
  'glasgow airport':       [55.8719, -4.4330],
  gla:             [55.8719, -4.4330],
};

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function milesToKm(miles: number): number { return miles * 1.60934; }

// Local UK: £200 per 30km band (or part thereof) — minimum £200
function localPriceFromKm(km: number): number {
  return Math.max(1, Math.ceil(km / 30)) * 200;
}

function detectCity(text: string): [number, number] | null {
  const lower = text.toLowerCase();
  const sorted = Object.keys(UK_CITIES).sort((a, b) => b.length - a.length);
  for (const city of sorted) {
    if (lower.includes(city)) return UK_CITIES[city];
  }
  return null;
}

function calcLocalEstimate(pickup: string, dropoff: string): { price: number; miles: number } | null {
  const from = detectCity(pickup);
  const to   = detectCity(dropoff);
  if (!from || !to) return null;
  const miles = Math.round(haversine(from[0], from[1], to[0], to[1]));
  const km    = milesToKm(miles);
  return { price: localPriceFromKm(km), miles };
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type Stage = 'loading' | 'landing' | 'email' | 'otp' | 'portal' | 'form' | 'jobs' | 'success';
type DeliveryType = 'local_uk' | 'international';

type MyJob = {
  id: string; job_ref: string; company_name: string | null;
  pickup: string; dropoff: string; status: string;
  urgency: string; estimated_price: number | null;
  driver_name: string | null; driver_phone: string | null;
  assigned_at: string | null; picked_up_at: string | null; delivered_at: string | null;
  created_at: string;
};

type JobForm = {
  company_name: string;
  phone: string;
  delivery_type: DeliveryType;
  pickup: string; dropoff: string;
  description: string;
  weight: string; value: string; category: string;
  urgency: 'same_day' | 'next_day';
  delivery_date: string;
  expected_delivery_date: string;
};

const EMPTY_FORM: JobForm = {
  company_name: '', phone: '',
  delivery_type: 'local_uk',
  pickup: '', dropoff: '', description: '',
  weight: '', value: '', category: '',
  urgency: 'same_day',
  delivery_date: '', expected_delivery_date: '',
};

const FADE = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -16 } };

// ─────────────────────────────────────────────────────────────────────────────
// T&C content
// ─────────────────────────────────────────────────────────────────────────────
const TC_SECTIONS = [
  {
    title: '1. Retainer Requirements',
    body: `All business accounts are required to hold a retainer with BootHop Business prior to placing any delivery order. Local UK accounts: £10,000 retainer. International accounts: £15,000 retainer. The retainer is held on account and drawn down against delivery charges. It is not a deposit and is not refundable unless the account is closed in good standing.`,
  },
  {
    title: '2. Pricing',
    body: `Local UK deliveries are charged at £200 per 30km band (or part thereof) of the direct route distance, with a minimum charge of £200. International deliveries (airport-to-airport) are priced from £1,000 per consignment. The direct UK–Lagos route is approximately 6 hours flight time. Final pricing is confirmed upon job assignment and may vary from the online estimate.`,
  },
  {
    title: '3. Insurance',
    body: `Standard coverage is included for goods with a declared value of up to £1,000. For goods with a declared value exceeding £1,000, a mandatory insurance premium of 8% of the declared value is applied and non-waivable. BootHop is not liable for any claims relating to goods whose declared value was understated at the time of booking.`,
  },
  {
    title: '4. Prohibited Items',
    body: `BootHop Business does not accept: hazardous or dangerous materials; illegal items under UK law or destination country law; living organisms; perishables without prior written agreement; items prohibited by HMRC or customs regulations. Submitting prohibited items may result in immediate account suspension and legal referral.`,
  },
  {
    title: '5. Liability',
    body: `BootHop's liability is limited to the lower of the insured declared value or £5,000 per consignment. We are not liable for consequential losses, business interruption, reputational damage, delays caused by customs, acts of God, or third-party failures outside our control.`,
  },
  {
    title: '6. Cancellation',
    body: `Jobs may be cancelled at no charge within 2 hours of submission, provided a carrier has not yet been assigned. Jobs cancelled after carrier assignment are subject to a £100 cancellation fee. International jobs cannot be cancelled once the carrier has checked in at the departure airport.`,
  },
  {
    title: '7. Payment Terms',
    body: `Invoices are issued upon confirmed delivery and are payable within 14 days of the invoice date. Overdue invoices accrue interest at 8% per annum above the Bank of England base rate. BootHop reserves the right to suspend services for accounts with outstanding balances.`,
  },
  {
    title: '8. Data Protection',
    body: `BootHop processes personal data in accordance with the UK GDPR and the Data Protection Act 2018. Data collected is used solely for the purposes of fulfilling the delivery contract and will not be shared with third parties except as necessary to complete the delivery (e.g. assigned carriers). You may request deletion of your data by contacting support@boothop.com.`,
  },
  {
    title: '9. Governing Law',
    body: `These terms are governed by and construed in accordance with the laws of England and Wales. Any disputes arising in connection with these terms shall be subject to the exclusive jurisdiction of the courts of England and Wales.`,
  },
  {
    title: '10. Acceptance',
    body: `By accepting these terms, you confirm that: (a) you are duly authorised to enter into this agreement on behalf of your organisation; (b) all information provided is accurate and complete; (c) you have read and understood all terms above in full. These terms form a binding contract between your organisation and BootHop Ltd.`,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function BoothopBusiness() {
  const [stage,        setStage]        = useState<Stage>('loading');
  const [bizEmail,     setBizEmail]     = useState('');
  const [emailInput,   setEmailInput]   = useState('');
  const [otpInput,     setOtpInput]     = useState('');
  const [authError,    setAuthError]    = useState<string | null>(null);
  const [authLoading,  setAuthLoading]  = useState(false);
  const [jobRef,       setJobRef]       = useState('');

  const [form,         setForm]         = useState<JobForm>(EMPTY_FORM);
  const [estimate,     setEstimate]     = useState<{ price: number; miles: number } | null>(null);
  const [formLoading,  setFormLoading]  = useState(false);
  const [formError,    setFormError]    = useState<string | null>(null);
  const [myJobs,       setMyJobs]       = useState<MyJob[]>([]);
  const [jobsLoading,  setJobsLoading]  = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showPricing,  setShowPricing]  = useState(false);

  // T&C modal
  const [showTerms,    setShowTerms]    = useState(false);
  const [termsScrolled,setTermsScrolled]= useState(false);
  const [termsAccepted,setTermsAccepted]= useState(false);

  // Contact form (landing)
  const [contactForm,    setContactForm]    = useState({ name: '', email: '', message: '' });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactStatus,  setContactStatus]  = useState<'idle' | 'ok' | 'err'>('idle');


  // Priority Partner
  const [companyName,     setCompanyName]     = useState('');
  const [partnerTier,     setPartnerTier]     = useState<string | null>(null);
  const [partnerStatus,   setPartnerStatus]   = useState<string | null>(null);
  const [partnerDiscount, setPartnerDiscount] = useState<number | null>(null);
  const [priorityForm,    setPriorityForm]    = useState({ email: '', company_name: '', phone: '', delivery_type: '', notes: '' });
  const [priorityLoading, setPriorityLoading] = useState(false);
  const [priorityStatus,  setPriorityStatus]  = useState<'idle' | 'ok' | 'err'>('idle');

  // Google Places coords for accurate pricing
  const [pickupCoords,  setPickupCoords]  = useState<[number, number] | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<[number, number] | null>(null);

  const [mapsReady,    setMapsReady]    = useState(false);
  const [queryPickup,  setQueryPickup]  = useState('');
  const [pickupSugs,   setPickupSugs]   = useState<string[]>([]);
  const [queryDropoff, setQueryDropoff] = useState('');
  const [dropoffSugs,  setDropoffSugs]  = useState<string[]>([]);

  // ── Session check ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/business/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.authenticated) {
          setBizEmail(d.email);
          if (d.company_name)           setCompanyName(d.company_name);
          if (d.partner_tier)           setPartnerTier(d.partner_tier);
          if (d.partner_status)         setPartnerStatus(d.partner_status);
          if (d.partner_discount)       setPartnerDiscount(d.partner_discount);
          setPriorityForm(p => ({ ...p, email: d.email }));
          setStage('portal');
        } else {
          setStage('landing');
        }
      })
      .catch(() => setStage('landing'));
  }, []);

  // ── Price estimate ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (form.delivery_type === 'international') {
      setEstimate({ price: 1000, miles: 0 });
      return;
    }
    if (pickupCoords && dropoffCoords) {
      const miles = Math.round(haversine(pickupCoords[0], pickupCoords[1], dropoffCoords[0], dropoffCoords[1]));
      const km    = milesToKm(miles);
      setEstimate({ price: localPriceFromKm(km), miles });
    } else if (form.pickup && form.dropoff) {
      setEstimate(calcLocalEstimate(form.pickup, form.dropoff));
    } else {
      setEstimate(null);
    }
  }, [form.pickup, form.dropoff, form.delivery_type, pickupCoords, dropoffCoords]);

  // ── Google Places ──────────────────────────────────────────────────────────
  useEffect(() => {
    if ((window as any).google?.maps?.places) { setMapsReady(true); return; }
    const t = setInterval(() => {
      if ((window as any).google?.maps?.places) { setMapsReady(true); clearInterval(t); }
    }, 300);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!mapsReady || queryPickup.length < 3) { setPickupSugs([]); return; }
    const t = setTimeout(() => {
      new (window as any).google.maps.places.AutocompleteService().getPlacePredictions(
        { input: queryPickup },
        (p: any[] | null) => setPickupSugs(p ? p.map((x: any) => x.description) : [])
      );
    }, 300);
    return () => clearTimeout(t);
  }, [queryPickup, mapsReady]);

  useEffect(() => {
    if (!mapsReady || queryDropoff.length < 3) { setDropoffSugs([]); return; }
    const t = setTimeout(() => {
      new (window as any).google.maps.places.AutocompleteService().getPlacePredictions(
        { input: queryDropoff },
        (p: any[] | null) => setDropoffSugs(p ? p.map((x: any) => x.description) : [])
      );
    }, 300);
    return () => clearTimeout(t);
  }, [queryDropoff, mapsReady]);

  // ── Auth ───────────────────────────────────────────────────────────────────
  const sendOtp = async () => {
    setAuthError(null); setAuthLoading(true);
    try {
      const res = await fetch('/api/business/auth/send-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.trim() }),
      });
      const j = await res.json();
      if (!res.ok) { setAuthError(j.error); return; }
      setStage('otp');
    } catch { setAuthError('Could not send code. Please try again.'); }
    finally { setAuthLoading(false); }
  };

  const verifyOtp = async () => {
    setAuthError(null); setAuthLoading(true);
    try {
      const res = await fetch('/api/business/auth/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: otpInput.trim() }),
      });
      const j = await res.json();
      if (!res.ok) { setAuthError(j.error); return; }
      setBizEmail(j.email); setStage('portal');
    } catch { setAuthError('Verification failed. Please try again.'); }
    finally { setAuthLoading(false); }
  };

  const logout = async () => {
    await fetch('/api/business/auth/logout', { method: 'POST' });
    setBizEmail(''); setStage('landing');
  };

  // ── Jobs ───────────────────────────────────────────────────────────────────
  const loadMyJobs = async () => {
    setJobsLoading(true);
    try {
      const res = await fetch('/api/business/my-jobs');
      const j   = await res.json();
      setMyJobs(j.jobs ?? []);
    } catch { /* silent */ }
    finally { setJobsLoading(false); }
  };

  const cancelJob = async (id: string) => {
    setCancellingId(id);
    try {
      const res = await fetch('/api/business/cancel-job', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const j = await res.json();
      if (res.ok) setMyJobs(prev => prev.map(job => job.id === id ? { ...job, status: 'cancelled' } : job));
      else alert(j.error || 'Could not cancel job.');
    } catch { alert('Something went wrong.'); }
    finally { setCancellingId(null); }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const goodsValue       = parseFloat(form.value) || 0;
  const insuranceFee     = goodsValue > 1000 ? Math.round(goodsValue * 0.08) : 0;
  const sameDaySurcharge = form.urgency === 'same_day' ? Math.round((estimate?.price ?? 0) * 0.2) : 0;
  const totalPrice       = (estimate?.price ?? 0) + insuranceFee + sameDaySurcharge;

  const submitJob = async () => {
    if (!form.phone.trim())               { setFormError('Phone number is required.'); return; }
    if (!form.pickup || !form.dropoff)    { setFormError('Pickup and drop-off locations are required.'); return; }
    if (!form.delivery_date)              { setFormError('Collection date is required.'); return; }
    if (!form.expected_delivery_date)     { setFormError('Expected delivery date is required.'); return; }
    if (form.expected_delivery_date < form.delivery_date) { setFormError('Expected delivery date cannot be before the collection date.'); return; }
    if (!termsAccepted)                   { setFormError('You must read and accept the Terms & Conditions.'); setShowTerms(true); return; }

    setFormError(null); setFormLoading(true);
    try {
      const res = await fetch('/api/business/create-job', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          company_name:          form.company_name || null,
          price:                 totalPrice || (form.delivery_type === 'international' ? 1000 : 200),
          miles:                 estimate?.miles ?? 0,
          insurance_fee:         insuranceFee,
          delivery_type:         form.delivery_type,
          delivery_date:         form.delivery_date,
          expected_delivery_date:form.expected_delivery_date,
          insurance:             true,
        }),
      });
      const j = await res.json();
      if (!res.ok) { setFormError(j.error || 'Something went wrong.'); return; }
      setJobRef(j.jobRef); setStage('success'); setQueryPickup(''); setQueryDropoff('');
    } catch { setFormError('Something went wrong.'); }
    finally { setFormLoading(false); }
  };

  // ── Contact submit ────────────────────────────────────────────────────────
  const submitContact = async () => {
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;
    setContactLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: contactForm.name, email: contactForm.email, topic: 'Business Enquiry', message: contactForm.message }),
      });
      setContactStatus(res.ok ? 'ok' : 'err');
      if (res.ok) setContactForm({ name: '', email: '', message: '' });
    } catch { setContactStatus('err'); }
    finally { setContactLoading(false); }
  };


  // ── Priority Partner apply ────────────────────────────────────────────────
  const submitPriorityApply = async () => {
    if (!priorityForm.email || !priorityForm.company_name || !priorityForm.phone) return;
    setPriorityLoading(true);
    try {
      const res = await fetch('/api/business/priority-apply', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(priorityForm),
      });
      setPriorityStatus(res.ok ? 'ok' : 'err');
    } catch { setPriorityStatus('err'); }
    finally { setPriorityLoading(false); }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (stage === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #020617 0%, #0c1e3d 50%, #020617 100%)' }}>
        <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white" style={{ background: 'linear-gradient(135deg, #020617 0%, #0c1e3d 50%, #020617 100%)', backgroundAttachment: 'fixed' }}>

      {/* ── T&C MODAL ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showTerms && (
          <motion.div
            key="terms-modal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
              className="bg-[#0a1628] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col"
            >
              <div className="px-8 py-6 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">Terms & Conditions</h3>
                    <p className="text-white/40 text-xs mt-0.5">BootHop Business — please read in full before accepting</p>
                  </div>
                </div>
              </div>

              <div
                className="flex-1 overflow-y-auto px-8 py-6 space-y-5"
                onScroll={e => {
                  const el = e.currentTarget;
                  if (el.scrollHeight - el.scrollTop - el.clientHeight < 60) setTermsScrolled(true);
                }}
              >
                {TC_SECTIONS.map(s => (
                  <div key={s.title}>
                    <p className="text-white font-bold text-sm mb-2">{s.title}</p>
                    <p className="text-white/50 text-sm leading-relaxed">{s.body}</p>
                  </div>
                ))}
                <div className="h-4" />
              </div>

              <div className="px-8 py-5 border-t border-white/10 flex-shrink-0">
                {!termsScrolled && (
                  <p className="text-amber-400/70 text-xs mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                    Scroll to the bottom to enable acceptance
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowTerms(false)}
                    className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 font-semibold text-sm hover:bg-white/10 transition-all"
                  >
                    Close
                  </button>
                  <button
                    disabled={!termsScrolled}
                    onClick={() => { setTermsAccepted(true); setShowTerms(false); setFormError(null); }}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black text-sm disabled:opacity-30 transition-all"
                  >
                    I accept these terms
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">

        {/* ══════════════════════════════════════════
            LANDING PAGE
        ══════════════════════════════════════════ */}
        {stage === 'landing' && (
          <motion.div key="landing" {...FADE} transition={{ duration: 0.4 }}>

            {/* Nav */}
            <nav className="px-6 py-5 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-4">
                <a href="/" className="text-white/30 hover:text-white/70 text-xs font-semibold transition-colors hidden sm:block">← BootHop</a>
                <div className="text-xl font-black tracking-tight">
                  Boot<span className="text-emerald-400">Hop</span>
                  <span className="ml-2 text-xs font-semibold bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full uppercase tracking-widest">Business</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => document.getElementById('biz-how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-sm font-semibold text-white/40 hover:text-white transition-colors hidden sm:block">
                  How It Works
                </button>
                <button onClick={() => document.getElementById('biz-priority')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-sm font-semibold text-amber-400/60 hover:text-amber-400 transition-colors hidden sm:block">
                  Priority Partner
                </button>
                <button onClick={() => document.getElementById('biz-contact')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-sm font-semibold text-white/40 hover:text-white transition-colors hidden sm:block">
                  Contact
                </button>
                <button onClick={() => setStage('email')}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black text-sm px-5 py-2.5 rounded-xl hover:scale-105 transition-all">
                  Book a Delivery
                </button>
              </div>
            </nav>

            {/* Hero */}
            <div className="max-w-5xl mx-auto px-8 pt-24 pb-16 text-center">
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-full mb-8 uppercase tracking-widest">
                <Zap className="h-3.5 w-3.5" /> Premium business logistics
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-6">
                Same-day delivery<br /><span className="text-emerald-400">across the UK.</span>
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="text-white/50 text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
                BootHop Business connects your company to a network of verified carriers.
                Fast, insured, and built for time-critical deliveries.
              </motion.p>
              {/* Hero CTA */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="flex items-center justify-center mb-4">
                <button onClick={() => setStage('email')}
                  className="inline-flex items-center gap-2.5 bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black text-sm px-7 py-3.5 rounded-2xl hover:scale-105 transition-all shadow-2xl shadow-emerald-500/30">
                  Request a delivery <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>

              <p className="text-white/20 text-xs mt-5">Business email required for delivery requests · Personal accounts not accepted</p>
            </div>

            {/* How it works */}
            <div id="biz-how-it-works" className="max-w-5xl mx-auto px-8 pb-20">
              <h2 className="text-2xl font-black text-center mb-10">How it works</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { icon: Building2, step: '01', title: 'Verify your business', body: 'Sign in with your company email. No Gmail or personal accounts — business only.' },
                  { icon: MapPin,    step: '02', title: 'Submit your request',   body: 'Tell us the route, what needs delivering, and when. Get an instant price estimate.' },
                  { icon: Zap,       step: '03', title: 'We handle the rest',    body: 'We match a verified carrier to your job and keep you updated every step of the way.' },
                ].map(({ icon: Icon, step, title, body }) => (
                  <div key={step} className="group relative overflow-hidden bg-white/3 border border-white/8 rounded-2xl p-6 transition-all duration-300 hover:border-emerald-500/30 hover:bg-white/5 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 active:scale-[0.98] touch-emerald">
                    <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 w-20 h-20 bg-emerald-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Icon className="h-5 w-5 text-emerald-400" />
                      </div>
                      <span className="text-white/20 font-black text-2xl">{step}</span>
                    </div>
                    <h3 className="text-white font-bold mb-2 group-hover:text-emerald-300 transition-colors duration-300">{title}</h3>
                    <p className="text-white/40 text-sm leading-relaxed">{body}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="max-w-5xl mx-auto px-8 pb-16">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: '£200+',    label: 'Local from',  sub: 'UK-to-UK distance pricing' },
                  { value: '100%',     label: 'Insured',     sub: 'Every single delivery' },
                  { value: 'Same day', label: 'Delivery',    sub: 'For urgent business needs' },
                ].map(s => (
                  <div key={s.label} className="group relative overflow-hidden bg-white/3 border border-white/8 rounded-2xl p-6 text-center transition-all duration-300 hover:border-emerald-500/30 hover:bg-white/5 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 active:scale-[0.98] touch-emerald">
                    <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 w-20 h-20 bg-emerald-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <p className="text-3xl font-black text-emerald-400 mb-1">{s.value}</p>
                    <p className="text-white font-semibold text-sm group-hover:text-emerald-300 transition-colors duration-300">{s.label}</p>
                    <p className="text-white/30 text-xs mt-0.5">{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing — sign in required */}
            <div className="max-w-3xl mx-auto px-8 pb-20">
              <div className="group relative overflow-hidden bg-white/3 border border-white/8 rounded-2xl p-10 text-center transition-all duration-300 hover:border-emerald-500/30 hover:bg-white/5 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 active:scale-[0.98] touch-emerald">
                <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 w-32 h-32 bg-emerald-500/15 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
                  <Lock className="h-6 w-6 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-black mb-3 group-hover:text-emerald-300 transition-colors duration-300">Pricing available on sign-in</h2>
                <p className="text-white/40 text-sm leading-relaxed max-w-md mx-auto mb-6">
                  Our pricing is tailored to route, distance, and delivery type. Sign in with your business email to view full pricing details, retainer requirements, and insurance terms.
                </p>
                <button onClick={() => setStage('email')}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 border border-emerald-500/30 px-5 py-2.5 rounded-xl hover:bg-emerald-500/10 transition-all duration-200">
                  Sign in to view pricing <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Features */}
            <div className="max-w-5xl mx-auto px-8 pb-20">
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { icon: ShieldCheck, title: 'Fully insured',       body: 'Every delivery is insured to the declared value of goods.' },
                  { icon: Clock,       title: 'Same-day available',   body: 'Submit before midday for same-day delivery on most routes.' },
                  { icon: Lock,        title: 'Business-only access', body: 'Verified business accounts only. No personal users on the platform.' },
                  { icon: Star,        title: 'Rated carriers',       body: 'All our carriers are verified, rated, and background-checked.' },
                ].map(({ icon: Icon, title, body }) => (
                  <div key={title} className="group relative overflow-hidden flex items-start gap-4 bg-white/3 border border-white/8 rounded-2xl p-5 transition-all duration-300 hover:border-emerald-500/30 hover:bg-white/5 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 active:scale-[0.98] touch-emerald">
                    <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 w-20 h-20 bg-emerald-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white font-bold mb-1 group-hover:text-emerald-300 transition-colors duration-300">{title}</p>
                      <p className="text-white/40 text-sm leading-relaxed">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Priority Partner Programme ── */}
            <div id="biz-priority" className="max-w-5xl mx-auto px-8 pb-20">
              <div className="group relative overflow-hidden bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/20 rounded-3xl p-10 transition-all duration-300 hover:border-amber-500/35 hover:shadow-2xl hover:shadow-amber-500/10">
                <div className="pointer-events-none absolute -top-10 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Star className="h-6 w-6 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-black">Priority Partner</h2>
                      <span className="text-xs font-bold bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full uppercase tracking-widest">Exclusive</span>
                    </div>
                    <p className="text-white/40 text-sm mt-0.5">For businesses that ship regularly — unlock premium perks</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-8 mb-10">
                  <div>
                    <p className="text-white/50 text-sm leading-relaxed mb-6">
                      Join our Priority Partner programme and experience a higher tier of service. Your requests go to the front of the queue, you get a dedicated account manager, and you earn volume discounts automatically — no negotiation needed.
                    </p>
                    <div className="space-y-3">
                      {[
                        { icon: Clock,       label: '2-hour guaranteed response', sub: 'Every request answered within 2 hours' },
                        { icon: User,        label: 'Dedicated account team',     sub: 'Your own named contact at BootHop' },
                        { icon: Zap,         label: 'Priority carrier matching',  sub: 'Your jobs are first in line' },
                        { icon: ShieldCheck, label: 'Volume discounts',           sub: '5% on 2–5 deliveries · 10% on 6+ per year' },
                      ].map(({ icon: Icon, label, sub }) => (
                        <div key={label} className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0 mt-0.5">
                            <Icon className="h-4 w-4 text-amber-400" />
                          </div>
                          <div>
                            <p className="text-white font-bold text-sm">{label}</p>
                            <p className="text-white/35 text-xs mt-0.5">{sub}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    {priorityStatus === 'ok' ? (
                      <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 px-6 py-8 text-center h-full flex flex-col items-center justify-center">
                        <CheckCircle className="h-10 w-10 text-amber-400 mx-auto mb-3" />
                        <p className="text-white font-bold text-lg">Application received!</p>
                        <p className="text-white/40 text-sm mt-2 leading-relaxed">Our team will review your application and be in touch within 24 hours.</p>
                      </div>
                    ) : (
                      <div className="bg-white/3 border border-white/8 rounded-2xl p-6 space-y-3">
                        <p className="text-white font-bold text-sm mb-4">Apply now — it takes 60 seconds</p>
                        {priorityStatus === 'err' && <p className="text-red-400 text-xs">Something went wrong — please try again.</p>}
                        <a href="/business/priority-partner"
                          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 text-black font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all">
                          <Star className="h-4 w-4" /> Apply &amp; Pay — full details →
                        </a>
                        <p className="text-white/20 text-xs text-center">UK £500/yr · International £1,000/yr · One-off annual fee</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Contact Us ── */}
            <div id="biz-contact" className="max-w-3xl mx-auto px-8 pb-20">
              <div className="group relative overflow-hidden bg-white/3 border border-white/8 rounded-3xl p-10 transition-all duration-300 hover:border-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/8 touch-emerald">
                <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black">Get in touch</h2>
                    <p className="text-white/40 text-sm">Questions about business deliveries? We reply within 24h.</p>
                  </div>
                </div>

                {/* WhatsApp CTA */}
                <a href="/api/whatsapp"
                  className="inline-flex items-center gap-2.5 bg-[#25D366] text-white font-bold text-sm px-5 py-3 rounded-full mb-6 hover:bg-[#1ebe5d] transition-all">
                  <MessageCircle className="h-5 w-5" />
                  Chat on WhatsApp
                </a>

                {contactStatus === 'ok' ? (
                  <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-6 py-8 text-center">
                    <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
                    <p className="text-white font-bold">Message sent!</p>
                    <p className="text-white/40 text-sm mt-1">We&apos;ll be in touch shortly.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contactStatus === 'err' && (
                      <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-300 text-sm">
                        Could not send message. Please try WhatsApp instead.
                      </div>
                    )}
                    <div className="grid md:grid-cols-2 gap-4">
                      <input value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="Your name" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
                      <input value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))}
                        type="email" placeholder="Email address" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
                    </div>
                    <textarea value={contactForm.message} onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                      rows={4} placeholder="How can we help?"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none" />
                    <button onClick={submitContact}
                      disabled={contactLoading || !contactForm.name || !contactForm.email || !contactForm.message}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black disabled:opacity-40 hover:scale-[1.02] transition-all text-sm">
                      {contactLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      {contactLoading ? 'Sending…' : 'Send message'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="max-w-2xl mx-auto px-8 pb-24 text-center">
              <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-3xl p-10">
                <h2 className="text-3xl font-black mb-3">Ready to get started?</h2>
                <p className="text-white/40 mb-8">Enter your business email to access the portal.</p>
                <button onClick={() => setStage('email')}
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black px-8 py-4 rounded-2xl hover:scale-105 transition-all">
                  Get access <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>

          </motion.div>
        )}

        {/* ══════════════════════════════════════════
            EMAIL INPUT
        ══════════════════════════════════════════ */}
        {stage === 'email' && (
          <motion.div key="email" {...FADE} className="min-h-screen flex flex-col items-center justify-center px-6">
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <p className="text-xl font-black mb-1">Boot<span className="text-emerald-400">Hop</span> <span className="text-white/40 font-normal">Business</span></p>
                <h2 className="text-3xl font-black mt-4 mb-2">Enter your business email</h2>
                <p className="text-white/40 text-sm">Personal email addresses are not accepted</p>
              </div>
              <div className="group relative overflow-hidden bg-white/5 border border-white/10 rounded-2xl p-8 space-y-4 transition-all duration-300 hover:border-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/8">
                <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                {authError && <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-300 text-sm">{authError}</div>}
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <input type="email" value={emailInput} onChange={e => setEmailInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendOtp()}
                    placeholder="you@yourcompany.com" autoFocus
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
                </div>
                <button onClick={sendOtp} disabled={authLoading || !emailInput.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black disabled:opacity-40 hover:scale-[1.02] transition-all">
                  {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  {authLoading ? 'Sending code…' : 'Send verification code'}
                </button>
                <button onClick={() => setStage('landing')} className="w-full text-center text-white/25 hover:text-white/50 text-sm transition-colors pt-1">
                  ← Back
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════
            OTP
        ══════════════════════════════════════════ */}
        {stage === 'otp' && (
          <motion.div key="otp" {...FADE} className="min-h-screen flex flex-col items-center justify-center px-6">
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-emerald-400" />
                </div>
                <h2 className="text-3xl font-black mb-2">Check your inbox</h2>
                <p className="text-white/40 text-sm">We sent a 6-digit code to</p>
                <p className="text-emerald-400 font-semibold text-sm mt-0.5">{emailInput}</p>
              </div>
              <div className="group relative overflow-hidden bg-white/5 border border-white/10 rounded-2xl p-8 space-y-4 transition-all duration-300 hover:border-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/8">
                <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                {authError && <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-300 text-sm">{authError}</div>}
                <input type="text" inputMode="numeric"
                  value={otpInput} onChange={e => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={e => e.key === 'Enter' && verifyOtp()}
                  placeholder="000000" autoFocus
                  className="w-full text-center text-4xl font-mono tracking-[0.6em] py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <button onClick={verifyOtp} disabled={authLoading || otpInput.length < 6}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black disabled:opacity-40 hover:scale-[1.02] transition-all">
                  {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  {authLoading ? 'Verifying…' : 'Verify & continue'}
                </button>
                <button onClick={() => { setStage('email'); setOtpInput(''); setAuthError(null); }}
                  className="w-full text-center text-white/25 hover:text-white/50 text-sm transition-colors">
                  Use a different email
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════
            POST-LOGIN PORTAL
        ══════════════════════════════════════════ */}
        {stage === 'portal' && (
          <motion.div key="portal" {...FADE} transition={{ duration: 0.4 }}>
            <nav className="px-8 py-5 flex items-center justify-between border-b border-white/5">
              <div className="text-xl font-black tracking-tight">
                Boot<span className="text-emerald-400">Hop</span>
                <span className="ml-2 text-xs font-semibold bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full uppercase tracking-widest">Business</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white/30 text-xs hidden md:block">{bizEmail}</span>
                <button onClick={() => { setStage('jobs'); loadMyJobs(); }}
                  className="inline-flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 font-semibold text-sm px-4 py-2.5 rounded-xl transition-all">
                  <List className="h-4 w-4" /> My Jobs
                </button>
                <button onClick={() => setStage('form')}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black text-sm px-5 py-2.5 rounded-xl hover:scale-105 transition-all">
                  Book a delivery <ArrowRight className="h-4 w-4" />
                </button>
                <button onClick={logout} title="Sign out"
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 text-white/30 transition-all">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </nav>

            <div className="max-w-5xl mx-auto px-8 py-16">
              {/* Welcome */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-12">
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-full uppercase tracking-widest">
                    <CheckCircle className="h-3.5 w-3.5" /> Verified business account
                  </div>
                  {partnerStatus === 'active' && (
                    <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest">
                      <Star className="h-3.5 w-3.5" /> Priority Partner {partnerTier === 'elite' ? '— Elite' : ''}
                    </div>
                  )}
                  {partnerStatus === 'pending' && (
                    <div className="inline-flex items-center gap-2 bg-white/5 border border-white/15 text-white/40 text-xs font-semibold px-4 py-2 rounded-full uppercase tracking-widest">
                      <Clock className="h-3.5 w-3.5" /> Partner application pending
                    </div>
                  )}
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-4">
                  Welcome back{companyName ? ',' : ','}<br />
                  <span className="text-emerald-400">{companyName || 'let\'s move something.'}</span>
                </h1>
                <p className="text-white/40 text-lg max-w-2xl">
                  Signed in as <span className="text-white/70 font-semibold">{bizEmail}</span>.
                  {partnerStatus === 'active'
                    ? <span className="text-amber-400/70 ml-1">You have {partnerDiscount}% volume discount and {partnerStatus === 'active' ? '2-hour' : ''} priority response.</span>
                    : ' Review the information below before placing your first job.'}
                </p>
              </motion.div>

              {/* Priority Partner upsell / status (post-login) */}
              {(!partnerStatus || partnerStatus === 'rejected') && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                  className="group relative overflow-hidden mb-12 bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/20 rounded-2xl p-8 transition-all duration-300 hover:border-amber-500/35 hover:shadow-lg hover:shadow-amber-500/8 touch-emerald">
                  <div className="pointer-events-none absolute -top-8 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" />
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <Star className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black">Become a Priority Partner</h2>
                      <p className="text-white/40 text-xs mt-0.5">For businesses that ship regularly — unlock exclusive perks</p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3 mb-6">
                    {[
                      { icon: Clock,       label: '2-hour response',        sub: 'Guaranteed reply within 2 hours, every time' },
                      { icon: Star,        label: 'Dedicated account team', sub: 'Your own point of contact at BootHop' },
                      { icon: Zap,         label: 'Priority carrier match', sub: 'Your jobs jump the queue on our network' },
                      { icon: ShieldCheck, label: 'Volume discount',        sub: '5% on 2–5 jobs/year · 10% on 6+ jobs/year' },
                    ].map(({ icon: Icon, label, sub }) => (
                      <div key={label} className="flex items-start gap-3 bg-white/3 rounded-xl p-4">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0 mt-0.5">
                          <Icon className="h-4 w-4 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm">{label}</p>
                          <p className="text-white/35 text-xs mt-0.5">{sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {priorityStatus === 'ok' ? (
                    <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 px-6 py-5 text-center">
                      <CheckCircle className="h-7 w-7 text-amber-400 mx-auto mb-2" />
                      <p className="text-white font-bold">Application submitted!</p>
                      <p className="text-white/40 text-sm mt-1">Our team will review and be in touch within 24h.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {priorityStatus === 'err' && <p className="text-red-400 text-xs">Something went wrong — try again.</p>}
                      <div className="grid sm:grid-cols-2 gap-3">
                        <input value={priorityForm.email} onChange={e => setPriorityForm(p => ({ ...p, email: e.target.value }))}
                          type="email" placeholder="Business email *"
                          className="px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
                        <input value={priorityForm.company_name} onChange={e => setPriorityForm(p => ({ ...p, company_name: e.target.value }))}
                          placeholder="Company name *"
                          className="px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
                        <input value={priorityForm.phone} onChange={e => setPriorityForm(p => ({ ...p, phone: e.target.value }))}
                          type="tel" placeholder="Phone number *"
                          className="px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
                        <select value={priorityForm.delivery_type} onChange={e => setPriorityForm(p => ({ ...p, delivery_type: e.target.value }))}
                          className="px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm">
                          <option value="" className="bg-[#0a1628]">Account type</option>
                          <option value="uk" className="bg-[#0a1628]">UK deliveries — £500/year</option>
                          <option value="international" className="bg-[#0a1628]">International deliveries — £1,000/year</option>
                        </select>
                      </div>
                      <a href="/business/priority-partner"
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 text-black font-black hover:scale-[1.02] active:scale-[0.98] transition-all text-sm">
                        <Star className="h-4 w-4" /> Apply &amp; pay — full details
                      </a>
                      <p className="text-white/20 text-xs text-center">UK £500/yr · International £1,000/yr · Annual membership</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Retainer Programme */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="group relative overflow-hidden mb-12 bg-white/3 border border-white/8 rounded-2xl p-8 transition-all duration-300 hover:border-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/8 touch-emerald">
                <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Star className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-black">Retainer Programme</h2>
                      <span className="text-xs font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-2.5 py-1 rounded-full uppercase tracking-widest">Founding Rate</span>
                    </div>
                    <p className="text-white/40 text-xs mt-0.5">Recommended for businesses that deliver frequently</p>
                  </div>
                </div>
                <p className="text-white/50 text-sm leading-relaxed mb-6">
                  If you plan to use BootHop Business on a regular basis, opening a retainer account gives you <span className="text-white/70 font-semibold">priority carrier matching</span>, <span className="text-white/70 font-semibold">faster turnaround</span>, and <span className="text-white/70 font-semibold">consolidated monthly invoicing</span> instead of paying per job. The retainer sits on account and is drawn down against delivery fees — it is never charged as a deposit.
                </p>
                <div className="grid md:grid-cols-2 gap-4 mb-5">
                  <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-5">
                    <p className="text-emerald-400 font-black text-3xl mb-1">£10,000</p>
                    <p className="text-white font-bold text-sm mb-1">Local UK retainer</p>
                    <p className="text-white/40 text-xs">Ideal for frequent UK-to-UK delivery accounts</p>
                    <p className="text-white/30 text-xs mt-2">First 30 accounts only — rate doubles for new clients after 9 months</p>
                  </div>
                  <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-5">
                    <p className="text-emerald-400 font-black text-3xl mb-1">£15,000</p>
                    <p className="text-white font-bold text-sm mb-1">International retainer</p>
                    <p className="text-white/40 text-xs">For accounts shipping internationally on a regular basis</p>
                    <p className="text-white/30 text-xs mt-2">First 30 accounts only — rate doubles for new clients after 9 months</p>
                  </div>
                </div>
                <p className="text-white/25 text-xs leading-relaxed">
                  One-off jobs are also welcome — no retainer needed for occasional use. To open a retainer account, contact <span className="text-white/40">business@boothop.com</span>.
                </p>
                <div className="mt-5 bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
                  <Star className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-white/50 text-xs leading-relaxed">
                    <span className="text-amber-400 font-bold">Founding member rates:</span> The first 30 accounts lock in these retainer rates permanently. After 9 months, rates double for all new clients. Your rate is fixed from the day you open your account.
                  </p>
                </div>
              </motion.div>

              {/* Pricing */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="group relative overflow-hidden mb-12 bg-white/3 border border-white/8 rounded-2xl p-8 transition-all duration-300 hover:border-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/8 touch-emerald">
                <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <h2 className="text-xl font-black mb-2">Pricing structure</h2>
                <p className="text-white/40 text-sm mb-6">All prices are estimates. Final price confirmed on job assignment.</p>
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Truck className="h-4 w-4 text-emerald-400" />
                      <p className="text-white font-bold text-sm">Local UK delivery</p>
                    </div>
                    <p className="text-emerald-400 font-black text-2xl mb-1">£200 <span className="text-sm font-semibold text-white/40">per 30km</span></p>
                    <p className="text-white/40 text-xs leading-relaxed">Charged per 30km band (or part thereof) of route distance. Minimum £200.</p>
                    <div className="mt-3 space-y-1 text-xs text-white/30">
                      <p>Up to 30km — £200</p>
                      <p>31 – 60km — £400</p>
                      <p>61 – 90km — £600</p>
                      <p>Each additional 30km — +£200</p>
                    </div>
                  </div>
                  <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Plane className="h-4 w-4 text-blue-400" />
                      <p className="text-white font-bold text-sm">International delivery</p>
                    </div>
                    <p className="text-blue-400 font-black text-2xl mb-1">From £1,000 <span className="text-sm font-semibold text-white/40">airport to airport</span></p>
                    <p className="text-white/40 text-xs leading-relaxed">All international routes priced from £1,000. UK→Lagos direct flight: approx. 6hrs.</p>
                    <div className="mt-3 space-y-1 text-xs text-white/30">
                      <p>UK → Lagos — from £1,000</p>
                      <p>UK → Dubai — from £1,000</p>
                      <p>Exact quote on assignment</p>
                    </div>
                  </div>
                </div>
                {/* Insurance */}
                <div className="bg-white/3 border border-white/8 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <p className="text-white font-bold text-sm">Insurance</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-3">
                      <p className="text-emerald-400 font-bold mb-1">Goods valued up to £1,000</p>
                      <p className="text-white/40">Standard insurance included in all delivery prices. No additional fee.</p>
                    </div>
                    <div className="bg-orange-500/5 border border-orange-500/15 rounded-lg p-3">
                      <p className="text-orange-400 font-bold mb-1">Goods valued over £1,000</p>
                      <p className="text-white/40">Mandatory premium insurance at <span className="text-orange-400 font-bold">8% of declared goods value</span>. Non-waivable.</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* How it works */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-12">
                <h2 className="text-2xl font-black mb-8">How it works</h2>
                <div className="grid md:grid-cols-4 gap-4">
                  {[
                    { icon: Mail,        step: '01', title: 'Submit a job',           body: 'Fill in the route, goods details, dates, and contact info. Get an instant price estimate.' },
                    { icon: ShieldCheck, step: '02', title: 'We verify & assign',      body: 'Our team reviews your job and assigns a vetted, insured carrier.' },
                    { icon: Truck,       step: '03', title: 'Collection & delivery',   body: 'Carrier collects from your pickup address and delivers directly.' },
                    { icon: CheckCircle, step: '04', title: 'Confirmed & invoiced',    body: 'Delivery confirmed by both parties. Invoice issued on net terms.' },
                  ].map(({ icon: Icon, step, title, body }) => (
                    <div key={step} className="group relative overflow-hidden bg-white/3 border border-white/8 rounded-2xl p-5 transition-all duration-300 hover:border-emerald-500/30 hover:bg-white/5 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 active:scale-[0.98] touch-emerald">
                      <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 w-20 h-20 bg-emerald-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                          <Icon className="h-4 w-4 text-emerald-400" />
                        </div>
                        <span className="text-emerald-400/60 text-xs font-black tracking-widest">{step}</span>
                      </div>
                      <p className="text-white font-bold text-sm mb-2 group-hover:text-emerald-300 transition-colors duration-300">{title}</p>
                      <p className="text-white/40 text-xs leading-relaxed">{body}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* CTA */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-center">
                <button onClick={() => setStage('form')}
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black text-xl px-12 py-5 rounded-2xl hover:scale-105 transition-all shadow-2xl shadow-emerald-500/30">
                  Book a delivery <ArrowRight className="h-6 w-6" />
                </button>
                <p className="text-white/20 text-sm mt-4">Insured · Same-day available · UK-wide + International</p>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════
            DELIVERY FORM
        ══════════════════════════════════════════ */}
        {stage === 'form' && (
          <motion.div key="form" {...FADE} className="px-6 py-10">
            <div className="max-w-3xl mx-auto">

              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <button onClick={() => setStage('portal')}
                    className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm font-semibold transition-colors">
                    <ChevronLeft className="h-4 w-4" /> Back
                  </button>
                  <div>
                    <h1 className="text-3xl font-black">Boot<span className="text-emerald-400">Hop</span> Business</h1>
                    <p className="text-white/30 text-sm mt-0.5">New delivery request</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-xs text-white/30 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">{bizEmail}</span>
                  </div>
                  <button onClick={logout} title="Sign out"
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 text-white/30 transition-all">
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="bg-white/3 border border-white/8 rounded-3xl p-8 space-y-6">

                {/* Delivery type */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3 flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5" /> Delivery type
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { value: 'local_uk',      label: '🇬🇧 Local UK',      sub: 'UK-to-UK · £200/30km' },
                      { value: 'international', label: '✈️ International', sub: 'Airport-to-airport · from £1,000' },
                    ] as const).map(opt => (
                      <button key={opt.value}
                        onClick={() => setForm(prev => ({ ...prev, delivery_type: opt.value }))}
                        className={`py-3 px-4 rounded-xl text-left transition-all ${form.delivery_type === opt.value ? 'bg-gradient-to-r from-emerald-400/20 to-teal-400/10 border-2 border-emerald-400/40' : 'bg-white/5 border border-white/10 hover:bg-white/8'}`}>
                        <p className={`font-bold text-sm ${form.delivery_type === opt.value ? 'text-white' : 'text-white/60'}`}>{opt.label}</p>
                        <p className="text-white/30 text-xs mt-0.5">{opt.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Company + Phone */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3 flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5" /> Company name
                    </p>
                    <input value={form.company_name} onChange={e => setForm(prev => ({ ...prev, company_name: e.target.value }))}
                      placeholder="Your company name (optional)"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3 flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5" /> Contact phone <span className="text-red-400">*</span>
                    </p>
                    <input type="tel" value={form.phone} onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+44 7700 000000"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
                  </div>
                </div>

                {/* Route */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3 flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" /> Route
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-white/40 block mb-1.5">Pickup location <span className="text-red-400">*</span></label>
                      <div className="relative">
                        <input
                          value={queryPickup}
                          onChange={e => { setQueryPickup(e.target.value); setForm(prev => ({ ...prev, pickup: e.target.value })); setPickupCoords(null); }}
                          onBlur={() => setPickupSugs([])}
                          autoComplete="off"
                          placeholder={form.delivery_type === 'international' ? 'e.g. Heathrow Airport (LHR)' : 'e.g. Nottingham city centre'}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        />
                        {pickupSugs.length > 0 && (
                          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#0a1628] border border-white/15 rounded-xl overflow-hidden shadow-2xl">
                            {pickupSugs.slice(0, 6).map((s, i) => (
                              <button key={i} type="button"
                                onMouseDown={e => {
                                  e.preventDefault();
                                  setQueryPickup(s); setForm(prev => ({ ...prev, pickup: s })); setPickupSugs([]);
                                  const coords = detectCity(s); if (coords) setPickupCoords(coords);
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm text-white/70 hover:bg-white/8 hover:text-white transition-colors border-b border-white/5 last:border-0 flex items-center gap-2">
                                <MapPin className="h-3.5 w-3.5 text-emerald-400/50 shrink-0" />{s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-white/40 block mb-1.5">Drop-off location <span className="text-red-400">*</span></label>
                      <div className="relative">
                        <input
                          value={queryDropoff}
                          onChange={e => { setQueryDropoff(e.target.value); setForm(prev => ({ ...prev, dropoff: e.target.value })); setDropoffCoords(null); }}
                          onBlur={() => setDropoffSugs([])}
                          autoComplete="off"
                          placeholder={form.delivery_type === 'international' ? 'e.g. Murtala Muhammed Airport (LOS)' : 'e.g. London EC2A'}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        />
                        {dropoffSugs.length > 0 && (
                          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#0a1628] border border-white/15 rounded-xl overflow-hidden shadow-2xl">
                            {dropoffSugs.slice(0, 6).map((s, i) => (
                              <button key={i} type="button"
                                onMouseDown={e => {
                                  e.preventDefault();
                                  setQueryDropoff(s); setForm(prev => ({ ...prev, dropoff: s })); setDropoffSugs([]);
                                  const coords = detectCity(s); if (coords) setDropoffCoords(coords);
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm text-white/70 hover:bg-white/8 hover:text-white transition-colors border-b border-white/5 last:border-0 flex items-center gap-2">
                                <MapPin className="h-3.5 w-3.5 text-emerald-400/50 shrink-0" />{s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3 flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" /> Collection date <span className="text-red-400">*</span>
                    </p>
                    <input type="date" value={form.delivery_date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setForm(prev => ({ ...prev, delivery_date: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm [color-scheme:dark]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3 flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5" /> Expected delivery <span className="text-red-400">*</span>
                    </p>
                    <input type="date" value={form.expected_delivery_date}
                      min={form.delivery_date || new Date().toISOString().split('T')[0]}
                      onChange={e => { const v = e.target.value; if (form.delivery_date && v < form.delivery_date) return; setForm(prev => ({ ...prev, expected_delivery_date: v })); }}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm [color-scheme:dark]" />
                  </div>
                </div>

                {/* Goods */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3 flex items-center gap-2">
                    <Package className="h-3.5 w-3.5" /> Goods
                  </p>
                  <textarea value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what needs to be delivered"
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none mb-4" />
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-white/40 block mb-1.5">Weight (kg)</label>
                      <input value={form.weight} onChange={e => setForm(prev => ({ ...prev, weight: e.target.value }))}
                        placeholder="e.g. 5"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 block mb-1.5">Declared value (£)</label>
                      <input value={form.value} onChange={e => setForm(prev => ({ ...prev, value: e.target.value }))}
                        placeholder="e.g. 500" type="number" min="0"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 block mb-1.5">Category</label>
                      <select value={form.category} onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl bg-[#0a1628] border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm">
                        <option value="">Select category</option>
                        <option>Documents</option>
                        <option>Medical</option>
                        <option>Parts / Components</option>
                        <option>Electronics</option>
                        <option>Clothing / Fashion</option>
                        <option>Food / Perishables</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Insurance notice */}
                {goodsValue > 0 && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl px-5 py-4 border ${goodsValue > 1000 ? 'bg-orange-500/8 border-orange-500/25' : 'bg-emerald-500/8 border-emerald-500/20'}`}>
                    <div className="flex items-start gap-3">
                      <ShieldCheck className={`h-5 w-5 mt-0.5 flex-shrink-0 ${goodsValue > 1000 ? 'text-orange-400' : 'text-emerald-400'}`} />
                      <div>
                        {goodsValue > 1000 ? (
                          <>
                            <p className="text-orange-400 font-bold text-sm">Mandatory premium insurance required</p>
                            <p className="text-white/40 text-xs mt-1 leading-relaxed">
                              Goods declared at £{goodsValue.toLocaleString()} exceed the standard £1,000 coverage limit.
                              A mandatory insurance premium of <span className="text-orange-400 font-bold">8% (£{insuranceFee.toLocaleString()})</span> will be added to your delivery fee.
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-emerald-400 font-bold text-sm">Standard insurance included</p>
                            <p className="text-white/40 text-xs mt-1">Goods up to £1,000 are covered by our standard insurance at no extra charge.</p>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Urgency */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3 flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5" /> Urgency
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {(['same_day', 'next_day'] as const).map(u => (
                      <button key={u} onClick={() => setForm(prev => ({ ...prev, urgency: u }))}
                        className={`py-3.5 px-4 rounded-xl text-sm font-bold transition-all text-left ${form.urgency === u ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-black' : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'}`}>
                        <span className="block">{u === 'same_day' ? '⚡ Same Day' : '🌅 Next Morning'}</span>
                        <span className={`block text-xs font-semibold mt-0.5 ${form.urgency === u ? 'text-black/60' : 'text-white/30'}`}>
                          {u === 'same_day' ? '+20% surcharge applies' : 'Standard rate'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price estimate */}
                {estimate && (
                  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                    className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-6 py-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-0.5">Estimated delivery fee</p>
                        <p className="text-white/30 text-xs">
                          {form.delivery_type === 'international'
                            ? 'Airport-to-airport · exact quote on assignment'
                            : `${estimate.miles} miles · £200 per 30km band`}
                        </p>
                      </div>
                      <p className="text-emerald-400 font-black text-3xl">£{estimate.price.toLocaleString()}</p>
                    </div>
                    {sameDaySurcharge > 0 && (
                      <div className="flex items-center justify-between pt-3 border-t border-white/10">
                        <p className="text-emerald-400/80 text-xs font-semibold">⚡ Same-day surcharge (20%)</p>
                        <p className="text-emerald-400 font-bold text-sm">+£{sameDaySurcharge.toLocaleString()}</p>
                      </div>
                    )}
                    {insuranceFee > 0 && (
                      <div className={`flex items-center justify-between pt-3 ${sameDaySurcharge === 0 ? 'border-t border-white/10' : ''}`}>
                        <p className="text-orange-400/80 text-xs font-semibold">+ Mandatory insurance (8% of £{goodsValue.toLocaleString()})</p>
                        <p className="text-orange-400 font-bold text-sm">+£{insuranceFee.toLocaleString()}</p>
                      </div>
                    )}
                    {(insuranceFee > 0 || sameDaySurcharge > 0) && (
                      <div className="flex items-center justify-between pt-2 border-t border-white/10">
                        <p className="text-white/50 text-xs font-bold uppercase tracking-wider">Total estimate</p>
                        <p className="text-white font-black text-xl">£{totalPrice.toLocaleString()}</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* T&C acceptance */}
                <div className={`rounded-xl border px-5 py-4 transition-all ${termsAccepted ? 'bg-emerald-500/8 border-emerald-500/25' : 'bg-white/3 border-white/8'}`}>
                  {termsAccepted ? (
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                      <div>
                        <p className="text-emerald-400 font-bold text-sm">Terms & Conditions accepted</p>
                        <button onClick={() => setShowTerms(true)} className="text-white/30 hover:text-white/50 text-xs transition-colors mt-0.5">
                          Read again
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-white/30 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-white font-semibold text-sm mb-1">Terms & Conditions</p>
                        <p className="text-white/40 text-xs mb-3 leading-relaxed">
                          You must read and accept our T&Cs before submitting — covering retainers, insurance limits, pricing, liability, and cancellation.
                        </p>
                        <button onClick={() => setShowTerms(true)}
                          className="inline-flex items-center gap-2 text-sm font-bold text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-lg hover:bg-emerald-500/10 transition-all">
                          <FileText className="h-3.5 w-3.5" /> Read & Accept Terms
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {formError && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-300 text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" /> {formError}
                  </div>
                )}

                <button onClick={submitJob} disabled={formLoading}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black text-base hover:scale-[1.02] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {formLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                  {formLoading ? 'Submitting…' : 'Submit delivery request'}
                </button>

                <p className="text-white/15 text-xs text-center">
                  Fields marked <span className="text-red-400">*</span> are required · Insurance compulsory on all jobs
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════
            MY JOBS
        ══════════════════════════════════════════ */}
        {stage === 'jobs' && (
          <motion.div key="jobs" {...FADE} transition={{ duration: 0.3 }}>
            <nav className="px-8 py-5 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-4">
                <button onClick={() => setStage('portal')}
                  className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm font-semibold transition-colors">
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
                <div className="text-xl font-black tracking-tight">
                  Boot<span className="text-emerald-400">Hop</span>
                  <span className="ml-2 text-xs font-semibold bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full uppercase tracking-widest">My Jobs</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={loadMyJobs} disabled={jobsLoading}
                  className="inline-flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white/50 text-sm px-4 py-2.5 rounded-xl transition-all">
                  {jobsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />} Refresh
                </button>
                <button onClick={() => setStage('form')}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-black text-sm px-5 py-2.5 rounded-xl hover:scale-105 transition-all">
                  + New job
                </button>
                <button onClick={logout} title="Sign out"
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 text-white/30 transition-all">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </nav>

            <div className="max-w-4xl mx-auto px-8 py-10">
              {jobsLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 text-emerald-400 animate-spin" /></div>
              ) : myJobs.length === 0 ? (
                <div className="text-center py-20">
                  <Package className="h-12 w-12 text-white/10 mx-auto mb-4" />
                  <p className="text-white/30 font-semibold">No jobs yet</p>
                  <button onClick={() => setStage('form')}
                    className="mt-6 inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm font-bold transition-colors">
                    Book your first delivery <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myJobs.map(job => {
                    const statusColors: Record<string, string> = {
                      pending:    'text-amber-400 bg-amber-500/10 border-amber-500/20',
                      assigned:   'text-blue-400 bg-blue-500/10 border-blue-500/20',
                      in_transit: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
                      delivered:  'text-green-400 bg-green-500/10 border-green-500/20',
                      cancelled:  'text-red-400 bg-red-500/10 border-red-500/20',
                      failed:     'text-orange-400 bg-orange-500/10 border-orange-500/20',
                    };
                    const statusLabels: Record<string, string> = {
                      pending: 'Pending', assigned: 'Driver assigned', in_transit: 'In transit',
                      delivered: 'Delivered', cancelled: 'Cancelled', failed: 'Failed',
                    };
                    const canCancel = ['pending', 'assigned'].includes(job.status);
                    const fmt = (ts: string | null) => ts
                      ? new Date(ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                      : null;

                    return (
                      <div key={job.id} className="group relative overflow-hidden bg-white/3 border border-white/8 rounded-2xl p-6 transition-all duration-300 hover:border-emerald-500/30 hover:bg-white/5 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/8 active:scale-[0.98] touch-emerald">
                        <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 w-24 h-24 bg-emerald-500/15 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap mb-2">
                              <span className="font-mono font-black text-emerald-400 text-sm">{job.job_ref}</span>
                              <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${statusColors[job.status] ?? 'text-white/40 bg-white/5 border-white/10'}`}>
                                {statusLabels[job.status] ?? job.status}
                              </span>
                              {job.urgency === 'same_day' && (
                                <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold">⚡ Same day</span>
                              )}
                            </div>
                            <p className="text-white font-semibold text-sm mb-1">{job.pickup} → {job.dropoff}</p>
                            <p className="text-white/30 text-xs">{new Date(job.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            {job.driver_name && (
                              <div className="mt-3 flex items-center gap-2 text-xs text-blue-300">
                                <User className="h-3.5 w-3.5" />
                                <span>{job.driver_name}</span>
                                {job.driver_phone && <span>· {job.driver_phone}</span>}
                              </div>
                            )}
                            {(job.assigned_at || job.picked_up_at || job.delivered_at) && (
                              <div className="mt-3 space-y-1">
                                {job.assigned_at  && <p className="text-xs text-white/30">Assigned: {fmt(job.assigned_at)}</p>}
                                {job.picked_up_at && <p className="text-xs text-white/30">Collected: {fmt(job.picked_up_at)}</p>}
                                {job.delivered_at && <p className="text-xs text-green-400/60">Delivered: {fmt(job.delivered_at)}</p>}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            {job.estimated_price && (
                              <span className="text-emerald-400 font-black text-lg">£{job.estimated_price}</span>
                            )}
                            {canCancel && (
                              <button onClick={() => cancelJob(job.id)} disabled={cancellingId === job.id}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/30 hover:text-red-400 bg-white/5 border border-white/10 hover:border-red-500/20 hover:bg-red-500/10 px-3 py-2 rounded-xl transition-all disabled:opacity-50">
                                {cancellingId === job.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════
            SUCCESS
        ══════════════════════════════════════════ */}
        {stage === 'success' && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            className="min-h-screen flex items-center justify-center px-6">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-emerald-400" />
              </div>
              <h2 className="text-4xl font-black mb-3">Request submitted</h2>
              <p className="text-white/40 mb-8 leading-relaxed">
                Your delivery request has been received. Our team will match a carrier and be in touch shortly with confirmation and payment details.
              </p>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-8 py-5 inline-block mb-6">
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Job reference</p>
                <p className="text-emerald-400 font-mono font-black text-2xl tracking-widest">{jobRef}</p>
              </div>
              <p className="text-white/25 text-sm mb-8">Confirmation sent to <span className="text-white/40">{bizEmail}</span></p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => { setStage('form'); setFormError(null); setForm(EMPTY_FORM); setEstimate(null); setPickupCoords(null); setDropoffCoords(null); setQueryPickup(''); setQueryDropoff(''); setTermsAccepted(false); setTermsScrolled(false); }}
                  className="text-emerald-400 hover:text-emerald-300 text-sm font-bold transition-colors">
                  Submit another request →
                </button>
                <button onClick={() => { setStage('jobs'); loadMyJobs(); }}
                  className="text-white/40 hover:text-white text-sm font-semibold transition-colors">
                  View all my jobs →
                </button>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Floating WhatsApp — icon only, always visible */}
      <a href="/api/whatsapp"
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-2xl shadow-[#25D366]/40 hover:scale-110 active:scale-95 transition-all"
        aria-label="Chat on WhatsApp">
        <MessageCircle className="h-7 w-7" />
      </a>
    </div>
  );
}
