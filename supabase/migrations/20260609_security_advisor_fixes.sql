-- BootHop — Supabase Security Advisor fixes
-- Addresses all 12 errors and 10 warnings shown in Security Advisor

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. FUNCTION SEARCH PATH MUTABLE (7 warnings)
--    Risk: search_path injection — attacker-controlled schema could shadow builtins
--    Fix:  pin search_path to 'public' on every affected function
-- ══════════════════════════════════════════════════════════════════════════════

-- Dynamically alter every matching function regardless of its argument signature.
-- pg_get_function_identity_arguments returns the full arg list (e.g. "uuid, text")
-- so the ALTER FUNCTION statement is always correct.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT 'public.' || p.proname
        || '(' || pg_get_function_identity_arguments(p.oid) || ')' AS sig
    FROM   pg_proc      p
    JOIN   pg_namespace n ON n.oid = p.pronamespace
    WHERE  n.nspname = 'public'
    AND    p.proname IN (
             'expire_location_requests',
             'log_checkpoint_to_history',
             'can_user_create_delivery',
             'can_user_accept_deliveries',
             'update_user_stripe_status',
             'update_updated_at_column',
             'cleanup_expired_email_login_codes'
           )
  LOOP
    EXECUTE 'ALTER FUNCTION ' || r.sig || ' SET search_path = public';
  END LOOP;
END $$;

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. SECURITY DEFINER — cleanup_expired_email_login_codes (2 warnings)
--    Risk: anonymous users can call a SECURITY DEFINER function, potentially
--          triggering unintended elevated-privilege operations.
--    Fix:  revoke EXECUTE from public and authenticated; keep service_role only
-- ══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT 'public.' || p.proname
        || '(' || pg_get_function_identity_arguments(p.oid) || ')' AS sig
    FROM   pg_proc      p
    JOIN   pg_namespace n ON n.oid = p.pronamespace
    WHERE  n.nspname = 'public'
    AND    p.proname = 'cleanup_expired_email_login_codes'
  LOOP
    EXECUTE 'REVOKE EXECUTE ON FUNCTION ' || r.sig || ' FROM PUBLIC';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION ' || r.sig || ' FROM authenticated';
  END LOOP;
END $$;
-- The cron job runs as service_role so this function still works from your cron.

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. RLS POLICY ALWAYS TRUE on notifications (1 warning)
--    Risk: every authenticated user can read every notification row
--    Fix:  scope to the owning user_id
-- ══════════════════════════════════════════════════════════════════════════════

-- Drop the permissive catch-all policy
DROP POLICY IF EXISTS "service-role-notifications" ON public.notifications;
DROP POLICY IF EXISTS "notifications_all"           ON public.notifications;
DROP POLICY IF EXISTS "enable_all_notifications"    ON public.notifications;

-- Service role (backend) gets full access
CREATE POLICY "service_role_notifications" ON public.notifications
  FOR ALL USING (auth.role() = 'service_role');

-- Users can only read their own notifications
CREATE POLICY "user_own_notifications" ON public.notifications
  FOR SELECT USING (
    user_id::text = (auth.jwt() ->> 'email')
    OR user_id::text = auth.uid()::text
  );

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. RLS DISABLED TO PUBLIC (12 errors)
--    Tables that have RLS disabled — anyone with the anon key can read all rows.
--    Since all BootHop API routes use the service_role key, enabling RLS with a
--    service_role bypass policy keeps the app working while blocking anon access.
-- ══════════════════════════════════════════════════════════════════════════════

-- Helper: enable RLS and add a service_role bypass on every affected table.
-- Pattern repeated for each table shown in the Security Advisor.

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_profiles" ON public.profiles;
CREATE POLICY "service_role_profiles" ON public.profiles
  FOR ALL USING (auth.role() = 'service_role');
