-- Commander: Supabase SQL migrations
-- Run these in the Supabase SQL editor (Settings → SQL Editor)
-- Safe to run multiple times (uses IF NOT EXISTS / ON CONFLICT)

-- ─────────────────────────────────────────────────────────────
-- 1. pipeline_clients  (may already exist — this adds missing cols)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pipeline_clients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,
  company       TEXT NOT NULL,
  email         TEXT,
  contact_name  TEXT,
  plan          TEXT NOT NULL DEFAULT 'basic',
  status        TEXT NOT NULL DEFAULT 'active',
  platforms     TEXT[],
  password_hash TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add password_hash if the table already existed without it
ALTER TABLE pipeline_clients ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE pipeline_clients ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- ─────────────────────────────────────────────────────────────
-- 2. commander_reset_tokens
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS commander_reset_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  UUID NOT NULL REFERENCES pipeline_clients(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 3. music_tracks  (BootHop music library)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS music_tracks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  artist           TEXT NOT NULL DEFAULT '',
  genre            TEXT NOT NULL DEFAULT 'General',
  duration_seconds INTEGER,
  source           TEXT NOT NULL DEFAULT 'library',  -- 'library' | 'youtube'
  youtube_id       TEXT UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 4. client_music  (which tracks are assigned to which client)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_music (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES pipeline_clients(id) ON DELETE CASCADE,
  track_id    UUID NOT NULL REFERENCES music_tracks(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (client_id, track_id)
);

-- ─────────────────────────────────────────────────────────────
-- 5. Optional: seed a few sample tracks
-- ─────────────────────────────────────────────────────────────
INSERT INTO music_tracks (title, artist, genre, source)
VALUES
  ('Afrobeats Sunrise', 'BootHop Studio', 'Afrobeats', 'library'),
  ('Lagos Nights',      'BootHop Studio', 'Afrobeats', 'library'),
  ('Smooth Delivery',   'BootHop Studio', 'Lo-fi',     'library'),
  ('City Rush',         'BootHop Studio', 'Electronic','library')
ON CONFLICT DO NOTHING;
