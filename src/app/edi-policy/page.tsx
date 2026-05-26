import { Scale, Users, Heart, UserPlus, Monitor, MessageCircle, CheckCircle, RefreshCw, Info } from 'lucide-react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Equality, Diversity & Inclusion Policy – BootHop',
  description: 'BootHop\'s commitment to creating an inclusive, respectful, fair, and accessible environment for all employees, partners, customers, and platform users.',
};

function Section({ id, title, icon: Icon, children }: {
  id: string; title: string; icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-10 scroll-mt-28">
      <div className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/3 hover:bg-white/5 hover:border-purple-500/20 transition-all duration-300 p-7">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/40 group-hover:scale-110 transition-transform duration-300">
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
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-pink-400 flex-shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function EDIPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white font-sans overflow-x-hidden">

      {/* ANIMATED BACKGROUND BLOBS */}
      <div className="fixed inset-0 opacity-20 pointer-events-none z-0">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
        <div className="absolute bottom-40 left-20 w-96 h-96 bg-violet-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
      </div>

      <NavBar />

      {/* HERO */}
      <section className="relative pt-36 pb-16 px-6 text-center z-10">
        <div className="inline-flex items-center gap-2 mb-6 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-pink-500/30 backdrop-blur-xl">
          <Scale className="h-4 w-4 text-pink-400" />
          <span className="text-xs font-semibold tracking-widest uppercase text-pink-300">EDI Policy</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-white mb-4">
          Equality, Diversity{' '}
          <span className="bg-gradient-to-r from-purple-400 via-pink-300 to-violet-400 bg-clip-text text-transparent">
            &amp; Inclusion
          </span>
        </h1>
        <p className="text-slate-400 text-base max-w-2xl mx-auto">
          BootHop is committed to creating an inclusive, respectful, and accessible environment across its workplace, partnerships, and platform.
        </p>
        <p className="text-xs text-slate-500 mt-4">
          Last updated: May 2026 · Applies to all company operations and platform activities
        </p>
      </section>

      <div className="relative z-10 max-w-3xl mx-auto px-6 pb-24">

        {/* TABLE OF CONTENTS */}
        <div className="rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm p-6 mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Contents</p>
          <ol className="space-y-2 text-sm list-none">
            {[
              ['purpose',         'Purpose'],
              ['scope',           'Scope'],
              ['equality',        'Equality Commitment'],
              ['diversity',       'Diversity & Inclusion'],
              ['recruitment',     'Inclusive Recruitment'],
              ['accessibility',   'Accessibility'],
              ['reporting',       'Reporting Concerns'],
              ['responsibility',  'Responsibility'],
              ['review',          'Policy Review'],
            ].map(([id, label], i) => (
              <li key={id}>
                <a href={`#${id}`} className="flex items-center gap-2 text-pink-400 hover:text-pink-300 transition-colors">
                  <span className="text-xs font-bold text-slate-600 w-5">{i + 1}.</span>
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </div>

        <Section id="purpose" title="Purpose" icon={Info}>
          <P>
            This Equality, Diversity &amp; Inclusion (EDI) Policy outlines BootHop&apos;s commitment to creating
            an inclusive, respectful, fair, and accessible environment for all employees, contractors,
            partners, customers, and platform users.
          </P>
          <P>
            BootHop recognises that diversity strengthens innovation, collaboration, and service delivery.
            As a logistics coordination and technology platform, we are committed to promoting equal
            opportunity across all areas of our operations and to maintaining a culture where people are
            treated with dignity and respect.
          </P>
          <div className="rounded-xl border border-white/8 bg-white/3 p-5 space-y-1">
            <p className="font-semibold text-white text-sm">Policy details</p>
            <p>Company: BootHop</p>
            <p>Policy Owner: Management Team</p>
            <p>Last Updated: May 2026</p>
            <p>Applies To: All company operations and platform activities</p>
          </div>
        </Section>

        <Section id="scope" title="Scope" icon={Users}>
          <P>This policy applies to:</P>
          <Ul items={[
            'Employees',
            'Contractors and consultants',
            'Platform users',
            'Delivery partners and service providers',
            'Recruitment processes',
            'Business partnerships and collaborations',
          ]} />
        </Section>

        <Section id="equality" title="Equality Commitment" icon={Scale}>
          <P>BootHop is committed to providing equal opportunities and fair treatment regardless of:</P>
          <Ul items={[
            'Age',
            'Disability',
            'Gender identity or expression',
            'Marital or civil partnership status',
            'Pregnancy or maternity',
            'Race, ethnicity, or nationality',
            'Religion or belief',
            'Sex',
            'Sexual orientation',
            'Socioeconomic background',
          ]} />
          <P>
            Discrimination, harassment, victimisation, bullying, or unfair treatment of any kind will not be tolerated.
          </P>
          <P>
            BootHop is committed to ensuring that decisions relating to recruitment, engagement, progression,
            access to services, and professional treatment are based on merit, suitability, conduct, and
            legitimate business needs.
          </P>
        </Section>

        <Section id="diversity" title="Diversity & Inclusion" icon={Heart}>
          <P>
            BootHop values diversity and aims to create an environment where individuals feel respected,
            supported, and able to contribute fully.
          </P>
          <P>
            As a technology and logistics platform operating across multiple communities and regions,
            BootHop seeks to:
          </P>
          <Ul items={[
            'Encourage inclusive participation',
            'Promote fair access to services and opportunities',
            'Support diverse perspectives and innovation',
            'Build a respectful and professional working culture',
            'Foster an environment free from exclusionary or discriminatory behaviour',
          ]} />
          <P>
            We believe that inclusive thinking leads to better decision-making, stronger partnerships,
            and better service outcomes.
          </P>
        </Section>

        <Section id="recruitment" title="Inclusive Recruitment" icon={UserPlus}>
          <P>BootHop is committed to fair and unbiased recruitment practices.</P>
          <P>Recruitment and selection decisions will be based on:</P>
          <Ul items={[
            'Skills',
            'Qualifications',
            'Experience',
            'Suitability for the role',
          ]} />
          <P>
            BootHop will not discriminate during hiring, onboarding, promotion, training, or any other
            employment-related process. As an early-stage company, our recruitment processes may remain
            lean, but we are committed to ensuring they are fair, professional, and inclusive.
          </P>
        </Section>

        <Section id="accessibility" title="Accessibility" icon={Monitor}>
          <P>
            BootHop aims to improve accessibility across its digital platform, communications, and
            operations wherever reasonably practicable.
          </P>
          <P>This includes:</P>
          <Ul items={[
            'Clear communication',
            'Inclusive digital experiences',
            'Consideration of accessibility requirements',
            'Continuous improvement of platform usability',
          ]} />
          <P>
            We recognise that accessibility is an ongoing process and are committed to improving where
            appropriate as the company grows.
          </P>
        </Section>

        <Section id="reporting" title="Reporting Concerns" icon={MessageCircle}>
          <P>
            Any concerns relating to discrimination, harassment, bullying, or unfair treatment may be
            reported confidentially through BootHop&apos;s official communication channels.
          </P>
          <P>Concerns may be raised through:</P>
          <Ul items={[
            'Management',
            'A relevant BootHop contact',
            'info@boothop.com',
          ]} />
          <P>
            All concerns will be reviewed fairly, sensitively, and appropriately. BootHop will not
            tolerate retaliation against any person who raises a genuine concern in good faith.
          </P>
          <div className="rounded-xl border border-white/8 bg-white/3 p-5">
            <p className="font-semibold text-white text-sm mb-1">Contact us</p>
            <p>Email: <a href="mailto:info@boothop.com" className="text-pink-400 hover:text-pink-300 underline transition-colors">info@boothop.com</a></p>
          </div>
        </Section>

        <Section id="responsibility" title="Responsibility" icon={CheckCircle}>
          <P>
            All employees, contractors, partners, and representatives of BootHop are expected to:
          </P>
          <Ul items={[
            'Treat others with dignity and respect',
            'Promote inclusive behaviour',
            'Avoid discriminatory conduct',
            'Support a positive and professional environment',
          ]} />
          <P>
            Management is responsible for monitoring compliance with this policy and for taking
            appropriate action where concerns arise.
          </P>
        </Section>

        <Section id="review" title="Policy Review" icon={RefreshCw}>
          <P>
            This policy will be reviewed periodically as BootHop grows to ensure continued
            effectiveness, legal compliance, and alignment with operational practices.
          </P>
          <P>
            BootHop is committed to continuously improving its approach to equality, diversity,
            inclusion, and accessibility across the business and platform.
          </P>
        </Section>

      </div>

      <Footer />
    </div>
  );
}
