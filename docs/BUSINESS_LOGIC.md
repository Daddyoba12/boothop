# BootHop — Developer Business Logic Reference

## Overview

BootHop is a peer-to-peer delivery platform that connects **Hoopers** (senders who want goods moved between cities) with **Booters** (travellers who carry goods for a fee). The platform handles matching, identity verification, manual payment processing, delivery confirmation, disputes, ratings, and in-app messaging.

---

## Terminology

| Term | Meaning |
|------|---------|
| **Hooper** | The sender — person who wants goods delivered |
| **Booter** | The carrier — traveller who carries the goods |
| **Match** | A confirmed pairing between a Hooper and a Booter |
| **Trip** | A journey listing posted by either party |
| **Agreed price** | Final delivery fee both parties accepted |
| **Action token** | One-time UUID stored in DB used for email link auth |

---

## Authentication

- **No Supabase Auth** — the app uses a custom JWT cookie session
- Cookie name: `boothop_session`
- Signed/verified via `APP_SESSION_SECRET` using `jsonwebtoken`
- Session payload: `{ email: string, verified: true }`
- Helper: `getAppSession(cookieStore)` in `src/lib/auth/session.ts`
- OTP login: user enters email → receives 6-digit code via Resend → verified → JWT cookie set
- Session duration: 7 days
- All protected API routes call `getAppSession` and check `session?.email`

---

## Match State Machine

Matches progress through a strict linear status pipeline:

```
matched
  → agreed              (both parties accept price)
  → committed           (both parties sign T&Cs)
  → kyc_pending         (at least one party started KYC)
  → kyc_complete        (both parties verified by Stripe Identity)
  → payment_processing  (sender submitted payment request)
  → active              (admin confirmed payment received)
  → delivery_confirmed  (both parties clicked confirm delivery)
  → completed           (admin released payment to carrier)
```

**Side states** (can occur from multiple points):
- `cancelled` — cancelled before payment
- `cancellation_requested` — cancelled after payment_processing
- `disputed` — dispute raised during active/delivery_confirmed

---

## Trip & Match Creation

1. User registers via OTP → session cookie set
2. User posts a trip (type: `travel` or `send`) → saved to `trips` table
3. Auto-match cron (`/api/cron/auto-match`) runs every 6h — matches trips by city pair and date proximity
4. Express interest (`/api/matches/express-interest`) creates a match record at `matched` status
5. Both parties receive email to accept/decline via action token links

---

## Price Negotiation

- Either party can propose a price via `/api/matches/send-negotiation-email`
- Accepting sets `sender_accepted` / `traveler_accepted` flags
- When both accept → status advances to `agreed`

---

## Terms & Commitment

- Both parties must sign T&Cs before proceeding
- `/api/terms/accept` inserts into `terms_acceptance` table (unique on match_id + email)
- When both have signed → status advances to `committed`

---

## KYC (Identity Verification)

- Uses **Stripe Identity** for document verification
- `/api/kyc/create-session` creates a Stripe verification session
  - Passes user `email` in metadata (NOT Supabase user_id)
  - Saves session ID to `sender_kyc_session_id` or `traveler_kyc_session_id`
  - Advances match to `kyc_pending`
- Webhook at `/api/webhooks/stripe-identity` listens for `identity.verification_session.verified`
  - Looks up match by email in metadata
  - Updates `sender_kyc_status` or `traveler_kyc_status` to `verified`
  - When **both verified** → status advances to `kyc_complete`, emails both parties
- KYC statuses: `none` → `pending` → `verified` / `failed`

---

## Payment Flow (Manual — No Stripe Payments)

> Payment is processed manually by admin. Users never see this — it looks like a normal payment system.

1. Sender submits payment request via `/api/payment/request`
   - Stores `goods_value`, `insurance_fee` on match
   - Status → `payment_processing`
   - Emails sender: "We received your request, our team will contact you"
   - Emails `admin@boothop.com`: rich HTML alert with match details + green **Confirm Payment Received** button

2. Admin clicks confirm button (email link → `/api/admin/confirm-payment?matchId=X&adminKey=SECRET`)
   - Status → `active`
   - Sets `payment_confirmed_at`
   - Emails **both parties** with each other's contact details (email address)

3. Both parties now see contact details on the match page and can coordinate directly

---

## Delivery Confirmation

- Cron at `/api/cron/delivery-reminders` runs every 6h
- Finds all `active` matches and sends reminder emails
- Carrier gets: one-click **"I delivered it"** link
- Sender gets: one-click **"I received it"** link
- Links go to `/api/auth/confirm-action?token=X`
- When **both confirmed**:
  - Status → `delivery_confirmed`
  - Admin emailed to release payment to carrier
  - Both parties emailed "delivery complete"

---

## Payment Release (Manual)

- Admin receives email alert when delivery is confirmed
- Admin clicks **Release Payment** link → `/api/admin/release-payment?matchId=X&adminKey=SECRET`
- Status → `completed`
- Sets `payment_released_at`
- **Rating request emails** sent to both parties

---

## Cancellation Logic

| Status at cancellation | Outcome |
|------------------------|---------|
| `matched`, `agreed`, `committed`, `kyc_pending`, `kyc_complete` | Immediate cancel, no penalty |
| `payment_processing` | Status → `cancellation_requested`, admin emailed, sender told 90% refund in 3–5 days |
| `active`, `delivery_confirmed`, `disputed`, `completed` | Cannot cancel — shown dispute option instead |

---

## Disputes

