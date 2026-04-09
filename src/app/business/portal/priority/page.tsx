'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, Mail, ShieldCheck, CheckCircle, ArrowRight,
  Zap, Clock, MapPin, Package, Star, Building2, Truck,
  LogOut, List, XCircle, AlertCircle, User, ChevronLeft,
  Phone, Plane, Globe, FileText, AlertTriangle,
  MessageCircle, Pencil, X,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Pricing engine (identical to one-off portal)
// ─────────────────────────────────────────────────────────────────────────────
const UK_CITIES: Record<string, [number, number]> = {
  london:                    [51.5074, -0.1278],
  'central london':          [51.5074, -0.1278],
  birmingham:                [52.4862, -1.8904],
  manchester:                [53.4808, -2.2426],
  leeds:                     [53.8008, -1.5491],
  sheffield:                 [53.3811, -1.4701],
  liverpool:                 [53.4084, -2.9916],
  bristol:                   [51.4545, -2.5879],
  nottingham:                [52.9548, -1.1581],
  leicester:                 [52.6369, -1.1398],
  derby:                     [52.9225, -1.4746],
  coventry:                  [52.4068, -1.5197],
  edinburgh:                 [55.9533, -3.1883],
  glasgow:                   [55.8642, -4.2518],
  cardiff:                   [51.4816, -3.1791],
  cambridge:                 [52.2053,  0.1218],
  oxford:                    [51.7520, -1.2577],
  norwich:                   [52.6309,  1.2974],
  southampton:               [50.9097, -1.4044],
  portsmouth:                [50.8198, -1.0880],
  reading:                   [51.4543, -0.9781],
  newcastle:                 [54.9783, -1.6178],
  sunderland:                [54.9069, -1.3838],
  middlesbrough:             [54.5743, -1.2350],
  hull:                      [53.7457, -0.3367],
  york:                      [53.9600, -1.0873],
  bradford:                  [53.7960, -1.7594],
  stoke:                     [53.0027, -2.1794],
  exeter:                    [50.7184, -3.5339],
  brighton:                  [50.8229, -0.1363],
  ipswich:                   [52.0567,  1.1482],
  peterborough:              [52.5695, -0.2405],
  northampton:               [52.2405, -0.9027],
  heathrow:                  [51.4700, -0.4543],
  'heathrow airport':        [51.4700, -0.4543],
  lhr:                       [51.4700, -0.4543],
  gatwick:                   [51.1481, -0.1903],
  'gatwick airport':         [51.1481, -0.1903],
  lgw:                       [51.1481, -0.1903],
  stansted:                  [51.8860,  0.2389],
  'stansted airport':        [51.8860,  0.2389],
  stn:                       [51.8860,  0.2389],
  luton:                     [51.8747, -0.3683],
  'luton airport':           [51.8747, -0.3683],
  ltn:                       [51.8747, -0.3683],
  'east midlands airport':   [52.8311, -1.3281],
  ema:                       [52.8311, -1.3281],
  'manchester airport':      [53.3537, -2.2750],
  man:                       [53.3537, -2.2750],
  'birmingham airport':      [52.4539, -1.7480],
  bhx:                       [52.4539, -1.7480],
  'edinburgh airport':       [55.9500, -3.3725],
  edi:                       [55.9500, -3.3725],
  'glasgow airport':         [55.8719, -4.4330],
  gla:                       [55.8719, -4.4330],
};

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function milesToKm(miles: number): number { return miles * 1.60934; }

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

