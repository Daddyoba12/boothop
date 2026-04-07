-- ================================================================
-- BootHop Sprint 2 — Matches table + KYC columns + Terms table
-- Run this in Supabase SQL Editor
-- ================================================================

-- Required extensions
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ── MATCHES table (new flow) ──────────────────────────────────────────────────
create table if not exists public.matches (
  id                          uuid primary key default uuid_generate_v4(),

  -- trip links
  sender_trip_id              uuid,
  traveler_trip_id            uuid,

  -- participants (email-based, custom auth)
  sender_email                text,
  traveler_email              text,

  -- optional Supabase user IDs (populated if/when users register fully)
  sender_user_id              uuid,
  traveler_user_id            uuid,

  -- price
  agreed_price                numeric,
  proposed_price              numeric,
  interest_type               text default 'full_price',

  -- acceptance flags
  sender_accepted             boolean default false,
  traveler_accepted           boolean default false,
  sender_accepted_negotiation boolean default false,
  traveler_accepted_negotiation boolean default false,
  negotiation_status          text,

  -- status machine: matched → agreed → committed → kyc_pending → kyc_complete → payment_pending → active → completed → cancelled
  status                      text not null default 'matched',

  -- KYC
  sender_kyc_status           text default 'none',   -- none / pending / verified / failed
  traveler_kyc_status         text default 'none',
  sender_kyc_session_id       text,
  traveler_kyc_session_id     text,
  sender_kyc_verified_at      timestamptz,
  traveler_kyc_verified_at    timestamptz,

  -- delivery confirmation
  booter_confirmed_delivery   boolean default false,
  booter_confirmed_at         timestamptz,
  hooper_confirmed_receipt    boolean default false,
  hooper_confirmed_condition  boolean default false,
  hooper_confirmed_at         timestamptz,

  -- payment
  stripe_payment_intent_id    text,

  -- cancellation
  cancelled_by                text,
  cancelled_at                timestamptz,
  cancellation_reason         text,

  -- payment (manual flow)
  goods_value                 numeric,
  insurance_fee               numeric,
  insurance_accepted          boolean default false,
  payment_confirmed_at        timestamptz,
  payment_released_at         timestamptz,

  created_at                  timestamptz default now(),
  updated_at                  timestamptz default now()
);

-- Index for lookups
create index if not exists idx_matches_sender_email   on public.matches (sender_email);
create index if not exists idx_matches_traveler_email on public.matches (traveler_email);
create index if not exists idx_matches_status         on public.matches (status);

alter table public.matches enable row level security;

-- Service role only (all access from API routes via admin client)
create policy "service-role-matches"
  on public.matches for all
  using (auth.role() = 'service_role');

-- ── TERMS ACCEPTANCE ─────────────────────────────────────────────────────────
create table if not exists public.terms_acceptance (
  id            uuid primary key default uuid_generate_v4(),
  match_id      uuid references public.matches(id) on delete cascade,
  email         text not null,
  terms_version text not null,
  accepted      boolean default false,
  ip_address    text,
  accepted_at   timestamptz default now(),
  created_at    timestamptz default now()
);

create unique index if not exists terms_acceptance_match_email_idx
  on public.terms_acceptance (match_id, email);

alter table public.terms_acceptance enable row level security;

create policy "service-role-terms-acceptance"
  on public.terms_acceptance for all
  using (auth.role() = 'service_role');

-- ── ACTION TOKENS (for one-click email links) ─────────────────────────────────
create table if not exists public.action_tokens (
  id          uuid primary key default uuid_generate_v4(),
  token       text unique not null default encode(gen_random_bytes(32), 'hex'),
  email       text not null,
  action_type text not null,  -- confirm_match / decline_match / accept_negotiation / reject_negotiation / confirm_collected / confirm_delivered
  entity_id   uuid,           -- match_id
  payload     jsonb default '{}',
  used        boolean default false,
  used_at     timestamptz,
  expires_at  timestamptz not null,
  created_at  timestamptz default now()
);

create index if not exists idx_action_tokens_token      on public.action_tokens (token);
create index if not exists idx_action_tokens_email      on public.action_tokens (email);
create index if not exists idx_action_tokens_expires_at on public.action_tokens (expires_at);

alter table public.action_tokens enable row level security;

create policy "service-role-action-tokens"
  on public.action_tokens for all
  using (auth.role() = 'service_role');

-- ── TRIPS table (sender/traveler intent, the new anonymous flow) ──────────────
create table if not exists public.trips (
  id          uuid primary key default uuid_generate_v4(),
  type        text not null check (type in ('send', 'travel')),
  email       text not null,
  user_id     uuid,           -- nullable until full registration
  from_city   text not null,
  to_city     text not null,
  travel_date date not null,
  price       numeric,
  weight_capacity numeric,
  asking_price    numeric,
  status      text default 'active',  -- active / matched / completed / cancelled
  lat         numeric,
  lng         numeric,
  created_at  timestamptz default now()
);

create index if not exists idx_trips_type_status on public.trips (type, status);
create index if not exists idx_trips_email       on public.trips (email);

alter table public.trips enable row level security;

create policy "service-role-trips"
  on public.trips for all
  using (auth.role() = 'service_role');
