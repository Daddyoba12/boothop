-- BootHop Phase 1–4: In-App Communication System
-- Adds: locked_at on matches, contact_attempts, call_logs, message_attachments
-- Also ensures match_messages has is_blocked column

-- ── 1. Thread locking ─────────────────────────────────────────────────────────
ALTER TABLE matches ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN matches.locked_at IS
  'Set when delivery is confirmed. Messages blocked after 7 days (dispute window).';

-- ── 2. match_messages — ensure is_blocked exists ──────────────────────────────
ALTER TABLE match_messages ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE match_messages ADD COLUMN IF NOT EXISTS is_flagged  BOOLEAN NOT NULL DEFAULT FALSE;

-- ── 3. Contact-sharing attempts ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_attempts (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id      UUID         NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_email  TEXT         NOT NULL,
  content       TEXT         NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_attempts_match  ON contact_attempts(match_id);
CREATE INDEX IF NOT EXISTS idx_contact_attempts_sender ON contact_attempts(sender_email);

COMMENT ON TABLE contact_attempts IS
  'Logs messages blocked for containing personal contact details. Used for abuse monitoring.';

-- ── 4. Call logs (Telnyx masked calling) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS call_logs (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id      UUID         NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  caller_email  TEXT         NOT NULL,
  call_id       TEXT,                       -- Telnyx call_control_id
  status        TEXT         NOT NULL DEFAULT 'initiated',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_call_logs_match  ON call_logs(match_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_caller ON call_logs(caller_email);

COMMENT ON TABLE call_logs IS
  'Audit log for BootHop Call. Real numbers are never stored — only Telnyx control IDs.';

-- ── 5. Message attachments (Phase 4 audit trail) ──────────────────────────────
CREATE TABLE IF NOT EXISTS message_attachments (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id       UUID         NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  uploader_email TEXT         NOT NULL,
  label          TEXT         NOT NULL DEFAULT 'attachment',
  file_path      TEXT         NOT NULL,     -- Supabase Storage path
  public_url     TEXT         NOT NULL,
  file_type      TEXT         NOT NULL,
  file_size      INTEGER      NOT NULL,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attachments_match ON message_attachments(match_id);

COMMENT ON TABLE message_attachments IS
  'Files uploaded as evidence/proof for Phase 4 enterprise audit trail.';

-- ── 6. Row-Level Security ─────────────────────────────────────────────────────

-- contact_attempts — admin only (no participant access)
ALTER TABLE contact_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_contact_attempts" ON contact_attempts;
CREATE POLICY "admin_contact_attempts" ON contact_attempts
  FOR ALL USING (
    auth.jwt() ->> 'email' LIKE '%@boothop.com'
  );

-- call_logs — participants and admins
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "participant_call_logs" ON call_logs;
CREATE POLICY "participant_call_logs" ON call_logs
  FOR SELECT USING (
    caller_email = auth.jwt() ->> 'email'
    OR auth.jwt() ->> 'email' LIKE '%@boothop.com'
    OR EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = call_logs.match_id
        AND (m.sender_email = auth.jwt() ->> 'email'
          OR m.traveler_email = auth.jwt() ->> 'email')
    )
  );

-- message_attachments — participants
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "participant_attachments" ON message_attachments;
CREATE POLICY "participant_attachments" ON message_attachments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = message_attachments.match_id
        AND (m.sender_email = auth.jwt() ->> 'email'
          OR m.traveler_email = auth.jwt() ->> 'email')
    )
    OR auth.jwt() ->> 'email' LIKE '%@boothop.com'
  );

-- ── 7. Storage bucket for Phase 4 attachments ────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('match-attachments', 'match-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policy: only match participants can read their own attachments
CREATE POLICY "participant_read_attachments" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'match-attachments'
    AND (
      -- Path starts with the matchId — stored as {matchId}/{filename}
      EXISTS (
        SELECT 1 FROM matches m
        WHERE m.id::text = split_part(name, '/', 1)
          AND (m.sender_email = auth.jwt() ->> 'email'
            OR m.traveler_email = auth.jwt() ->> 'email')
      )
      OR auth.jwt() ->> 'email' LIKE '%@boothop.com'
    )
  );

-- Only the uploader (via service role in the API route) can insert
-- The API uses the admin client so storage.objects insert uses the service role key.