-- Allow users to read their own profile (needed for mobile anon-key realtime)
DROP POLICY IF EXISTS "user_own_profile" ON public.profiles;
CREATE POLICY "user_own_profile" ON public.profiles
  FOR SELECT USING (email = (auth.jwt() ->> 'email'));

-- trips / travel_listings (whichever name the table uses)
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_trips" ON public.trips;
CREATE POLICY "service_role_trips" ON public.trips
  FOR ALL USING (auth.role() = 'service_role');

-- delivery_requests
ALTER TABLE public.delivery_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_delivery_requests" ON public.delivery_requests;
CREATE POLICY "service_role_delivery_requests" ON public.delivery_requests
  FOR ALL USING (auth.role() = 'service_role');

-- matches (in case it was also flagged)
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_matches" ON public.matches;
CREATE POLICY "service_role_matches" ON public.matches
  FOR ALL USING (auth.role() = 'service_role');

-- notifications (already handled above — just ensure RLS is on)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- email_login_codes / otp_codes
ALTER TABLE public.email_login_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_email_login_codes" ON public.email_login_codes;
CREATE POLICY "service_role_email_login_codes" ON public.email_login_codes
  FOR ALL USING (auth.role() = 'service_role');

-- barcode_scans (if present)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='barcode_scans') THEN
    ALTER TABLE public.barcode_scans ENABLE ROW LEVEL SECURITY;
    EXECUTE 'DROP POLICY IF EXISTS "service_role_barcode_scans" ON public.barcode_scans';
    EXECUTE 'CREATE POLICY "service_role_barcode_scans" ON public.barcode_scans FOR ALL USING (auth.role() = ''service_role'')';
  END IF;
END $$;

-- device_fingerprints (if present)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='device_fingerprints') THEN
    ALTER TABLE public.device_fingerprints ENABLE ROW LEVEL SECURITY;
    EXECUTE 'DROP POLICY IF EXISTS "service_role_device_fingerprints" ON public.device_fingerprints';
    EXECUTE 'CREATE POLICY "service_role_device_fingerprints" ON public.device_fingerprints FOR ALL USING (auth.role() = ''service_role'')';
  END IF;
END $$;

-- kyc_sessions (if present)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='kyc_sessions') THEN
    ALTER TABLE public.kyc_sessions ENABLE ROW LEVEL SECURITY;
    EXECUTE 'DROP POLICY IF EXISTS "service_role_kyc_sessions" ON public.kyc_sessions';
    EXECUTE 'CREATE POLICY "service_role_kyc_sessions" ON public.kyc_sessions FOR ALL USING (auth.role() = ''service_role'')';
  END IF;
END $$;

-- business_jobs (if present)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='business_jobs') THEN
    ALTER TABLE public.business_jobs ENABLE ROW LEVEL SECURITY;
    EXECUTE 'DROP POLICY IF EXISTS "service_role_business_jobs" ON public.business_jobs';
    EXECUTE 'CREATE POLICY "service_role_business_jobs" ON public.business_jobs FOR ALL USING (auth.role() = ''service_role'')';
  END IF;
END $$;

-- customs_estimates (if present)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='customs_estimates') THEN
    ALTER TABLE public.customs_estimates ENABLE ROW LEVEL SECURITY;
    EXECUTE 'DROP POLICY IF EXISTS "service_role_customs_estimates" ON public.customs_estimates';
    EXECUTE 'CREATE POLICY "service_role_customs_estimates" ON public.customs_estimates FOR ALL USING (auth.role() = ''service_role'')';
  END IF;
END $$;

-- instagram_pipeline / social_pipeline (if present)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='instagram_pipeline') THEN
    ALTER TABLE public.instagram_pipeline ENABLE ROW LEVEL SECURITY;
    EXECUTE 'DROP POLICY IF EXISTS "service_role_instagram_pipeline" ON public.instagram_pipeline';
    EXECUTE 'CREATE POLICY "service_role_instagram_pipeline" ON public.instagram_pipeline FOR ALL USING (auth.role() = ''service_role'')';
  END IF;
END $$;
