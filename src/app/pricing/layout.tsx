import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing – Affordable International Parcel Delivery',
  description:
    'BootHop charges a small platform fee on top of the agreed delivery price. No hidden costs. Senders pay less than traditional couriers. Travellers earn 100% of the agreed fee.',
  keywords: [
    'BootHop pricing', 'peer delivery cost', 'international parcel cost',
    'cheap international shipping UK', 'affordable parcel delivery Nigeria',
    'delivery platform fees', 'escrow fee', 'how much to send parcel abroad',
  ],
  alternates: {
    canonical: 'https://www.boothop.com/pricing',
  },
  openGraph: {
    title:       'Pricing | BootHop',
    description: 'Transparent pricing. No hidden fees. Send parcels internationally for less.',
    url:         'https://www.boothop.com/pricing',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: 'BootHop Pricing' }],
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
