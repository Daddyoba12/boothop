import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import PWAInstallBanner from '@/components/PWAInstallBanner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'BootHop – Ship Anything. Anywhere. With a Verified Traveler.',
  description:
    'BootHop connects verified travelers with people who need personal effects, letters, and parcels delivered internationally. Safe, secure, peer-to-peer logistics.',
  keywords: [
    'peer-to-peer delivery',
    'international shipping',
    'send parcels abroad',
    'travelers carrying packages',
    'affordable international logistics',
  ],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BootHop',
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: 'BootHop – Peer-to-Peer International Delivery',
    description:
      'Connect with verified travelers to send items worldwide at a fraction of courier costs.',
    type: 'website',
    siteName: 'BootHop',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BootHop – Ship Anything. Anywhere.',
    description:
      'The peer-to-peer logistics platform that connects travellers with senders worldwide.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#2563eb" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/images/boothop.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 min-h-screen`}
      >
        {children}
        <PWAInstallBanner />

        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
