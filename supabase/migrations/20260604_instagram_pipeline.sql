-- Instagram content pipeline tables

CREATE TABLE IF NOT EXISTS instagram_posts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id   TEXT        UNIQUE NOT NULL,
  scenario      TEXT        NOT NULL,
  hook          TEXT        NOT NULL,
  slides        JSONB       NOT NULL,
  caption       TEXT        NOT NULL,
  hashtags      TEXT        NOT NULL,
  image_urls    JSONB,
  status        TEXT        NOT NULL DEFAULT 'pending',
  instagram_media_id TEXT,
  tiktok_publish_id  TEXT,
  tiktok_status      TEXT DEFAULT 'skipped',
  insights      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at   TIMESTAMPTZ,
  posted_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_instagram_posts_status     ON instagram_posts(status);
CREATE INDEX IF NOT EXISTS idx_instagram_posts_approval   ON instagram_posts(approval_id);
CREATE INDEX IF NOT EXISTS idx_instagram_posts_created    ON instagram_posts(created_at DESC);

-- Weekly analytics snapshots
CREATE TABLE IF NOT EXISTS instagram_analytics (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  week_ending         TIMESTAMPTZ NOT NULL,
  posts_count         INT         DEFAULT 0,
  total_impressions   INT         DEFAULT 0,
  total_reach         INT         DEFAULT 0,
  total_saves         INT         DEFAULT 0,
  total_shares        INT         DEFAULT 0,
  avg_engagement_rate NUMERIC(5,2),
  best_post_id        TEXT,
  insights_raw        JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
