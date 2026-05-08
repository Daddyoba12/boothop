-- =============================================
-- SEED: Item Categories
-- =============================================
INSERT INTO item_categories (name, display_name, hs_code_prefix, risk_level, requires_invoice, requires_enhanced_id)
VALUES
  ('luxury_bag',       'Luxury Handbag',       '4202', 'high',   true,  false),
  ('jewellery_gold',   'Gold Jewellery',        '7113', 'high',   true,  true),
  ('jewellery_silver', 'Silver Jewellery',      '7113', 'high',   true,  false),
  ('watches_luxury',   'Luxury Watch',          '9101', 'high',   true,  true),
  ('electronics',      'Electronics',           '8471', 'medium', false, false),
  ('clothing',         'Clothing & Apparel',    '6204', 'low',    false, false),
  ('footwear',         'Footwear / Trainers',   '6403', 'low',    false, false),
  ('perfume',          'Perfume / Cosmetics',   '3303', 'low',    false, false),
  ('artwork',          'Artwork / Antiques',    '9701', 'high',   true,  true),
  ('food',             'Food & Perishables',    '2106', 'medium', true,  false),
  ('documents',        'Documents / Papers',    '4901', 'low',    false, false),
  ('other',            'Other / General',       NULL,   'medium', false, false)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- SEED: Duty Rules — BootHop International Routes
-- =============================================
-- UAE → UK
INSERT INTO duty_rules (origin_country, destination_country, category_id, vat_rate, duty_rate, de_minimis_threshold, notes)
SELECT 'AE','GB',id,20.00,3.50,135.00,'UAE luxury bag to UK' FROM item_categories WHERE name='luxury_bag' ON CONFLICT DO NOTHING;
INSERT INTO duty_rules (origin_country, destination_country, category_id, vat_rate, duty_rate, de_minimis_threshold, notes)
SELECT 'AE','GB',id,20.00,2.50,135.00,'Gold jewellery UAE to UK' FROM item_categories WHERE name='jewellery_gold' ON CONFLICT DO NOTHING;
INSERT INTO duty_rules (origin_country, destination_country, category_id, vat_rate, duty_rate, de_minimis_threshold, notes)
SELECT 'AE','GB',id,20.00,3.50,135.00,'Luxury watch UAE to UK' FROM item_categories WHERE name='watches_luxury' ON CONFLICT DO NOTHING;
INSERT INTO duty_rules (origin_country, destination_country, category_id, vat_rate, duty_rate, de_minimis_threshold, notes)
SELECT 'AE','GB',id,20.00,0.00,135.00,'Electronics UAE to UK' FROM item_categories WHERE name='electronics' ON CONFLICT DO NOTHING;

-- France → UK (post-Brexit)
INSERT INTO duty_rules (origin_country, destination_country, category_id, vat_rate, duty_rate, de_minimis_threshold, notes)
SELECT 'FR','GB',id,20.00,4.00,135.00,'Post-Brexit France luxury bag to UK' FROM item_categories WHERE name='luxury_bag' ON CONFLICT DO NOTHING;
INSERT INTO duty_rules (origin_country, destination_country, category_id, vat_rate, duty_rate, de_minimis_threshold, notes)
SELECT 'FR','GB',id,20.00,0.00,135.00,'Low value footwear France to UK' FROM item_categories WHERE name='footwear' ON CONFLICT DO NOTHING;
INSERT INTO duty_rules (origin_country, destination_country, category_id, vat_rate, duty_rate, de_minimis_threshold, notes)
SELECT 'FR','GB',id,20.00,12.00,135.00,'Clothing France to UK' FROM item_categories WHERE name='clothing' ON CONFLICT DO NOTHING;

-- USA → UK
INSERT INTO duty_rules (origin_country, destination_country, category_id, vat_rate, duty_rate, de_minimis_threshold, notes)
SELECT 'US','GB',id,20.00,3.50,135.00,'USA luxury bag to UK' FROM item_categories WHERE name='luxury_bag' ON CONFLICT DO NOTHING;
INSERT INTO duty_rules (origin_country, destination_country, category_id, vat_rate, duty_rate, de_minimis_threshold, notes)
SELECT 'US','GB',id,20.00,0.00,135.00,'Electronics USA to UK' FROM item_categories WHERE name='electronics' ON CONFLICT DO NOTHING;
INSERT INTO duty_rules (origin_country, destination_country, category_id, vat_rate, duty_rate, de_minimis_threshold, notes)
SELECT 'US','GB',id,20.00,12.00,135.00,'Clothing USA to UK' FROM item_categories WHERE name='clothing' ON CONFLICT DO NOTHING;

-- UK → Nigeria
INSERT INTO duty_rules (origin_country, destination_country, category_id, vat_rate, duty_rate, de_minimis_threshold, notes)
SELECT 'GB','NG',id,7.50,20.00,50.00,'UK electronics to Nigeria' FROM item_categories WHERE name='electronics' ON CONFLICT DO NOTHING;
INSERT INTO duty_rules (origin_country, destination_country, category_id, vat_rate, duty_rate, de_minimis_threshold, notes)
SELECT 'GB','NG',id,7.50,20.00,50.00,'UK clothing to Nigeria' FROM item_categories WHERE name='clothing' ON CONFLICT DO NOTHING;
INSERT INTO duty_rules (origin_country, destination_country, category_id, vat_rate, duty_rate, de_minimis_threshold, notes)
SELECT 'GB','NG',id,7.50,20.00,50.00,'UK luxury bag to Nigeria' FROM item_categories WHERE name='luxury_bag' ON CONFLICT DO NOTHING;

-- Nigeria → UK
INSERT INTO duty_rules (origin_country, destination_country, category_id, vat_rate, duty_rate, de_minimis_threshold, notes)
SELECT 'NG','GB',id,20.00,0.00,135.00,'Nigeria clothing to UK' FROM item_categories WHERE name='clothing' ON CONFLICT DO NOTHING;
INSERT INTO duty_rules (origin_country, destination_country, category_id, vat_rate, duty_rate, de_minimis_threshold, notes)
SELECT 'NG','GB',id,20.00,5.00,135.00,'Nigeria food to UK' FROM item_categories WHERE name='food' ON CONFLICT DO NOTHING;

-- =============================================
-- SEED: Risk Flag Definitions
-- =============================================
INSERT INTO risk_flag_definitions (flag_code, description, severity, action_required)
VALUES
  ('HIGH_VALUE_LUXURY',    'Item value exceeds £10,000',                          'alert',    'Require invoice + enhanced verification'),
  ('AML_THRESHOLD',        'Item value exceeds AML reporting threshold £10,000',  'critical', 'Trigger AML review queue'),
  ('JEWELLERY_HIGH_VALUE', 'High value gold/jewellery detected',                  'alert',    'Invoice upload mandatory'),
  ('RESTRICTED_COUNTRY',   'Origin/destination may have trade restrictions',      'warning',  'Manual admin review'),
  ('NO_INVOICE',           'High value item without invoice',                     'warning',  'Request invoice upload'),
  ('UNCLASSIFIED_ITEM',    'AI could not confidently classify item',              'warning',  'Manual category confirmation')
ON CONFLICT (flag_code) DO NOTHING;
