-- =============================================
-- BOOTHOP CUSTOMS & DUTIES SYSTEM
-- Run this in your Supabase SQL editor
-- =============================================

CREATE TABLE IF NOT EXISTS item_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  hs_code_prefix TEXT,
  risk_level TEXT DEFAULT 'medium',
  requires_invoice BOOLEAN DEFAULT false,
  requires_enhanced_id BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS duty_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_country TEXT NOT NULL,
  destination_country TEXT NOT NULL,
  category_id UUID REFERENCES item_categories(id),
  vat_rate NUMERIC(5,2) DEFAULT 0,
  duty_rate NUMERIC(5,2) DEFAULT 0,
  de_minimis_threshold NUMERIC(10,2),
  currency TEXT DEFAULT 'GBP',
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customs_estimations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID,
  user_id UUID,
  item_category TEXT,
  declared_value NUMERIC(12,2),
  currency TEXT DEFAULT 'GBP',
  origin_country TEXT,
  destination_country TEXT,
  item_description TEXT,
  brand TEXT,
  is_new BOOLEAN DEFAULT true,
  weight_kg NUMERIC(6,2),
  ai_category_detected TEXT,
  ai_confidence_score NUMERIC(4,2),
  ai_hs_suggestion TEXT,
  ai_flags JSONB DEFAULT '[]',
  estimated_vat NUMERIC(12,2),
  estimated_duty NUMERIC(12,2),
  estimated_handling NUMERIC(12,2),
  estimated_total NUMERIC(12,2),
  estimation_method TEXT,
  risk_score INTEGER DEFAULT 0,
  risk_level TEXT DEFAULT 'low',
  risk_flags JSONB DEFAULT '[]',
  requires_aml_review BOOLEAN DEFAULT false,
  requires_invoice BOOLEAN DEFAULT false,
  invoice_uploaded BOOLEAN DEFAULT false,
  disclaimer_shown BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS risk_flag_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_code TEXT UNIQUE NOT NULL,
  description TEXT,
  severity TEXT,
  action_required TEXT
);

CREATE TABLE IF NOT EXISTS aml_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimation_id UUID REFERENCES customs_estimations(id),
  user_id UUID,
  status TEXT DEFAULT 'pending',
  reviewer_id UUID,
  notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customs_user     ON customs_estimations(user_id);
CREATE INDEX IF NOT EXISTS idx_customs_shipment ON customs_estimations(shipment_id);
CREATE INDEX IF NOT EXISTS idx_customs_risk     ON customs_estimations(risk_level);
CREATE INDEX IF NOT EXISTS idx_duty_rules_route ON duty_rules(origin_country, destination_country);
