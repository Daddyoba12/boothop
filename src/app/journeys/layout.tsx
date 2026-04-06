import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live International Delivery Journeys',
  description:
    'Browse live journeys from verified BootHop travellers. Send your parcel to Nigeria, Ghana, Kenya, Dubai and worldwide — or earn money carrying packages on trips you\'re already taking.',
  keywords: [
    'live delivery journeys', 'find a traveller to carry my parcel',
    'send parcel with traveller UK', 'peer delivery journeys',
    'London to Lagos traveller', 'UK to Nigeria delivery',
    'UK to Ghana parcel', 'UK to Dubai delivery', 'international luggage space',
    'earn carrying packages', 'booter journeys', 'hooper delivery',
  ],
  alternates: {
    canonical: 'https://www.boothop.com/journeys',
  },
  openGraph: {
    title:       'Live Delivery Journeys | BootHop',
    description: 'Browse live traveller journeys. Send parcels worldwide or earn carrying packages.',
    url:         'https://www.boothop.com/journeys',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: 'BootHop Live Journeys' }],
  },
};

export default function JourneysLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
