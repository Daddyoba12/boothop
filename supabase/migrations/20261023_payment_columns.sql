-- 2026-10-23 — Payment columns the code writes but `matches` never had.
--
-- Every type below was matched against an existing sibling column on the same
-- table, not assumed:
--
--   matches.agreed_price / goods_value / insurance_fee  -> numeric
--   matches.payment_confirmed_at / cancelled_at         -> timestamptz
--   matches.cancellation_reason / blocked_reason        -> text
--
-- Note carrier_payout is numeric (POUNDS) here, deliberately unlike
-- transactions.carrier_payout which is bigint (pence). The code confirms the
-- unit: payment/create-checkout writes a pounds value, and webhooks/stripe
-- reads it back as `Math.round(match.carrier_payout * 100)` to convert to pence.

-- ── Written by /api/payment/create-checkout ────────────────────────────────
-- Their absence makes that route's UPDATE fail outright, which also silently
-- discards status='payment_processing', goods_value, insurance_fee and
-- insurance_accepted in the same statement.
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS carrier_payout numeric,
  ADD COLUMN IF NOT EXISTS platform_fee   numeric;

-- ── Written by /api/webhooks/stripe ────────────────────────────────────────
-- Audit timestamps for the payment lifecycle. Nothing reads them today; they
-- are recorded so a failed or cancelled payment leaves a trace.
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS payment_succeeded_at   timestamptz,
  ADD COLUMN IF NOT EXISTS payment_failed_at      timestamptz,
  ADD COLUMN IF NOT EXISTS payment_failure_reason text,
  ADD COLUMN IF NOT EXISTS payment_canceled_at    timestamptz;

-- ── Verify ─────────────────────────────────────────────────────────────────
-- Expect 6 rows.
SELECT column_name, data_type
  FROM information_schema.columns
 WHERE table_name = 'matches'
   AND column_name IN ('carrier_payout','platform_fee','payment_succeeded_at',
                       'payment_failed_at','payment_failure_reason','payment_canceled_at')
 ORDER BY column_name;
