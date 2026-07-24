-- Stage 3: Risk Engine + Handover Inspection Workflow
-- Run AFTER 20260722_compliance_gate_stage2.sql

-- ── Risk Assessments ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.shipment_risk_assessments (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id            uuid        NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  declaration_id      uuid        NOT NULL REFERENCES public.item_declarations(id) ON DELETE CASCADE,
  assessed_at         timestamptz NOT NULL DEFAULT now(),
  assessed_by         text        NOT NULL DEFAULT 'risk_engine',
  risk_score          integer     NOT NULL,
  risk_classification text        NOT NULL,
  flags               jsonb       NOT NULL DEFAULT '[]'::jsonb,
  breakdown           jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_risk_assessments_match_id ON public.shipment_risk_assessments(match_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_decl_id  ON public.shipment_risk_assessments(declaration_id);

ALTER TABLE public.shipment_risk_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only_risk_assessments"
  ON public.shipment_risk_assessments
  FOR ALL TO service_role
  USING (true);

-- ── Handover Inspections ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.shipment_inspections (
  id                             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id                       uuid        NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  declaration_id                 uuid        REFERENCES public.item_declarations(id),
  risk_assessment_id             uuid        REFERENCES public.shipment_risk_assessments(id),
  inspector_email                text        NOT NULL,
  status                         text        NOT NULL DEFAULT 'pending',
  started_at                     timestamptz,
  completed_at                   timestamptz,
  check_item_matches_description boolean,
  check_no_prohibited_items      boolean,
  check_packaging_acceptable     boolean,
  check_weight_reasonable        boolean,
  check_evidence_verified        boolean,
  overall_pass                   boolean,
  inspector_note                 text,
  created_at                     timestamptz DEFAULT now(),
  updated_at                     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inspections_match_id ON public.shipment_inspections(match_id);

ALTER TABLE public.shipment_inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only_inspections"
  ON public.shipment_inspections
  FOR ALL TO service_role
  USING (true);

-- ── Extend item_declarations ──────────────────────────────────────────────────

ALTER TABLE public.item_declarations
  ADD COLUMN IF NOT EXISTS risk_classification text,
  ADD COLUMN IF NOT EXISTS risk_assessed_at    timestamptz;

-- ── Extend matches ────────────────────────────────────────────────────────────

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS inspection_pending_at       timestamptz,
  ADD COLUMN IF NOT EXISTS inspection_reminder_sent_at timestamptz;
