-- Stage 5 rollback
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'shipment_secure_seals'
  ) THEN
    DROP TABLE public.shipment_secure_seals CASCADE;
  END IF;
END $$;
