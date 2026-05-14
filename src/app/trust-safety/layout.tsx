import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trust & Safety – Compliance-First Verified Delivery | BootHop',
  description:
    'BootHop uses KYC identity verification, Stripe escrow payments, AI customs compliance screening, and a two-party confirmation system to keep every delivery safe and compliant. Learn how we protect senders, travellers, and businesses.',
  keywords: [
    'BootHop trust safety', 'compliance first delivery', 'KYC verified traveller',
    'escrow parcel delivery', 'secure international shipping',
    'AI customs compliance', 'delivery fraud protection',
    'verified logistics network', 'identity verified courier',
  ],
  alternates: {
    canonical: 'https://www.boothop.com/trust-safety',
  },
  openGraph: {
    title:       'Trust & Safety | BootHop Compliance-First Logistics',
    description: 'KYC verified travellers, Stripe escrow, AI customs screening, two-party confirmation. Compliance-first delivery on every movement.',
    url:         'https://www.boothop.com/trust-safety',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: 'BootHop Trust & Safety' }],
  },
};

export default function TrustSafetyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
