import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Customs Compliance Check – Know Before You Send | BootHop',
  description:
    'Check if your item is safe to send across borders. BootHop\'s AI-powered customs compliance tool screens items against import/export rules for 200+ countries before your package moves.',
  keywords: [
    'customs compliance check', 'UK customs rules', 'import export checker',
    'can I send this abroad', 'customs item checker', 'prohibited items international shipping',
    'cross-border item compliance', 'BootHop customs',
  ],
  alternates: {
    canonical: 'https://www.boothop.com/customs',
  },
  openGraph: {
    title:       'Customs Compliance Checker | BootHop',
    description: 'AI-powered tool to check if your item can legally cross borders. Covers 200+ countries.',
    url:         'https://www.boothop.com/customs',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: 'BootHop Customs Compliance' }],
  },
};

export default function CustomsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
