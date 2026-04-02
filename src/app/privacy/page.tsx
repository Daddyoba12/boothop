import Link from 'next/link';
import { Shield, Eye, Lock, Database, Globe, Mail, UserCheck, Trash2 } from 'lucide-react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Privacy Policy – BootHop',
  description: 'How BootHop collects, uses, and protects your personal data.',
};

function Section({ id, title, icon: Icon, children }: {
  id: string; title: string; icon: React.ElementType; children: React.ReactNode;
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
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PrivacyPage() {
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
          <Shield className="h-4 w-4 text-cyan-400" />
          <span className="text-xs font-semibold tracking-widest uppercase text-cyan-300">Privacy Policy</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-white mb-4">
          Your privacy{' '}
          <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
            matters
          </span>
        </h1>
        <p className="text-slate-400 text-base max-w-xl mx-auto">
          We are committed to protecting your personal data. This policy explains what we collect, why, and how we keep it safe.
        </p>
        <p className="text-xs text-slate-500 mt-4">Last updated: {lastUpdated} · BootHop Ltd, United Kingdom</p>
      </section>

      <div className="relative z-10 max-w-3xl mx-auto px-6 pb-24">

        {/* TABLE OF CONTENTS */}
        <div className="rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm p-6 mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Contents</p>
          <ol className="space-y-2 text-sm list-none">
            {[
              ['who-we-are', 'Who We Are'],
              ['data-we-collect', 'Data We Collect'],
              ['how-we-use', 'How We Use Your Data'],
              ['legal-basis', 'Legal Basis for Processing'],
              ['sharing', 'Who We Share Data With'],
              ['international', 'International Transfers'],
              ['retention', 'How Long We Keep Data'],
              ['your-rights', 'Your Rights'],
              ['cookies', 'Cookies'],
              ['security', 'Security'],
              ['contact-dpo', 'Contact & DPO'],
            ].map(([id, label], i) => (
              <li key={id}>
                <a href={`#${id}`} className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors">
                  <span className="text-xs font-bold text-slate-600 w-5">{i + 1}.</span>
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </div>

        <Section id="who-we-are" title="Who We Are" icon={Shield}>
          <P>BootHop Ltd ("BootHop", "we", "us") is a company registered in the United Kingdom. We operate the peer-to-peer delivery platform available at boothop.co.uk and its associated applications.</P>
          <P>BootHop acts as the data controller for the personal information you provide when using our platform.</P>
          <P>If you have questions about how we handle your data, please contact us at <a href="mailto:privacy@boothop.co.uk" className="text-cyan-400 hover:text-cyan-300 underline transition-colors">privacy@boothop.co.uk</a>.</P>
        </Section>

        <Section id="data-we-collect" title="Data We Collect" icon={Database}>
          <P>We collect the following categories of personal data:</P>
          <Ul items={[
            'Identity data: full name, date of birth, government ID (for KYC verification)',
            'Contact data: email address',
            'Transaction data: delivery listings, matched trips, payment records',
            'Profile data: ratings, reviews, delivery history',
            'Technical data: IP address, browser type, device identifiers, usage logs',
            'Communications: messages sent through the BootHop platform',
            'Location data: cities you travel to and from (not real-time GPS)',
          ]} />
          <P>We do not collect sensitive personal data (such as health, religion, or political views) unless legally required.</P>
        </Section>

        <Section id="how-we-use" title="How We Use Your Data" icon={Eye}>
          <P>We use your personal data to:</P>
          <Ul items={[
            'Create and manage your BootHop account',
            'Match you with compatible Booters or Hoopers',
            'Process payments and manage escrow',
            'Verify your identity through KYC checks',
            'Send transactional emails (match notifications, payment receipts, OTP codes)',
            'Investigate complaints, disputes, or safety incidents',
            'Improve our platform through analytics and usage data',
            'Comply with legal obligations, including fraud prevention and customs reporting',
          ]} />
          <P>We will never sell your personal data to third parties for marketing purposes.</P>
        </Section>

        <Section id="legal-basis" title="Legal Basis for Processing" icon={UserCheck}>
          <P>We process your data under the following legal bases (UK GDPR Article 6):</P>
          <Ul items={[
            'Contract performance: to provide our platform services to you',
            'Legal obligation: identity verification, fraud prevention, compliance with UK and international law',
            'Legitimate interests: platform safety, dispute resolution, analytics to improve our service',
            'Consent: for any marketing communications (you may withdraw consent at any time)',
          ]} />
        </Section>

        <Section id="sharing" title="Who We Share Data With" icon={Globe}>
          <P>We may share your data with the following categories of third parties, strictly as necessary:</P>
          <Ul items={[
            'Stripe Inc. — payment processing and escrow management',
            'Supabase — secure cloud database and authentication infrastructure',
            'Resend — transactional email delivery',
            'Identity verification providers — for KYC/AML compliance',
            'Law enforcement or regulatory authorities — when legally required',
            'Other platform users — limited profile information is visible to your matched counterpart (name, ratings)',
          ]} />
          <P>All third-party processors are bound by data processing agreements and must comply with applicable data protection law.</P>
        </Section>

        <Section id="international" title="International Transfers" icon={Globe}>
          <P>Some of our service providers are based outside the UK or EEA. Where your data is transferred internationally, we ensure appropriate safeguards are in place, such as Standard Contractual Clauses (SCCs) approved by the UK ICO or equivalent mechanisms.</P>
          <P>For example, Stripe and Supabase are US-based services. Data transfers to the US are covered by their respective Data Processing Agreements incorporating SCCs.</P>
        </Section>

        <Section id="retention" title="How Long We Keep Data" icon={Trash2}>
          <P>We retain personal data only for as long as necessary:</P>
          <Ul items={[
            'Account data: retained for the lifetime of your account plus 6 years after closure (for legal and financial record-keeping)',
            'Transaction records: 7 years (UK financial regulation requirements)',
            'KYC documents: 5 years after last transaction (AML regulations)',
            'Messages: 2 years from the date of the match',
            'Technical / server logs: 90 days',
          ]} />
          <P>You may request deletion of your data at any time (subject to legal retention obligations).</P>
        </Section>

        <Section id="your-rights" title="Your Rights" icon={UserCheck}>
          <P>Under UK GDPR, you have the following rights:</P>
          <Ul items={[
            'Right to access: request a copy of the personal data we hold about you',
            'Right to rectification: ask us to correct inaccurate or incomplete data',
            'Right to erasure: request deletion of your data (subject to legal retention obligations)',
            'Right to restriction: ask us to limit how we process your data',
            'Right to data portability: receive your data in a structured, machine-readable format',
            'Right to object: object to processing based on legitimate interests',
            'Right to withdraw consent: for any processing based on your consent',
          ]} />
          <P>To exercise any of these rights, email <a href="mailto:privacy@boothop.co.uk" className="text-cyan-400 hover:text-cyan-300 underline transition-colors">privacy@boothop.co.uk</a>. We will respond within 30 days. You also have the right to lodge a complaint with the UK Information Commissioner's Office (ICO) at ico.org.uk.</P>
        </Section>

        <Section id="cookies" title="Cookies" icon={Eye}>
          <P>BootHop uses essential cookies required for the platform to function (session management, authentication). We do not use advertising or tracking cookies.</P>
          <Ul items={[
            'Session cookies: maintain your login state (deleted when you close your browser)',
            'Preference cookies: remember your settings (30-day expiry)',
            'Analytics cookies: anonymous, aggregated usage data to improve the platform (opt-out available)',
          ]} />
          <P>You can control cookie preferences through your browser settings. Note that disabling essential cookies may prevent you from using the platform.</P>
        </Section>

        <Section id="security" title="Security" icon={Lock}>
          <P>We take the security of your personal data seriously. Our security measures include:</P>
          <Ul items={[
            'All data transmitted over TLS/HTTPS encryption',
            'Database encryption at rest',
            'Row-level security (RLS) policies ensuring users can only access their own data',
            'Magic link / OTP authentication — no passwords stored',
            'Payment card data handled exclusively by Stripe (we never see or store raw card numbers)',
            'Regular security reviews and penetration testing',
          ]} />
          <P>In the event of a data breach affecting your rights, we will notify you and the ICO within 72 hours as required by law.</P>
        </Section>

        <Section id="contact-dpo" title="Contact & Data Protection" icon={Mail}>
          <P>For all privacy-related enquiries, please contact:</P>
          <div className="rounded-xl border border-white/8 bg-white/3 p-5 space-y-1">
            <p className="font-semibold text-white">BootHop Ltd — Data Protection</p>
            <p>Email: <a href="mailto:privacy@boothop.co.uk" className="text-cyan-400 hover:text-cyan-300 underline transition-colors">privacy@boothop.co.uk</a></p>
            <p>Registered in England and Wales</p>
          </div>
          <P>We aim to respond to all privacy enquiries within 30 days. For urgent data protection concerns, mark your email with "URGENT – Data Protection".</P>
        </Section>

      </div>

      <Footer />
    </div>
  );
}
