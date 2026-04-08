-- BootHop Business Jobs v2 migration
-- Run this in your Supabase SQL editor once

ALTER TABLE business_jobs
  ADD COLUMN IF NOT EXISTS phone                  TEXT,
  ADD COLUMN IF NOT EXISTS delivery_type          TEXT DEFAULT 'local_uk',
  ADD COLUMN IF NOT EXISTS delivery_date          DATE,
  ADD COLUMN IF NOT EXISTS expected_delivery_date DATE,
  ADD COLUMN IF NOT EXISTS distance_miles         NUMERIC,
  ADD COLUMN IF NOT EXISTS insurance_fee          NUMERIC;
