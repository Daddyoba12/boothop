import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trust & Safety – Verified, Secure Peer Delivery',
  description:
    'BootHop uses KYC identity verification, Stripe escrow payments, and a two-party confirmation system to keep every delivery safe. Learn how we protect senders and travellers.',
  keywords: [
    'BootHop trust safety', 'safe peer delivery', 'KYC verified traveller',
    'escrow parcel delivery', 'secure international shipping',
    'peer delivery verification', 'delivery fraud protection',
    'trusted luggage sharing', 'identity verified courier',
  ],
  alternates: {
    canonical: 'https://www.boothop.com/trust-safety',
  },
  openGraph: {
    title:       'Trust & Safety | BootHop',
    description: 'KYC verified travellers, Stripe escrow, two-party confirmation. Safe peer-to-peer delivery.',
    url:         'https://www.boothop.com/trust-safety',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: 'BootHop Trust & Safety' }],
  },
};

export default function TrustSafetyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
