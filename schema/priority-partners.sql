-- BootHop Priority Partner Programme
-- Run once in Supabase SQL editor

CREATE TABLE IF NOT EXISTS priority_partners (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT        NOT NULL UNIQUE,
  company_name    TEXT,
  phone           TEXT,
  delivery_volume TEXT,         -- '2-5' | '6-10' | '10+'
  notes           TEXT,
  status          TEXT        NOT NULL DEFAULT 'pending',  -- pending | approved | active | rejected
  tier            TEXT        NOT NULL DEFAULT 'priority', -- priority | elite
  discount_pct    NUMERIC     NOT NULL DEFAULT 5,          -- 5 for 2-5 deliveries, 10 for 6+
  response_hours  INTEGER     NOT NULL DEFAULT 2,
  shipment_count  INTEGER     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE priority_partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only" ON priority_partners
  USING (auth.role() = 'service_role');
