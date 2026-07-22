-- Rollback for 20260722_compliance_gate.sql
-- Run in Supabase SQL Editor ONLY if rolling back the compliance gate.
-- WARNING: This permanently drops item_declarations and shipment_events
-- and all data within them. Run only if no production compliance records exist.

-- 1. Drop FK from matches → item_declarations first
ALTER TABLE public.matches
  DROP CONSTRAINT IF EXISTS matches_declaration_id_fkey;

-- 2. Drop new tables (shipment_events first — it references item_declarations)
DROP TABLE IF EXISTS public.shipment_events;
DROP TABLE IF EXISTS public.item_declarations;

-- 3. Remove compliance tracking columns from matches
ALTER TABLE public.matches
  DROP COLUMN IF EXISTS compliance_locked_at,
  DROP COLUMN IF EXISTS compliance_review_started_at,
  DROP COLUMN IF EXISTS sealed_at,
  DROP COLUMN IF EXISTS declaration_id,
  DROP COLUMN IF EXISTS compliance_reminder_24h_sent_at,
  DROP COLUMN IF EXISTS compliance_reminder_6h_sent_at;
