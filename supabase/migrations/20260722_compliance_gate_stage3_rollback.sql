-- Rollback for 20260722_compliance_gate_stage3.sql

DROP TABLE IF EXISTS public.shipment_inspections;
DROP TABLE IF EXISTS public.shipment_risk_assessments;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'item_declarations'
  ) THEN
    ALTER TABLE public.item_declarations
      DROP COLUMN IF EXISTS risk_classification,
      DROP COLUMN IF EXISTS risk_assessed_at;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'matches'
  ) THEN
    ALTER TABLE public.matches
      DROP COLUMN IF EXISTS inspection_pending_at,
      DROP COLUMN IF EXISTS inspection_reminder_sent_at;
  END IF;
END $$;
