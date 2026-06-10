-- BootHop BD Pipeline — faceless logistics/travel content store
-- Slots: 1=7:00 AM  2=12:00 PM  3=6:00 PM  4=9:00 PM
-- Pillars: logistics_stories | travel_hacks | airport_deliveries | supply_chain_failures

CREATE TABLE IF NOT EXISTS public.bd_posts (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  slot         SMALLINT    NOT NULL CHECK (slot BETWEEN 1 AND 4),
  slot_label   TEXT        NOT NULL,
  pillar       TEXT        NOT NULL,
  hook         TEXT        NOT NULL,
  script       TEXT        NOT NULL,
  caption      TEXT        NOT NULL,
  hashtags     TEXT        NOT NULL,
  visual_desc  TEXT,
  music_track  TEXT,
  video_url           TEXT,
  tiktok_publish_id   TEXT,
  instagram_media_id  TEXT,
  post_date    DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bd_posts_date_idx ON public.bd_posts (post_date DESC, slot);

ALTER TABLE public.bd_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_bd_posts" ON public.bd_posts
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "admin_read_bd_posts" ON public.bd_posts
  FOR SELECT USING (
    (auth.jwt() ->> 'email') LIKE '%@boothop.com'
  );

INSERT INTO storage.buckets (id, name, public)
VALUES ('bd-videos', 'bd-videos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "service_role_bd_videos" ON storage.objects
  FOR ALL USING (
    bucket_id = 'bd-videos' AND auth.role() = 'service_role'
  );
