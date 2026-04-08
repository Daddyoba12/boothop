-- BootHop Carrier (Booter) Applications
-- Run once in Supabase SQL editor

CREATE TABLE IF NOT EXISTS booter_applications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  phone      TEXT        NOT NULL,
  city       TEXT,
  vehicle    TEXT,
  about      TEXT,
  status     TEXT        NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE booter_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_only" ON booter_applications
  USING (auth.role() = 'service_role');
