import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Watch BootHop – See How It Works | BootHop',
  description:
    'See BootHop in action. Watch how senders connect with verified travellers to ship packages worldwide, cheaper and faster than traditional couriers.',
  alternates: {
    canonical: 'https://www.boothop.com/watch',
  },
  openGraph: {
    title:       'Watch BootHop | Ship Anything, Anywhere',
    description: 'See how BootHop connects senders with verified travellers for affordable cross-border delivery.',
    url:         'https://www.boothop.com/watch',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: 'BootHop in action' }],
  },
  robots: { index: false, follow: false },
};

export default function WatchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
