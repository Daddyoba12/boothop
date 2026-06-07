-- =============================================
-- BootHop Business Jobs table
-- Run AFTER 20260607_carrier_express_tables.sql
-- =============================================

create table if not exists business_jobs (
  id                      uuid        primary key default gen_random_uuid(),
  job_ref                 text        not null unique,
  email                   text        not null,          -- business user's email
  company_name            text,
  phone                   text,

  -- Route
  pickup                  text        not null,
  dropoff                 text        not null,
  delivery_type           text        not null default 'local_uk',
  route_type              text,                          -- local_uk | eu | international
  delivery_mode           text,                          -- hand_carry | van | air
  delivery_date           date,
  expected_delivery_date  date,
  distance_miles          numeric,
  extra_pickup_miles      numeric     not null default 0,
  extra_drop_miles        numeric     not null default 0,

  -- Cargo
  description             text,
  category                text,
  weight                  text,
  declared_value          text,
  fragile                 boolean     not null default false,
  dangerous_goods         boolean     not null default false,
  customs_handled_by      text,                          -- boothop | client

  -- Urgency & service tier
  urgency                 text        not null default 'planned',
  urgency_tier            text,                          -- planned | priority | critical | same_day
  night_service           boolean     not null default false,
  weekend                 boolean     not null default false,
  dedicated_driver        boolean     not null default false,
  immediate_dispatch      boolean     not null default false,
  meet_greet_origin       boolean     not null default false,
  meet_greet_dest         boolean     not null default false,

  -- Pricing
  estimated_price         numeric,
  insurance               boolean     not null default true,
  insurance_fee           numeric,
  is_priority             boolean     not null default false,

  -- Sender / receiver contacts
  sender_name             text,
  sender_email            text,
  receiver_company        text,
  receiver_name           text,
  receiver_phone          text,
  receiver_email          text,
  receiver_address        text,

  -- Admin review
  review_required         boolean     not null default false,
  status                  text        not null default 'pending',
  -- pending_payment | pending | review | assigned | in_transit | delivered | cancelled | failed

  -- Driver assignment (set by admin via /api/business/update-status)
  driver_name             text,
  driver_email            text,
  driver_phone            text,
  assigned_at             timestamptz,
  picked_up_at            timestamptz,
  delivered_at            timestamptz,

  -- Metadata blob (add-ons, translation, extras)
  metadata                jsonb       default '{}'::jsonb,

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists business_jobs_email_idx      on business_jobs (email);
create index if not exists business_jobs_status_idx     on business_jobs (status);
create index if not exists business_jobs_created_idx    on business_jobs (created_at desc);
create index if not exists business_jobs_job_ref_idx    on business_jobs (job_ref);

-- updated_at trigger (reuses function from carrier_express_tables migration)
drop trigger if exists business_jobs_updated_at on business_jobs;
create trigger business_jobs_updated_at
  before update on business_jobs
  for each row execute function update_updated_at_column();

alter table business_jobs enable row level security;
-- All access via service role only — no public policies needed
