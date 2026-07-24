-- Stage 2: sender declaration schema extensions
-- Adds full declaration fields, acknowledgement booleans, and evidence table.
-- Run after 20260722_compliance_gate.sql in Supabase SQL Editor.

ALTER TABLE public.item_declarations
  ADD COLUMN IF NOT EXISTS item_name                        text,
  ADD COLUMN IF NOT EXISTS quantity                         integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS brand                            text,
  ADD COLUMN IF NOT EXISTS country_of_origin                text,
  ADD COLUMN IF NOT EXISTS contains_battery                 boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS contains_powder                  boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS contains_chemical                boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS contains_plant_or_animal         boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS item_modified                    boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sender_owns_item                 boolean,
  ADD COLUMN IF NOT EXISTS proof_of_ownership_explanation   text,
  ADD COLUMN IF NOT EXISTS ack_description_accurate         boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ack_nothing_concealed            boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ack_complies_with_laws           boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ack_may_be_reported              boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ack_false_decl_consequences      boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ack_legally_responsible          boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS declaration_text_version         text DEFAULT '1.0',
  ADD COLUMN IF NOT EXISTS created_by                       text;

-- Evidence uploads linked to a declaration
CREATE TABLE IF NOT EXISTS public.declaration_evidence (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  declaration_id  uuid        NOT NULL REFERENCES public.item_declarations(id) ON DELETE CASCADE,
  match_id        uuid        NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  evidence_type   text        NOT NULL,  -- 'photo' | 'video' | 'proof_of_ownership'
  file_url        text        NOT NULL,
  storage_key     text,
  mime_type       text,
  uploaded_by     text        NOT NULL,
  checksum        text,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_decl_evidence_decl_id  ON public.declaration_evidence (declaration_id);
CREATE INDEX IF NOT EXISTS idx_decl_evidence_match_id ON public.declaration_evidence (match_id);

ALTER TABLE public.declaration_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service-role-declaration-evidence"
  ON public.declaration_evidence FOR ALL
  USING (auth.role() = 'service_role');

-- NOTE: Create a Supabase Storage bucket named 'declaration-evidence' (public: false)
-- in the Supabase dashboard after running this migration.
