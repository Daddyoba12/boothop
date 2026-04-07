'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, ExternalLink, CheckCircle, Loader2, ShieldCheck, Scale } from 'lucide-react';
import NavBar from '@/components/NavBar';

// ── Prohibited-items links per region ──────────────────────────────────────
function getProhibitedLink(toCity: string): { label: string; url: string }[] {
  const lower = toCity?.toLowerCase() ?? '';
  const links: { label: string; url: string }[] = [
    { label: 'UK Government — Prohibited & Restricted Goods', url: 'https://www.gov.uk/guidance/import-controls' },
    { label: 'UK Border Force — Banned & Restricted Goods',  url: 'https://www.gov.uk/bringing-goods-into-great-britain-from-outside-the-uk-the-rules-you-need-to-follow' },
  ];
  if (lower.includes('nigeria') || lower.includes('lagos') || lower.includes('abuja')) {
    links.push({ label: 'Nigeria Customs — Prohibited Imports', url: 'https://www.customs.gov.ng/ProhibitedGoods/index.php' });
  } else if (lower.includes('ghana') || lower.includes('accra')) {
    links.push({ label: 'Ghana Customs — Restricted Items', url: 'https://www.gra.gov.gh/customs/' });
  } else if (lower.includes('kenya') || lower.includes('nairobi')) {
    links.push({ label: 'Kenya Revenue Authority — Prohibited Goods', url: 'https://www.kra.go.ke/en/individual/filing-paying/types-of-taxes/customs-border-control/prohibited-restricted-goods' });
  } else if (lower.includes('dubai') || lower.includes('uae') || lower.includes('abu dhabi')) {
    links.push({ label: 'UAE — Prohibited & Restricted Goods', url: 'https://www.dubaitrade.ae/services/customs-services/prohibited-restricted-goods' });
  }
  return links;
}

