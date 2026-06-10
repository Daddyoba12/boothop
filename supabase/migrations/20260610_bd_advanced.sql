-- BootHop BD Pipeline — Advanced tables (content engine, A/B variants, jobs)
-- Run in Supabase dashboard after 20260610_bd_posts.sql

-- ── Content items ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bd_content (
  id            TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  pillar        TEXT        NOT NULL,
  platform      TEXT        NOT NULL DEFAULT 'all',
  template_key  TEXT        NOT NULL DEFAULT 'documentary',
  status        TEXT        NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft','review','approved','queued','rendering','rendered','posted','archived')),
  slot          SMALLINT,
  slot_label    TEXT,

  hook          TEXT        NOT NULL,
  script        TEXT        NOT NULL,
  caption       TEXT        NOT NULL,
  hashtags      TEXT        NOT NULL,
  visual_desc   TEXT,
  voiceover_url TEXT,
  video_url     TEXT,

  tiktok_id     TEXT,
  instagram_id  TEXT,

  scheduled_at  TIMESTAMPTZ,
  posted_at     TIMESTAMPTZ,

  views         INT         NOT NULL DEFAULT 0,
  likes         INT         NOT NULL DEFAULT 0,
  comments      INT         NOT NULL DEFAULT 0,
  shares        INT         NOT NULL DEFAULT 0,
  saves         INT         NOT NULL DEFAULT 0,
  clicks        INT         NOT NULL DEFAULT 0,
  conversions   INT         NOT NULL DEFAULT 0,
  score         FLOAT       NOT NULL DEFAULT 0,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bd_content_status_idx  ON public.bd_content (status, created_at DESC);
CREATE INDEX IF NOT EXISTS bd_content_score_idx   ON public.bd_content (score DESC);
CREATE INDEX IF NOT EXISTS bd_content_slot_idx    ON public.bd_content (slot, created_at DESC);

-- ── A/B Variants ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bd_variants (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  content_id  TEXT        NOT NULL REFERENCES public.bd_content(id) ON DELETE CASCADE,
  label       TEXT        NOT NULL,
  hook        TEXT        NOT NULL,
  caption     TEXT        NOT NULL,
  views       INT         NOT NULL DEFAULT 0,
  likes       INT         NOT NULL DEFAULT 0,
  clicks      INT         NOT NULL DEFAULT 0,
  score       FLOAT       NOT NULL DEFAULT 0,
  is_winner   BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bd_variants_content_idx ON public.bd_variants (content_id);

-- ── Render jobs ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bd_render_jobs (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  content_id  TEXT        NOT NULL REFERENCES public.bd_content(id) ON DELETE CASCADE,
  status      TEXT        NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','running','done','failed')),
  video_url   TEXT,
  error       TEXT,
  attempts    INT         NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Posting jobs ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bd_posting_jobs (
  id           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  content_id   TEXT        NOT NULL REFERENCES public.bd_content(id) ON DELETE CASCADE,
  platform     TEXT        NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending','running','done','failed')),
  result_id    TEXT,
  error        TEXT,
  attempts     INT         NOT NULL DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  posted_at    TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Notifications ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bd_notifications (
  id         TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  message    TEXT        NOT NULL,
  type       TEXT        NOT NULL DEFAULT 'info',
  read       BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── updated_at trigger ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bd_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS bd_content_updated_at ON public.bd_content;
CREATE TRIGGER bd_content_updated_at
  BEFORE UPDATE ON public.bd_content
  FOR EACH ROW EXECUTE FUNCTION public.bd_set_updated_at();

DROP TRIGGER IF EXISTS bd_render_jobs_updated_at ON public.bd_render_jobs;
CREATE TRIGGER bd_render_jobs_updated_at
  BEFORE UPDATE ON public.bd_render_jobs
  FOR EACH ROW EXECUTE FUNCTION public.bd_set_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.bd_content       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bd_variants      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bd_render_jobs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bd_posting_jobs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bd_notifications ENABLE ROW LEVEL SECURITY;

-- Service role bypass on all tables
DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['bd_content','bd_variants','bd_render_jobs','bd_posting_jobs','bd_notifications']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "service_role_%s" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "service_role_%s" ON public.%I FOR ALL USING (auth.role() = ''service_role'')', t, t);
  END LOOP;
END $$;
