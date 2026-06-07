-- =============================================
-- BootHop Business v2 — carrier, express, priority partner
-- Adds new columns to carrier_profiles and express_quotes,
-- creates priority_partners table if missing,
-- and adds new columns to priority_partners.
-- =============================================

-- ── carrier_profiles: new columns ─────────────────────────────────────

alter table carrier_profiles
  add column if not exists company_reg_number text,
  add column if not exists vat_number         text,
  add column if not exists your_role          text,
  add column if not exists vehicle_types      jsonb    not null default '[]'::jsonb,
  add column if not exists operating_hours    text,
  add column if not exists coverage_area      text,
  add column if not exists bank_account_name  text,
  add column if not exists sort_code          text,
  add column if not exists account_number     text,
  add column if not exists how_did_you_hear   text,
  add column if not exists agreed_to_terms    boolean  not null default false,
  add column if not exists insurance_filename text,
  add column if not exists registration_fee_paid boolean not null default false;

-- Update status domain to include payment_pending
-- (stored as text, no constraint — existing 'pending' values remain valid)

comment on column carrier_profiles.status is 'payment_pending | pending | active | rejected';

-- ── express_quotes: new columns ────────────────────────────────────────

alter table express_quotes
  add column if not exists delivery_type        text,   -- uk | international
  add column if not exists package_size         text,   -- small | medium | large | pallet
  add column if not exists estimated_price      integer,  -- GBP (whole pounds)
  add column if not exists pickup_address       text,
  add column if not exists pickup_contact       text,
  add column if not exists pickup_phone         text,
  add column if not exists delivery_address     text,
  add column if not exists delivery_contact     text,
  add column if not exists delivery_phone       text,
  add column if not exists special_instructions text,
  add column if not exists reference            text;    -- BH-EXP-XXXXXX

create unique index if not exists express_quotes_reference_idx on express_quotes (reference)
  where reference is not null;

create index if not exists express_quotes_delivery_type_idx on express_quotes (delivery_type);

-- ── priority_partners table ────────────────────────────────────────────

create table if not exists priority_partners (
  id                    uuid primary key default gen_random_uuid(),
  email                 text not null unique,
  company_name          text,
  phone                 text,
  job_title             text,
  industry_sector       text,
  delivery_type         text,   -- uk | international
  delivery_volume       text,   -- kept for backward compat
  delivery_frequency    text,   -- Daily | Weekly | Monthly | Emergency only
  typical_destinations  text,   -- UK only | UK & Europe | International
  what_moving           jsonb not null default '[]'::jsonb,
  notes                 text,
  annual_fee            integer,  -- 10000 | 15000 (GBP)
  discount_pct          integer  not null default 5,
  response_hours        integer  not null default 2,
  status                text     not null default 'payment_pending',
  -- status values: payment_pending | active | rejected | cancelled
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Add new columns to priority_partners if table already existed
alter table priority_partners
  add column if not exists job_title             text,
  add column if not exists industry_sector       text,
  add column if not exists delivery_type         text,
  add column if not exists delivery_frequency    text,
  add column if not exists typical_destinations  text,
  add column if not exists what_moving           jsonb not null default '[]'::jsonb,
  add column if not exists annual_fee            integer;

create index if not exists priority_partners_status_idx       on priority_partners (status);
create index if not exists priority_partners_delivery_type_idx on priority_partners (delivery_type);

-- ── Updated_at triggers ────────────────────────────────────────────────

create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists priority_partners_updated_at on priority_partners;
create trigger priority_partners_updated_at
  before update on priority_partners
  for each row execute function update_updated_at_column();

-- ── RLS ────────────────────────────────────────────────────────────────

alter table priority_partners enable row level security;
-- No public access — all reads/writes go through service role (API routes)

-- ── Admin view: carrier applications awaiting payment ──────────────────

create or replace view carrier_applications_pending_payment as
  select
    id, company_name, company_reg_number, contact_name, your_role,
    email, phone, base_location, fleet_size,
    vehicle_types, operating_hours, coverage_area,
    insurance_filename, agreed_to_terms,
    status, created_at
  from carrier_profiles
  where status = 'payment_pending'
  order by created_at desc;
