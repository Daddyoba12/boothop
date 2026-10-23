-- 2026-10-23 — Columns the application code writes but the database never had.
--
-- Both are additive, nullable, and guarded with IF NOT EXISTS. Neither rewrites
-- existing rows. Verified against production before writing: `trips` has no
-- route_type, `push_subscriptions` has no updated_at.
--
-- Run order does not matter; they are independent.

-- ── 1. trips.route_type ────────────────────────────────────────────────────
-- /api/trips/create inserts route_type on every trip. The column has never
-- existed, so that insert always fails and the route silently falls back to
-- `coreInsert` only (see trips/create/route.ts). The fallback also discards
-- from_city_en, to_city_en, language and translated — which is why every trip
-- in production has from_city_en = null and translated = false, and why
-- non-English listings never match (auto-match's cityEn() prefers *_en).
--
-- Type matches the existing business_jobs.route_type: free-text classifier
-- ('local_uk', etc.) produced by classifyRoute() in register/page.tsx.
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS route_type text;

-- ── 2. push_subscriptions.updated_at ───────────────────────────────────────
-- /api/push/subscribe upserts { user_email, subscription, updated_at }. The
-- column does not exist, so every push-subscription write fails and the table
-- is empty — web push has never worked for anyone, web or mobile.
ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- The same upsert uses onConflict: 'user_email', which requires a unique
-- constraint on that column. The table is currently empty, so adding it now
-- cannot fail on duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS push_subscriptions_user_email_key
  ON public.push_subscriptions (user_email);