// ── Full T&C text ──────────────────────────────────────────────────────────
const TC_SECTIONS = [
  {
    title: '1. DEFINITIONS',
    content: [
      '"Platform" means the BootHop website and services operated by BootHop Limited.',
      '"Sender" (Hooper) means a user requesting delivery of an item.',
      '"Carrier" (Booter) means a user agreeing to transport an item.',
      '"Transaction" means an agreed delivery arrangement between Sender and Carrier facilitated by BootHop.',
      '"Prohibited Items" means any goods restricted or illegal under applicable law, including but not limited to controlled substances, weapons, hazardous materials, and undeclared currency.',
      '"Verification Services" includes identity verification providers such as Onfido and payment processors such as Stripe.',
    ],
  },
  {
    title: '2. PLATFORM ROLE',
    content: [
      'BootHop acts solely as a technology intermediary connecting Senders and Carriers.',
      'BootHop does not take possession of goods at any time.',
      'BootHop does not guarantee delivery, legality, or condition of any item.',
      'All Transactions are contracts directly between Sender and Carrier.',
    ],
  },
  {
    title: '3. USER ONBOARDING & VERIFICATION',
    content: [
      'All users must: provide accurate personal information; verify identity via approved services (e.g. Onfido); provide valid contact and identification documents.',
      'BootHop reserves the right to approve, reject, or suspend any user and to request additional verification at any time.',
    ],
  },
  {
    title: '4. TRANSACTION FLOW & PAYMENT ESCROW',
    content: [
      'Users may only provide email address at initial matching stage.',
      'Full personal details (phone, address) are withheld until: payment is made and held in escrow via Stripe; both parties accept these Terms; identity verification is completed.',
      'Upon successful completion, BootHop releases contact details to both parties and the Transaction becomes active.',
      'Funds are held in escrow and released only when delivery is confirmed or BootHop determines completion based on evidence.',
    ],
  },
  {
    title: '5. MANDATORY INSPECTION & PROOF OF CONTENTS',
    content: [
      'The Sender must present all items in an open and inspectable condition.',
      'The Carrier must physically inspect the contents prior to acceptance.',
      'The following is mandatory: visual inspection of all goods; photo and/or video recording of contents ("Proof of Contents"); accurate declaration of all items.',
      'BootHop strictly prohibits sealed suitcases, locked containers, or items that cannot be inspected.',
      'BootHop may store Proof of Contents for dispute resolution and legal compliance.',
    ],
  },
  {
    title: '6. OPTIONAL SECURITY SCANNING',
    content: [
      'BootHop may require additional screening for certain items.',
      'Such screening must be conducted by authorised third-party facilities, including recognised logistics providers such as DHL or UPS.',
      'Any additional screening is at the Sender\'s cost, must be agreed voluntarily, and does not replace mandatory physical inspection.',
    ],
  },
  {
    title: '7. PROHIBITED ITEMS & LEGAL COMPLIANCE',
    content: [
      'Senders must not list or provide Prohibited Items.',
      'Users must comply with all applicable laws including: Misuse of Drugs Act 1971; UK customs and border regulations; destination country import/export laws.',
      'The Sender warrants that all items are legal and all declarations are accurate.',
      'The Carrier acknowledges they act as the transporting party and may be held legally responsible at borders.',
    ],
  },
  {
    title: '8. RIGHT TO REFUSE & TERMINATE',
    content: [
      'The Carrier may refuse any item without obligation.',
      'BootHop may cancel any Transaction where items appear suspicious, Terms are breached, or compliance concerns arise.',
    ],
  },
  {
    title: '9. LIABILITY & RISK ALLOCATION',
    content: [
      'The Sender assumes full liability for illegal or misdeclared goods and any resulting legal consequences.',
      'The Carrier assumes risk for transporting accepted goods and compliance during transit.',
      'BootHop shall not be liable for loss, damage, delay, legal consequences arising from Transactions, or actions of users.',
    ],
  },
  {
    title: '10. DISPUTES',
    content: [
      'Disputes must be submitted via the Platform.',
      'BootHop may review Proof of Contents, communication logs, and delivery evidence.',
      'BootHop may release or withhold escrow funds, issue partial refunds, or suspend accounts.',
      'BootHop\'s decision shall be final and binding.',
    ],
  },
  {
    title: '11. REFUNDS & CANCELLATIONS',
    content: [
      'Cancellation before escrow: No obligation.',
      'After escrow but before handover: Refund subject to administrative fees.',
      'After handover: No refund unless dispute is upheld.',
    ],
  },
  {
    title: '12. DATA & PRIVACY',
    content: [
      'BootHop stores identity data, transaction data, and Proof of Contents.',
      'Data is used for compliance, fraud prevention, and legal obligations.',
    ],
  },
  {
    title: '13. ENFORCEMENT & PENALTIES',
    content: [
      'Breach of these Terms may result in: immediate account suspension; permanent ban; reporting to authorities.',
      'BootHop may cooperate with law enforcement and border agencies.',
    ],
  },
  {
    title: '14. ACCEPTANCE OF TERMS',
    content: [
      'By proceeding with any Transaction, users confirm that they have read and understood these Terms, accept all compliance obligations, acknowledge risks associated with transporting goods, and consent to identity verification and data storage.',
    ],
  },
];

