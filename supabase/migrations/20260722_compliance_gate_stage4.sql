-- Stage 4: External Verification Workflow
-- Run AFTER 20260722_compliance_gate_stage3.sql (or the combined Stage1-3 script)

-- ── matches: external verification column ─────────────────────────────────────

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS external_verification_required_at timestamptz;

-- ── verification_providers ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.verification_providers (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name               text        NOT NULL,
  provider_type      text        NOT NULL,
  country            text        NOT NULL,
  city               text,
  address            text,
  email              text,
  phone              text,
  supported_services jsonb       DEFAULT '[]'::jsonb,
  active             boolean     NOT NULL DEFAULT true,
  instructions       text,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_providers_country ON public.verification_providers(country);
CREATE INDEX IF NOT EXISTS idx_verification_providers_active  ON public.verification_providers(active);

ALTER TABLE public.verification_providers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'verification_providers'
    AND   policyname = 'service_role_only_verification_providers'
  ) THEN
    CREATE POLICY "service_role_only_verification_providers"
      ON public.verification_providers
      FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- ── shipment_verification_requests ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.shipment_verification_requests (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id                  uuid        NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  status                    text        NOT NULL DEFAULT 'pending',
  provider_id               uuid        REFERENCES public.verification_providers(id),
  reason                    text,
  requested_by              text        NOT NULL,
  requested_at              timestamptz NOT NULL DEFAULT now(),
  verification_reference    text,
  verification_result       text,
  verification_document_url text,
  verified_by               text,
  verified_at               timestamptz,
  notes                     text,
  created_at                timestamptz DEFAULT now(),
  updated_at                timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verif_requests_match_id ON public.shipment_verification_requests(match_id);
CREATE INDEX IF NOT EXISTS idx_verif_requests_status   ON public.shipment_verification_requests(status);

ALTER TABLE public.shipment_verification_requests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'shipment_verification_requests'
    AND   policyname = 'service_role_only_verification_requests'
  ) THEN
    CREATE POLICY "service_role_only_verification_requests"
      ON public.shipment_verification_requests
      FOR ALL TO service_role USING (true);
  END IF;
END $$;
