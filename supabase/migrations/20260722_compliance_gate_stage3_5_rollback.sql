-- Stage 3.5 rollback
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shipment_inspections' AND column_name = 'failure_reason'
  ) THEN
    ALTER TABLE public.shipment_inspections DROP COLUMN failure_reason;
  END IF;
END $$;
