-- 2026-10-23 — Make the `users` table actually usable.
--
-- Nothing in the codebase ever inserted into `users`. Verified with a
-- multiline search across src/: no .insert(), no .upsert(), anywhere. The
-- table has 0 rows, and so does auth.users.
--
-- Consequence chain:
--   /api/stripe/create-connect-account does
--       .from('users').select(...).eq('email', session.email).single()
--       if (!user) return 404 'User not found'
--   → no traveller can start Stripe Connect onboarding
--   → users.can_receive_payments is never true
--   → the payout guard in matches/[id]/respond is commented out "until
--     traveller onboarding is complete"
--   → no payment has ever reached payout.
--
-- /api/auth/verify-code now upserts a row on every successful login. That
-- upsert uses onConflict:'email', which REQUIRES the unique index below.

-- ── 1. Unique index on email ───────────────────────────────────────────────
-- Required by the upsert. Built on DISTINCT values so it cannot fail on
-- duplicates even if rows are added before this runs.
CREATE UNIQUE INDEX IF NOT EXISTS users_email_key
  ON public.users (email);

-- ── 2. Backfill everyone who has already used the platform ─────────────────
-- Without this, existing travellers still cannot onboard — they would each
-- have to log in again first. Sources: every email that has posted a trip or
-- requested a login code.
--
-- users.id has no default, so gen_random_uuid() supplies it.
-- ON CONFLICT DO NOTHING makes this safe to re-run.
INSERT INTO public.users (id, email)
SELECT gen_random_uuid(), e.email
  FROM (
         SELECT DISTINCT lower(trim(email)) AS email FROM public.trips             WHERE email IS NOT NULL
         UNION
         SELECT DISTINCT lower(trim(email)) AS email FROM public.email_login_codes WHERE email IS NOT NULL
       ) AS e
 WHERE e.email <> ''
ON CONFLICT (email) DO NOTHING;

-- ── Verify ─────────────────────────────────────────────────────────────────
-- Expect one row per distinct platform email, and no duplicates.
SELECT count(*) AS user_rows FROM public.users;
SELECT email, count(*) FROM public.users GROUP BY email HAVING count(*) > 1;
