-- =============================================
-- BootHop Jobs Engine — core jobs table and matching infrastructure
-- =============================================

-- ── jobs ──────────────────────────────────────────────────────────────────

create table if not exists jobs (
  id                    uuid primary key default gen_random_uuid(),
  reference             text not null unique,

  -- Client
  client_type           text not null default 'express', -- express | priority
  client_email          text not null,
  client_company        text,

  -- Pricing (whole pounds)
  client_paid           integer,           -- what client pays BootHop
  partner_rate          integer,           -- 70% of client_paid (what partner receives)
  boothop_margin        integer,           -- 30% of client_paid (BootHop keeps)

  -- Shipment
  delivery_type         text,              -- uk | international
  package_size          text,              -- small | medium | large | pallet
  cargo_description     text,
  special_instructions  text,

  -- Pickup
  pickup_address        text,
  pickup_contact        text,
  pickup_phone          text,
  pickup_postcode       text,             -- used for radius matching
  pickup_lat            numeric(10, 7),
  pickup_lng            numeric(10, 7),

  -- Delivery
  delivery_address      text,
  delivery_contact      text,
  delivery_phone        text,
  delivery_postcode     text,
  delivery_lat          numeric(10, 7),
  delivery_lng          numeric(10, 7),

  -- Status
  status                text not null default 'received',
  -- received | matching | assigned | collected | in_transit | delivered | failed | cancelled

  -- Matching
  match_radius_miles    integer not null default 50,
  partner_id            uuid references carrier_profiles(id),
  matched_at            timestamptz,       -- when first alert was sent
  assigned_at           timestamptz,       -- when a partner accepted
  is_boothop_direct     boolean not null default false,

  -- Timeline events
  collected_at          timestamptz,
  in_transit_at         timestamptz,
  delivered_at          timestamptz,
  failed_at             timestamptz,
  cancelled_at          timestamptz,

  -- Payment
  payment_due_at        timestamptz,       -- delivered_at + 7 days
  payment_released_at   timestamptz,

  -- Proof & tracking
  photo_proof_url       text,
  tracking_url          text,

  -- Source reference (links back to express_quotes or priority_partners)
  source_reference      text,             -- BH-EXP-XXXX or BH-PP-XXXX

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists jobs_status_idx         on jobs (status);
create index if not exists jobs_partner_id_idx     on jobs (partner_id);
create index if not exists jobs_client_email_idx   on jobs (client_email);
create index if not exists jobs_delivery_type_idx  on jobs (delivery_type);
create index if not exists jobs_matched_at_idx     on jobs (matched_at) where matched_at is not null;
create index if not exists jobs_delivered_at_idx   on jobs (delivered_at) where delivered_at is not null;

-- updated_at trigger
drop trigger if exists jobs_updated_at on jobs;
create trigger jobs_updated_at
  before update on jobs
  for each row execute function update_updated_at_column();

-- ── job_match_log ──────────────────────────────────────────────────────────

create table if not exists job_match_log (
  id            uuid primary key default gen_random_uuid(),
  job_id        uuid not null references jobs(id) on delete cascade,
  partner_id    uuid not null references carrier_profiles(id),
  radius_miles  integer,
  alerted_at    timestamptz not null default now(),
  response      text,          -- accepted | declined | no_response
  responded_at  timestamptz
);

create index if not exists job_match_log_job_id_idx     on job_match_log (job_id);
create index if not exists job_match_log_partner_id_idx on job_match_log (partner_id);

-- ── carrier_profiles: add fields needed by job engine ─────────────────────

alter table carrier_profiles
  add column if not exists status_active      boolean not null default false,
  add column if not exists last_job_at        timestamptz,
  add column if not exists co_house_verified  boolean not null default false,
  add column if not exists co_house_checked_at timestamptz,
  add column if not exists cert_expiry_date   date,
  add column if not exists insurance_expiry_date date;

-- ── priority_partners: add membership expiry ─────────────────────────────

alter table priority_partners
  add column if not exists membership_expires_at timestamptz,
  add column if not exists am_called_at          timestamptz,
  add column if not exists am_assigned           text;          -- account manager name

-- ── Admin view: live jobs needing attention ───────────────────────────────

create or replace view jobs_needing_attention as
  select
    id, reference, status, client_type, client_email, client_company,
    client_paid, partner_rate, delivery_type, pickup_address, delivery_address,
    match_radius_miles, matched_at, assigned_at, is_boothop_direct,
    created_at,
    extract(epoch from (now() - coalesce(matched_at, created_at))) / 60 as minutes_waiting
  from jobs
  where status in ('received', 'matching')
  order by created_at asc;

-- ── Admin view: today's completed jobs ───────────────────────────────────

create or replace view jobs_today as
  select
    id, reference, status, client_type, client_email,
    client_paid, partner_rate, boothop_margin,
    delivery_type, partner_id, is_boothop_direct,
    delivered_at, payment_released_at
  from jobs
  where date(created_at) = current_date
  order by created_at desc;

-- ── RLS ───────────────────────────────────────────────────────────────────

alter table jobs          enable row level security;
alter table job_match_log enable row level security;
-- All reads/writes go through service role (API routes)
