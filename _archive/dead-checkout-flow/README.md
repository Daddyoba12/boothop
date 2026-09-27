# Archived — dead legacy checkout flow

Moved out of `src/app` on 2026-09-27 during a pre-launch audit. This code is
fully superseded and was unreachable — nothing in the app links to `/checkout/[matchId]`,
and it can't function anyway: it calls `supabase.auth.getUser()` directly, but this app
uses custom JWT session cookies only (see `CLAUDE.md`), never Supabase Auth. It also
queries a `delivery_matches` table with `hooper_pays`/`agreed_price` columns from an
older schema.

**The real, currently-used checkout flow** is:
`/kyc?matchId=...` page → `POST /api/payment/create-checkout` → Stripe-hosted
Checkout Session (escrow via `capture_method: 'manual'`, platform fee, insurance,
premium tracking, signup-credit redemption, traveller Connect-verification guard) →
redirects to `/payment/success` on completion.

Safe to delete this folder entirely once confirmed nobody needs to reference the
old implementation.