// ── Page component ─────────────────────────────────────────────────────────
function CommitContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const matchId      = searchParams.get('matchId');

  const [match,    setMatch]    = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [checked,  setChecked]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done,     setDone]     = useState(false);
  const [waitingOther, setWaitingOther] = useState(false);

  useEffect(() => {
    if (!matchId) { setError('No match ID provided.'); setLoading(false); return; }
    fetch(`/api/matches/${matchId}/details`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setMatch(d); })
      .catch(() => setError('Could not load match details.'))
      .finally(() => setLoading(false));
  }, [matchId]);

  async function handleSubmit() {
    if (!checked || !matchId) return;
    setSubmitting(true);
    try {
      const res  = await fetch('/api/terms/accept', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ matchId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong.'); return; }
      if (data.bothAccepted) {
        router.replace(data.redirectTo || `/kyc?matchId=${matchId}`);
      } else {
        setDone(true);
        setWaitingOther(true);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const trip            = match?.sender_trip ?? match?.trip ?? {};
  const fromCity        = trip.from_city ?? match?.from_city ?? '';
  const toCity          = trip.to_city   ?? match?.to_city   ?? '';
  const travelDate      = trip.travel_date ?? match?.travel_date ?? '';
  const agreedPrice     = match?.agreed_price ?? 0;
  const prohibitedLinks = getProhibitedLink(toCity);

  const dateStr = travelDate
    ? new Date(travelDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      <NavBar />

      <main className="max-w-2xl mx-auto px-4 pt-28 pb-24">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 rounded-full px-5 py-2 mb-4">
            <Scale className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300 font-medium">Step 3 of 7 — Terms & Conditions</span>
          </div>
          <h1 className="text-3xl font-black mb-2">Read & Accept Terms</h1>
          <p className="text-slate-400">Both parties must accept before proceeding to identity verification.</p>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {waitingOther && (
          <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-8 text-center">
            <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Terms accepted!</h2>
            <p className="text-slate-300">We are waiting for the other party to accept. You will receive an email as soon as they do, and we will send you straight to identity verification.</p>
          </div>
        )}

        {!loading && !error && match && !waitingOther && (
          <>
            {/* Match summary — read only */}
            <div className="rounded-2xl border border-white/10 bg-slate-800/50 p-6 mb-6">
              <p className="text-xs text-slate-400 uppercase font-semibold tracking-widest mb-3">Your Match (cannot be amended)</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Route</p>
                  <p className="font-bold text-white">{fromCity} → {toCity}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Travel Date</p>
                  <p className="font-bold text-white">{dateStr}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Agreed Price</p>
                  <p className="text-2xl font-black text-blue-400">£{Number(agreedPrice).toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Customs duty notice */}
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 mb-6">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-300 mb-1">Sender — Customs Duties Notice</p>
                  <p className="text-sm text-amber-200/80">
                    As the Sender, you are <strong className="text-amber-300">solely responsible</strong> for all customs duties, import taxes, and compliance with the laws of both the origin and destination country. BootHop does not assume any liability for customs-related charges or seizures.
                  </p>
                </div>
              </div>
            </div>

            {/* Prohibited items links */}
            <div className="rounded-2xl border border-slate-600/40 bg-slate-800/40 p-5 mb-6">
              <div className="flex gap-3 mb-3">
                <ShieldCheck className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="font-bold text-white">Check Prohibited Items for Your Route</p>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Before accepting, you must ensure all items comply with customs regulations for <strong className="text-white">{fromCity} → {toCity}</strong>. Use the official government links below:
              </p>
              <div className="flex flex-col gap-2">
                {prohibitedLinks.map(link => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Full T&C */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 mb-6 overflow-hidden">
              <div className="bg-slate-800/80 px-6 py-4 border-b border-white/10">
                <p className="font-black text-white text-lg">BOOTHOP LIMITED — TERMS & CONDITIONS</p>
                <p className="text-xs text-slate-400 mt-1">BootHop Limited (Subsidiary of OTB-MIDAS Limited) · Effective: 07 April 2025 · boothop.com</p>
              </div>
              <div className="px-6 py-5 max-h-96 overflow-y-auto space-y-5 scrollbar-thin scrollbar-thumb-slate-600">
                {TC_SECTIONS.map(section => (
                  <div key={section.title}>
                    <p className="font-bold text-white mb-2 text-sm">{section.title}</p>
                    <ul className="space-y-1.5">
                      {section.content.map((line, i) => (
                        <li key={i} className="text-sm text-slate-300 leading-relaxed flex gap-2">
                          <span className="text-slate-500 flex-shrink-0">•</span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {/* Critical clause */}
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 mt-4">
                  <p className="text-sm font-bold text-red-300 mb-1">CRITICAL CLAUSE</p>
                  <p className="text-sm text-red-200/80 italic">
                    "I confirm that I have inspected (or presented for inspection) all items, that no prohibited goods are included, and that I accept full legal responsibility for any breach of applicable laws."
                  </p>
                </div>
              </div>
            </div>

            {/* Checkbox */}
            <label className="flex gap-4 items-start cursor-pointer rounded-2xl border border-white/15 bg-slate-800/50 hover:border-blue-500/50 transition-colors p-5 mb-6">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={e => setChecked(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${checked ? 'bg-blue-600 border-blue-600' : 'border-slate-500 bg-slate-800'}`}>
                  {checked && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">
                I confirm I have <strong className="text-white">read and understood</strong> the BootHop Terms & Conditions above. I confirm I am responsible for customs duties, I have checked the prohibited items list for my route, and I accept full legal responsibility for the contents of the goods involved in this transaction.
              </p>
            </label>

            {!checked && (
              <p className="text-center text-sm text-amber-400 mb-4">You must tick the checkbox above to continue.</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!checked || submitting}
              className="w-full py-4 rounded-2xl font-black text-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.01] active:scale-[0.99]"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> Processing…
                </span>
              ) : (
                'I Accept — Continue to Identity Verification →'
              )}
            </button>
          </>
        )}
      </main>
    </div>
  );
}

export default function CommitPage() {
  return (
    <Suspense>
      <CommitContent />
    </Suspense>
  );
}
