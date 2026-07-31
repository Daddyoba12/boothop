import type { Metadata } from 'next';
import FlightTicker from '@/components/bfi/FlightTicker';

export const metadata: Metadata = {
  title: 'Send a Package – Same-Day & International Delivery | BootHop',
  description: 'Send parcels anywhere in the UK or internationally with a verified traveller already making the journey. Cheaper than DHL, faster than post. Find your route on BootHop.',
  alternates: { canonical: 'https://www.boothop.com/send' },
  openGraph: {
    title: 'Send a Package | BootHop',
    description: 'Find a verified traveller on your route and send your package for less. Same-day UK and international delivery via BootHop.',
    url: 'https://www.boothop.com/send',
    type: 'website',
  },
};

export default function SendLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <FlightTicker fixed />
    </>
  );
}
