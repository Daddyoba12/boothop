-- ============================================================
-- BootHop Fraud + Escrow Extension
-- Migration: 20260603_fraud_escrow.sql
-- ============================================================

-- ── matches extensions ─────────────────────────────────────────────────────
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS sender_confirmed_delivery    BOOLEAN      DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS traveller_confirmed_delivery BOOLEAN      DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS blocked_reason               TEXT,
  ADD COLUMN IF NOT EXISTS item_category                TEXT,
  ADD COLUMN IF NOT EXISTS ghost_flagged_at             TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS currency                     TEXT         DEFAULT 'gbp';

-- ── users extension ────────────────────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active';

-- ── transactions ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id                  UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  stripe_session_id         TEXT,
  stripe_payment_intent_id  TEXT,
  stripe_transfer_id        TEXT,
  amount_total              BIGINT,
  carrier_payout            BIGINT,
  currency                  TEXT    DEFAULT 'gbp',
  status                    TEXT    DEFAULT 'pending'
                              CHECK (status IN ('pending','escrowed','captured','transferred','refunded','failed')),
  sender_email              TEXT,
  traveller_email           TEXT,
  created_at                TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at                TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_match   ON transactions(match_id);
CREATE INDEX IF NOT EXISTS idx_transactions_pi      ON transactions(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status  ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);

-- ── fraud_flags ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fraud_flags (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id     UUID REFERENCES matches(id) ON DELETE SET NULL,
  email        TEXT NOT NULL,
  ip_address   TEXT,
  risk_score   INTEGER NOT NULL,
  risk_tier    TEXT NOT NULL CHECK (risk_tier IN ('low','medium','high','critical')),
  factors      JSONB,
  action_taken TEXT,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fraud_flags_email   ON fraud_flags(email);
CREATE INDEX IF NOT EXISTS idx_fraud_flags_match   ON fraud_flags(match_id);
CREATE INDEX IF NOT EXISTS idx_fraud_flags_tier    ON fraud_flags(risk_tier);
CREATE INDEX IF NOT EXISTS idx_fraud_flags_created ON fraud_flags(created_at DESC);

-- ── banned_ips ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS banned_ips (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address TEXT NOT NULL UNIQUE,
  reason     TEXT,
  banned_by  TEXT DEFAULT 'fraud_engine',
  banned_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_banned_ips_ip      ON banned_ips(ip_address);
CREATE INDEX IF NOT EXISTS idx_banned_ips_expires ON banned_ips(expires_at);

-- ── banned_accounts ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS banned_accounts (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email      TEXT NOT NULL UNIQUE,
  reason     TEXT,
  banned_by  TEXT DEFAULT 'fraud_engine',
  banned_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_banned_accounts_email ON banned_accounts(email);

-- ── ghost_incidents ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ghost_incidents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id        UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  traveller_email TEXT NOT NULL,
  last_seen_at    TIMESTAMP WITH TIME ZONE,
  notified_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at     TIMESTAMP WITH TIME ZONE,
  status          TEXT DEFAULT 'open' CHECK (status IN ('open','resolved','escalated')),
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ghost_incidents_match     ON ghost_incidents(match_id);
CREATE INDEX IF NOT EXISTS idx_ghost_incidents_traveller ON ghost_incidents(traveller_email);
CREATE INDEX IF NOT EXISTS idx_ghost_incidents_status    ON ghost_incidents(status);

-- ── fraud_fees ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fraud_fees (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id              UUID REFERENCES matches(id) ON DELETE SET NULL,
  email                 TEXT NOT NULL,
  amount                INTEGER NOT NULL,
  currency              TEXT    NOT NULL,
  stripe_payment_intent TEXT,
  reason                TEXT,
  risk_tier             TEXT,
  status                TEXT DEFAULT 'pending' CHECK (status IN ('pending','charged','failed','waived')),
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fraud_fees_email  ON fraud_fees(email);
CREATE INDEX IF NOT EXISTS idx_fraud_fees_match  ON fraud_fees(match_id);
CREATE INDEX IF NOT EXISTS idx_fraud_fees_status ON fraud_fees(status);

-- ── admin_alerts ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_alerts (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_type TEXT NOT NULL,
  match_id   UUID REFERENCES matches(id) ON DELETE SET NULL,
  email      TEXT,
  message    TEXT NOT NULL,
  metadata   JSONB,
  resolved   BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_alerts_type     ON admin_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_match    ON admin_alerts(match_id);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_resolved ON admin_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_created  ON admin_alerts(created_at DESC);

-- ── RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE transactions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_flags     ENABLE ROW LEVEL SECURITY;
ALTER TABLE banned_ips      ENABLE ROW LEVEL SECURITY;
ALTER TABLE banned_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghost_incidents  ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_fees      ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_alerts    ENABLE ROW LEVEL SECURITY;

GRANT ALL ON transactions, fraud_flags, banned_ips, banned_accounts,
            ghost_incidents, fraud_fees, admin_alerts TO authenticated;
