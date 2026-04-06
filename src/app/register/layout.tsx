import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Send a Parcel or Earn as a Traveller – Get Started',
  description:
    'Join BootHop free. Send parcels internationally with verified travellers — cheaper than couriers. Or earn money from your spare luggage space on trips you\'re already taking.',
  keywords: [
    'join BootHop', 'register BootHop', 'send parcel free signup',
    'traveller earn money register', 'peer delivery sign up',
    'send package abroad register', 'BootHop account',
  ],
  alternates: {
    canonical: 'https://www.boothop.com/register',
  },
  openGraph: {
    title:       'Get Started | BootHop',
    description: 'Send parcels internationally or earn from your luggage space. Join BootHop free.',
    url:         'https://www.boothop.com/register',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: 'Join BootHop' }],
  },
  robots: {
    index:  true,
    follow: true,
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
