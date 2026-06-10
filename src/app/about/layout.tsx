import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About BootHop – Peer-to-Peer Delivery, Built for the World',
  description: 'BootHop connects senders with verified travellers for affordable, same-day UK and international delivery. Learn our story, mission, and why millions trust us to move what matters.',
  keywords: [
    'about BootHop', 'BootHop company', 'BootHop team', 'peer to peer delivery company',
    'delivery startup UK', 'community delivery platform', 'BootHop mission', 'who is BootHop',
    'logistics startup', 'verified delivery network', 'BootHop story', 'UK delivery company',
  ],
  openGraph: {
    title: 'About BootHop – Peer-to-Peer Delivery, Built for the World',
    description: 'Learn how BootHop is connecting senders with verified travellers for faster, cheaper delivery across the UK and internationally.',
    url: 'https://www.boothop.com/about',
    type: 'website',
  },
  alternates: { canonical: 'https://www.boothop.com/about' },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
