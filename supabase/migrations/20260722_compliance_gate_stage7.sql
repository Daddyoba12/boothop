-- Stage 7: PIN-based delivery confirmation + 24-hour sender dispute window
-- Adds delivery PIN fields to shipment_secure_seals and delivery_confirmed_at to matches.
-- Run AFTER 20260722_compliance_gate_stage5.sql (requires shipment_secure_seals).

-- PIN fields on the activated seal
ALTER TABLE public.shipment_secure_seals
  ADD COLUMN IF NOT EXISTS delivery_pin_hash          text,
  ADD COLUMN IF NOT EXISTS delivery_pin_attempts      integer     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_pin_locked_at     timestamptz,
  ADD COLUMN IF NOT EXISTS delivery_pin_generated_at  timestamptz,
  -- future-proofing: 'pin' | 'signature' | 'company_stamp' etc.
  ADD COLUMN IF NOT EXISTS delivery_verification_tier text        NOT NULL DEFAULT 'pin';

-- Tracks when the match transitioned to delivery_confirmed (anchors 24h dispute window)
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS delivery_confirmed_at timestamptz;
