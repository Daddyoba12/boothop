import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How It Works – Verified Same-Day & Cross-Border Delivery | BootHop',
  description:
    'Learn how BootHop works. Post your delivery, get matched with a verified traveller or courier on your route, pay into secure Stripe escrow, and confirm delivery — with AI customs compliance built in.',
  keywords: [
    'how BootHop works', 'peer to peer delivery explained',
    'how to send parcel with traveller', 'how to earn carrying packages',
    'cross-border delivery process', 'same-day logistics how it works',
    'secure escrow parcel delivery', 'KYC verified traveller delivery',
    'compliance first delivery', 'verified courier delivery',
  ],
  alternates: {
    canonical: 'https://www.boothop.com/how-it-works',
  },
  openGraph: {
    title:       'How BootHop Works | Same-Day & Cross-Border Logistics Network',
    description: 'Post, match, verify, escrow, deliver — BootHop combines AI customs compliance and verified travellers for safe same-day and cross-border delivery.',
    url:         'https://www.boothop.com/how-it-works',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: 'How BootHop Works' }],
  },
};

export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
