import { MetadataRoute } from 'next';

const APP_URL = 'https://www.boothop.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    // ── Core pages ────────────────────────────────────────────
    {
      url:              APP_URL,
      lastModified:     now,
      changeFrequency:  'weekly',
      priority:         1.0,
    },
    {
      url:              `${APP_URL}/journeys`,
      lastModified:     now,
      changeFrequency:  'hourly',
      priority:         0.95,
    },
    {
      url:              `${APP_URL}/how-it-works`,
      lastModified:     now,
      changeFrequency:  'monthly',
      priority:         0.9,
    },
    {
      url:              `${APP_URL}/register`,
      lastModified:     now,
      changeFrequency:  'monthly',
      priority:         0.9,
    },
    {
      url:              `${APP_URL}/pricing`,
      lastModified:     now,
      changeFrequency:  'monthly',
      priority:         0.8,
    },
    {
      url:              `${APP_URL}/trust-safety`,
      lastModified:     now,
      changeFrequency:  'monthly',
      priority:         0.8,
    },
    // ── Auth ──────────────────────────────────────────────────
    {
      url:              `${APP_URL}/login`,
      lastModified:     now,
      changeFrequency:  'monthly',
      priority:         0.6,
    },
    // ── Info ──────────────────────────────────────────────────
    {
      url:              `${APP_URL}/customs`,
      lastModified:     now,
      changeFrequency:  'monthly',
      priority:         0.7,
    },
    {
      url:              `${APP_URL}/help`,
      lastModified:     now,
      changeFrequency:  'monthly',
      priority:         0.6,
    },
    {
      url:              `${APP_URL}/contact`,
      lastModified:     now,
      changeFrequency:  'monthly',
      priority:         0.5,
    },
    // ── Business ──────────────────────────────────────────────
    {
      url:              `${APP_URL}/business`,
      lastModified:     now,
      changeFrequency:  'monthly',
      priority:         0.9,
    },
    {
      url:              `${APP_URL}/business/how-it-works`,
      lastModified:     now,
      changeFrequency:  'monthly',
      priority:         0.7,
    },
    {
      url:              `${APP_URL}/business/pricing`,
      lastModified:     now,
      changeFrequency:  'monthly',
      priority:         0.7,
    },
    // ── Content ───────────────────────────────────────────────
    {
      url:              `${APP_URL}/about`,
      lastModified:     now,
      changeFrequency:  'monthly',
      priority:         0.7,
    },
    {
      url:              `${APP_URL}/blog`,
      lastModified:     now,
      changeFrequency:  'weekly',
      priority:         0.85,
    },
    {
      url:              `${APP_URL}/blog/customs-clearance-services`,
      lastModified:     now,
      changeFrequency:  'monthly',
      priority:         0.8,
    },
    {
      url:              `${APP_URL}/blog/small-business-cross-border-shipping`,
      lastModified:     now,
      changeFrequency:  'monthly',
      priority:         0.8,
    },
    {
      url:              `${APP_URL}/blog/on-board-courier-time-critical-logistics`,
      lastModified:     now,
      changeFrequency:  'monthly',
      priority:         0.8,
    },
    {
      url:              `${APP_URL}/watch`,
      lastModified:     now,
      changeFrequency:  'monthly',
      priority:         0.6,
    },
    {
      url:              `${APP_URL}/carrier-agreement`,
      lastModified:     now,
      changeFrequency:  'yearly',
      priority:         0.5,
    },
    // ── Send hub ──────────────────────────────────────────────
    {
      url:              `${APP_URL}/send`,
      lastModified:     now,
      changeFrequency:  'weekly',
      priority:         0.9,
    },
    // ── Send landing pages ────────────────────────────────────
    {
      url:              `${APP_URL}/send/uk-same-day`,
      lastModified:     now,
      changeFrequency:  'monthly',
      priority:         0.9,
    },
    {
      url:              `${APP_URL}/send/student-delivery`,
      lastModified:     now,
      changeFrequency:  'monthly',
      priority:         0.85,
    },
    {
      url:              `${APP_URL}/send/working-away`,
      lastModified:     now,
      changeFrequency:  'monthly',
      priority:         0.85,
    },
    {
      url:              `${APP_URL}/send/business-urgent`,
      lastModified:     now,
      changeFrequency:  'monthly',
      priority:         0.9,
    },
    {
      url:              `${APP_URL}/send/uk-to-europe`,
      lastModified:     now,
      changeFrequency:  'monthly',
      priority:         0.9,
    },
    // ── City-pair delivery pages ──────────────────────────────
    ...([
      // UK
      'london-to-manchester', 'manchester-to-london',
      'london-to-birmingham', 'birmingham-to-london',
      'london-to-edinburgh',  'edinburgh-to-london',
      'london-to-glasgow',    'glasgow-to-london',
      'london-to-leeds',      'leeds-to-london',
      'london-to-liverpool',  'liverpool-to-london',
      'london-to-bristol',    'bristol-to-london',
      'london-to-sheffield',  'sheffield-to-london',
      'london-to-newcastle',  'newcastle-to-london',
      'london-to-nottingham', 'nottingham-to-london',
      'london-to-essex',      'essex-to-london',
      'bristol-to-nottingham','nottingham-to-bristol',
      'essex-to-loughborough','loughborough-to-essex',
      'nottingham-to-glasgow','glasgow-to-nottingham',
      'manchester-to-birmingham', 'birmingham-to-manchester',
      'manchester-to-edinburgh',  'edinburgh-to-manchester',
      // International — UK ↔ Nigeria extended
      'london-to-prague',        'prague-to-london',
      'london-to-lagos',         'lagos-to-london',
      'london-to-abuja',         'abuja-to-london',
      'london-to-port-harcourt', 'port-harcourt-to-london',
      'manchester-to-lagos',     'lagos-to-manchester',
      'manchester-to-abuja',     'abuja-to-manchester',
      'birmingham-to-lagos',     'lagos-to-birmingham',
      'birmingham-to-abuja',     'abuja-to-birmingham',
      // Nigeria ↔ USA
      'lagos-to-chicago',        'chicago-to-lagos',
      'abuja-to-chicago',        'chicago-to-abuja',
      'lagos-to-houston',        'houston-to-lagos',
      'lagos-to-new-york',       'new-york-to-lagos',
      'abuja-to-new-york',       'new-york-to-abuja',
      'lagos-to-atlanta',        'atlanta-to-lagos',
      'lagos-to-washington-dc',  'washington-dc-to-lagos',
      // Nigeria ↔ Canada
      'lagos-to-toronto',        'toronto-to-lagos',
      'abuja-to-toronto',        'toronto-to-abuja',
      'lagos-to-calgary',        'calgary-to-lagos',
      'lagos-to-vancouver',      'vancouver-to-lagos',
      'lagos-to-ottawa',         'ottawa-to-lagos',
      // UK ↔ Ghana
      'london-to-accra',         'accra-to-london',
    ].map(slug => ({
      url:             `${APP_URL}/send/${slug}`,
      lastModified:    now,
      changeFrequency: 'monthly' as const,
      priority:        0.85,
    }))),
    // ── Legal ─────────────────────────────────────────────────
    {
      url:              `${APP_URL}/terms`,
      lastModified:     now,
      changeFrequency:  'yearly',
      priority:         0.4,
    },
    {
      url:              `${APP_URL}/privacy`,
      lastModified:     now,
      changeFrequency:  'yearly',
      priority:         0.4,
    },
    {
      url:              `${APP_URL}/cookie-policy`,
      lastModified:     now,
      changeFrequency:  'yearly',
      priority:         0.3,
    },
  ];
}
