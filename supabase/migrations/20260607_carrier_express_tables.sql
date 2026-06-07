-- Carrier Network capability profiles
create table if not exists carrier_profiles (
  id              uuid primary key default gen_random_uuid(),
  company_name    text not null,
  contact_name    text,
  email           text not null unique,
  phone           text,
  base_location   text,
  fleet_size      text,

  -- Certifications
  cert_adr                boolean not null default false,
  cert_iata_dg            boolean not null default false,
  cert_gdp                boolean not null default false,
  cert_aviation_security  boolean not null default false,
  cert_iso9001            boolean not null default false,
  cert_tapa               boolean not null default false,
  cert_medical            boolean not null default false,

  -- Cargo categories
  cargo_aog         boolean not null default false,
  cargo_industrial  boolean not null default false,
  cargo_pharma      boolean not null default false,
  cargo_electronics boolean not null default false,
  cargo_automotive  boolean not null default false,
  cargo_general     boolean not null default false,

  -- Service capabilities
  svc_sameday_uk    boolean not null default false,
  svc_international boolean not null default false,
  svc_airport       boolean not null default false,
  svc_ooh           boolean not null default false,
  svc_refrigerated  boolean not null default false,
  svc_hazmat        boolean not null default false,

  notes     text,
  status    text not null default 'pending', -- pending | active | rejected
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for admin filtering by capability
create index if not exists carrier_profiles_status_idx  on carrier_profiles (status);
create index if not exists carrier_profiles_adr_idx     on carrier_profiles (cert_adr) where cert_adr = true;
create index if not exists carrier_profiles_aviation_idx on carrier_profiles (cert_aviation_security) where cert_aviation_security = true;
create index if not exists carrier_profiles_aog_idx     on carrier_profiles (cargo_aog) where cargo_aog = true;

-- Express quote requests (one-off delivery leads)
create table if not exists express_quotes (
  id                  uuid primary key default gen_random_uuid(),
  company_name        text not null,
  contact_name        text,
  email               text not null,
  phone               text,
  from_location       text,
  to_location         text,
  cargo_type          text,
  cargo_description   text,
  cargo_weight        text,
  cargo_value         text,
  urgency             text, -- same_day | next_day | scheduled
  preferred_date      text,
  special_requirements text,
  status              text not null default 'new', -- new | called | quoted | booked | closed
  assigned_to         text, -- admin/ops team member
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists express_quotes_status_idx   on express_quotes (status);
create index if not exists express_quotes_urgency_idx  on express_quotes (urgency);
create index if not exists express_quotes_created_idx  on express_quotes (created_at desc);

-- Updated_at trigger (shared function reuse)
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists carrier_profiles_updated_at on carrier_profiles;
create trigger carrier_profiles_updated_at
  before update on carrier_profiles
  for each row execute function update_updated_at_column();

drop trigger if exists express_quotes_updated_at on express_quotes;
create trigger express_quotes_updated_at
  before update on express_quotes
  for each row execute function update_updated_at_column();

-- RLS: admin-only read/write (service role bypasses RLS)
alter table carrier_profiles enable row level security;
alter table express_quotes    enable row level security;

-- No public access — all reads/writes go through service role (API routes)
