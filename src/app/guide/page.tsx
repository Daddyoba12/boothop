'use client';

import { useEffect } from 'react';

const GUIDE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Inter', sans-serif;
    background: #fff;
    color: #111;
    font-size: 14px;
    line-height: 1.6;
  }

  .screen-only { display: block; }
  .print-only  { display: none; }

  @media print {
    .screen-only { display: none !important; }
    .print-only  { display: block !important; }
    body { font-size: 11pt; }
    .page-break  { page-break-before: always; }
    section      { page-break-inside: avoid; }
  }

  /* ── Layout ── */
  .container { max-width: 760px; margin: 0 auto; padding: 0 32px; }
  .print-container { max-width: 760px; margin: 0 auto; padding: 0; }

  /* ── Cover ── */
  .cover {
    background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%);
    color: #fff;
    padding: 80px 40px 60px;
    text-align: center;
    position: relative;
  }
  .cover-badge {
    display: inline-block;
    background: rgba(6,182,212,0.2);
    border: 1px solid rgba(6,182,212,0.4);
    color: #67e8f9;
    border-radius: 999px;
    padding: 6px 20px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 28px;
  }
  .cover h1 {
    font-size: 52px;
    font-weight: 900;
    line-height: 1.1;
    margin-bottom: 16px;
  }
  .cover h1 span { color: #22d3ee; }
  .cover p {
    font-size: 16px;
    color: rgba(255,255,255,0.65);
    max-width: 520px;
    margin: 0 auto 40px;
  }
  .cover-meta {
    display: flex;
    justify-content: center;
    gap: 40px;
    font-size: 13px;
    color: rgba(255,255,255,0.4);
    border-top: 1px solid rgba(255,255,255,0.1);
    padding-top: 28px;
  }
  .cover-meta strong { color: #fff; display: block; font-size: 22px; }

  /* ── Sections ── */
  .section { padding: 48px 0 36px; border-bottom: 1px solid #e5e7eb; }
  .section:last-child { border-bottom: none; }

  .section-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #6b7280;
    margin-bottom: 8px;
  }
  .section-title {
    font-size: 26px;
    font-weight: 800;
    color: #111;
    margin-bottom: 10px;
  }
  .section-sub {
    font-size: 14px;
    color: #6b7280;
    margin-bottom: 28px;
    max-width: 560px;
  }

  /* ── Steps ── */
  .steps { display: flex; flex-direction: column; gap: 16px; }
  .step {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    padding: 16px 20px;
    border-radius: 12px;
    background: #f8fafc;
    border-left: 4px solid #e5e7eb;
  }
  .step.blue  { border-left-color: #3b82f6; background: #eff6ff; }
  .step.green { border-left-color: #10b981; background: #f0fdf4; }
  .step.amber { border-left-color: #f59e0b; background: #fffbeb; }
  .step.red   { border-left-color: #ef4444; background: #fef2f2; }
  .step-num {
    width: 32px; height: 32px;
    border-radius: 50%;
    background: #1e40af;
    color: #fff;
    font-weight: 800;
    font-size: 13px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .step.green .step-num { background: #059669; }
  .step.amber .step-num { background: #d97706; }
  .step.red   .step-num { background: #dc2626; }
  .step-title { font-weight: 700; font-size: 14px; color: #111; margin-bottom: 3px; }
  .step-desc  { font-size: 13px; color: #4b5563; line-height: 1.5; }
  .step-tag   { font-size: 11px; font-weight: 600; color: #9ca3af; margin-top: 4px; }

  /* ── Two col ── */
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 20px; }
  .card {
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    padding: 20px;
    background: #f9fafb;
  }
  .card h4 { font-size: 13px; font-weight: 700; margin-bottom: 10px; }
  .card ul { list-style: none; }
  .card ul li { font-size: 12px; color: #4b5563; padding: 4px 0; display: flex; gap: 6px; }
  .card ul li::before { content: '✓'; color: #10b981; font-weight: 700; flex-shrink: 0; }
  .card ul li.no::before { content: '✗'; color: #ef4444; }

  /* ── Highlight box ── */
  .highlight {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 12px;
    padding: 20px 24px;
    margin-top: 24px;
  }
  .highlight.amber { background: #fffbeb; border-color: #fde68a; }
  .highlight.green { background: #f0fdf4; border-color: #a7f3d0; }
  .highlight h4 { font-size: 13px; font-weight: 700; margin-bottom: 6px; color: #1e40af; }
  .highlight.amber h4 { color: #92400e; }
  .highlight.green h4 { color: #065f46; }
  .highlight p  { font-size: 12px; color: #374151; line-height: 1.6; }

  /* ── Pipeline ── */
  .pipeline { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
  .pipe-step {
    border-radius: 8px;
    padding: 6px 14px;
    font-size: 11px;
    font-weight: 600;
    display: flex; align-items: center; gap: 6px;
  }
  .pipe-step .dot { width: 8px; height: 8px; border-radius: 50%; }

  /* ── Table ── */
  table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
  th { background: #f1f5f9; text-align: left; padding: 8px 12px; font-weight: 700; color: #374151; border: 1px solid #e5e7eb; }
  td { padding: 8px 12px; border: 1px solid #e5e7eb; color: #4b5563; }
  tr:nth-child(even) td { background: #f8fafc; }

  /* ── Footer ── */
  .footer {
    background: #0f172a;
    color: rgba(255,255,255,0.5);
    text-align: center;
    padding: 32px 24px;
    font-size: 11px;
  }
  .footer strong { color: #fff; }

  /* ── Screen wrapper ── */
  .screen-wrapper {
    min-height: 100vh;
    background: #f1f5f9;
    padding: 32px 0 64px;
  }
  .toolbar {
    position: sticky; top: 0; z-index: 100;
    background: #0f172a;
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 32px;
    margin-bottom: 32px;
  }
  .toolbar-logo { font-size: 18px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
  .toolbar-logo span { color: #22d3ee; }
  .btn-print {
    background: linear-gradient(135deg, #3b82f6, #22d3ee);
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 10px 24px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    display: flex; align-items: center; gap-8px;
    gap: 8px;
  }
  .doc-wrapper {
    background: #fff;
    box-shadow: 0 4px 40px rgba(0,0,0,0.12);
    border-radius: 8px;
    overflow: hidden;
    max-width: 800px;
    margin: 0 auto;
  }
`;

const steps = {
  traveller: [
    { title: 'Post Your Journey', desc: 'Share your route, travel dates, and available luggage capacity. Takes under 60 seconds. Set your own price per kg.', tag: 'Free to list' },
    { title: 'Get Auto-Matched', desc: 'Our system automatically matches you with verified senders travelling the same route. No back-and-forth needed.', tag: 'AI matching' },
    { title: 'Agree on Terms', desc: 'Confirm price and item details through secure in-app messaging. Both parties agree before any commitment is made.', tag: 'Secure messaging' },
    { title: 'Complete KYC', desc: 'Upload a valid government ID. One-time identity check — keeps the platform safe for everyone.', tag: 'Identity verified' },
    { title: 'Collect & Deliver', desc: 'Meet the sender at the agreed location, collect the item, carry it on your journey, and hand it to the recipient.', tag: 'Earn per trip' },
    { title: 'Get Paid', desc: 'Payment is held in escrow throughout. Released automatically 24 hours after the recipient confirms delivery — only if no dispute is raised.', tag: '24-hr auto-release' },
  ],
  sender: [
    { title: 'Post Your Request', desc: 'Describe your item, the route (e.g. London → Lagos), preferred date window, and your budget per kg.', tag: 'Free to post' },
    { title: 'Get Matched', desc: 'Browse available travellers on your route or wait for the auto-match system to find the best fit.', tag: 'Auto or manual' },
    { title: 'Pay Into Escrow', desc: 'Agreed fee is locked in escrow. The traveller is only paid after your recipient confirms safe delivery.', tag: 'Protected payment' },
    { title: 'Prepare Your Item', desc: 'Package the item securely. Provide an accurate description. Both you and the traveller sign a digital handover record.', tag: 'Digital handover' },
    { title: 'Track In Real Time', desc: 'Stay updated as your item moves. Message the traveller directly through the platform.', tag: 'Live updates' },
    { title: 'Confirm & Rate', desc: 'Your recipient confirms receipt. Escrow releases to the traveller. Rate the experience.', tag: 'Funds released' },
  ],
};

const pipeline = [
  { label: 'Matched',              color: '#3b82f6', bg: '#eff6ff' },
  { label: 'Agreed',               color: '#8b5cf6', bg: '#f5f3ff' },
  { label: 'Committed',            color: '#6366f1', bg: '#eef2ff' },
  { label: 'KYC Pending',          color: '#f59e0b', bg: '#fffbeb' },
  { label: 'KYC Complete',         color: '#10b981', bg: '#f0fdf4' },
  { label: 'Payment Processing',   color: '#0ea5e9', bg: '#f0f9ff' },
  { label: 'Active Delivery',      color: '#22c55e', bg: '#f0fdf4' },
  { label: 'Delivery Confirmed',   color: '#14b8a6', bg: '#f0fdfa' },
  { label: 'Completed',            color: '#6b7280', bg: '#f9fafb' },
];

export default function GuidePage() {
  useEffect(() => {
    document.title = 'BootHop — How It Works (Full Guide)';
  }, []);

  const handlePrint = () => window.print();

  const TravellerSteps = () => (
    <div className="steps">
      {steps.traveller.map((s, i) => (
        <div key={i} className="step blue">
          <div className="step-num">{String(i + 1).padStart(2, '0')}</div>
          <div>
            <div className="step-title">{s.title}</div>
            <div className="step-desc">{s.desc}</div>
            <div className="step-tag">{s.tag}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const SenderSteps = () => (
    <div className="steps">
      {steps.sender.map((s, i) => (
        <div key={i} className="step green">
          <div className="step-num">{String(i + 1).padStart(2, '0')}</div>
          <div>
            <div className="step-title">{s.title}</div>
            <div className="step-desc">{s.desc}</div>
            <div className="step-tag">{s.tag}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const DocContent = () => (
    <>
      {/* COVER */}
      <div className="cover">
        <div className="cover-badge">Official User Guide · 2025</div>
        <h1>How <span>BootHop</span><br />Works</h1>
        <p>
          The complete guide for travellers and senders — from posting a trip to getting paid,
          fully updated to reflect the current BootHop platform.
        </p>
        <div className="cover-meta">
          <div><strong>10,000+</strong> Active users</div>
          <div><strong>95%</strong> Success rate</div>
          <div><strong>8</strong> Pipeline stages</div>
          <div><strong>24 hr</strong> Auto-payout</div>
        </div>
      </div>

      <div className="container">

        {/* ── WHAT IS BOOTHOP ── */}
        <div className="section">
          <div className="section-label">Overview</div>
          <div className="section-title">What is BootHop?</div>
          <div className="section-sub">
            BootHop is a peer-to-peer delivery platform that connects people who are already travelling
            (travellers) with people who need to send items along the same route (senders).
            Instead of expensive courier services, senders pay travellers to carry items in their
            existing luggage — legally, safely, and far more affordably.
          </div>
          <div className="two-col">
            <div className="card">
              <h4>🧳 Travellers (Booters)</h4>
              <ul>
                <li>Already travelling — use spare luggage space</li>
                <li>Earn £85–£320 per trip</li>
                <li>Set your own price per kg</li>
                <li>Payment guaranteed via escrow</li>
                <li>Auto-matched with verified senders</li>
              </ul>
            </div>
            <div className="card">
              <h4>📦 Senders (Hoopers)</h4>
              <ul>
                <li>Send items door-to-door internationally</li>
                <li>Typically 60–80% cheaper than couriers</li>
                <li>Payment held in escrow until delivery</li>
                <li>Real-time tracking and messaging</li>
                <li>Rate and review after delivery</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── TRAVELLER STEPS ── */}
        <div className="section">
          <div className="section-label">For Travellers</div>
          <div className="section-title">How to earn with BootHop</div>
          <div className="section-sub">
            Post your journey, get matched automatically, complete KYC once, deliver safely, get paid.
          </div>
          <TravellerSteps />
        </div>

        {/* ── SENDER STEPS ── */}
        <div className="section page-break">
          <div className="section-label">For Senders</div>
          <div className="section-title">How to send with BootHop</div>
          <div className="section-sub">
            Post your request, get matched with a verified traveller, pay into escrow, confirm delivery.
          </div>
          <SenderSteps />
        </div>

        {/* ── PIPELINE ── */}
        <div className="section">
          <div className="section-label">Match Lifecycle</div>
          <div className="section-title">The 9-Stage Pipeline</div>
          <div className="section-sub">
            Every match between a traveller and a sender moves through defined stages.
            Both parties can see the current stage at all times.
          </div>
          <div className="pipeline">
            {pipeline.map((p, i) => (
              <div key={i} className="pipe-step" style={{ background: p.bg, color: p.color, border: `1px solid ${p.color}40` }}>
                <div className="dot" style={{ background: p.color }} />
                {p.label}
              </div>
            ))}
          </div>
          <div className="highlight" style={{ marginTop: 20 }}>
            <h4>Auto-payout after delivery</h4>
            <p>
              When a sender confirms delivery, the match moves to <strong>Delivery Confirmed</strong>.
              If no dispute is raised within 24 hours, the system automatically releases the escrow
              payment to the traveller and sends both parties a rating request. No manual action needed.
            </p>
          </div>
        </div>

        {/* ── AFRICA-OUTBOUND ── */}
        <div className="section">
          <div className="section-label">Africa-Outbound Policy</div>
          <div className="section-title">Sending goods out of Africa</div>
          <div className="section-sub">
            Trips originating from an African city go through an additional manual review
            before both parties are notified of the match.
          </div>
          <div className="steps">
            <div className="step amber">
              <div className="step-num" style={{ background: '#d97706' }}>1</div>
              <div>
                <div className="step-title">Auto-Match Detected</div>
                <div className="step-desc">The system finds a potential match where the sending trip originates in Africa (Nigeria, Ghana, Kenya, South Africa, etc.).</div>
              </div>
            </div>
            <div className="step amber">
              <div className="step-num" style={{ background: '#d97706' }}>2</div>
              <div>
                <div className="step-title">Held for Authorisation</div>
                <div className="step-desc">The match is placed into <strong>Awaiting Authorisation</strong> status. Neither the traveller nor sender is notified yet.</div>
              </div>
            </div>
            <div className="step amber">
              <div className="step-num" style={{ background: '#d97706' }}>3</div>
              <div>
                <div className="step-title">Admin Review</div>
                <div className="step-desc">The BootHop admin team reviews the match details and approves or rejects it via a secure one-click email link or admin dashboard.</div>
              </div>
            </div>
            <div className="step green">
              <div className="step-num">4</div>
              <div>
                <div className="step-title">Approved → Normal Flow</div>
                <div className="step-desc">If approved, both parties receive their match confirmation emails with one-click accept/decline links. The match continues through the standard pipeline.</div>
              </div>
            </div>
            <div className="step red">
              <div className="step-num">4</div>
              <div>
                <div className="step-title">Rejected → Cancelled</div>
                <div className="step-desc">If rejected, the match is quietly cancelled. Neither party is notified. The traveller and sender remain active and can match with others.</div>
              </div>
            </div>
          </div>
          <div className="highlight amber">
            <h4>Why this policy?</h4>
            <p>
              Africa-outbound shipments require additional compliance checks due to varying export regulations
              across different countries. This manual step ensures every match meets BootHop&apos;s compliance
              standards before proceeding.
            </p>
          </div>
        </div>

        {/* ── WHAT YOU CAN SEND ── */}
        <div className="section page-break">
          <div className="section-label">Customs Guide</div>
          <div className="section-title">What can I send?</div>
          <div className="section-sub">
            Rules apply based on the destination country. The sender is solely responsible for
            ensuring items comply with UK export and destination country import regulations.
          </div>
          <div className="two-col">
            <div className="card">
              <h4 style={{ color: '#059669' }}>✓ Typically Accepted</h4>
              <ul>
                <li>Clothes &amp; shoes (personal use)</li>
                <li>Letters &amp; documents</li>
                <li>Phones &amp; small electronics</li>
                <li>Gifts &amp; household items</li>
                <li>Food (sealed, non-perishable)</li>
                <li>Books &amp; magazines</li>
                <li>Cosmetics &amp; personal care items</li>
              </ul>
            </div>
            <div className="card">
              <h4 style={{ color: '#dc2626' }}>✗ Never Accepted</h4>
              <ul>
                <li className="no">Cash or monetary instruments</li>
                <li className="no">Controlled substances / drugs</li>
                <li className="no">Weapons or ammunition</li>
                <li className="no">Counterfeit goods</li>
                <li className="no">Hazardous materials</li>
                <li className="no">Anything misrepresented</li>
                <li className="no">Live animals</li>
              </ul>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Destination</th>
                <th>Key Rules</th>
                <th>BootHop Policy</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Nigeria</td><td>Personal effects duty-free; electronics may attract import duty; food must be NAFDAC-compliant</td><td>Sender signs customs declaration</td></tr>
              <tr><td>Ghana</td><td>GRA allows personal imports up to GH₵200 duty-free; electronics declared at port</td><td>Sender signs customs declaration</td></tr>
              <tr><td>Kenya</td><td>Personal effects exempt; formal declaration required for electronics &gt; KES 10,000</td><td>Sender signs customs declaration</td></tr>
              <tr><td>UK (inbound)</td><td>HMRC: goods &gt; £135 require formal customs entry; gifts up to £39 duty-free</td><td>Both parties responsible for compliance</td></tr>
            </tbody>
          </table>
          <div className="highlight amber" style={{ marginTop: 16 }}>
            <h4>Important</h4>
            <p>
              BootHop facilitates the connection — we do not inspect packages. Travellers are not liable
              for undeclared or misrepresented contents. The sender accepts full legal responsibility
              for the accuracy of the item description and customs compliance.
            </p>
          </div>
        </div>

        {/* ── PRICING & FEES ── */}
        <div className="section">
          <div className="section-label">Pricing</div>
          <div className="section-title">Fees &amp; how pricing works</div>
          <div className="section-sub">
            Travellers set their own price per kg. Senders agree before committing. BootHop
            charges a platform service fee on completed transactions.
          </div>
          <table>
            <thead>
              <tr><th>Component</th><th>Who pays</th><th>Amount</th></tr>
            </thead>
            <tbody>
              <tr><td>Delivery fee</td><td>Sender → Traveller</td><td>Set by traveller (typically £5–£15/kg)</td></tr>
              <tr><td>Platform fee</td><td>Deducted from payout</td><td>Applied on completed delivery</td></tr>
              <tr><td>Insurance (optional)</td><td>Sender</td><td>Based on declared goods value</td></tr>
              <tr><td>KYC verification</td><td>Traveller (one-time)</td><td>Free</td></tr>
            </tbody>
          </table>
          <div className="highlight green">
            <h4>Escrow protection</h4>
            <p>
              All payments are held in secure escrow from the moment the sender pays.
              The traveller cannot access funds until the recipient confirms delivery and
              the 24-hour dispute window has passed. If a dispute is raised, BootHop mediates.
            </p>
          </div>
        </div>

        {/* ── TRUST & SAFETY ── */}
        <div className="section">
          <div className="section-label">Trust &amp; Safety</div>
          <div className="section-title">How we keep every match safe</div>
          <div className="section-sub">
            BootHop operates an 8-layer safety framework across identity, payments, compliance, and dispute resolution.
          </div>
          <div className="steps">
            {[
              { title: 'Identity Verification (KYC)', desc: 'Every traveller must complete a government ID check before carrying any item. Senders verify their email address at registration.' },
              { title: 'Email Verification on Contact', desc: 'All contact form submissions require the user to verify their email address before the message reaches our team — preventing spam and ensuring accountability.' },
              { title: 'Escrow Payments', desc: 'Sender\'s payment is held by BootHop\'s escrow system from the moment they pay. It cannot be released until delivery is confirmed.' },
              { title: 'Digital Handover Record', desc: 'Both sender and traveller sign a digital handover at collection. This creates a timestamped record of what was handed over and in what condition.' },
              { title: 'Africa-Outbound Compliance Review', desc: 'Shipments originating from Africa are held for manual admin review before both parties are notified — ensuring export compliance on every Africa-outbound match.' },
              { title: '24-Hour Dispute Window', desc: 'After the recipient confirms delivery, there is a 24-hour window to raise a dispute before payment is auto-released. Disputes are mediated by BootHop.' },
              { title: 'Ratings & Reviews', desc: 'After every completed delivery, both parties rate each other. Low-rated users are reviewed and may be removed from the platform.' },
              { title: 'Admin Dashboard', desc: 'The BootHop team monitors all matches in real time via a secure admin hub — including pending Africa authorisations, disputes, and payment processing.' },
            ].map((s, i) => (
              <div key={i} className="step blue">
                <div className="step-num">{String(i + 1).padStart(2, '0')}</div>
                <div>
                  <div className="step-title">{s.title}</div>
                  <div className="step-desc">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CONTACT ── */}
        <div className="section">
          <div className="section-label">Support</div>
          <div className="section-title">Get help</div>
          <div className="two-col">
            <div className="card">
              <h4>Contact</h4>
              <ul>
                <li>Email: info@boothop.com</li>
                <li>Phone: +44 115 661 2820</li>
                <li>Hours: Mon–Fri, 9am–6pm GMT</li>
                <li>Weekend: Limited support</li>
              </ul>
            </div>
            <div className="card">
              <h4>Response Times</h4>
              <ul>
                <li>General queries: within 24 hrs</li>
                <li>Active delivery issues: within 6 hrs</li>
                <li>Urgent safety reports: within 2 hrs</li>
                <li>Africa auth review: within 12 hrs</li>
              </ul>
            </div>
          </div>
        </div>

      </div>

      {/* FOOTER */}
      <div className="footer">
        <strong>BootHop</strong> · boothop.com · info@boothop.com · +44 115 661 2820<br />
        <span style={{ marginTop: 8, display: 'block' }}>
          © {new Date().getFullYear()} BootHop. All rights reserved.
          This document is for informational purposes. Subject to change without notice.
        </span>
      </div>
    </>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GUIDE_STYLES }} />

      {/* ── SCREEN VIEW ── */}
      <div className="screen-only">
        <div className="screen-wrapper">
          <div className="toolbar">
            <div className="toolbar-logo">Boot<span>Hop</span></div>
            <button className="btn-print" onClick={handlePrint}>
              ⬇ Download PDF
            </button>
          </div>
          <div className="doc-wrapper">
            <DocContent />
          </div>
        </div>
      </div>

      {/* ── PRINT VIEW ── */}
      <div className="print-only">
        <DocContent />
      </div>
    </>
  );
}
