-- Stage 5: SecureSeal generation
-- Run AFTER 20260722_compliance_gate_stage3.sql (requires public.matches)

CREATE TABLE IF NOT EXISTS public.shipment_secure_seals (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id               uuid        NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  seal_number            text        NOT NULL,
  token_hash             text        NOT NULL,
  status                 text        NOT NULL DEFAULT 'generated',
  generated_at           timestamptz NOT NULL DEFAULT now(),
  expires_at             timestamptz NOT NULL,
  activated_at           timestamptz,
  activated_by           text,
  sender_confirmed_at    timestamptz,
  traveller_confirmed_at timestamptz,
  activated_weight       numeric,
  activation_photo_url   text,
  revoked_at             timestamptz,
  revoked_by             text,
  revocation_reason      text,
  completed_at           timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

-- Uniqueness on seal_number and token_hash
CREATE UNIQUE INDEX IF NOT EXISTS shipment_secure_seals_seal_number_key
  ON public.shipment_secure_seals(seal_number);

CREATE UNIQUE INDEX IF NOT EXISTS shipment_secure_seals_token_hash_key
  ON public.shipment_secure_seals(token_hash);

-- Only one active (non-revoked, non-expired) seal per shipment at any time
CREATE UNIQUE INDEX IF NOT EXISTS shipment_secure_seals_one_active_per_match
  ON public.shipment_secure_seals(match_id)
  WHERE status NOT IN ('revoked', 'expired');

-- Fast lookup by match
CREATE INDEX IF NOT EXISTS shipment_secure_seals_match_id_idx
  ON public.shipment_secure_seals(match_id);

-- RLS: service role only
ALTER TABLE public.shipment_secure_seals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'shipment_secure_seals'
      AND policyname = 'service_role_all'
  ) THEN
    CREATE POLICY service_role_all
      ON public.shipment_secure_seals
      FOR ALL TO service_role USING (true);
  END IF;
END $$;
