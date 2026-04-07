-- ================================================================
-- BootHop Sprint 3 & 4 — Disputes, Ratings, Messages, Match columns
-- Run this in Supabase SQL Editor AFTER sprint2-matches-kyc.sql
-- ================================================================

-- ── Extra columns on matches (if not already added) ───────────────────────────
alter table public.matches
  add column if not exists goods_value              numeric,
  add column if not exists insurance_fee            numeric,
  add column if not exists insurance_accepted       boolean default false,
  add column if not exists payment_confirmed_at     timestamptz,
  add column if not exists payment_released_at      timestamptz,
  add column if not exists cancelled_by             text,
  add column if not exists cancelled_at             timestamptz,
  add column if not exists cancellation_reason      text;

-- Additional statuses the app now uses:
-- 'disputed', 'delivery_confirmed', 'cancellation_requested'
-- (stored as text — no constraint needed)

-- ── DISPUTES ──────────────────────────────────────────────────────────────────
create table if not exists public.disputes (
  id           uuid primary key default uuid_generate_v4(),
  match_id     uuid references public.matches(id) on delete cascade,
  raised_by    text not null,       -- email of party who raised it
  reason       text not null,
  description  text not null,
  status       text default 'open', -- open / resolved / rejected
  resolution   text,                -- refund_sender / pay_carrier / split / no_action
  admin_note   text,
  resolved_at  timestamptz,
  created_at   timestamptz default now()
);

create index if not exists idx_disputes_match_id on public.disputes (match_id);
create index if not exists idx_disputes_status   on public.disputes (status);

alter table public.disputes enable row level security;

create policy "service-role-disputes"
  on public.disputes for all
  using (auth.role() = 'service_role');

-- ── RATINGS ───────────────────────────────────────────────────────────────────
create table if not exists public.ratings (
  id              uuid primary key default uuid_generate_v4(),
  match_id        uuid references public.matches(id) on delete cascade,
  reviewer_email  text not null,
  reviewee_email  text not null,
  rating          integer not null check (rating between 1 and 5),
  comment         text,
  created_at      timestamptz default now()
);

create unique index if not exists ratings_match_reviewer_idx
  on public.ratings (match_id, reviewer_email);

create index if not exists idx_ratings_reviewee on public.ratings (reviewee_email);

alter table public.ratings enable row level security;

create policy "service-role-ratings"
  on public.ratings for all
  using (auth.role() = 'service_role');

-- ── MATCH MESSAGES ────────────────────────────────────────────────────────────
create table if not exists public.match_messages (
  id            uuid primary key default uuid_generate_v4(),
  match_id      uuid references public.matches(id) on delete cascade,
  sender_email  text not null,
  content       text not null,
  is_flagged    boolean default false,
  created_at    timestamptz default now()
);

create index if not exists idx_match_messages_match_id on public.match_messages (match_id);
create index if not exists idx_match_messages_flagged  on public.match_messages (is_flagged) where is_flagged = true;

alter table public.match_messages enable row level security;

create policy "service-role-match-messages"
  on public.match_messages for all
  using (auth.role() = 'service_role');
