-- ================================================================
-- BootHop — Custom Auth Table (NEW — run this in Supabase SQL editor)
-- Adds email_login_codes table for the custom verification code system
-- Does NOT modify any existing tables
-- ================================================================

create extension if not exists pgcrypto;

create table if not exists public.email_login_codes (
  id              uuid primary key default gen_random_uuid(),
  email           text not null,
  code            text not null,
  code_hash       text not null,
  expires_at      timestamptz not null,
  used            boolean not null default false,
  attempts        integer not null default 0,
  max_attempts    integer not null default 5,
  created_at      timestamptz not null default now(),
  used_at         timestamptz,
  ip_address      inet,
  user_agent      text,
  purpose         text not null default 'login',
  journey_payload jsonb,
  metadata        jsonb not null default '{}'::jsonb
);

create index if not exists idx_email_login_codes_email   on public.email_login_codes (email);
create index if not exists idx_email_login_codes_expires on public.email_login_codes (expires_at);
create index if not exists idx_email_login_codes_used    on public.email_login_codes (used);

alter table public.email_login_codes enable row level security;

create policy "service-role-only-select-email-login-codes"
  on public.email_login_codes for select
  using (auth.role() = 'service_role');

create policy "service-role-only-insert-email-login-codes"
  on public.email_login_codes for insert
  with check (auth.role() = 'service_role');

create policy "service-role-only-update-email-login-codes"
  on public.email_login_codes for update
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Auto-cleanup function (optional — call via pg_cron or scheduled job)
create or replace function public.cleanup_expired_email_login_codes()
returns void language sql security definer as $$
  delete from public.email_login_codes
  where expires_at < now() - interval '1 day';
$$;
