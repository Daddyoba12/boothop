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

const APP_URL = 'https://boothop.com';

// ─── Replace G-XXXXXXXXXX with your real GA4 Measurement ID ───────────────
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-XXXXXXXXXX';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'BootHop – Ship Anything. Anywhere. With a Verified Traveler.',
    template: '%s | BootHop',
  },
  description:
    'BootHop connects verified travelers with people who need personal effects, letters, and parcels delivered internationally. Safe, secure, peer-to-peer logistics.',
  keywords: [
    'peer-to-peer delivery',
    'international shipping',
    'send parcels abroad',
    'travelers carrying packages',
    'affordable international logistics',
    'send package to Nigeria',
    'London to Lagos delivery',
    'peer delivery UK',
    'luggage sharing',
    'travel courier',
  ],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BootHop',
  },
  formatDetection: { telephone: false },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'BootHop – Peer-to-Peer International Delivery',
    description:
      'Connect with verified travelers to send items worldwide at a fraction of courier costs.',
    type: 'website',
    siteName: 'BootHop',
    url: APP_URL,
    images: [
      {
        url: '/images/boothop.png',
        width: 512,
        height: 512,
        alt: 'BootHop – Ship Anything. Anywhere.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BootHop – Ship Anything. Anywhere.',
    description:
      'The peer-to-peer logistics platform that connects travellers with senders worldwide.',
    images: ['/images/boothop.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

// JSON-LD structured data — helps Google understand the business
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${APP_URL}/#org`,
      name: 'BootHop',
      url: APP_URL,
      logo: `${APP_URL}/images/boothop.png`,
      description:
        'BootHop connects verified travellers with people who need parcels delivered internationally, at a fraction of courier costs.',
      sameAs: [
        'https://www.instagram.com/boothop',
        'https://www.tiktok.com/@boothop',
        'https://www.facebook.com/boothop',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'support@boothop.com',
        availableLanguage: 'English',
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${APP_URL}/#website`,
      url: APP_URL,
      name: 'BootHop',
      publisher: { '@id': `${APP_URL}/#org` },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${APP_URL}/journeys?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Service',
      '@id': `${APP_URL}/#service`,
      name: 'Peer-to-Peer International Delivery',
      provider: { '@id': `${APP_URL}/#org` },
      serviceType: 'Logistics',
      areaServed: { '@type': 'Country', name: 'Worldwide' },
      description:
        'Verified travellers carry parcels on their existing journeys, connecting senders with affordable international delivery.',
    },
  ],
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
        <link rel="canonical" href={APP_URL} />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Google Analytics 4 — replace G-XXXXXXXXXX with your real ID in .env.local */}
        {GA_ID !== 'G-XXXXXXXXXX' && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_ID}', { page_path: window.location.pathname });
                `,
              }}
            />
          </>
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 min-h-screen`}
      >
        {children}
        <PWAInstallBanner />

        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
