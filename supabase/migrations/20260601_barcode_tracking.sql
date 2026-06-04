-- ============================================================
-- BootHop Linked Barcode Tracking System
-- Migration: 20260601_barcode_tracking.sql
-- ============================================================

-- Extend matches table
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS sender_barcode    VARCHAR(50)  UNIQUE,
  ADD COLUMN IF NOT EXISTS traveller_barcode VARCHAR(50)  UNIQUE,
  ADD COLUMN IF NOT EXISTS tracking_status   VARCHAR(20)  DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS delivery_tier     VARCHAR(20)  DEFAULT 'p2p',
  ADD COLUMN IF NOT EXISTS tier_cost         DECIMAL(10,4) DEFAULT 0.01,
  ADD COLUMN IF NOT EXISTS premium_tracking  BOOLEAN      DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_sender_barcode    ON matches(sender_barcode);
CREATE INDEX IF NOT EXISTS idx_traveller_barcode ON matches(traveller_barcode);
CREATE INDEX IF NOT EXISTS idx_tracking_status   ON matches(tracking_status);
CREATE INDEX IF NOT EXISTS idx_delivery_tier     ON matches(delivery_tier);

-- users columns are created in 20260601_stripe_validation.sql

-- Tracking checkpoints
CREATE TABLE IF NOT EXISTS tracking_checkpoints (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id        UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  checkpoint_type VARCHAR(20) NOT NULL CHECK (checkpoint_type IN ('location_check','pickup','transit','delivered')),
  latitude        DECIMAL(10,8) NOT NULL,
  longitude       DECIMAL(11,8) NOT NULL,
  address         TEXT,
  accuracy        FLOAT,
  initiated_by    VARCHAR(20) NOT NULL CHECK (initiated_by IN ('sender','traveller','system')),
  traveller_id    UUID,
  photo_url       TEXT,
  notes           TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checkpoint_match_id   ON tracking_checkpoints(match_id);
CREATE INDEX IF NOT EXISTS idx_checkpoint_created    ON tracking_checkpoints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checkpoint_type       ON tracking_checkpoints(checkpoint_type);

-- Location requests (sender pings traveller)
CREATE TABLE IF NOT EXISTS location_requests (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id     UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  requested_by TEXT NOT NULL,
  status       VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','completed','timeout','declined')),
  expires_at   TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loc_req_match_id ON location_requests(match_id);
CREATE INDEX IF NOT EXISTS idx_loc_req_status   ON location_requests(status);
CREATE INDEX IF NOT EXISTS idx_loc_req_expires  ON location_requests(expires_at);

-- Delivery cost ledger
CREATE TABLE IF NOT EXISTS delivery_costs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id   UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  tier       VARCHAR(20) NOT NULL,
  action     VARCHAR(50) NOT NULL,
  cost       DECIMAL(10,4) NOT NULL,
  metadata   JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_costs_match   ON delivery_costs(match_id);
CREATE INDEX IF NOT EXISTS idx_delivery_costs_tier    ON delivery_costs(tier);
CREATE INDEX IF NOT EXISTS idx_delivery_costs_created ON delivery_costs(created_at DESC);

-- Tracking history (audit log)
CREATE TABLE IF NOT EXISTS tracking_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id    UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  actor_id    UUID,
  actor_type  VARCHAR(20),
  metadata    JSONB,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracking_history_match   ON tracking_history(match_id);
CREATE INDEX IF NOT EXISTS idx_tracking_history_action  ON tracking_history(action_type);
CREATE INDEX IF NOT EXISTS idx_tracking_history_created ON tracking_history(created_at DESC);

-- Geocode cache (avoid hitting Nominatim repeatedly)
CREATE TABLE IF NOT EXISTS geocode_cache (
  coordinate_key VARCHAR(50) PRIMARY KEY,
  address        TEXT NOT NULL,
  precision      VARCHAR(20) NOT NULL,
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_geocode_updated ON geocode_cache(updated_at);

-- Push subscriptions (web-push)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email   TEXT NOT NULL,
  subscription JSONB NOT NULL,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_email)
);

-- ============================================================
-- Views
-- ============================================================

CREATE OR REPLACE VIEW latest_locations AS
SELECT DISTINCT ON (match_id)
  match_id, latitude, longitude, address, checkpoint_type, created_at
FROM tracking_checkpoints
ORDER BY match_id, created_at DESC;

CREATE OR REPLACE VIEW active_tracking_summary AS
SELECT
  m.id              AS match_id,
  m.sender_barcode,
  m.traveller_barcode,
  m.delivery_tier,
  m.tracking_status,
  m.premium_tracking,
  ll.address        AS last_location,
  ll.created_at     AS last_update,
  COUNT(tc.id)      AS checkpoint_count
FROM matches m
LEFT JOIN latest_locations ll ON ll.match_id = m.id
LEFT JOIN tracking_checkpoints tc ON tc.match_id = m.id
WHERE m.tracking_status = 'active'
GROUP BY m.id, ll.address, ll.created_at;

-- ============================================================
-- Functions
-- ============================================================

CREATE OR REPLACE FUNCTION expire_location_requests() RETURNS void AS $$
BEGIN
  UPDATE location_requests
  SET status = 'timeout'
  WHERE status = 'pending' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Triggers
-- ============================================================

CREATE OR REPLACE FUNCTION log_checkpoint_to_history() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO tracking_history(match_id, action_type, metadata)
  VALUES (NEW.match_id, 'checkpoint_' || NEW.checkpoint_type,
          jsonb_build_object('lat', NEW.latitude, 'lng', NEW.longitude, 'address', NEW.address));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tracking_checkpoint_history ON tracking_checkpoints;
CREATE TRIGGER tracking_checkpoint_history
  AFTER INSERT ON tracking_checkpoints
  FOR EACH ROW EXECUTE FUNCTION log_checkpoint_to_history();

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE tracking_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_requests    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_history     ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_costs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions   ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS — app uses service role key
-- Grant authenticated read access to their own match data
GRANT ALL ON tracking_checkpoints, location_requests, tracking_history,
             delivery_costs, geocode_cache, push_subscriptions TO authenticated;
GRANT SELECT ON latest_locations, active_tracking_summary TO authenticated;
