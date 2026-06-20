import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us – Get Help with Your Delivery | BootHop',
  description:
    'Get in touch with the BootHop team. Support for senders, travellers, and businesses. Questions about deliveries, payments, KYC, or your account.',
  keywords: [
    'contact BootHop', 'BootHop support', 'delivery help UK',
    'peer delivery support', 'international parcel help', 'BootHop customer service',
  ],
  alternates: {
    canonical: 'https://www.boothop.com/contact',
  },
  openGraph: {
    title:       'Contact BootHop | We\'re Here to Help',
    description: 'Reach out to BootHop for help with deliveries, payments, KYC verification, or your account.',
    url:         'https://www.boothop.com/contact',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: 'Contact BootHop' }],
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
