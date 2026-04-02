import Link from 'next/link';
import { Shield, AlertTriangle, CheckCircle, Globe, FileText, Scale } from 'lucide-react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Terms & Conditions – BootHop',
  description: 'BootHop Terms and Conditions — your responsibilities as a sender or traveller on our platform.',
};

function Section({ id, title, icon: Icon, children }: {
  id: string; title: string; icon: any; children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-10 scroll-mt-28">
      <div className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/3 hover:bg-white/5 hover:border-blue-500/20 transition-all duration-300 p-7">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/40 group-hover:scale-110 transition-transform duration-300">
            <Icon className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-lg font-black text-white">{title}</h2>
        </div>
        <div className="relative space-y-4 text-sm text-slate-400 leading-relaxed">{children}</div>
      </div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="leading-relaxed">{children}</p>;
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 pl-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <CheckCircle className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Warn({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-5 py-4 text-sm text-red-300 leading-relaxed">
      <span className="font-semibold text-red-400">⚠️ Important: </span>{children}
    </div>
  );
}

const prohibited = [
  'Cash, banknotes, coins, cryptocurrency wallets, or any monetary instruments',
  'Controlled substances, illegal drugs, narcotics, or any substance prohibited under local or international law',
  'Firearms, ammunition, weapons, explosives, or any component thereof',
  'Counterfeit, replica, or pirated goods — including fake branded items, unlicensed software, or forged documents',
  'Hazardous materials — flammable, corrosive, toxic, radioactive or explosive substances',
  'Human remains, biological specimens, or infectious material',
  'Live animals or endangered species (or their parts) protected under CITES',
  'Pornographic or obscene material',
  'Stolen goods or items of suspicious origin',
  'Items whose import is prohibited in the destination country (even if legal in the origin country)',
  'Cultural artefacts or items requiring export licences without proper documentation',
  'Items exceeding customs personal import allowances without prior declaration and duty payment',
  'Goods subject to trade sanctions or embargos between the origin and destination countries',
  'Prescription drugs (except in original packaging with valid prescription accompanying, and only for personal use)',
  'Alcohol exceeding duty-free allowances',
  'Tobacco products exceeding duty-free allowances',
  'Brand-name goods in quantities suggesting commercial intent rather than personal use',
];

const senderDuties = [
  'You are solely responsible for ensuring all items comply with the laws and regulations of both the origin country AND the destination country.',
  'You must accurately and honestly describe every item you submit. Misrepresentation — whether deliberate or by omission — is a serious breach of these Terms and may result in permanent account termination and legal action.',
  'You are solely liable for all import duties, taxes, VAT, and any other fees imposed by customs authorities at the destination. BootHop and the Traveller are not responsible for any customs charges.',
  'You must ensure items are properly packed, labelled, and where required, accompanied by appropriate customs declarations and documentation (e.g. CN22, CN23 forms).',
  'You accept full responsibility if goods are seized, impounded, or destroyed by customs authorities due to non-compliance with regulations.',
  'You must not send items that exceed personal gift or import thresholds without ensuring duty has been pre-paid or that the recipient is prepared to pay on collection.',
  'If the destination country requires import licences, permits, health certificates or phytosanitary certificates for your item, you are responsible for obtaining and providing these.',
  'You must ensure that the Traveller is not unknowingly placed in legal jeopardy by carrying your items.',
];

const travellerDuties = [
  'You have the right — and the responsibility — to inspect any item before agreeing to carry it. Do not carry sealed packages unless you are satisfied with what is inside.',
  'You must honestly declare any items you are asked about at customs. You are not liable for contents you genuinely could not have known about, but willful blindness is not a defence.',
  'You must comply with all airline, transportation authority, and customs regulations applicable to your journey.',
  'You accept that you are acting as a private individual courier, not a commercial carrier, and must not misrepresent the nature of goods to customs officials.',
  'You should retain all BootHop documentation relating to your match in case of customs queries.',
  'You must not agree to carry items outside the BootHop platform or before completing the KYC and escrow payment process.',
];

const communicationRules = [
  'All communication between Senders and Travellers must remain respectful, professional, and courteous at all times.',
  'Abusive, threatening, discriminatory, harassing, or offensive language of any kind is strictly prohibited and will result in immediate account termination.',
  'Users must not solicit personal contact details (phone, social media, email) outside the BootHop platform prior to completing the full verification and escrow process.',
  'Users must not attempt to conduct transactions outside the BootHop platform to circumvent fees or protections.',
  'Fraud, misrepresentation, or deceptive communication is a criminal matter and will be reported to appropriate authorities.',
  'BootHop reserves the right to review communications on the platform in cases of reported abuse or disputes.',
  'Respect cultural, religious, and personal differences. BootHop serves a global community and zero tolerance is applied to any form of discrimination.',
];

export default function TermsPage() {
  const lastUpdated = '31 March 2026';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white font-sans overflow-x-hidden">

      {/* ANIMATED BACKGROUND BLOBS */}
      <div className="fixed inset-0 opacity-20 pointer-events-none z-0">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDuration:'4s'}} />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDuration:'6s',animationDelay:'2s'}} />
        <div className="absolute bottom-40 left-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDuration:'5s',animationDelay:'1s'}} />
      </div>

      <NavBar />

      {/* HERO */}
      <section className="relative pt-36 pb-16 px-6 text-center z-10">
        <div className="inline-flex items-center gap-2 mb-6 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-cyan-500/30 backdrop-blur-xl">
          <Scale className="h-4 w-4 text-cyan-400" />
          <span className="text-xs font-semibold tracking-widest uppercase text-cyan-300">Legal</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-white mb-4">
          Terms &amp;{' '}
          <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
            Conditions
          </span>
        </h1>
        <p className="text-slate-400 text-base max-w-xl mx-auto">
          By using BootHop you agree to these terms in full. Please read them carefully before posting or accepting any delivery.
        </p>
        <p className="text-xs text-slate-500 mt-4">Last updated: {lastUpdated} · BootHop Ltd, United Kingdom</p>
      </section>

      <div className="relative z-10 max-w-4xl mx-auto px-6 pb-24">

        {/* TOC */}
        <div className="rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm p-6 mb-12">
          <p className="text-xs uppercase tracking-widest font-semibold text-slate-500 mb-4">Contents</p>
          <div className="grid md:grid-cols-2 gap-2 text-sm">
            {[
              ['#definitions',     '1. Definitions'],
              ['#platform',        '2. Platform & Services'],
              ['#eligibility',     '3. Eligibility'],
              ['#prohibited',      '4. Prohibited Items'],
              ['#sender',          '5. Sender Responsibilities'],
              ['#traveller',       '6. Traveller Responsibilities'],
              ['#customs',         '7. Customs & Import Duties'],
              ['#insurance',       '8. Insurance'],
              ['#escrow',          '9. Escrow Payments'],
              ['#communication',   '10. Communication Standards'],
              ['#kyc',             '11. Identity Verification'],
              ['#liability',       '12. Liability & Disclaimers'],
              ['#disputes',        '13. Disputes'],
              ['#countries',       '14. Country-Specific Terms'],
              ['#termination',     '15. Termination'],
              ['#governing',       '16. Governing Law'],
            ].map(([href, label]) => (
              <a key={href} href={href} className="text-cyan-400 hover:text-cyan-300 hover:underline transition-colors">
                {label}
              </a>
            ))}
          </div>
        </div>

        {/* 1. DEFINITIONS */}
        <Section id="definitions" title="1. Definitions" icon={FileText}>
          <P><strong className="text-white">"BootHop"</strong>, <strong className="text-white">"we"</strong>, <strong className="text-white">"us"</strong> or <strong className="text-white">"our"</strong> refers to BootHop Ltd, a company registered in England and Wales.</P>
          <P><strong className="text-white">"Platform"</strong> means the BootHop website, mobile application, and all related services.</P>
          <P><strong className="text-white">"Sender"</strong> (also referred to as <em>Hooper</em> on our platform) means a user who posts a delivery request — i.e. a person who wishes to have an item transported.</P>
          <P><strong className="text-white">"Traveller"</strong> (also referred to as <em>Booter</em> on our platform) means a user who accepts a delivery request — i.e. a person who carries an item as part of an existing journey.</P>
          <P><strong className="text-white">"Match"</strong> means a confirmed pairing between a Sender and a Traveller for a specific delivery.</P>
          <P><strong className="text-white">"Escrow"</strong> means the secure holding of funds by Stripe on behalf of both parties, pending confirmation of delivery.</P>
          <P><strong className="text-white">"KYC"</strong> means Know Your Customer identity verification, carried out via Stripe Identity.</P>
          <P><strong className="text-white">"Goods"</strong> means any item or items posted for delivery on the Platform.</P>
          <P><strong className="text-white">"Insurance"</strong> means the optional but default-selected cover charged at 7.5% of the declared goods value, as described in Section 8.</P>
        </Section>

        {/* 2. PLATFORM */}
        <Section id="platform" title="2. Platform & Services" icon={Globe}>
          <P>BootHop is a peer-to-peer logistics marketplace. We connect individuals who wish to send items internationally with individuals who are already travelling on compatible routes. BootHop is not a courier, freight forwarder, or transport company. We provide the matching technology, secure payment escrow, and identity verification infrastructure.</P>
          <P>BootHop does not take physical possession of any goods at any time. All transportation is carried out by the Traveller in their personal capacity.</P>
          <P>BootHop reserves the right to modify, suspend, or discontinue any aspect of the Platform at any time without prior notice.</P>
        </Section>

        {/* 3. ELIGIBILITY */}
        <Section id="eligibility" title="3. Eligibility" icon={CheckCircle}>
          <Ul items={[
            'You must be at least 18 years of age to use BootHop.',
            'You must successfully complete KYC identity verification before any delivery details are shared.',
            'You must provide accurate, truthful information at all times. Providing false identity information is grounds for immediate permanent ban and may constitute fraud.',
            'You must have the legal right to send or carry the items you list on the Platform.',
            'Businesses may use BootHop but must not use the Platform in a way that misrepresents commercial shipments as personal items.',
          ]} />
        </Section>

        {/* 4. PROHIBITED ITEMS */}
        <Section id="prohibited" title="4. Prohibited Items" icon={AlertTriangle}>
          <Warn>Attempting to send prohibited items is a serious breach of these Terms. It may result in permanent account suspension, forfeiture of escrowed funds, and referral to law enforcement.</Warn>
          <P>The following items are <strong className="text-white">strictly prohibited</strong> on the BootHop platform under any circumstances:</P>
          <Ul items={prohibited} />
          <P>This list is not exhaustive. BootHop reserves the right to refuse any listing at its sole discretion. If you are unsure whether an item is permitted, contact us before posting.</P>
          <P>Travellers who discover prohibited items in goods they have accepted have the right to refuse carriage without penalty and will receive a full escrow refund. They should report the incident immediately via the Platform.</P>
        </Section>

        {/* 5. SENDER RESPONSIBILITIES */}
        <Section id="sender" title="5. Sender Responsibilities" icon={Shield}>
          <P>As a Sender on BootHop, you accept full and sole responsibility for the following:</P>
          <Ul items={senderDuties} />
          <Warn>BootHop will cooperate fully with customs authorities and law enforcement in any investigation arising from goods sent via our platform. Senders who knowingly use the Platform to smuggle or deceive customs face criminal prosecution.</Warn>
          <P>By posting a delivery request, you make a legally binding declaration that to the best of your knowledge the item(s) described are legal in both the origin and destination countries, are accurately described, and comply with all applicable laws and regulations.</P>
        </Section>

        {/* 6. TRAVELLER RESPONSIBILITIES */}
        <Section id="traveller" title="6. Traveller Responsibilities" icon={Shield}>
          <P>As a Traveller on BootHop, you accept the following responsibilities:</P>
          <Ul items={travellerDuties} />
          <P>BootHop strongly recommends that all Travellers inspect and photograph items before accepting them and again before handing them over to the Sender's recipient.</P>
        </Section>

        {/* 7. CUSTOMS */}
        <Section id="customs" title="7. Customs & Import Duties" icon={Globe}>
          <P><strong className="text-white">The Sender is solely and exclusively responsible for all customs duties, import taxes, VAT, excise duties, and any other charges levied by customs authorities</strong> in the destination country (and in any transit country).</P>
          <P>BootHop does not facilitate customs declarations on behalf of users. It is the Sender's responsibility to ensure that appropriate customs documentation is prepared and provided to the Traveller before handover.</P>
          <P>Common customs thresholds users must be aware of (these are indicative and subject to change — always verify with official customs authorities):</P>
          <div className="rounded-xl border border-white/10 overflow-hidden text-xs">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left p-3 font-semibold text-slate-300">Destination</th>
                  <th className="text-left p-3 font-semibold text-slate-300">Duty-Free Threshold (Gifts)</th>
                  <th className="text-left p-3 font-semibold text-slate-300">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  ['United Kingdom', '£39 (gifts); £135 (general)', 'Import VAT applies above £135; customs duty on higher values'],
                  ['European Union', '€45 (gifts); €150 (general)', 'VAT payable above €22 threshold removed; all imports now liable'],
                  ['United States', '$800 (de minimis)', 'Items over $800 require formal entry and duty payment'],
                  ['Canada', 'CAD $20 (gifts)', 'CBSA strictly enforces; sender name/address required'],
                  ['Australia', 'AUD $1,000', 'GST applies; biosecurity declaration mandatory'],
                  ['Nigeria', 'No duty-free threshold', 'All commercial goods subject to duty; personal effects vary'],
                  ['Ghana', 'GHS varies by category', 'Strict CEPS enforcement; food/ag items need GSMA permits'],
                  ['Kenya', 'KES 50,000 for personal effects', 'KRA requires valuation; prohibited items list is extensive'],
                  ['South Africa', 'ZAR 500 (gifts)', 'SARS enforces strictly; prohibited goods list is detailed'],
                  ['UAE', 'AED 0 (all dutiable)', 'No formal gift threshold; alcohol, pork, and drugs prohibited'],
                  ['Singapore', 'SGD 400 (non-dutiable)', 'GST applies; controlled goods need import permit'],
                  ['Japan', '¥10,000 exemption', 'Quarantine required for food/plants; strict prohibited list'],
                  ['India', 'INR 5,000 (gifts)', 'Customs duty on electronics strictly enforced'],
                  ['China', 'CNY 50 (duty-free)', 'Strict prohibited list; VPN equipment, religious material restricted'],
                ].map(([country, threshold, notes]) => (
                  <tr key={country} className="hover:bg-white/3 transition-colors">
                    <td className="p-3 font-medium text-slate-300">{country}</td>
                    <td className="p-3 text-slate-400">{threshold}</td>
                    <td className="p-3 text-slate-500">{notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <P>The above table is provided for guidance only. BootHop accepts no liability for any inaccuracies. Always verify requirements with the official customs authority of the destination country.</P>
          <Warn>Deliberately under-declaring the value of goods to avoid customs duties is a criminal offence in virtually all jurisdictions. Do not do this.</Warn>
        </Section>

        {/* 8. INSURANCE */}
        <Section id="insurance" title="8. Insurance" icon={Shield}>
          <P>BootHop offers an optional delivery protection cover for Senders. This cover is <strong className="text-white">selected by default</strong> at checkout and is charged at <strong className="text-white">7.5% of the declared goods value</strong>.</P>
          <P>By accepting the insurance at checkout, the Sender acknowledges:</P>
          <Ul items={[
            'The insurance premium of 7.5% of the declared goods value is non-refundable once the delivery has been accepted by both parties.',
            'Coverage applies to loss or damage during transit, subject to the exclusions below.',
            'The maximum claimable amount is the declared goods value, up to £2,500 per delivery.',
            'Claims must be raised via the BootHop Platform within 48 hours of the confirmed delivery date.',
            'Photographic evidence of the item\'s condition at handover and receipt must be submitted with any claim.',
          ]} />
          <P><strong className="text-white">Insurance exclusions — the following are NOT covered:</strong></P>
          <Ul items={[
            'Any item that is prohibited under these Terms (Section 4)',
            'Items whose declared value is materially understated',
            'Damage caused by improper or inadequate packaging by the Sender',
            'Loss or damage arising from customs seizure',
            'Items left unattended or lost due to the Traveller\'s gross negligence',
            'Electronic items (laptops, phones, cameras) unless declared and valued accurately',
            'Fragile items not marked as such and not packed appropriately',
            'Any items involved in criminal activity',
          ]} />
          <P>Insurance is underwritten by BootHop's insurance partner. Full policy documents are available on request. BootHop acts as an introducer only and is not itself an insurer.</P>
        </Section>

        {/* 9. ESCROW */}
        <Section id="escrow" title="9. Escrow Payments" icon={Scale}>
          <P>All payments between Senders and Travellers are processed via Stripe's secure escrow system. By using the Platform, you agree to Stripe's terms of service in addition to these Terms.</P>
          <Ul items={[
            'The Sender pays the agreed delivery price plus insurance premium into escrow. These funds are held by Stripe — not by BootHop, not by the Traveller.',
            'Escrowed funds are released to the Traveller only when both the Sender and Traveller have confirmed successful delivery.',
            'If the Traveller confirms delivery but the Sender does not respond within 72 hours, funds are automatically released.',
            'In the event of a dispute, funds remain in escrow until resolution by BootHop\'s dispute team.',
            'BootHop charges a platform fee on each transaction. This fee is clearly disclosed before payment.',
            'Refunds are issued at BootHop\'s discretion in cases of failed delivery, match cancellation prior to KYC, or upheld disputes.',
            'BootHop does not handle funds directly and is not a regulated payment institution. Stripe processes all transactions.',
          ]} />
        </Section>

        {/* 10. COMMUNICATION */}
        <Section id="communication" title="10. Communication Standards" icon={CheckCircle}>
          <P>BootHop serves a global, diverse community of Senders and Travellers from all backgrounds, cultures, and beliefs. We expect every user to treat others with dignity, respect, and professionalism.</P>
          <Ul items={communicationRules} />
          <P>The following behaviours will result in <strong className="text-white">immediate permanent account termination</strong> and may be reported to law enforcement:</P>
          <Ul items={[
            'Racial, ethnic, religious, or gender-based abuse or discrimination of any kind',
            'Threats of violence, intimidation, or blackmail',
            'Sexual harassment or unwanted contact of a sexual nature',
            'Deliberate attempts to defraud, deceive, or manipulate other users',
            'Spamming, phishing, or sending unsolicited communications',
          ]} />
        </Section>

        {/* 11. KYC */}
        <Section id="kyc" title="11. Identity Verification (KYC)" icon={Shield}>
          <P>Both parties in a Match must complete identity verification (KYC) before any contact details or delivery information are shared. KYC is powered by Stripe Identity.</P>
          <Ul items={[
            'You must provide genuine, valid government-issued identity documents.',
            'Submitting forged, altered, or someone else\'s identity documents is fraud and will be reported to police.',
            'BootHop retains verification data in accordance with our Privacy Policy and applicable law.',
            'KYC verification is required once per account and may be repeated if your documents expire or if we have reason to re-verify.',
            'Users who fail KYC are not permitted to proceed with deliveries and their account may be reviewed.',
          ]} />
        </Section>

        {/* 12. LIABILITY */}
        <Section id="liability" title="12. Liability & Disclaimers" icon={Scale}>
          <P>To the fullest extent permitted by law:</P>
          <Ul items={[
            'BootHop is not liable for any loss, damage, delay, confiscation, or destruction of goods during transit.',
            'BootHop is not liable for any customs duties, taxes, fines, or penalties incurred in connection with any delivery.',
            'BootHop does not guarantee that any Match will be completed, that any delivery will arrive safely, or that items will not be detained by customs.',
            'BootHop\'s total liability to any user in respect of any single incident shall not exceed the platform fee paid in respect of that transaction.',
            'Nothing in these Terms limits liability for death or personal injury caused by our negligence, or for fraudulent misrepresentation.',
            'BootHop is not responsible for the acts or omissions of Senders or Travellers who are independent third parties.',
          ]} />
          <P>Users engage with each other at their own risk. BootHop's role is to facilitate connections and provide security infrastructure — we are not a party to any delivery contract between Sender and Traveller.</P>
        </Section>

        {/* 13. DISPUTES */}
        <Section id="disputes" title="13. Disputes" icon={Scale}>
          <P>In the event of a dispute between a Sender and a Traveller:</P>
          <Ul items={[
            'Either party may raise a dispute via the Platform within 72 hours of the scheduled delivery date.',
            'Escrowed funds will be held pending resolution.',
            'BootHop\'s dispute team will review evidence submitted by both parties and make a final decision within 10 business days.',
            'BootHop\'s decision on disputes is final, subject to any statutory rights you may have.',
            'Where fraud is suspected, BootHop will cooperate with law enforcement and may withhold funds pending investigation.',
            'Users agree not to pursue legal action against BootHop before completing the dispute resolution process.',
          ]} />
        </Section>

        {/* 14. COUNTRY-SPECIFIC */}
        <Section id="countries" title="14. Country-Specific Terms & Restrictions" icon={Globe}>
          <P>BootHop operates globally. Users are responsible for understanding and complying with all local laws. The following country-specific restrictions apply in addition to the general Terms:</P>

          <div className="space-y-4">
          {[
            {
              country: 'United Kingdom',
              notes: [
                'UK customs strictly enforces post-Brexit import rules. All goods arriving from outside Great Britain are subject to customs declaration.',
                'The Sender must provide a customs declaration (CN22 or CN23) for all international packages.',
                'HMRC may impose Customs Duty and Import VAT on all goods over £135.',
                'Certain goods require import licences (food, plants, animal products, antiques).',
                'No carriage of items that breach UK Trade Sanctions or UN Sanctions.',
              ],
            },
            {
              country: 'United States',
              notes: [
                'CBP (US Customs and Border Protection) has extensive prohibited and restricted items lists.',
                'Items over the $800 de minimis threshold may be subject to formal entry and duty.',
                'Food, plant, and animal products are strictly controlled by USDA and FDA.',
                'Do not send goods that would violate US sanctions, embargos, or export control laws (OFAC, EAR, ITAR).',
                'California may apply additional state-level restrictions on certain goods.',
              ],
            },
            {
              country: 'European Union',
              notes: [
                'All EU member states enforce EU customs regulations uniformly.',
                'VAT is applicable on all imported goods (the €22 threshold was abolished in July 2021).',
                'CITES restrictions on wildlife products apply across all 27 member states.',
                'Dual-use goods (civilian and military application) may require export authorisation.',
                'Food and agricultural products must comply with EU phytosanitary and veterinary requirements.',
              ],
            },
            {
              country: 'Nigeria',
              notes: [
                'Nigeria Customs Service (NCS) enforces a comprehensive banned and restricted goods list.',
                'Banned imports include: second-hand clothing, used cars over 15 years old, certain food items, and more.',
                'All commercial imports require Form M from a Nigerian bank and a SON/NAFDAC certificate for regulated goods.',
                'High import duties (often 20–35%) apply on many goods. Senders must account for duty costs.',
                'Used electronic equipment may be subject to inspection and could be detained.',
              ],
            },
            {
              country: 'Ghana',
              notes: [
                'Ghana Revenue Authority (GRA) CEPS applies import duties based on CIF value.',
                'Agricultural products require Plant Protection and Regulatory Services Directorate (PPRSD) permits.',
                'Electronic and electrical products must meet Ghana Standards Authority specifications.',
                'Drugs and pharmaceuticals require FDA Ghana import permits.',
              ],
            },
            {
              country: 'Kenya',
              notes: [
                'Kenya Revenue Authority (KRA) enforces import regulations. All goods over KES 50,000 require formal customs entry.',
                'Agricultural, food, and plant products require Kenya Plant Health Inspectorate Service (KEPHIS) permits.',
                'Counterfeits and pirated goods are aggressively seized by the Anti-Counterfeit Authority.',
                'Second-hand garments require proof of fumigation.',
              ],
            },
            {
              country: 'United Arab Emirates',
              notes: [
                'UAE has strict prohibition on alcohol (unless imported through licensed channels), pork, politically sensitive material, and anything contrary to Islamic values.',
                'All medicines require approval from UAE Ministry of Health. Travellers must carry prescription letter for personal medications.',
                'VoIP software and certain cybersecurity tools are regulated.',
                'Cultural artefacts and antiques require export permits from the origin country and UAE Ministry of Culture approval.',
              ],
            },
            {
              country: 'Australia',
              notes: [
                'Australia has some of the world\'s strictest biosecurity requirements. All food, plant, and animal products (including wooden items) must be declared.',
                'Australian Border Force (ABF) has no tolerance for undeclared biosecurity risk items — heavy fines apply.',
                'Drugs, weapons, and certain publications are strictly prohibited.',
                'Cultural artefacts of Aboriginal or Torres Strait Islander origin cannot be exported without an export permit.',
              ],
            },
            {
              country: 'Canada',
              notes: [
                'Canada Border Services Agency (CBSA) requires full disclosure of all goods being imported.',
                'Cannabis products (even from states/countries where legal) cannot be imported into Canada without federal authorisation.',
                'Firearms, weapons, and certain knives are heavily restricted.',
                'Cultural property exports may require permits under the Cultural Property Export and Import Act.',
                'CITES applies in full — no wildlife products without permits.',
              ],
            },
          ].map(({ country, notes }) => (
            <div key={country} className="rounded-xl border border-white/8 bg-white/3 p-5">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                <Globe className="h-4 w-4 text-cyan-400" /> {country}
              </h3>
              <Ul items={notes} />
            </div>
          ))}
          </div>

          <P>This section is provided for general guidance only and is not legal advice. Users must independently verify all regulatory requirements. BootHop accepts no liability for errors or omissions in this country guidance.</P>
        </Section>

        {/* 15. TERMINATION */}
        <Section id="termination" title="15. Termination" icon={AlertTriangle}>
          <Ul items={[
            'BootHop reserves the right to suspend or permanently terminate any account at any time, for any reason, including but not limited to breach of these Terms.',
            'Users may delete their account at any time. Deletion does not affect obligations arising from in-progress deliveries or pending disputes.',
            'Upon termination, all escrowed funds relating to active matches will be dealt with in accordance with our dispute resolution process.',
            'BootHop may retain certain data after termination as required by law or for fraud prevention purposes.',
          ]} />
        </Section>

        {/* 16. GOVERNING LAW */}
        <Section id="governing" title="16. Governing Law & Jurisdiction" icon={Scale}>
          <P>These Terms are governed by and construed in accordance with the laws of <strong className="text-white">England and Wales</strong>. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of England and Wales, without prejudice to any mandatory consumer protection laws applicable in your country of residence.</P>
          <P>If any provision of these Terms is found to be unenforceable, the remaining provisions shall continue in full force and effect.</P>
          <P>BootHop Ltd is registered in England and Wales. Registered address: [BootHop Ltd, England, UK].</P>
          <P>For questions about these Terms, contact us at <a href="mailto:legal@boothop.com" className="text-cyan-400 hover:text-cyan-300 underline transition-colors">legal@boothop.com</a>.</P>
        </Section>

      </div>

      <Footer />
    </div>
  );
}
