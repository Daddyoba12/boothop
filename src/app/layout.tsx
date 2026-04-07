import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import PWAInstallBanner from '@/components/PWAInstallBanner';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

const APP_URL = 'https://www.boothop.com';
const GA_ID   = process.env.NEXT_PUBLIC_GA_ID || '';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),

  title: {
    default:  'BootHop – Ship Anything. Anywhere. With a Verified Traveller.',
    template: '%s | BootHop',
  },

  description:
    'BootHop is the peer-to-peer international delivery platform that connects verified travellers with senders worldwide. Send parcels to Nigeria, Ghana, Kenya, Dubai and beyond — cheaper than couriers, faster than freight.',

  keywords: [
    // Core concept
    'peer to peer delivery', 'peer-to-peer international shipping', 'crowdsourced delivery',
    'luggage sharing delivery', 'travel courier service', 'send parcel with traveller',
    // Routes — Africa
    'send package to Nigeria', 'London to Lagos delivery', 'UK to Nigeria parcel',
    'send package to Ghana', 'UK to Ghana delivery', 'London to Accra parcel',
    'send package to Kenya', 'UK to Nairobi delivery',
    // Routes — Middle East
    'send package to Dubai', 'UK to UAE parcel', 'London to Dubai delivery',
    // Routes — general
    'send parcel abroad cheap', 'cheap international parcel delivery',
    'affordable international shipping UK', 'send package overseas',
    // Traveller side
    'earn money travelling', 'get paid to carry packages', 'make money from luggage space',
    'earn from spare baggage', 'side income travelling',
    // Brand
    'BootHop', 'boothop delivery', 'boothop shipping',
    // Trust / safety
    'verified traveller delivery', 'safe peer delivery', 'escrow parcel delivery',
  ],

  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BootHop',
  },
  formatDetection: { telephone: false },

  alternates: {
    canonical: APP_URL,
  },

  openGraph: {
    title:       'BootHop – Peer-to-Peer International Delivery',
    description: 'Connect with verified travellers to send items worldwide — London to Lagos, UK to Dubai and beyond — at a fraction of courier costs.',
    type:        'website',
    siteName:    'BootHop',
    url:         APP_URL,
    locale:      'en_GB',
    images: [
      {
        url:    '/images/og-image.png',
        width:  1200,
        height: 630,
        alt:    'BootHop – Ship Anything. Anywhere.',
      },
      {
        url:    '/images/boothop1.png',
        width:  512,
        height: 512,
        alt:    'BootHop logo',
      },
    ],
  },

  twitter: {
    card:        'summary_large_image',
    site:        '@boothop',
    creator:     '@boothop',
    title:       'BootHop – Ship Anything. Anywhere.',
    description: 'The peer-to-peer logistics platform connecting travellers with senders worldwide.',
    images:      ['/images/og-image.png'],
  },

  robots: {
    index:     true,
    follow:    true,
    googleBot: {
      index:              true,
      follow:             true,
      'max-image-preview': 'large',
      'max-snippet':       -1,
      'max-video-preview': -1,
    },
  },

  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } }
    : {}),

  category: 'logistics',
};

// ── JSON-LD Structured Data ────────────────────────────────────────────────
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id':   `${APP_URL}/#org`,
      name:    'BootHop',
      url:     APP_URL,
      logo: {
        '@type':      'ImageObject',
        url:          `${APP_URL}/images/boothop1.png`,
        width:        512,
        height:       512,
      },
      description:
        'BootHop connects verified travellers with people who need parcels delivered internationally, at a fraction of courier costs.',
      foundingDate: '2024',
      areaServed:   'Worldwide',
      sameAs: [
        'https://www.instagram.com/boothop',
        'https://www.tiktok.com/@boothop',
        'https://www.facebook.com/boothop',
        'https://twitter.com/boothop',
      ],
      contactPoint: {
        '@type':            'ContactPoint',
        contactType:        'customer support',
        email:              'support@boothop.com',
        availableLanguage:  'English',
      },
    },
    {
      '@type':   'WebSite',
      '@id':     `${APP_URL}/#website`,
      url:       APP_URL,
      name:      'BootHop',
      inLanguage: 'en-GB',
      publisher:  { '@id': `${APP_URL}/#org` },
      potentialAction: {
        '@type':      'SearchAction',
        target:       `${APP_URL}/journeys?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type':       'Service',
      '@id':         `${APP_URL}/#service`,
      name:          'Peer-to-Peer International Parcel Delivery',
      provider:      { '@id': `${APP_URL}/#org` },
      serviceType:   'Delivery Service',
      category:      'Logistics',
      areaServed:    { '@type': 'Country', name: 'Worldwide' },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Delivery Services',
        itemListElement: [
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Send a Package' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Carry a Package & Earn' } },
        ],
      },
      description:
        'Verified travellers carry parcels on their existing journeys, connecting senders with affordable international delivery worldwide.',
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type':          'Question',
          name:             'How does BootHop work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:    'BootHop connects people who need to send parcels internationally with verified travellers who have spare luggage space. Senders post their delivery request, travellers accept, payment is held in escrow, and funds release on confirmed delivery.',
          },
        },
        {
          '@type':          'Question',
          name:             'Is BootHop safe?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:    'Yes. All travellers complete identity verification (KYC), payments are held in secure Stripe escrow, and both parties must confirm delivery before funds are released.',
          },
        },
        {
          '@type':          'Question',
          name:             'How much does it cost to send a parcel with BootHop?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:    'Senders pay the agreed price plus a small platform fee. Prices are typically 50-80% cheaper than traditional courier services. Travellers pay no fees — they earn from every successful delivery.',
          },
        },
        {
          '@type':          'Question',
          name:             'Which countries does BootHop serve?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:    'BootHop is available worldwide. Popular routes include London to Lagos, UK to Ghana, UK to Kenya, UK to Dubai, and many more destinations across Africa, the Middle East, Asia, and the Americas.',
          },
        },
      ],
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        <meta name="theme-color" content="#2563eb" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/images/boothop1.png" />
        <link rel="canonical" href={APP_URL} />

        {/* Preconnect to critical origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Google Analytics 4 */}
        {GA_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_ID}', {
                    page_path: window.location.pathname,
                    send_page_view: true,
                    anonymize_ip: false,
                    allow_google_signals: true,
                    allow_ad_personalization_signals: true,
                  });
                `,
              }}
            />
          </>
        )}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 min-h-screen`}>
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
