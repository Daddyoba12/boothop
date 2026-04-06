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
