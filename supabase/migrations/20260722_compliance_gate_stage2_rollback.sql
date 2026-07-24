-- Rollback for 20260722_compliance_gate_stage2.sql
-- Safe to run even if item_declarations no longer exists (e.g. Stage 1 already rolled back).

DROP TABLE IF EXISTS public.declaration_evidence;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'item_declarations'
  ) THEN
    ALTER TABLE public.item_declarations
      DROP COLUMN IF EXISTS item_name,
      DROP COLUMN IF EXISTS quantity,
      DROP COLUMN IF EXISTS brand,
      DROP COLUMN IF EXISTS country_of_origin,
      DROP COLUMN IF EXISTS contains_battery,
      DROP COLUMN IF EXISTS contains_powder,
      DROP COLUMN IF EXISTS contains_chemical,
      DROP COLUMN IF EXISTS contains_plant_or_animal,
      DROP COLUMN IF EXISTS item_modified,
      DROP COLUMN IF EXISTS sender_owns_item,
      DROP COLUMN IF EXISTS proof_of_ownership_explanation,
      DROP COLUMN IF EXISTS ack_description_accurate,
      DROP COLUMN IF EXISTS ack_nothing_concealed,
      DROP COLUMN IF EXISTS ack_complies_with_laws,
      DROP COLUMN IF EXISTS ack_may_be_reported,
      DROP COLUMN IF EXISTS ack_false_decl_consequences,
      DROP COLUMN IF EXISTS ack_legally_responsible,
      DROP COLUMN IF EXISTS declaration_text_version,
      DROP COLUMN IF EXISTS created_by;
  END IF;
END $$;
