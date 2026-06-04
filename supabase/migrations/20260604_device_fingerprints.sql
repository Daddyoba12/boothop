-- ============================================================
-- BootHop Device Fingerprint Tracking
-- Migration: 20260604_device_fingerprints.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS device_fingerprints (
  id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  fingerprint TEXT    NOT NULL,
  email       TEXT,
  ip_address  TEXT,
  user_agent  TEXT,
  components  JSONB,
  is_banned   BOOLEAN DEFAULT FALSE,
  ban_reason  TEXT,
  first_seen  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- One row per (fingerprint, email) pair — same device can appear for multiple accounts
CREATE UNIQUE INDEX IF NOT EXISTS idx_fp_fp_email  ON device_fingerprints(fingerprint, email);
CREATE INDEX        IF NOT EXISTS idx_fp_fp        ON device_fingerprints(fingerprint);
CREATE INDEX        IF NOT EXISTS idx_fp_email     ON device_fingerprints(email);
CREATE INDEX        IF NOT EXISTS idx_fp_banned    ON device_fingerprints(is_banned);
CREATE INDEX        IF NOT EXISTS idx_fp_last_seen ON device_fingerprints(last_seen DESC);

ALTER TABLE device_fingerprints ENABLE ROW LEVEL SECURITY;
GRANT ALL ON device_fingerprints TO authenticated;
