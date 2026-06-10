import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Business Delivery UK – Same-Day Courier & Enterprise Logistics | BootHop',
  description: 'BootHop Business: same-day UK courier, international delivery, and enterprise logistics for companies that can\'t afford downtime. Verified carriers, fully insured, 2-hour response. From £300.',
  keywords: [
    'business delivery UK', 'same day courier business', 'enterprise logistics UK',
    'urgent business delivery', 'AOG parts delivery', 'legal document courier',
    'same day B2B delivery', 'corporate courier UK', 'critical logistics UK',
    'BootHop business', 'on-board courier UK', 'insured business delivery',
    'aerospace parts courier', 'healthcare logistics UK', 'priority delivery service',
  ],
  openGraph: {
    title: 'Business Delivery UK – Same-Day Courier & Enterprise Logistics | BootHop',
    description: 'Same-day UK courier and enterprise logistics for businesses. Verified carriers, fully insured, 2-hour guaranteed response. From £300.',
    url: 'https://www.boothop.com/business',
    type: 'website',
  },
  alternates: { canonical: 'https://www.boothop.com/business' },
};

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
