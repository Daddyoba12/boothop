-- ============================================================
-- BootHop Stripe Connect & Validation
-- Migration: 20260601_stripe_validation.sql
-- ============================================================

-- Create users table (core user profile + Stripe Connect + tracking tier columns)
CREATE TABLE IF NOT EXISTS users (
  id                                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email                             TEXT NOT NULL UNIQUE,
  country                           VARCHAR(2),
  stripe_customer_id                VARCHAR(255),
  stripe_connect_id                 VARCHAR(255),
  stripe_connect_charges_enabled    BOOLEAN DEFAULT FALSE,
  stripe_connect_payouts_enabled    BOOLEAN DEFAULT FALSE,
  stripe_connect_details_submitted  BOOLEAN DEFAULT FALSE,
  stripe_account_type               VARCHAR(50),
  stripe_onboarding_completed       BOOLEAN DEFAULT FALSE,
  stripe_onboarding_started_at      TIMESTAMP WITH TIME ZONE,
  stripe_onboarding_completed_at    TIMESTAMP WITH TIME ZONE,
  stripe_verification_status        VARCHAR(50) DEFAULT 'unverified',
  stripe_verification_documents     JSONB,
  stripe_requirements               JSONB,
  stripe_future_requirements        JSONB,
  stripe_disabled_reason            VARCHAR(255),
  can_receive_payments              BOOLEAN DEFAULT FALSE,
  last_stripe_sync_at               TIMESTAMP WITH TIME ZONE,
  preferred_tier                    VARCHAR(20) DEFAULT 'p2p',
  priority_partner_status           VARCHAR(20) DEFAULT 'inactive',
  priority_partner_since            TIMESTAMP WITH TIME ZONE,
  monthly_delivery_count            INTEGER DEFAULT 0,
  account_type                      VARCHAR(20) DEFAULT 'personal',
  company_name                      TEXT,
  push_subscription                 JSONB,
  created_at                        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at                        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email          ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe_cid     ON users(stripe_connect_id);
CREATE INDEX IF NOT EXISTS idx_users_preferred_tier ON users(preferred_tier);
CREATE INDEX IF NOT EXISTS idx_users_priority_status ON users(priority_partner_status);

-- Payment methods saved per user
CREATE TABLE IF NOT EXISTS user_payment_methods (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_payment_method_id VARCHAR(255) NOT NULL,
  type                     VARCHAR(50)  NOT NULL,
  card_brand               VARCHAR(50),
  card_last4               VARCHAR(4),
  card_exp_month           INTEGER,
  card_exp_year            INTEGER,
  card_country             VARCHAR(2),
  bank_name                VARCHAR(255),
  bank_last4               VARCHAR(4),
  is_default               BOOLEAN DEFAULT FALSE,
  is_active                BOOLEAN DEFAULT TRUE,
  created_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_upm_user    ON user_payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_upm_stripe  ON user_payment_methods(stripe_payment_method_id);
CREATE INDEX IF NOT EXISTS idx_upm_default ON user_payment_methods(user_id, is_default);

-- Verification attempts
CREATE TABLE IF NOT EXISTS stripe_verification_attempts (
  id                              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                         UUID NOT NULL REFERENCES users(id),
  attempt_type                    VARCHAR(50) NOT NULL,
  status                          VARCHAR(50) NOT NULL,
  stripe_verification_session_id  VARCHAR(255),
  failure_reason                  VARCHAR(255),
  failure_code                    VARCHAR(50),
  metadata                        JSONB,
  created_at                      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at                    TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_sva_user   ON stripe_verification_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_sva_status ON stripe_verification_attempts(status);

-- Stripe webhook logs
CREATE TABLE IF NOT EXISTS stripe_webhook_logs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_event_id     VARCHAR(255) NOT NULL,
  event_type          VARCHAR(100) NOT NULL,
  account_id          VARCHAR(255),
  http_status         INTEGER,
  processing_time_ms  INTEGER,
  payload             JSONB NOT NULL,
  response            JSONB,
  error               TEXT,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_swl_event_id ON stripe_webhook_logs(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_swl_type     ON stripe_webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_swl_account  ON stripe_webhook_logs(account_id);

-- ============================================================
-- Views
-- ============================================================

CREATE OR REPLACE VIEW user_verification_status AS
SELECT
  u.id,
  u.email,
  u.stripe_connect_id,
  u.stripe_verification_status,
  u.stripe_onboarding_completed,
  u.can_receive_payments,
  u.stripe_connect_charges_enabled,
  u.stripe_connect_payouts_enabled,
  u.stripe_disabled_reason,
  u.stripe_requirements,
  COUNT(pm.id)                                              AS payment_methods_count,
  COUNT(CASE WHEN va.status = 'verified' THEN 1 END)        AS verified_attempts,
  COUNT(CASE WHEN va.status = 'failed'   THEN 1 END)        AS failed_attempts
FROM users u
LEFT JOIN user_payment_methods pm         ON u.id = pm.user_id AND pm.is_active = TRUE
LEFT JOIN stripe_verification_attempts va ON u.id = va.user_id
GROUP BY u.id;

-- ============================================================
-- Functions
-- ============================================================

CREATE OR REPLACE FUNCTION can_user_create_delivery(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_payment_methods
    WHERE user_id = p_user_id AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION can_user_accept_deliveries(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE v_user RECORD;
BEGIN
  SELECT stripe_connect_id, stripe_onboarding_completed,
         stripe_connect_charges_enabled, stripe_connect_payouts_enabled,
         can_receive_payments
  INTO v_user FROM users WHERE id = p_user_id;

  RETURN (
    v_user.stripe_connect_id IS NOT NULL AND
    v_user.stripe_onboarding_completed = TRUE AND
    v_user.stripe_connect_charges_enabled = TRUE AND
    v_user.stripe_connect_payouts_enabled = TRUE AND
    v_user.can_receive_payments = TRUE
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_user_stripe_status(p_user_id UUID, p_stripe_account JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  v_charges   BOOLEAN;
  v_payouts   BOOLEAN;
  v_submitted BOOLEAN;
  v_disabled  TEXT;
BEGIN
  v_charges   := (p_stripe_account->>'charges_enabled')::BOOLEAN;
  v_payouts   := (p_stripe_account->>'payouts_enabled')::BOOLEAN;
  v_submitted := (p_stripe_account->>'details_submitted')::BOOLEAN;
  v_disabled  := p_stripe_account->>'disabled_reason';

  UPDATE users SET
    stripe_connect_charges_enabled   = v_charges,
    stripe_connect_payouts_enabled   = v_payouts,
    stripe_connect_details_submitted = v_submitted,
    stripe_disabled_reason           = v_disabled,
    stripe_requirements              = p_stripe_account->'requirements',
    stripe_future_requirements       = p_stripe_account->'future_requirements',
    can_receive_payments             = (v_charges AND v_payouts),
    stripe_onboarding_completed      = v_submitted,
    stripe_onboarding_completed_at   = CASE
      WHEN v_submitted AND stripe_onboarding_completed_at IS NULL THEN NOW()
      ELSE stripe_onboarding_completed_at END,
    stripe_verification_status       = CASE
      WHEN v_charges AND v_payouts THEN 'verified'
      WHEN v_submitted             THEN 'pending'
      WHEN v_disabled IS NOT NULL  THEN 'rejected'
      ELSE 'unverified' END,
    last_stripe_sync_at = NOW()
  WHERE id = p_user_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE user_payment_methods       ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_verification_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_webhook_logs        ENABLE ROW LEVEL SECURITY;

GRANT ALL ON user_payment_methods, stripe_verification_attempts TO authenticated;
GRANT SELECT ON user_verification_status TO authenticated;
