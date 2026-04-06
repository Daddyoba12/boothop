import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How It Works – Peer-to-Peer International Delivery',
  description:
    'Learn how BootHop works. Post a parcel, get matched with a verified traveller on your route, pay into secure escrow, and confirm delivery. Simple, safe, affordable international shipping.',
  keywords: [
    'how BootHop works', 'peer to peer delivery explained',
    'how to send parcel with traveller', 'how to earn carrying packages',
    'international delivery process', 'peer delivery step by step',
    'secure escrow parcel delivery', 'KYC verified traveller delivery',
  ],
  alternates: {
    canonical: 'https://www.boothop.com/how-it-works',
  },
  openGraph: {
    title:       'How BootHop Works | Peer-to-Peer International Delivery',
    description: 'Simple 4-step process: post, match, escrow, deliver. Safe peer-to-peer shipping worldwide.',
    url:         'https://www.boothop.com/how-it-works',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: 'How BootHop Works' }],
  },
};

export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
