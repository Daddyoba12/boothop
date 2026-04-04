-- ================================================================
-- BootHop — Existing Supabase Tables
-- Derived from src/lib/supabase.types.ts
-- ================================================================

-- 1. PROFILES
create table if not exists public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  email                 text not null,
  full_name             text not null,
  user_type             text not null check (user_type in ('booter', 'hooper')),
  phone                 text,
  avatar_url            text,
  bio                   text,
  is_verified           boolean not null default false,
  verification_status   text not null default 'pending' check (verification_status in ('pending', 'verified', 'rejected')),
  rating                numeric not null default 0,
  total_deliveries      integer not null default 0,
  completed_deliveries  integer not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- 2. JOURNEYS
create table if not exists public.journeys (
  id                    uuid primary key default gen_random_uuid(),
  booter_id             uuid not null references public.profiles(id) on delete cascade,
  from_city             text not null,
  from_country          text not null,
  to_city               text not null,
  to_country            text not null,
  departure_date        date not null,
  arrival_date          date not null,
  flexible_until        date,
  available_space_kg    numeric not null,
  max_dimensions        text,
  excludes              text[],
  accepts_only          text[],
  price_per_delivery    numeric,
  status                text not null default 'draft' check (status in ('draft','active','in_progress','completed','cancelled')),
  delivery_matches      integer not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- 3. DELIVERY REQUESTS
create table if not exists public.delivery_requests (
  id                        uuid primary key default gen_random_uuid(),
  hooper_id                 uuid not null references public.profiles(id) on delete cascade,
  item_name                 text not null,
  item_description          text not null,
  item_category             text,
  item_weight_kg            numeric,
  item_dimensions           text,
  item_value_currency       text not null default 'GBP',
  item_value_amount         numeric,
  pickup_city               text not null,
  pickup_country            text not null,
  delivery_city             text not null,
  delivery_country          text not null,
  preferred_pickup_date     date not null,
  flexible_until            date not null,
  is_international          boolean not null default false,
  requires_customs          boolean not null default false,
  special_instructions      text,
  offered_price             numeric not null,
  status                    text not null default 'draft' check (status in ('draft','open','matched','in_transit','delivered','cancelled')),
  urgency                   text not null default 'normal' check (urgency in ('normal','urgent')),
  item_photos               text[],
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- 4. DELIVERY MATCHES
create table if not exists public.delivery_matches (
  id                            uuid primary key default gen_random_uuid(),
  journey_id                    uuid not null references public.journeys(id) on delete cascade,
  request_id                    uuid not null references public.delivery_requests(id) on delete cascade,
  booter_id                     uuid not null references public.profiles(id),
  hooper_id                     uuid not null references public.profiles(id),
  agreed_price                  numeric not null,
  booter_fee_percentage         numeric not null,
  hooper_fee_percentage         numeric not null,
  hooper_pays                   numeric not null,
  booter_receives               numeric not null,
  platform_fee                  numeric not null,
  payment_status                text not null default 'pending' check (payment_status in ('pending','escrowed','released','refunded')),
  stripe_payment_intent_id      text,
  status                        text not null default 'pending' check (status in ('pending','accepted','in_transit','completed','disputed','cancelled')),
  booter_confirmed_delivery     boolean not null default false,
  hooper_confirmed_receipt      boolean not null default false,
  hooper_confirmed_condition    boolean not null default false,
  booter_confirmed_at           timestamptz,
  hooper_confirmed_at           timestamptz,
  payment_released_at           timestamptz,
  customs_declaration_accepted  boolean not null default false,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);

-- 5. MESSAGES
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid not null references public.delivery_matches(id) on delete cascade,
  sender_id   uuid not null references public.profiles(id),
  receiver_id uuid not null references public.profiles(id),
  message     text not null,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- 6. RATINGS
create table if not exists public.ratings (
  id                    uuid primary key default gen_random_uuid(),
  match_id              uuid not null references public.delivery_matches(id) on delete cascade,
  reviewer_id           uuid not null references public.profiles(id),
  reviewee_id           uuid not null references public.profiles(id),
  rating                integer not null check (rating between 1 and 5),
  review                text,
  communication_rating  integer check (communication_rating between 1 and 5),
  reliability_rating    integer check (reliability_rating between 1 and 5),
  created_at            timestamptz not null default now()
);
