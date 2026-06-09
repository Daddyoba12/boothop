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