function calcLocalEstimate(
  pickup: string,
  dropoff: string,
): { price: number; miles: number } | null {
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
type Stage = 'loading' | 'portal' | 'form' | 'jobs' | 'success';
type DeliveryType = 'local_uk' | 'international';

type MyJob = {
  id: string;
  job_ref: string;
  company_name: string | null;
  pickup: string;
  dropoff: string;
  status: string;
  urgency: string;
  estimated_price: number | null;
  driver_name: string | null;
  driver_phone: string | null;
  assigned_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  created_at: string;
};

type JobForm = {
  company_name: string;
  phone: string;
  delivery_type: DeliveryType;
  pickup: string;
  dropoff: string;
  description: string;
  weight: string;
  value: string;
  category: string;
  urgency: 'same_day' | 'next_day';
  delivery_date: string;
  expected_delivery_date: string;
};

const EMPTY_FORM: JobForm = {
  company_name: '',
  phone: '',
  delivery_type: 'local_uk',
  pickup: '',
  dropoff: '',
  description: '',
  weight: '',
  value: '',
  category: '',
  urgency: 'same_day',
  delivery_date: '',
  expected_delivery_date: '',
};

const FADE = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -16 },
};

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
export default function PriorityPortalPage() {
  const router = useRouter();

  const [stage,          setStage]          = useState<Stage>('loading');
  const [bizEmail,       setBizEmail]       = useState('');
  const [companyName,    setCompanyName]    = useState('');
  const [partnerTier,    setPartnerTier]    = useState<string | null>(null);
  const [partnerDiscount,setPartnerDiscount]= useState<number | null>(null);
  const [jobRef,         setJobRef]         = useState('');

  const [form,           setForm]           = useState<JobForm>(EMPTY_FORM);
  const [estimate,       setEstimate]       = useState<{ price: number; miles: number } | null>(null);
  const [formLoading,    setFormLoading]    = useState(false);
  const [formError,      setFormError]      = useState<string | null>(null);
  const [myJobs,         setMyJobs]         = useState<MyJob[]>([]);
  const [jobsLoading,    setJobsLoading]    = useState(false);
  const [cancellingId,   setCancellingId]   = useState<string | null>(null);

  // Edit job modal
  type EditForm = { pickup: string; dropoff: string; description: string; urgency: 'same_day' | 'next_day'; delivery_date: string; expected_delivery_date: string };
  const EMPTY_EDIT: EditForm = { pickup: '', dropoff: '', description: '', urgency: 'same_day', delivery_date: '', expected_delivery_date: '' };
  const [editingJob,     setEditingJob]     = useState<MyJob | null>(null);
  const [editForm,       setEditForm]       = useState<EditForm>(EMPTY_EDIT);
  const [editLoading,    setEditLoading]    = useState(false);
  const [editError,      setEditError]      = useState<string | null>(null);

  const [showTerms,      setShowTerms]      = useState(false);
  const [termsScrolled,  setTermsScrolled]  = useState(false);
  const [termsAccepted,  setTermsAccepted]  = useState(false);

  const [mapsReady,      setMapsReady]      = useState(false);
  const [queryPickup,    setQueryPickup]    = useState('');
  const [pickupSugs,     setPickupSugs]     = useState<string[]>([]);
  const [queryDropoff,   setQueryDropoff]   = useState('');
  const [dropoffSugs,    setDropoffSugs]    = useState<string[]>([]);
  const [pickupCoords,   setPickupCoords]   = useState<[number, number] | null>(null);
  const [dropoffCoords,  setDropoffCoords]  = useState<[number, number] | null>(null);

  // ── Auth check ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/business/auth/me')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) {
          router.replace('/business');
          return;
        }
        if (d.partner_status !== 'active') {
          router.replace('/business/portal');
          return;
        }
        setBizEmail(d.email ?? '');
        if (d.company_name)     setCompanyName(d.company_name);
        if (d.partner_tier)     setPartnerTier(d.partner_tier);
        if (d.partner_discount) setPartnerDiscount(d.partner_discount);
        setStage('portal');
      })
      .catch(() => router.replace('/business'));
  }, [router]);

  // ── Price estimate ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (form.delivery_type === 'international') {
      setEstimate({ price: 1000, miles: 0 });
      return;
    }
    if (pickupCoords && dropoffCoords) {
      const miles = Math.round(haversine(pickupCoords[0], pickupCoords[1], dropoffCoords[0], dropoffCoords[1]));
      const km = milesToKm(miles);
      setEstimate({ price: localPriceFromKm(km), miles });
    } else if (form.pickup && form.dropoff) {
      setEstimate(calcLocalEstimate(form.pickup, form.dropoff));
    } else {
      setEstimate(null);
    }
  }, [form.pickup, form.dropoff, form.delivery_type, pickupCoords, dropoffCoords]);

  // ── Google Places ────────────────────────────────────────────────────────────
  useEffect(() => {
    if ((window as any).google?.maps?.places) {
      setMapsReady(true);
      return;
    }
    const t = setInterval(() => {
      if ((window as any).google?.maps?.places) {
        setMapsReady(true);
        clearInterval(t);
      }
    }, 300);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!mapsReady || queryPickup.length < 3) { setPickupSugs([]); return; }
    const t = setTimeout(() => {
      new (window as any).google.maps.places.AutocompleteService().getPlacePredictions(
        { input: queryPickup },
        (p: Array<{ description: string }> | null) =>
          setPickupSugs(p ? p.map(x => x.description) : []),
      );
    }, 300);
    return () => clearTimeout(t);
  }, [queryPickup, mapsReady]);

  useEffect(() => {
    if (!mapsReady || queryDropoff.length < 3) { setDropoffSugs([]); return; }
    const t = setTimeout(() => {
      new (window as any).google.maps.places.AutocompleteService().getPlacePredictions(
        { input: queryDropoff },
        (p: Array<{ description: string }> | null) =>
          setDropoffSugs(p ? p.map(x => x.description) : []),
      );
    }, 300);
    return () => clearTimeout(t);
  }, [queryDropoff, mapsReady]);

  // ── Auth ─────────────────────────────────────────────────────────────────────
  const logout = async () => {
    await fetch('/api/business/auth/logout', { method: 'POST' });
    router.replace('/business');
  };

  // ── Jobs ─────────────────────────────────────────────────────────────────────
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const j = await res.json();
      if (res.ok) {
        setMyJobs(prev => prev.map(job => job.id === id ? { ...job, status: 'cancelled' } : job));
      } else {
        alert(j.error || 'Could not cancel job.');
      }
    } catch { alert('Something went wrong.'); }
    finally { setCancellingId(null); }
  };

  const openEdit = (job: MyJob) => {
    setEditForm({
      pickup:                  job.pickup,
      dropoff:                 job.dropoff,
      description:             '',
      urgency:                 job.urgency as 'same_day' | 'next_day',
      delivery_date:           '',
      expected_delivery_date:  '',
    });
    setEditError(null);
    setEditingJob(job);
  };

  const saveEdit = async () => {
    if (!editingJob) return;
    if (!editForm.pickup || !editForm.dropoff) { setEditError('Pickup and drop-off are required.'); return; }
    setEditLoading(true);
    setEditError(null);
    try {
      const res = await fetch('/api/business/update-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingJob.id, ...editForm }),
      });
      const j = await res.json();
      if (!res.ok) { setEditError(j.error || 'Could not update job.'); return; }
      setMyJobs(prev => prev.map(job => job.id === editingJob.id
        ? { ...job, pickup: editForm.pickup, dropoff: editForm.dropoff, urgency: editForm.urgency }
        : job));
      setEditingJob(null);
    } catch { setEditError('Something went wrong.'); }
    finally { setEditLoading(false); }
  };

  // ── Computed ─────────────────────────────────────────────────────────────────
  const goodsValue       = parseFloat(form.value) || 0;
  const insuranceFee     = goodsValue > 1000 ? Math.round(goodsValue * 0.08) : 0;
  const sameDaySurcharge = form.urgency === 'same_day' ? Math.round((estimate?.price ?? 0) * 0.2) : 0;
  const baseTotal        = (estimate?.price ?? 0) + insuranceFee + sameDaySurcharge;
  // Apply volume discount if available
  const discountMultiplier = partnerDiscount ? (1 - partnerDiscount / 100) : 1;
  const totalPrice         = Math.round(baseTotal * discountMultiplier);

  // ── Submit ───────────────────────────────────────────────────────────────────
  const submitJob = async () => {
    if (!form.phone.trim())              { setFormError('Phone number is required.'); return; }
    if (!form.pickup || !form.dropoff)   { setFormError('Pickup and drop-off locations are required.'); return; }
    if (!form.delivery_date)             { setFormError('Collection date is required.'); return; }
    if (!form.expected_delivery_date)    { setFormError('Expected delivery date is required.'); return; }
    if (form.expected_delivery_date < form.delivery_date) {
      setFormError('Expected delivery date cannot be before the collection date.');
      return;
    }
    if (!termsAccepted) { setFormError('You must read and accept the Terms & Conditions.'); setShowTerms(true); return; }

    setFormError(null);
    setFormLoading(true);
    try {
      const res = await fetch('/api/business/create-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          company_name:           form.company_name || null,
          price:                  totalPrice || (form.delivery_type === 'international' ? 1000 : 200),
          miles:                  estimate?.miles ?? 0,
          insurance_fee:          insuranceFee,
          delivery_type:          form.delivery_type,
          delivery_date:          form.delivery_date,
          expected_delivery_date: form.expected_delivery_date,
          insurance:              true,
          priority:               true,
        }),
      });
      const j = await res.json();
      if (!res.ok) { setFormError(j.error || 'Something went wrong.'); return; }
      setJobRef(j.jobRef);
      setStage('success');
      setQueryPickup('');
      setQueryDropoff('');
    } catch { setFormError('Something went wrong.'); }
    finally { setFormLoading(false); }
  };

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (stage === 'loading') {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #020617 0%, #0c1e3d 50%, #020617 100%)' }}
      >
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Star className="h-8 w-8 text-amber-400" />
          </div>
          <p className="text-white/30 text-sm">Verifying Priority Partner access…</p>
        </div>
      </div>
    );
  }

  // ── Nav (amber-themed, shared across stages) ──────────────────────────────────
  const Nav = () => (
    <nav className="px-8 py-5 flex items-center justify-between border-b border-amber-500/10">
      <div className="flex items-center gap-3">
        <div className="text-xl font-black tracking-tight">
          Boot<span className="text-amber-400">Hop</span>
          <span className="ml-2 text-xs font-semibold bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full uppercase tracking-widest">
            Business
          </span>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-black bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-full uppercase tracking-widest">
          <Star className="h-3 w-3" /> Priority Partner
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-white/30 text-xs hidden md:block">{bizEmail}</span>
        <button
          onClick={() => { setStage('jobs'); loadMyJobs(); }}
          className="inline-flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 font-semibold text-sm px-4 py-2.5 rounded-xl transition-all"
        >
          <List className="h-4 w-4" /> My Jobs
        </button>
        <button
          onClick={() => setStage('form')}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-400 text-black font-black text-sm px-5 py-2.5 rounded-xl hover:scale-105 transition-all"
        >
          Book a Delivery <ArrowRight className="h-4 w-4" />
        </button>
        <button
          onClick={logout}
          title="Sign out"
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 text-white/30 transition-all"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background: 'linear-gradient(135deg, #020617 0%, #0c1e3d 50%, #020617 100%)',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* ── T&C MODAL ── */}
      <AnimatePresence>
        {showTerms && (
          <motion.div
            key="terms-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 16 }}
              className="bg-[#0a1628] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col"
            >
              <div className="px-8 py-6 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">Terms &amp; Conditions</h3>
                    <p className="text-white/40 text-xs mt-0.5">
                      BootHop Business — please read in full before accepting
                    </p>
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
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 text-black font-black text-sm disabled:opacity-30 transition-all"
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

        {/* ══ PRIORITY PORTAL DASHBOARD ══ */}
        {stage === 'portal' && (
          <motion.div key="portal" {...FADE} transition={{ duration: 0.4 }}>
            <Nav />
            <div className="max-w-5xl mx-auto px-8 py-16">

              {/* Badges row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-wrap items-center gap-2 mb-6"
              >
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-full uppercase tracking-widest">
                  <CheckCircle className="h-3.5 w-3.5" /> Verified Business
                </div>
                <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest">
                  <Star className="h-3.5 w-3.5" /> Priority Partner
                </div>
                {partnerTier === 'elite' && (
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/40 text-amber-300 text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest">
                    <Star className="h-3.5 w-3.5" /> Elite
                  </div>
                )}
              </motion.div>

              {/* Big welcome */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mb-12"
              >
                <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-4">
                  Welcome back,<br />
                  <span className="text-amber-400">
                    {companyName || bizEmail || 'Priority Partner.'}
                  </span>
                </h1>
                <p className="text-white/40 text-lg max-w-2xl">
                  You have{' '}
                  <span className="text-amber-400 font-bold">{partnerDiscount ?? 0}% volume discount</span>{' '}
                  and{' '}
                  <span className="text-amber-400 font-bold">2-hour priority response</span>{' '}
                  on every request.
                </p>
              </motion.div>

              {/* 4 priority perks cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-12"
              >
                {[
                  {
                    icon: Clock,
                    title: '2-hour response',
                    body: 'Every request answered within 2 hours, guaranteed.',
                  },
                  {
                    icon: User,
                    title: 'Account manager',
                    body: 'A dedicated named contact at BootHop, just for you.',
                  },
                  {
                    icon: Zap,
                    title: 'Priority matching',
                    body: 'Your jobs jump to the front of our carrier network.',
                  },
                  {
                    icon: ShieldCheck,
                    title: `${partnerDiscount ?? 0}% discount active`,
                    body: 'Volume discount automatically applied to every job.',
                  },
                ].map(({ icon: Icon, title, body }) => (
                  <div
                    key={title}
                    className="group relative overflow-hidden bg-white/3 border border-white/8 rounded-2xl p-6 transition-all duration-300 hover:border-amber-500/30 hover:bg-white/5 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10 active:scale-[0.98]"
                  >
                    <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 w-20 h-20 bg-amber-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="h-4 w-4 text-amber-400" />
                    </div>
                    <p className="text-white font-bold text-sm mb-2 group-hover:text-amber-300 transition-colors duration-300">
                      {title}
                    </p>
                    <p className="text-white/40 text-xs leading-relaxed">{body}</p>
                  </div>
                ))}
              </motion.div>

              {/* CTA row: two big action cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="grid sm:grid-cols-2 gap-4"
              >
                <button
                  onClick={() => setStage('form')}
                  className="group relative overflow-hidden bg-white/3 border border-white/8 rounded-2xl p-8 text-left transition-all duration-300 hover:border-amber-500/30 hover:bg-white/5 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10 active:scale-[0.98]"
                >
                  <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 w-20 h-20 bg-amber-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Truck className="h-5 w-5 text-amber-400" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-black bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full uppercase tracking-widest">
                      <Star className="h-3 w-3" /> Priority
                    </span>
                  </div>
                  <h3 className="text-white font-black text-xl mb-2 group-hover:text-amber-300 transition-colors duration-300">
                    Book a Priority Delivery
                  </h3>
                  <p className="text-white/40 text-sm leading-relaxed mb-5">
                    Carrier assigned within 2 hours. Your{' '}
                    {partnerDiscount ? `${partnerDiscount}% discount` : 'volume discount'} applied automatically.
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-amber-400 text-sm font-black">
                    Book now <ArrowRight className="h-4 w-4" />
                  </span>
                </button>

                <button
                  onClick={() => { setStage('jobs'); loadMyJobs(); }}
                  className="group relative overflow-hidden bg-white/3 border border-white/8 rounded-2xl p-8 text-left transition-all duration-300 hover:border-amber-500/30 hover:bg-white/5 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10 active:scale-[0.98]"
                >
                  <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 w-20 h-20 bg-amber-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <List className="h-5 w-5 text-amber-400" />
                  </div>
                  <h3 className="text-white font-black text-xl mb-2 group-hover:text-amber-300 transition-colors duration-300">
                    My Jobs
                  </h3>
                  <p className="text-white/40 text-sm leading-relaxed mb-5">
                    Track all your priority delivery requests, statuses, and assigned carriers.
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-amber-400 text-sm font-black">
                    View jobs <ArrowRight className="h-4 w-4" />
                  </span>
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* ══ DELIVERY FORM (amber-themed) ══ */}
        {stage === 'form' && (
          <motion.div key="form" {...FADE} className="px-6 py-10">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setStage('portal')}
                    className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm font-semibold transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" /> Back
                  </button>
                  <div>
                    <h1 className="text-3xl font-black">Boot<span className="text-amber-400">Hop</span> Business</h1>
                    <p className="text-white/30 text-sm mt-0.5">New priority delivery request</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-2 text-xs text-white/30 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                    <Star className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-amber-400 font-bold">Priority Job</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/30 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-amber-400 font-semibold">{bizEmail}</span>
                  </div>
                  <button
                    onClick={logout}
                    title="Sign out"
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 text-white/30 transition-all"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Priority badge */}
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-black px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
                <Star className="h-3.5 w-3.5" /> Priority Job — 2-hour carrier assignment
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
                      <button
                        key={opt.value}
                        onClick={() => setForm(prev => ({ ...prev, delivery_type: opt.value }))}
                        className={`py-3 px-4 rounded-xl text-left transition-all ${
                          form.delivery_type === opt.value
                            ? 'bg-gradient-to-r from-amber-400/20 to-orange-400/10 border-2 border-amber-400/40'
                            : 'bg-white/5 border border-white/10 hover:bg-white/8'
                        }`}
                      >
                        <p className={`font-bold text-sm ${form.delivery_type === opt.value ? 'text-white' : 'text-white/60'}`}>
                          {opt.label}
                        </p>
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
                    <input
                      value={form.company_name}
                      onChange={e => setForm(prev => ({ ...prev, company_name: e.target.value }))}
                      placeholder="Your company name (optional)"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3 flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5" /> Contact phone <span className="text-red-400">*</span>
                    </p>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+44 7700 000000"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                    />
                  </div>
                </div>

                {/* Route */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3 flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" /> Route
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-white/40 block mb-1.5">
                        Pickup location <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          value={queryPickup}
                          onChange={e => {
                            setQueryPickup(e.target.value);
                            setForm(prev => ({ ...prev, pickup: e.target.value }));
                            setPickupCoords(null);
                          }}
                          onBlur={() => setPickupSugs([])}
                          autoComplete="off"
                          placeholder={
                            form.delivery_type === 'international'
                              ? 'e.g. Heathrow Airport (LHR)'
                              : 'e.g. Nottingham city centre'
                          }
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                        />
                        {pickupSugs.length > 0 && (
                          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#0a1628] border border-white/15 rounded-xl overflow-hidden shadow-2xl">
                            {pickupSugs.slice(0, 6).map((s, i) => (
                              <button
                                key={i}
                                type="button"
                                onMouseDown={e => {
                                  e.preventDefault();
                                  setQueryPickup(s);
                                  setForm(prev => ({ ...prev, pickup: s }));
                                  setPickupSugs([]);
                                  const coords = detectCity(s);
                                  if (coords) setPickupCoords(coords);
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm text-white/70 hover:bg-white/8 hover:text-white transition-colors border-b border-white/5 last:border-0 flex items-center gap-2"
                              >
                                <MapPin className="h-3.5 w-3.5 text-amber-400/50 shrink-0" />{s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-white/40 block mb-1.5">
                        Drop-off location <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          value={queryDropoff}
                          onChange={e => {
                            setQueryDropoff(e.target.value);
                            setForm(prev => ({ ...prev, dropoff: e.target.value }));
                            setDropoffCoords(null);
                          }}
                          onBlur={() => setDropoffSugs([])}
                          autoComplete="off"
                          placeholder={
                            form.delivery_type === 'international'
                              ? 'e.g. Murtala Muhammed Airport (LOS)'
                              : 'e.g. London EC2A'
                          }
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                        />
                        {dropoffSugs.length > 0 && (
                          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#0a1628] border border-white/15 rounded-xl overflow-hidden shadow-2xl">
                            {dropoffSugs.slice(0, 6).map((s, i) => (
                              <button
                                key={i}
                                type="button"
                                onMouseDown={e => {
                                  e.preventDefault();
                                  setQueryDropoff(s);
                                  setForm(prev => ({ ...prev, dropoff: s }));
                                  setDropoffSugs([]);
                                  const coords = detectCity(s);
                                  if (coords) setDropoffCoords(coords);
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm text-white/70 hover:bg-white/8 hover:text-white transition-colors border-b border-white/5 last:border-0 flex items-center gap-2"
                              >
                                <MapPin className="h-3.5 w-3.5 text-amber-400/50 shrink-0" />{s}
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
                    <input
                      type="date"
                      value={form.delivery_date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setForm(prev => ({ ...prev, delivery_date: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3 flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5" /> Expected delivery <span className="text-red-400">*</span>
                    </p>
                    <input
                      type="date"
                      value={form.expected_delivery_date}
                      min={form.delivery_date || new Date().toISOString().split('T')[0]}
                      onChange={e => {
                        const v = e.target.value;
                        if (form.delivery_date && v < form.delivery_date) return;
                        setForm(prev => ({ ...prev, expected_delivery_date: v }));
                      }}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm [color-scheme:dark]"
                    />
                  </div>
                </div>

                {/* Goods */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3 flex items-center gap-2">
                    <Package className="h-3.5 w-3.5" /> Goods
                  </p>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what needs to be delivered"
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm resize-none mb-4"
                  />
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-white/40 block mb-1.5">Weight (kg)</label>
                      <input
                        value={form.weight}
                        onChange={e => setForm(prev => ({ ...prev, weight: e.target.value }))}
                        placeholder="e.g. 5"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 block mb-1.5">Declared value (£)</label>
                      <input
                        value={form.value}
                        onChange={e => setForm(prev => ({ ...prev, value: e.target.value }))}
                        placeholder="e.g. 500"
                        type="number"
                        min="0"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 block mb-1.5">Category</label>
                      <select
                        value={form.category}
                        onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl bg-[#0a1628] border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                      >
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
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl px-5 py-4 border ${goodsValue > 1000 ? 'bg-orange-500/8 border-orange-500/25' : 'bg-emerald-500/8 border-emerald-500/20'}`}
                  >
                    <div className="flex items-start gap-3">
                      <ShieldCheck className={`h-5 w-5 mt-0.5 flex-shrink-0 ${goodsValue > 1000 ? 'text-orange-400' : 'text-emerald-400'}`} />
                      <div>
                        {goodsValue > 1000 ? (
                          <>
                            <p className="text-orange-400 font-bold text-sm">Mandatory premium insurance required</p>
                            <p className="text-white/40 text-xs mt-1 leading-relaxed">
                              Goods declared at £{goodsValue.toLocaleString()} exceed the standard £1,000 coverage limit.
                              A mandatory insurance premium of{' '}
                              <span className="text-orange-400 font-bold">8% (£{insuranceFee.toLocaleString()})</span>{' '}
                              will be added to your delivery fee.
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-emerald-400 font-bold text-sm">Standard insurance included</p>
                            <p className="text-white/40 text-xs mt-1">
                              Goods up to £1,000 are covered by our standard insurance at no extra charge.
                            </p>
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
                      <button
                        key={u}
                        onClick={() => setForm(prev => ({ ...prev, urgency: u }))}
                        className={`py-3.5 px-4 rounded-xl text-sm font-bold transition-all text-left ${
                          form.urgency === u
                            ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-black'
                            : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'
                        }`}
                      >
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
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-6 py-5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-0.5">Estimated delivery fee</p>
                        <p className="text-white/30 text-xs">
                          {form.delivery_type === 'international'
                            ? 'Airport-to-airport · exact quote on assignment'
                            : `${estimate.miles} miles · £200 per 30km band`}
                        </p>
                      </div>
                      <p className="text-amber-400 font-black text-3xl">£{estimate.price.toLocaleString()}</p>
                    </div>
                    {sameDaySurcharge > 0 && (
                      <div className="flex items-center justify-between pt-3 border-t border-white/10">
                        <p className="text-amber-400/80 text-xs font-semibold">⚡ Same-day surcharge (20%)</p>
                        <p className="text-amber-400 font-bold text-sm">+£{sameDaySurcharge.toLocaleString()}</p>
                      </div>
                    )}
                    {insuranceFee > 0 && (
                      <div className={`flex items-center justify-between pt-3 ${sameDaySurcharge === 0 ? 'border-t border-white/10' : ''}`}>
                        <p className="text-orange-400/80 text-xs font-semibold">
                          + Mandatory insurance (8% of £{goodsValue.toLocaleString()})
                        </p>
                        <p className="text-orange-400 font-bold text-sm">+£{insuranceFee.toLocaleString()}</p>
                      </div>
                    )}
                    {partnerDiscount && partnerDiscount > 0 && (
                      <div className="flex items-center justify-between pt-3 border-t border-white/10">
                        <p className="text-amber-400/80 text-xs font-semibold">
                          <Star className="h-3 w-3 inline mr-1" />
                          Priority Partner discount ({partnerDiscount}%)
                        </p>
                        <p className="text-amber-400 font-bold text-sm">
                          −£{Math.round(baseTotal * partnerDiscount / 100).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {(insuranceFee > 0 || sameDaySurcharge > 0 || (partnerDiscount && partnerDiscount > 0)) && (
                      <div className="flex items-center justify-between pt-2 border-t border-white/10">
                        <p className="text-white/50 text-xs font-bold uppercase tracking-wider">Total estimate</p>
                        <p className="text-white font-black text-xl">£{totalPrice.toLocaleString()}</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* T&C acceptance */}
                <div className={`rounded-xl border px-5 py-4 transition-all ${termsAccepted ? 'bg-amber-500/8 border-amber-500/25' : 'bg-white/3 border-white/8'}`}>
                  {termsAccepted ? (
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-amber-400 flex-shrink-0" />
                      <div>
                        <p className="text-amber-400 font-bold text-sm">Terms &amp; Conditions accepted</p>
                        <button
                          onClick={() => setShowTerms(true)}
                          className="text-white/30 hover:text-white/50 text-xs transition-colors mt-0.5"
                        >
                          Read again
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-white/30 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-white font-semibold text-sm mb-1">Terms &amp; Conditions</p>
                        <p className="text-white/40 text-xs mb-3 leading-relaxed">
                          You must read and accept our T&Cs before submitting — covering retainers, insurance limits,
                          pricing, liability, and cancellation.
                        </p>
                        <button
                          onClick={() => setShowTerms(true)}
                          className="inline-flex items-center gap-2 text-sm font-bold text-amber-400 border border-amber-500/30 px-4 py-2 rounded-lg hover:bg-amber-500/10 transition-all"
                        >
                          <FileText className="h-3.5 w-3.5" /> Read &amp; Accept Terms
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

                <button
                  onClick={submitJob}
                  disabled={formLoading}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 text-black font-black text-base hover:scale-[1.02] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {formLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                  {formLoading ? 'Submitting…' : 'Submit priority delivery request'}
                </button>

                <p className="text-white/15 text-xs text-center">
                  Fields marked <span className="text-red-400">*</span> are required · Insurance compulsory on all jobs
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══ MY JOBS (amber-themed) ══ */}
        {stage === 'jobs' && (
          <motion.div key="jobs" {...FADE} transition={{ duration: 0.3 }}>
            <nav className="px-8 py-5 flex items-center justify-between border-b border-amber-500/10">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setStage('portal')}
                  className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm font-semibold transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
                <div className="flex items-center gap-3">
                  <div className="text-xl font-black tracking-tight">
                    Boot<span className="text-amber-400">Hop</span>
                    <span className="ml-2 text-xs font-semibold bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full uppercase tracking-widest">
                      My Jobs
                    </span>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs font-black bg-amber-500/15 text-amber-400 border border-amber-500/25 px-2.5 py-1 rounded-full uppercase tracking-widest">
                    <Star className="h-3 w-3" /> Priority
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={loadMyJobs}
                  disabled={jobsLoading}
                  className="inline-flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white/50 text-sm px-4 py-2.5 rounded-xl transition-all"
                >
                  {jobsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />} Refresh
                </button>
                <button
                  onClick={() => setStage('form')}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-400 text-black font-black text-sm px-5 py-2.5 rounded-xl hover:scale-105 transition-all"
                >
                  + New job
                </button>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 text-white/30 transition-all"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </nav>

            <div className="max-w-4xl mx-auto px-8 py-10">
              {jobsLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
                </div>
              ) : myJobs.length === 0 ? (
                <div className="text-center py-20">
                  <Package className="h-12 w-12 text-white/10 mx-auto mb-4" />
                  <p className="text-white/30 font-semibold">No jobs yet</p>
                  <button
                    onClick={() => setStage('form')}
                    className="mt-6 inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 text-sm font-bold transition-colors"
                  >
                    Book your first priority delivery <ArrowRight className="h-4 w-4" />
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
                      pending: 'Pending — awaiting assignment', assigned: 'Driver assigned', in_transit: 'In transit',
                      delivered: 'Delivered ✓', cancelled: 'Cancelled', failed: 'Failed delivery',
                    };
                    const canCancel = ['pending', 'assigned'].includes(job.status);
                    const canEdit   = ['pending', 'assigned'].includes(job.status);
                    const fmt = (ts: string | null) =>
                      ts
                        ? new Date(ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                        : null;

                    return (
                      <div
                        key={job.id}
                        className="group relative overflow-hidden bg-white/3 border border-white/8 rounded-2xl p-6 transition-all duration-300 hover:border-amber-500/30 hover:bg-white/5 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/8 active:scale-[0.98]"
                      >
                        <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 w-24 h-24 bg-amber-500/15 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap mb-2">
                              <span className="font-mono font-black text-amber-400 text-sm">{job.job_ref}</span>
                              <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${statusColors[job.status] ?? 'text-white/40 bg-white/5 border-white/10'}`}>
                                {statusLabels[job.status] ?? job.status}
                              </span>
                              <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                                <Star className="h-3 w-3" /> Priority
                              </span>
                              {job.urgency === 'same_day' && (
                                <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold">⚡ Same day</span>
                              )}
                            </div>
                            <p className="text-white font-semibold text-sm mb-1">{job.pickup} → {job.dropoff}</p>
                            <p className="text-white/30 text-xs">
                              {new Date(job.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
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
                          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                            {job.estimated_price !== null && (
                              <span className="text-amber-400 font-black text-lg">£{job.estimated_price}</span>
                            )}
                            {canEdit && (
                              <button
                                onClick={() => openEdit(job)}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/40 hover:text-amber-400 bg-white/5 border border-white/10 hover:border-amber-500/20 hover:bg-amber-500/10 px-3 py-2 rounded-xl transition-all"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Amend
                              </button>
                            )}
                            {canCancel && (
                              <button
                                onClick={() => cancelJob(job.id)}
                                disabled={cancellingId === job.id}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/30 hover:text-red-400 bg-white/5 border border-white/10 hover:border-red-500/20 hover:bg-red-500/10 px-3 py-2 rounded-xl transition-all disabled:opacity-50"
                              >
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

        {/* ══ SUCCESS (amber-themed) ══ */}
        {stage === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="min-h-screen flex items-center justify-center px-6"
          >
            <div className="text-center max-w-md">
              <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-amber-400" />
              </div>
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-black px-4 py-2 rounded-full mb-4 uppercase tracking-widest">
                <Star className="h-3.5 w-3.5" /> Priority Job Submitted
              </div>
              <h2 className="text-4xl font-black mb-3">Request submitted</h2>
              <p className="text-white/40 mb-4 leading-relaxed">
                Your priority delivery request has been received.
              </p>
              <p className="text-amber-400/80 text-sm mb-8 leading-relaxed">
                Your job has been flagged as Priority — expect a carrier assigned within 2 hours.
              </p>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-8 py-5 inline-block mb-6">
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Job reference</p>
                <p className="text-amber-400 font-mono font-black text-2xl tracking-widest">{jobRef}</p>
              </div>
              <p className="text-white/25 text-sm mb-8">
                Confirmation sent to <span className="text-white/40">{bizEmail}</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    setStage('form');
                    setFormError(null);
                    setForm(EMPTY_FORM);
                    setEstimate(null);
                    setPickupCoords(null);
                    setDropoffCoords(null);
                    setQueryPickup('');
                    setQueryDropoff('');
                    setTermsAccepted(false);
                    setTermsScrolled(false);
                  }}
                  className="text-amber-400 hover:text-amber-300 text-sm font-bold transition-colors"
                >
                  Submit another request →
                </button>
                <button
                  onClick={() => { setStage('jobs'); loadMyJobs(); }}
                  className="text-white/40 hover:text-white text-sm font-semibold transition-colors"
                >
                  View all my jobs →
                </button>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* WhatsApp FAB */}
      <a
        href="/api/whatsapp"
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-2xl shadow-[#25D366]/40 hover:scale-110 active:scale-95 transition-all"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="h-7 w-7" />
      </a>

      {/* ── Edit job modal ── */}
      {editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-lg bg-[#0d1117] border border-amber-500/20 rounded-2xl p-6 shadow-2xl"
          >
            <button
              onClick={() => setEditingJob(null)}
              className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-lg font-black">Amend priority job</h3>
              <span className="text-xs bg-amber-500/10 border border-amber-500/25 text-amber-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Priority</span>
            </div>
            <p className="text-white/30 text-xs mb-6 font-mono">{editingJob.job_ref}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5">Pickup location</label>
                <input
                  type="text"
                  value={editForm.pickup}
                  onChange={e => setEditForm(f => ({ ...f, pickup: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5">Drop-off location</label>
                <input
                  type="text"
                  value={editForm.dropoff}
                  onChange={e => setEditForm(f => ({ ...f, dropoff: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5">Description (optional)</label>
                <textarea
                  rows={2}
                  value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 transition-colors resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5">Urgency</label>
                  <select
                    value={editForm.urgency}
                    onChange={e => setEditForm(f => ({ ...f, urgency: e.target.value as 'same_day' | 'next_day' }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                  >
                    <option value="same_day" className="bg-[#0d1117]">Same day</option>
                    <option value="next_day" className="bg-[#0d1117]">Next day</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5">Collection date</label>
                  <input
                    type="date"
                    value={editForm.delivery_date}
                    onChange={e => setEditForm(f => ({ ...f, delivery_date: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-1.5">Expected delivery date</label>
                <input
                  type="date"
                  value={editForm.expected_delivery_date}
                  onChange={e => setEditForm(f => ({ ...f, expected_delivery_date: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                />
              </div>
            </div>

            {editError && (
              <p className="mt-4 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />{editError}
              </p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingJob(null)}
                className="flex-1 text-sm font-semibold text-white/30 hover:text-white bg-white/5 border border-white/10 hover:border-white/20 px-4 py-3 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={editLoading}
                className="flex-1 text-sm font-black text-black bg-amber-400 hover:bg-amber-300 px-4 py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save changes'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
