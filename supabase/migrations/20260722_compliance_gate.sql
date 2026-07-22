-- BootHop — Compliance Gate (Stage 1)
-- Adds shipment lock states, item declarations, and chain-of-custody audit log.
-- Run in Supabase SQL Editor.

-- ── Extend matches table with compliance tracking columns ─────────────────────
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS compliance_locked_at            timestamptz,
  ADD COLUMN IF NOT EXISTS compliance_review_started_at    timestamptz,
  ADD COLUMN IF NOT EXISTS sealed_at                       timestamptz,
  ADD COLUMN IF NOT EXISTS declaration_id                  uuid,
  ADD COLUMN IF NOT EXISTS compliance_reminder_24h_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS compliance_reminder_6h_sent_at  timestamptz;

-- ── item_declarations — sender's pre-transit item declaration ─────────────────
CREATE TABLE IF NOT EXISTS public.item_declarations (
  id                      uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id                uuid        NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,

  -- Lifecycle: draft → submitted → approved | rejected
  declaration_status      text        NOT NULL DEFAULT 'draft',

  -- What's in the shipment
  item_description        text,
  item_category           text,
  declared_value          numeric,
  declared_currency       text        DEFAULT 'GBP',
  declared_weight_kg      numeric,

  -- Content flags (sender ticks these)
  contains_electronics    boolean     DEFAULT false,
  contains_medication     boolean     DEFAULT false,
  contains_food           boolean     DEFAULT false,
  contains_liquids        boolean     DEFAULT false,
  contains_currency       boolean     DEFAULT false,
  contains_jewellery      boolean     DEFAULT false,
  contains_documents      boolean     DEFAULT false,
  contains_clothing       boolean     DEFAULT false,
  contains_hazardous      boolean     DEFAULT false,
  contains_weapons        boolean     DEFAULT false,

  -- Evidence
  proof_of_ownership_url  text,

  -- Version counter — increments on each draft save, immutable after submit
  version                 integer     NOT NULL DEFAULT 1,

  -- Review fields
  submitted_at            timestamptz,
  reviewed_at             timestamptz,
  reviewed_by             text,          -- admin email or 'ai_engine'
  review_note             text,
  risk_score              integer,

  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_item_declarations_match_id ON public.item_declarations (match_id);
CREATE INDEX IF NOT EXISTS idx_item_declarations_status   ON public.item_declarations (declaration_status);

ALTER TABLE public.item_declarations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service-role-item-declarations"
  ON public.item_declarations FOR ALL
  USING (auth.role() = 'service_role');

-- ── shipment_events — immutable chain-of-custody audit log ───────────────────
CREATE TABLE IF NOT EXISTS public.shipment_events (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id        uuid        NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  declaration_id  uuid        REFERENCES public.item_declarations(id),

  -- Event types: SHIPMENT_LOCKED | DECLARATION_DRAFT_SAVED | DECLARATION_SUBMITTED |
  --   COMPLIANCE_REVIEW_STARTED | COMPLIANCE_APPROVED | COMPLIANCE_REJECTED |
  --   COMPLIANCE_TIMEOUT | SHIPMENT_SEALED | SHIPMENT_SUSPENDED |
  --   SHIPMENT_LOCK_OVERRIDDEN | SHIPMENT_CANCELLED_TIMEOUT
  event_type      text        NOT NULL,

  performed_by    text        NOT NULL DEFAULT 'system',  -- email or 'system' or 'ai_engine'
  metadata        jsonb       DEFAULT '{}',
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shipment_events_match_id   ON public.shipment_events (match_id);
CREATE INDEX IF NOT EXISTS idx_shipment_events_event_type ON public.shipment_events (event_type);
CREATE INDEX IF NOT EXISTS idx_shipment_events_created_at ON public.shipment_events (created_at DESC);

ALTER TABLE public.shipment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service-role-shipment-events"
  ON public.shipment_events FOR ALL
  USING (auth.role() = 'service_role');

-- ── FK from matches → item_declarations (after both tables exist) ─────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'matches_declaration_id_fkey'
  ) THEN
    ALTER TABLE public.matches
      ADD CONSTRAINT matches_declaration_id_fkey
      FOREIGN KEY (declaration_id) REFERENCES public.item_declarations(id);
  END IF;
END $$;
