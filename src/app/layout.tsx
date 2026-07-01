import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
import { Suspense } from 'react';
import './globals.css';
import PWAInstallBanner from '@/components/PWAInstallBanner';
import DeviceFingerprint from '@/components/DeviceFingerprint';
import WorldCupWidget from '@/components/WorldCupWidget';
import GATracker from '@/components/GATracker';
import { TikTokPageTracker } from '@/components/TikTokTracker';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

const APP_URL  = 'https://www.boothop.com';
const GA_ID    = process.env.NEXT_PUBLIC_GA_ID || '';
const TTOK_ID  = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || '';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),

  title: {
    default:  'BootHop – Ship Anything. Anywhere. With a Verified Traveller.',
    template: '%s | BootHop',
  },

  description:
    'BootHop is a compliance-first logistics network connecting verified travellers, couriers, businesses, and consumers for same-day and cross-border delivery. Real-time GPS package tracking, AI-assisted customs screening, and Stripe escrow on every transaction.',

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
    // Trust / safety & tracking
    'verified traveller delivery', 'safe peer delivery', 'escrow parcel delivery',
    'real time package tracking', 'live parcel tracking', 'GPS package tracking',
    'track package internationally', 'parcel tracking app', 'live delivery tracking',
    // Compliance & customs
    'customs clearance services', 'UK customs clearance', 'cross-border compliance', 'pre-departure customs screening',
    // Business / enterprise
    'on-board courier UK', 'time-critical logistics', 'OBC delivery service',
    'small business international shipping', 'cross-border shipping UK',
    'same day courier service UK', 'verified courier service',
    // B2B
    'business logistics UK', 'enterprise delivery network', 'critical parts delivery UK',
    'AOG parts delivery', 'pharmaceutical courier UK', 'legal document courier UK',
    // UK domestic
    'same day delivery UK', 'same day courier UK', 'urgent delivery UK',
    'UK domestic same day delivery', 'send parcel same day UK',
    // Student
    'student delivery UK', 'send stuff to university UK', 'goods left at home delivery',
    'student package delivery UK', 'send belongings to uni',
    // Working away
    'working away from home delivery UK', 'send package to temporary address UK',
    'delivery for contractors UK', 'urgent delivery while working away',
    // B2B urgent verticals
    'urgent business delivery UK', 'legal document courier UK', 'AOG parts delivery UK',
    'same day courier law firm', 'premiership football courier', 'financial document courier UK',
    // UK-Europe
    'UK to Europe delivery', 'send parcel to Europe from UK', 'post-Brexit UK delivery Europe',
    'UK to France delivery', 'UK to Germany parcel', 'UK to Spain delivery',
  ],

  icons: {
    icon: [
      { url: '/favicon.ico',        sizes: 'any' },
      { url: '/icon-32x32.png',     type: 'image/png', sizes: '32x32'  },
      { url: '/icon-96x96.png',     type: 'image/png', sizes: '96x96'  },
      { url: '/icon-192x192.png',   type: 'image/png', sizes: '192x192'},
      { url: '/icon-512x512.png',   type: 'image/png', sizes: '512x512'},
    ],
    apple:    { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    shortcut: '/favicon.ico',
  },
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
    title:       'BootHop | Same-Day & Cross-Border Logistics Network',
    description: 'BootHop is a compliance-first logistics network connecting verified travellers, couriers, businesses, and consumers for same-day and cross-border delivery. Real-time GPS tracking, AI customs screening, and Stripe escrow on every transaction.',
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
    description: 'BootHop is a compliance-first logistics network connecting verified travellers, couriers, businesses, and consumers for same-day and cross-border delivery. Real-time GPS tracking, AI customs screening, and Stripe escrow on every transaction.',
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
        'BootHop is a compliance-first logistics network delivering same-day, cross-border, and business logistics through verified travellers and couriers — with AI customs screening, Stripe escrow, and KYC on every movement.',
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
        email:              'info@boothop.com',
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
      name:          'Compliance-First Same-Day & Cross-Border Delivery Network',
      provider:      { '@id': `${APP_URL}/#org` },
      serviceType:   'Logistics Network',
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
        'Verified travellers carry parcels on their existing journeys, connecting senders with affordable international delivery worldwide. Real-time GPS tracking, AI customs screening, and Stripe escrow on every delivery.',
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

        {/* Preconnect to critical origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />


        {/* TikTok Pixel */}
        {TTOK_ID && (
          <script
            dangerouslySetInnerHTML={{ __html: `
              !function(w,d,t){
                w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
                ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
                ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
                for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
                ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
                ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
                ttq.load('${TTOK_ID}');
                ttq.page();
              }(window,document,'ttq');
            ` }}
          />
        )}

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
                    send_page_view: false,
                    anonymize_ip: false,
                    allow_google_signals: true,
                    allow_ad_personalization_signals: true,
                  });
                `,
              }}
            />
          </>
        )}
        {/* Service Worker — registered inline so scanners (PWABuilder) detect it before React hydrates */}
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker'in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});});}` }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 min-h-screen`}>
        {children}
        <TikTokPageTracker />
        <DeviceFingerprint />
        <PWAInstallBanner />
        <WorldCupWidget />
        {GA_ID && (
          <Suspense fallback={null}>
            <GATracker gaId={GA_ID} />
          </Suspense>
        )}
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