- Raised via `/api/disputes/create` (active or delivery_confirmed matches only)
- Stored in `disputes` table with reason, description, raised_by
- Match status → `disputed`
- Admin and support emailed immediately
- Raiser gets acknowledgement email
- Admin resolves via hub or email link → `/api/admin/disputes/resolve`
- Resolutions: `pay_carrier` / `refund_sender` / `split` / `no_action`
- Both parties emailed the decision

---

## Ratings

- Available when match is `completed` or `delivery_confirmed`
- POST `/api/matches/[id]/rate` with `{ rating: 1-5, comment? }`
- Stored in `ratings` table (unique on match_id + reviewer_email)
- `reviewee_email` stored for profile aggregation
- Triggered by rating request email sent automatically when admin releases payment

---

## In-App Messaging

- Available when match is `active`, `delivery_confirmed`, or `disputed`
- Messages stored in `match_messages` table
- Content filter blocks: phone numbers (10+ digits), email addresses, WhatsApp, Telegram, Signal, Snapchat, Instagram, Facebook, Messenger
- Flagged messages are **still delivered** but admin is silently alerted
- Max message length: 1000 characters
- GET `/api/messages/list?matchId=X` — returns all messages ordered by time
- POST `/api/messages/send` — sends a message

---

## Admin Hub

- URL: `/admin/hub?adminKey=YOUR_ADMIN_SECRET`
- Protected by `ADMIN_SECRET` env var on all API routes
- Three tabs:
  - **Payments** — shows `payment_processing` matches (confirm received) + `delivery_confirmed` matches (release to carrier)
  - **Disputes** — shows open disputes with resolve modal
  - **Refunds** — shows `cancellation_requested` matches with refund amounts

---

## Cron Jobs

> Vercel Hobby plan only supports daily crons. Use **cron-job.org** (free) to call these URLs on schedule.

| Endpoint | Recommended Schedule | Purpose |
|----------|---------------------|---------|
| `/api/cron/auto-match` | Every 6 hours | Match unmatched trips by city pair |
| `/api/cron/delivery-reminders` | Every 6 hours | Send confirm delivery reminders to active matches |
| `/api/cron/expire-matches` | Every 3 hours | Cancel stale matches (agreed/committed >12h, kyc_pending >72h) |

All cron endpoints are protected — they check for `CRON_SECRET` header or can be restricted by IP.

---

## Email System

All emails sent via **Resend**. The `Resend` client is always instantiated **inside** the function (never at module level — causes Vercel build crash).

| File | Emails sent |
|------|------------|
| `sendKycEmail.ts` | KYC verified (single party), both KYC verified |
| `sendPaymentEmail.ts` | Admin payment alert, payment request confirmed, contact details released |
| `sendDeliveryEmail.ts` | Carrier delivery reminder, sender receipt reminder, admin delivery confirmed, delivery complete |
| `sendDisputeEmail.ts` | Dispute raised (admin), dispute acknowledged (raiser), dispute resolved (both parties) |
| `sendRatingEmail.ts` | Rating request (both parties, on payment release) |

**From address**: `BootHop <noreply@boothop.com>` (set via `AUTH_FROM_EMAIL`)
**Admin address**: `admin@boothop.com` (set via `ADMIN_EMAIL`)
**Support address**: `support@boothop.com` (set via `SUPPORT_EMAIL`)

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `trips` | Journey listings (travel or send type) |
| `matches` | Pairings between sender and traveller trips |
| `terms_acceptance` | Records of T&C sign-offs per match per user |
| `action_tokens` | One-time tokens for email link actions (accept, decline, confirm delivery) |
| `disputes` | Dispute records linked to matches |
| `ratings` | Star ratings per match per reviewer |
| `match_messages` | In-app chat messages per match |

---

## Key Environment Variables

| Variable | Purpose |
|----------|---------|
| `APP_SESSION_SECRET` | Signs JWT session cookies |
| `ADMIN_SECRET` | Protects all admin API routes and email links |
| `RESEND_API_KEY` | Transactional email sending |
| `AUTH_FROM_EMAIL` | From address for all emails |
| `ADMIN_EMAIL` | Admin inbox for alerts |
| `SUPPORT_EMAIL` | Support inbox for dispute alerts |
| `NEXT_PUBLIC_APP_URL` | Base URL used in email links |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public key (client-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side, bypasses RLS) |
| `STRIPE_SECRET_KEY` | Stripe secret (KYC only — no payment processing) |
| `STRIPE_IDENTITY_WEBHOOK_SECRET` | Stripe webhook signature verification |

---

## Row Level Security

All tables have RLS enabled with a single policy:
```sql
using (auth.role() = 'service_role')
```
This means **only the server-side admin client** (`createSupabaseAdminClient`) can read/write data. The browser-side Supabase client cannot access any table directly — all data access goes through Next.js API routes.

---

## Important Implementation Notes

1. **Never use Supabase Auth** — the app uses custom JWT cookies. `supabase.auth.getUser()` will not work.
2. **Never instantiate Resend at module level** — always inside the function body.
3. **Stripe is only for KYC** — no Stripe payment processing. Payment is 100% manual via admin email.
4. **`params` in route handlers must be awaited** — Next.js 15 changed `params` to a Promise: `const { id } = await params`
5. **Supabase joins return arrays** — when using `relation:foreign_key(cols)` in select, the result is an array even for single rows. Always handle with `Array.isArray(x) ? x[0] : x`.
6. **Contact details are private** — other party's email is only revealed after admin confirms payment (status = `active`).
7. **Admin actions require `ADMIN_SECRET`** — passed as `?adminKey=` in GET links or `x-admin-key` header in POST requests.
