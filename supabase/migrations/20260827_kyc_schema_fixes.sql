-- KYC schema fixes: add missing tracking columns + video_kyc table + profiles table
-- Fixes: create-session leaving status stuck, webhook unable to write verified_at,
--        video-submit/video-approve using non-existent booter/hooper column names.

-- ── 1. Missing KYC columns on matches ──────────────────────────────────────────
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS sender_kyc_session_id    TEXT,
  ADD COLUMN IF NOT EXISTS traveler_kyc_session_id   TEXT,
  ADD COLUMN IF NOT EXISTS sender_kyc_verified_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS traveler_kyc_verified_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sender_video_kyc_status   TEXT,
  ADD COLUMN IF NOT EXISTS traveler_video_kyc_status TEXT,
  ADD COLUMN IF NOT EXISTS sender_video_kyc_path     TEXT,
  ADD COLUMN IF NOT EXISTS traveler_video_kyc_path   TEXT,
  ADD COLUMN IF NOT EXISTS sender_photo_kyc_path     TEXT,
  ADD COLUMN IF NOT EXISTS traveler_photo_kyc_path   TEXT,
  ADD COLUMN IF NOT EXISTS sender_video_kyc_expires_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS traveler_video_kyc_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sender_video_kyc_submitted   BIGINT,
  ADD COLUMN IF NOT EXISTS traveler_video_kyc_submitted  BIGINT,
  ADD COLUMN IF NOT EXISTS sender_id_received   BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS traveler_id_received  BOOLEAN DEFAULT false;

-- ── 2. video_kyc table ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.video_kyc (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id     UUID        NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  email        TEXT        NOT NULL,
  video_path   TEXT,
  photo_path   TEXT,
  status       TEXT        DEFAULT 'pending_review',
  expires_at   TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  reviewed_at  TIMESTAMPTZ,
  reviewed_by  TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (match_id, email)
);

-- ── 3. Add kyc_pending to matches status constraint ───────────────────────────
ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_status_check;
ALTER TABLE public.matches ADD CONSTRAINT matches_status_check CHECK (status = ANY (ARRAY[
  'matched','accepted','declined','in_transit','completed','disputed','cancelled',
  'agreed','committed','kyc_pending','kyc_complete',
  'locked_pending_compliance','compliance_in_progress','inspection_pending',
  'seal_pending','active','delivery_confirmed'
]::text[]));

-- ── 4. profiles table (admin roles + id_verified tracking) ────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT        UNIQUE NOT NULL,
  role           TEXT        DEFAULT 'user',
  is_verified    BOOLEAN     DEFAULT false,
  id_verified    BOOLEAN     DEFAULT false,
  id_verified_at TIMESTAMPTZ,
  total_deliveries INT       DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- If profiles already existed with a different schema, add any missing columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role           TEXT        DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS id_verified    BOOLEAN     DEFAULT false,
  ADD COLUMN IF NOT EXISTS id_verified_at TIMESTAMPTZ;

-- ── 5. user_verifications — email-keyed id_verified tracking ──────────────────
-- profiles is tied to Supabase auth.users; this table works with custom JWT auth
CREATE TABLE IF NOT EXISTS public.user_verifications (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT        NOT NULL UNIQUE,
  id_verified    BOOLEAN     DEFAULT false,
  id_verified_at TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);
