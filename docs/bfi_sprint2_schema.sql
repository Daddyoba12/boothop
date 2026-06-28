-- BFI Sprint 2 — Additional tables
-- Run in Supabase SQL editor after bfi_schema.sql

-- Outbound click tracking (every "Book Flight" click passes through BootHop)
CREATE TABLE IF NOT EXISTS bfi_clicks (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id        uuid REFERENCES bfi_flight_offers(id),
  route_id        uuid REFERENCES bfi_routes(id),
  origin          text NOT NULL,
  destination     text NOT NULL,
  airline_code    text NOT NULL,
  airline_name    text NOT NULL,
  price_gbp       numeric(10,2) NOT NULL,
  currency        text DEFAULT 'GBP',
  provider        text NOT NULL,
  destination_url text NOT NULL,
  ip_country      text,
  device          text,   -- mobile | desktop | tablet
  browser         text,
  session_id      text,
  user_id         text,   -- nullable — logged-in BootHop users only
  referrer        text,
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  clicked_at      timestamptz DEFAULT now()
);

-- Route page view tracking
CREATE TABLE IF NOT EXISTS bfi_route_views (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id    uuid REFERENCES bfi_routes(id),
  origin      text NOT NULL,
  destination text NOT NULL,
  session_id  text,
  ip_country  text,
  device      text,
  referrer    text,
  viewed_at   timestamptz DEFAULT now()
);

-- Featured routes shown on homepage ticker / cards
CREATE TABLE IF NOT EXISTS bfi_featured_routes (
  route_id    uuid PRIMARY KEY REFERENCES bfi_routes(id),
  position    integer NOT NULL DEFAULT 0,
  label       text,   -- override display label e.g. "London ✈ Lagos"
  featured    boolean DEFAULT true,
  updated_at  timestamptz DEFAULT now()
);

-- Provider health status
CREATE TABLE IF NOT EXISTS bfi_provider_status (
  provider         text PRIMARY KEY,
  status           text DEFAULT 'unknown',  -- online | offline | degraded | unknown
  last_checked_at  timestamptz,
  last_success_at  timestamptz,
  last_error       text,
  success_count    integer DEFAULT 0,
  error_count      integer DEFAULT 0,
  avg_latency_ms   integer
);

-- ── Indexes ────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS bfi_clicks_route_id_idx    ON bfi_clicks(route_id);
CREATE INDEX IF NOT EXISTS bfi_clicks_clicked_at_idx  ON bfi_clicks(clicked_at DESC);
CREATE INDEX IF NOT EXISTS bfi_clicks_session_idx     ON bfi_clicks(session_id);
CREATE INDEX IF NOT EXISTS bfi_route_views_route_idx  ON bfi_route_views(route_id);
CREATE INDEX IF NOT EXISTS bfi_route_views_viewed_idx ON bfi_route_views(viewed_at DESC);

-- ── Seed featured routes ──────────────────────────────────────────────────────

INSERT INTO bfi_featured_routes (route_id, position, featured)
SELECT id, priority, true FROM bfi_routes WHERE enabled = true
ON CONFLICT DO NOTHING;

-- Seed provider status
INSERT INTO bfi_provider_status (provider, status) VALUES
  ('mock',    'online'),
  ('amadeus', 'unknown')
ON CONFLICT DO NOTHING;
