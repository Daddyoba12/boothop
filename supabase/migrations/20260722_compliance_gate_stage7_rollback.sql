-- Stage 7 rollback
ALTER TABLE public.shipment_secure_seals
  DROP COLUMN IF EXISTS delivery_pin_hash,
  DROP COLUMN IF EXISTS delivery_pin_attempts,
  DROP COLUMN IF EXISTS delivery_pin_locked_at,
  DROP COLUMN IF EXISTS delivery_pin_generated_at,
  DROP COLUMN IF EXISTS delivery_verification_tier;

ALTER TABLE public.matches
  DROP COLUMN IF EXISTS delivery_confirmed_at;
