-- BootHop Compliance Lookup Database
-- Two tables:
--   compliance_rules  → static scraped/curated rules per route (no Claude needed)
--   compliance_cache  → cached Claude responses keyed by item+route (avoid repeat calls)

-- ── compliance_rules ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS compliance_rules (
  id           BIGSERIAL PRIMARY KEY,
  from_region  TEXT NOT NULL,   -- ISO-2 country ('NG','GB','US') or region ('AFRICA','EU','ANY')
  to_region    TEXT NOT NULL,   -- same
  item_keyword TEXT NOT NULL,   -- lowercase keyword to match against item description
  category     TEXT,            -- food | medication | weapons | electronics | cash | animals | plants | cosmetics | other
  verdict      TEXT NOT NULL CHECK (verdict IN ('PERMITTED','RESTRICTED','PROHIBITED','REVIEW_REQUIRED')),
  explanation  TEXT NOT NULL,
  legal_ref    TEXT,            -- e.g. 'HMRC Notice 701 / NAFDAC Act s.5'
  confidence   INT  DEFAULT 90 CHECK (confidence BETWEEN 0 AND 100),
  active       BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS compliance_rules_route_idx
  ON compliance_rules (from_region, to_region);

CREATE INDEX IF NOT EXISTS compliance_rules_keyword_idx
  ON compliance_rules USING gin(to_tsvector('english', item_keyword));

CREATE UNIQUE INDEX IF NOT EXISTS compliance_rules_route_keyword_idx
  ON compliance_rules (from_region, to_region, item_keyword);

-- ── compliance_cache ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS compliance_cache (
  id              BIGSERIAL PRIMARY KEY,
  item_normalized TEXT NOT NULL,
  from_country    TEXT NOT NULL,
  to_country      TEXT NOT NULL,
  verdict         TEXT NOT NULL,
  risk_score      INT,
  explanation     TEXT,
  tips            JSONB DEFAULT '[]',
  requires_review BOOLEAN DEFAULT false,
  category        TEXT,
  hit_count       INT DEFAULT 1,
  created_at      TIMESTAMPTZ DEFAULT now(),
  last_hit_at     TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS compliance_cache_lookup_idx
  ON compliance_cache (item_normalized, from_country, to_country);


-- ══════════════════════════════════════════════════════════════════════════════
-- SEED DATA  — Key routes: Nigeria↔UK, Africa↔UK/EU, USA↔Africa, Africa↔USA
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Legend ────────────────────────────────────────────────────────────────────
-- from_region / to_region values:
--   NG=Nigeria  GB=United Kingdom  US=United States
--   GH=Ghana  KE=Kenya  ZA=South Africa  SN=Senegal  CI=Côte d'Ivoire
--   AFRICA=any African country (broad rule)
--   EU=any EU member state
--   ANY=applies regardless of origin/destination (used with specific to_region)

INSERT INTO compliance_rules (from_region, to_region, item_keyword, category, verdict, explanation, legal_ref, confidence) VALUES

-- ══════════════════════════════════════════════════════════════════════════════
-- NIGERIA → UNITED KINGDOM
-- ══════════════════════════════════════════════════════════════════════════════
('NG','GB','khat',        'drugs',      'PROHIBITED',  'Khat is a Class C controlled drug in the UK. Importing khat from any country including Nigeria is a criminal offence under the Misuse of Drugs Act 1971, amended June 2014.', 'Misuse of Drugs Act 1971 (amended 2014)', 99),
('NG','GB','qat',         'drugs',      'PROHIBITED',  'Qat (also spelled khat) is a Class C controlled drug in the UK since June 2014. Importing it from Nigeria is illegal.', 'Misuse of Drugs Act 1971', 99),
('NG','GB','bush meat',   'food',       'PROHIBITED',  'Bush meat (wild game from Africa) is prohibited entry into the UK under animal disease and wildlife protection rules. It poses a serious risk of introducing African Swine Fever and other diseases.', 'HMRC Animal Health Regulations / CITES', 99),
('NG','GB','bushmeat',    'food',       'PROHIBITED',  'Bushmeat from African countries including Nigeria is prohibited from entering the UK under HMRC animal health rules.', 'HMRC Animal Health Regulations', 99),
('NG','GB','ivory',       'wildlife',   'PROHIBITED',  'Ivory is prohibited from import into the UK under the Ivory Act 2018 and CITES Appendix I. This applies to all ivory regardless of age unless a specific pre-1947 exemption certificate is held.', 'Ivory Act 2018 / CITES Appendix I', 99),
('NG','GB','elephant',    'wildlife',   'PROHIBITED',  'Products made from elephant parts (including ivory, skin, hair) are prohibited under CITES Appendix I and the UK Ivory Act 2018.', 'Ivory Act 2018 / CITES Appendix I', 95),
('NG','GB','parrot',      'animals',    'PROHIBITED',  'Grey parrots and most African parrot species are listed under CITES Appendix I. Importing them without a CITES permit is prohibited.', 'CITES Appendix I', 95),
('NG','GB','live bird',   'animals',    'PROHIBITED',  'Live birds from Nigeria require a CITES export permit and UK import licence. Most are prohibited without prior authorisation due to Newcastle disease risk.', 'HMRC Animal Imports / CITES', 90),
('NG','GB','raw meat',    'food',       'PROHIBITED',  'Raw or fresh meat from Nigeria (a non-approved third country) is prohibited from import into the UK under HMRC food safety rules.', 'HMRC Imports of animal products', 99),
('NG','GB','fresh meat',  'food',       'PROHIBITED',  'Fresh meat from Nigeria is prohibited entry into the UK. Nigeria is not on the approved list of countries from which meat can be imported.', 'HMRC Imports of animal products', 99),
('NG','GB','suya',        'food',       'RESTRICTED',  'Suya and other Nigerian meat products require full commercial import documentation and may be detained at the border. For personal use small quantities, declare at customs.', 'HMRC food imports', 80),
('NG','GB','egusi',       'food',       'PERMITTED',   'Dried seeds such as egusi (melon seeds) are generally permitted for personal import. Commercial quantities may require phytosanitary documentation.', 'HMRC personal food imports', 85),
('NG','GB','palm oil',    'food',       'PERMITTED',   'Palm oil in sealed containers for personal use is generally permitted. Commercial quantities may be subject to import controls. Declare at customs if over personal use threshold.', 'HMRC food imports', 80),
('NG','GB','crayfish',    'food',       'PERMITTED',   'Dried crayfish in sealed packaging for personal use is generally allowed. Must be commercially packaged and clearly labelled.', 'HMRC personal food imports', 80),
('NG','GB','stockfish',   'food',       'PERMITTED',   'Stockfish (dried, salted cod) in commercially packaged sealed containers is generally permitted for personal import into the UK.', 'HMRC food imports', 80),
('NG','GB','dried fish',  'food',       'PERMITTED',   'Commercially packaged dried fish products are generally permitted for personal use. Declare at customs if in large quantities.', 'HMRC food imports', 75),
('NG','GB','ponmo',       'food',       'RESTRICTED',  'Ponmo (cow skin) may be classified as an animal product and is subject to HMRC animal product import rules. Declaration required. May be seized if not commercially packaged.', 'HMRC animal product imports', 80),
('NG','GB','medication',  'medication', 'RESTRICTED',  'Prescription medication requires the original prescription and a letter from your doctor. Maximum 3 months personal supply permitted. Some controlled drugs require a personal import licence from the Home Office.', 'Misuse of Drugs Regulations 2001 / MHRA', 90),
('NG','GB','medicine',    'medication', 'RESTRICTED',  'Medicines for personal use are generally permitted up to 3 months supply with a prescription. Controlled drugs require a Home Office licence. Declare at customs on arrival.', 'MHRA / Misuse of Drugs Regulations', 90),
('NG','GB','tablets',     'medication', 'RESTRICTED',  'Tablets that are prescription medicines require documentation. Over-the-counter medicines for personal use are generally permitted. Check the specific medicine against MHRA guidelines.', 'MHRA guidelines', 85),
('NG','GB','tramadol',    'medication', 'PROHIBITED',  'Tramadol is a controlled drug (Schedule 3) in the UK. Importing tramadol without a Home Office personal licence is illegal, even with a Nigerian prescription.', 'Misuse of Drugs Regulations 2001', 99),
('NG','GB','codeine',     'medication', 'RESTRICTED',  'Codeine-containing medicines are controlled in the UK. Personal use quantities with a valid prescription may be permitted but must be declared. A Home Office personal licence may be required.', 'Misuse of Drugs Regulations 2001', 90),
('NG','GB','nafdac',      'medication', 'REVIEW_REQUIRED','Items labelled with NAFDAC registration are regulated pharmaceuticals or food products in Nigeria. UK import rules apply independently. A NAFDAC label does not guarantee UK clearance.', 'MHRA / HMRC', 80),
('NG','GB','cash',        'cash',       'RESTRICTED',  'You must declare cash of £10,000 or more (or equivalent in any currency) when entering or leaving the UK. Failure to declare can result in seizure.', 'HMRC Notice: Cash Controls', 99),
('NG','GB','currency',    'cash',       'RESTRICTED',  'Cash of £10,000 or more must be declared to UK Border Force. This applies to any currency, travellers cheques, or bearer bonds.', 'HMRC Notice: Cash Controls', 99),
('NG','GB','plant',       'plants',     'RESTRICTED',  'Plants and plant material require a phytosanitary certificate from the Nigerian NAQS (National Agricultural Quarantine Service). Soil must not be attached.', 'HMRC Plant Health / UK Plant Health Order', 90),
('NG','GB','seeds',       'plants',     'RESTRICTED',  'Seeds require a phytosanitary certificate. Some species are prohibited under CITES. Declare at customs. Small personal quantities may be accepted with documentation.', 'UK Plant Health Order 2020', 85),
('NG','GB','cosmetics',   'cosmetics',  'RESTRICTED',  'Cosmetics must comply with the UK Cosmetics Regulation (retained EU law). Commercial imports require safety assessment, CPSR, and a UK Responsible Person. For personal use amounts, generally permitted.', 'UK Cosmetics Regulation 2020', 80),
('NG','GB','herbal',      'other',      'REVIEW_REQUIRED','Herbal products require safety assessment and may be classified as unlicensed medicines under MHRA rules. Commercial import is restricted. Personal use small quantities generally tolerated.', 'MHRA Herbal Medicines Advisory Committee', 75),
('NG','GB','drone',       'electronics','RESTRICTED',  'Drones/UAVs entering the UK must comply with CAA regulations. Drones over 250g require CAA registration. Commercial drone imports may need UKCA/CE marking.', 'CAA Drone Regulation 2020 / UKCA', 85),
('NG','GB','firearm',     'weapons',    'PROHIBITED',  'Firearms and ammunition are prohibited from import without explicit Home Office authorisation. This includes imitation firearms that can be converted.', 'Firearms Act 1968', 99),
('NG','GB','weapon',      'weapons',    'PROHIBITED',  'Offensive weapons including knives with blades over 3 inches, flick knives, and other offensive weapons are prohibited from import into the UK.', 'Criminal Justice Act 1988 / Offensive Weapons Act', 99),
('NG','GB','counterfeit', 'other',      'PROHIBITED',  'Counterfeit goods of any kind — including fake branded clothing, electronics, handbags, and watches — are prohibited from import into the UK. Seizure and prosecution may follow.', 'Trade Marks Act 1994 / HMRC', 99),

-- ══════════════════════════════════════════════════════════════════════════════
-- UNITED KINGDOM → NIGERIA
-- ══════════════════════════════════════════════════════════════════════════════
('GB','NG','firearm',     'weapons',    'PROHIBITED',  'Firearms require an import permit from the Nigerian Police Force. Without prior authorisation, importing firearms into Nigeria is a serious criminal offence.', 'Firearms Act Nigeria', 99),
('GB','NG','pornography', 'other',      'PROHIBITED',  'Pornographic material is prohibited from import into Nigeria under the Obscene Publications Act and Customs laws.', 'Nigerian Customs Act', 99),
('GB','NG','medication',  'medication', 'RESTRICTED',  'Medicines and pharmaceuticals require NAFDAC import approval for commercial quantities. Personal use quantities (3 months supply) with documentation are generally permitted but must be declared.', 'NAFDAC Act / Nigerian Customs', 90),
('GB','NG','medicine',    'medication', 'RESTRICTED',  'Medicines for personal use require declaration at Nigerian Customs. Commercial quantities need NAFDAC registration and import permit.', 'NAFDAC Act', 90),
('GB','NG','pharmaceuticals','medication','RESTRICTED', 'Pharmaceutical products require NAFDAC registration and an import licence for commercial import into Nigeria. Personal supply with prescription is generally permitted.', 'NAFDAC Act Cap N1 LFN 2004', 90),
('GB','NG','food',        'food',       'RESTRICTED',  'Food items for commercial import into Nigeria require NAFDAC pre-shipment inspection and approval. Personal quantities in sealed packaging are generally allowed but must be declared.', 'NAFDAC Regulations', 85),
('GB','NG','cosmetics',   'cosmetics',  'RESTRICTED',  'Cosmetics require NAFDAC registration for commercial import. Personal quantities in sealed original packaging are generally permitted.', 'NAFDAC Act', 85),
('GB','NG','supplement',  'medication', 'RESTRICTED',  'Dietary supplements and food supplements require NAFDAC registration and approval for commercial import into Nigeria.', 'NAFDAC Act', 85),
('GB','NG','alcohol',     'food',       'RESTRICTED',  'Alcohol is permitted for personal import into Nigeria but commercial imports require NAFDAC and SON approval. Declare value at customs.', 'Nigerian Customs / NAFDAC', 80),
('GB','NG','electronics', 'electronics','RESTRICTED',  'Electronics require SON (Standards Organisation of Nigeria) conformity assessment for commercial import. Personal items are generally allowed but may be subject to duty.', 'SON Act Nigeria', 80),
('GB','NG','cash',        'cash',       'RESTRICTED',  'Importing more than $10,000 USD (or equivalent) in cash into Nigeria must be declared to Nigerian Customs. Undeclared currency above this limit is subject to seizure.', 'Nigerian Customs / CBN regulations', 99),
('GB','NG','used clothing','other',     'RESTRICTED',  'Commercial quantities of used/second-hand clothing (okrika) are subject to import restrictions and may require special permits. Personal used clothing is generally permitted.', 'Nigerian Customs HS codes', 75),
('GB','NG','drone',       'electronics','RESTRICTED',  'Drones/UAVs require approval from the Nigerian Civil Aviation Authority (NCAA) for import and operation. Declaration required at customs.', 'NCAA Regulations Nigeria', 85),
('GB','NG','counterfeit', 'other',      'PROHIBITED',  'Counterfeit goods are prohibited from import into Nigeria. Seizure and prosecution by Nigerian Customs can follow.', 'Nigerian Customs Excise Management Act', 99),

-- ══════════════════════════════════════════════════════════════════════════════
-- USA → NIGERIA  /  NIGERIA → USA
-- ══════════════════════════════════════════════════════════════════════════════
('US','NG','medication',  'medication', 'RESTRICTED',  'Medicines require NAFDAC approval for commercial import into Nigeria. Personal supplies (3 months) with a valid US prescription are generally permitted but must be declared at Nigerian customs.', 'NAFDAC Act Nigeria', 90),
('US','NG','food',        'food',       'RESTRICTED',  'Food items for commercial sale require NAFDAC pre-shipment inspection. Personal food in sealed packaging is generally allowed but should be declared.', 'NAFDAC Act', 85),
('US','NG','electronics', 'electronics','RESTRICTED',  'Electronics for personal use are generally permitted. Commercial quantities require SON conformity assessment mark.', 'SON Act Nigeria', 80),
('US','NG','cash',        'cash',       'RESTRICTED',  'Cash of $10,000 or more (or equivalent) must be declared to Nigerian Customs on arrival.', 'CBN / Nigerian Customs', 99),
('US','NG','firearm',     'weapons',    'PROHIBITED',  'Firearms require a prior import permit from the Nigerian Police Force. Importing without authorisation is a serious criminal offence in Nigeria.', 'Firearms Act Nigeria', 99),

('NG','US','bush meat',   'food',       'PROHIBITED',  'Bush meat from Africa is prohibited from entering the United States under USDA APHIS rules due to risk of introducing foot-and-mouth disease and other animal diseases.', 'USDA APHIS / 9 CFR', 99),
('NG','US','bushmeat',    'food',       'PROHIBITED',  'Bushmeat is prohibited from import into the USA under USDA and CDC animal disease regulations.', 'USDA APHIS / CDC', 99),
('NG','US','khat',        'drugs',      'PROHIBITED',  'Khat is a Schedule I controlled substance in the United States. Importing khat from Nigeria is a federal criminal offence.', 'DEA Schedule I / 21 USC', 99),
('NG','US','qat',         'drugs',      'PROHIBITED',  'Qat is a Schedule I controlled substance in the USA. Importing it is illegal regardless of source country.', 'DEA Schedule I', 99),
('NG','US','cash',        'cash',       'RESTRICTED',  'Currency of $10,000 or more (or equivalent) must be declared to CBP on the FinCEN 105 form when entering or leaving the USA. Failure to declare is a federal offence.', 'FinCEN / 31 USC 5316', 99),
('NG','US','currency',    'cash',       'RESTRICTED',  'Cash and monetary instruments of $10,000 or more must be declared on CBP Form 6059B and FinCEN 105 when entering the USA.', 'FinCEN regulations', 99),
('NG','US','medication',  'medication', 'RESTRICTED',  'Personal use medications are generally permitted up to 90 days supply with a valid prescription. Controlled substances require DEA import authorisation. Declare all medication to CBP.', 'FDA / DEA regulations', 90),
('NG','US','ivory',       'wildlife',   'PROHIBITED',  'Ivory is prohibited from import into the USA under the Endangered Species Act and CITES. This applies regardless of age or origin.', 'Endangered Species Act / CITES', 99),
('NG','US','plant',       'plants',     'RESTRICTED',  'Plants and plant material require a phytosanitary certificate and USDA APHIS permit. Soil must not be attached. Some species are prohibited.', 'USDA APHIS / CITES', 90),
('NG','US','food',        'food',       'RESTRICTED',  'Food products are subject to FDA inspection on entry. Commercially packaged sealed food is generally allowed for personal use. Unpackaged food or fresh produce may be detained.', 'FDA / CBP food import rules', 80),
('NG','US','firearm',     'weapons',    'PROHIBITED',  'Importing firearms without ATF authorisation is illegal. Nigerian firearms certificates are not recognised in the USA.', 'Gun Control Act 1968 / ATF', 99),
('NG','US','drone',       'electronics','RESTRICTED',  'Drones are permitted for personal import but must be registered with the FAA if over 0.55 lbs. Commercial drones may require FCC compliance certification.', 'FAA Drone Registration / FCC', 80),
('NG','US','counterfeit', 'other',      'PROHIBITED',  'Counterfeit goods are seized by CBP and importing them is a federal offence. Significant fines and criminal prosecution can follow.', 'Lanham Act / 18 USC 2320', 99),

-- ══════════════════════════════════════════════════════════════════════════════
-- AFRICA (GENERAL) → UK / EU
-- ══════════════════════════════════════════════════════════════════════════════
('AFRICA','GB','bush meat',  'food',    'PROHIBITED',  'Bush meat from any African country is prohibited from entering the UK due to the risk of introducing African Swine Fever, Foot and Mouth disease, and other animal diseases.', 'HMRC Animal Products Import Rules', 99),
('AFRICA','GB','ivory',      'wildlife','PROHIBITED',  'Ivory from any African country is prohibited from import into the UK under the Ivory Act 2018 and CITES Appendix I.', 'Ivory Act 2018 / CITES', 99),
('AFRICA','GB','live animal','animals', 'PROHIBITED',  'Live animals from African countries generally require CITES documentation and UK import permits. Most are prohibited without prior authorisation. Contact APHA before shipping.', 'CITES / HMRC Animal Imports', 95),
('AFRICA','GB','fresh meat', 'food',    'PROHIBITED',  'Fresh or chilled meat from African countries (not on the UK approved third-country list) is prohibited from entry into the UK.', 'HMRC Imports of animal products', 99),
('AFRICA','EU','bush meat',  'food',    'PROHIBITED',  'Bush meat from any African country is prohibited in the EU under EC Regulation 1774/2002 and subsequent animal health rules.', 'EC Regulation 1774/2002 / EU animal health rules', 99),
('AFRICA','EU','ivory',      'wildlife','PROHIBITED',  'Ivory is banned from commercial trade and import into the EU under CITES Appendix I and EU wildlife trade regulations.', 'CITES Appendix I / EU Regulation 338/97', 99),
('AFRICA','EU','cash',       'cash',    'RESTRICTED',  'Cash of €10,000 or more (or equivalent) must be declared to EU customs on entry or exit from any EU member state.', 'EU Cash Controls Regulation 1889/2005', 99),
('AFRICA','EU','medication',  'medication','RESTRICTED','Medicines require EU marketing authorisation for commercial import. Personal use quantities with prescription are generally permitted. Controlled drugs require special permits.', 'EMA / EU Pharmaceutical Regulation', 90),
('AFRICA','EU','fresh fruit', 'plants', 'RESTRICTED',  'Fresh fruit and vegetables from many African countries require phytosanitary certificates and may be subject to EU plant health checks at the border.', 'EU Plant Health Regulation 2016/2031', 85),
('AFRICA','EU','plant',      'plants',  'RESTRICTED',  'Plants and plant material from Africa require phytosanitary certificates. High-risk items may be prohibited. Check specific species and destination country rules.', 'EU Plant Health Regulation 2016/2031', 85),

-- ══════════════════════════════════════════════════════════════════════════════
-- AFRICA → USA  /  USA → AFRICA
-- ══════════════════════════════════════════════════════════════════════════════
('AFRICA','US','bush meat',  'food',    'PROHIBITED',  'Bush meat from any African country is strictly prohibited from entry into the USA. This includes any wild game or meat from African wildlife.', 'USDA APHIS 9 CFR 94', 99),
('AFRICA','US','ivory',      'wildlife','PROHIBITED',  'Ivory from any African country is prohibited from import into the USA under the Endangered Species Act and CITES Appendix I.', 'ESA / CITES', 99),
('AFRICA','US','live animal','animals', 'PROHIBITED',  'Live wild animals from Africa require CITES permits, CDC, and USFWS permits. Most are prohibited without extensive prior authorisation.', 'CITES / USFWS / CDC', 95),
('AFRICA','US','cash',       'cash',    'RESTRICTED',  'Cash or monetary instruments of $10,000 or more must be declared to CBP when entering the USA from any country.', 'FinCEN / CBP', 99),
('AFRICA','US','medication',  'medication','RESTRICTED','Prescription medication for personal use (up to 90 days supply) is generally permitted. Must be in original container with prescription label. Controlled substances require DEA import permit.', 'FDA / DEA', 90),
('US','AFRICA','medication',  'medication','RESTRICTED','US prescription medicines for personal use are generally permitted into most African countries in reasonable quantities. Commercial importers require local drug agency registration.', 'Varies by destination country', 80),
('US','AFRICA','electronics', 'electronics','RESTRICTED','Electronics for personal use are generally allowed. Commercial quantities may require local standards certification (e.g. NAFDAC/SON for Nigeria, KEBS for Kenya).', 'Country-specific standards bodies', 75),

-- ══════════════════════════════════════════════════════════════════════════════
-- GHANA ↔ UK  /  KENYA ↔ UK  /  SOUTH AFRICA ↔ UK
-- ══════════════════════════════════════════════════════════════════════════════
('GH','GB','bush meat',   'food',       'PROHIBITED',  'Bush meat from Ghana is prohibited from entry into the UK. Same rules apply as other African countries under HMRC animal health regulations.', 'HMRC Animal Products Import Rules', 99),
('GH','GB','kente',       'other',      'PERMITTED',   'Kente cloth and other traditional Ghanaian textiles are generally permitted for import into the UK with no restrictions.', 'HMRC textile imports', 95),
('KE','GB','fresh flower', 'plants',    'RESTRICTED',  'Fresh cut flowers from Kenya require a phytosanitary certificate. Most commercial Kenyan flower exports already meet UK standards. Personal quantities generally accepted.', 'UK Plant Health Order 2020', 85),
('KE','GB','coffee',      'food',       'PERMITTED',   'Commercially packaged roasted coffee from Kenya is generally permitted for import into the UK for personal use. Commercial quantities require standard food import documentation.', 'HMRC food imports', 90),
('ZA','GB','wine',        'food',       'RESTRICTED',  'South African wine for personal use (up to allowance limits) is permitted. Commercial imports require standard alcohol import licence. Duty applies above personal allowance.', 'HMRC alcohol import', 85),
('ZA','GB','biltong',     'food',       'PROHIBITED',  'Biltong (dried meat) from South Africa is prohibited from entry into the UK as South Africa is not on the approved list for meat imports.', 'HMRC animal product imports', 90),

-- ══════════════════════════════════════════════════════════════════════════════
-- EU INTERNAL + UK → EU
-- ══════════════════════════════════════════════════════════════════════════════
('GB','EU','cash',        'cash',       'RESTRICTED',  'Cash of €10,000 or more (or equivalent) must be declared when entering any EU member state from the UK post-Brexit.', 'EU Cash Controls Regulation', 99),
('GB','EU','medication',  'medication', 'RESTRICTED',  'Medicines require EU marketing authorisation for commercial import from the UK. Personal use quantities with prescription are generally permitted for up to 3 months supply.', 'EMA regulations', 85),
('GB','EU','meat',        'food',       'RESTRICTED',  'Meat products from the UK entering the EU require health certification and may be subject to border inspection posts (BIPs). Personal quantities face restrictions post-Brexit.', 'EU animal health rules / post-Brexit SPS checks', 90),

-- ══════════════════════════════════════════════════════════════════════════════
-- UNIVERSAL PROHIBITED (ANY → ANY)
-- ══════════════════════════════════════════════════════════════════════════════
('ANY','ANY','explosive',  'weapons',   'PROHIBITED',  'Explosives of any kind are universally prohibited from peer-to-peer or luggage-based delivery. This includes fireworks, pyrotechnics, and flammable materials.', 'IATA Dangerous Goods Regulations / ICAO Annex 18', 99),
('ANY','ANY','flammable',  'other',     'PROHIBITED',  'Flammable liquids and gases (including aerosols above 500ml, lighter fuel, acetone) are prohibited from carry-on and checked luggage under IATA Dangerous Goods Regulations.', 'IATA DGR', 99),
('ANY','ANY','lithium battery','electronics','RESTRICTED','Large lithium batteries (over 100Wh) are restricted in aircraft hold. Lithium batteries must comply with IATA Section II requirements. Spare batteries must be in carry-on only.', 'IATA DGR Section II', 90),
('ANY','ANY','marijuana',  'drugs',     'PROHIBITED',  'Cannabis/marijuana is illegal in most countries and prohibited from international transport regardless of any local legality at origin or destination.', 'UN Single Convention on Narcotic Drugs 1961', 99),
('ANY','ANY','cannabis',   'drugs',     'PROHIBITED',  'Cannabis and cannabis derivatives are controlled substances under international law and are prohibited from international peer-to-peer delivery.', 'UN Single Convention on Narcotic Drugs 1961', 99),
('ANY','ANY','cocaine',    'drugs',     'PROHIBITED',  'Cocaine is a Class A controlled drug internationally. Transporting cocaine across any international border is a serious criminal offence.', 'UN Drug Conventions', 99),
('ANY','ANY','heroin',     'drugs',     'PROHIBITED',  'Heroin is a Class A controlled substance. International transport is universally prohibited.', 'UN Drug Conventions', 99),
('ANY','ANY','weapon',     'weapons',   'PROHIBITED',  'Weapons including firearms, ammunition, tasers, and offensive weapons are prohibited from peer-to-peer delivery. Country-specific import licences are required even for legitimate transfer.', 'IATA / national customs laws', 99),
('ANY','ANY','pornography','other',     'RESTRICTED',  'Pornographic material is prohibited or severely restricted in many countries including Nigeria, Saudi Arabia, and others. Check destination country laws. Child pornography is universally illegal.', 'Varies by country', 85),
('ANY','ANY','counterfeit','other',     'PROHIBITED',  'Counterfeit goods — including fake branded items, pirated software, and fraudulent currency — are prohibited from import in all countries.', 'TRIPS Agreement / national IP laws', 99),
('ANY','ANY','endangered species','wildlife','PROHIBITED','Live animals or products from endangered species listed under CITES Appendix I are prohibited from international trade without specific permits. Check CITES database for your specific species.', 'CITES Appendix I', 99);

-- ── Function: bump cache hit count on repeated lookup ────────────────────────
CREATE OR REPLACE FUNCTION bump_compliance_cache_hit(
  p_item TEXT, p_from TEXT, p_to TEXT
) RETURNS void LANGUAGE sql AS $$
  UPDATE compliance_cache
  SET hit_count = hit_count + 1, last_hit_at = now()
  WHERE item_normalized = p_item
    AND from_country    = p_from
    AND to_country      = p_to;
$$;
