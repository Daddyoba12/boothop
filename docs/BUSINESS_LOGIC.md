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
  → agreed                      (both parties accept price)
  → committed                   (both parties sign T&Cs)
  → kyc_pending                 (at least one party started KYC)
  → kyc_complete                (both parties verified by Stripe Identity)
  → payment_processing          (sender submitted payment + escrow secured)
  → locked_pending_compliance   (escrow confirmed — awaiting sender declaration)
  → compliance_in_progress      (declaration submitted — under review)
  → sealed_for_transit          (compliance approved — shipment locked for handover)
  → active                      (handover confirmed, both parties have contact details)
  → delivery_confirmed          (both parties clicked confirm delivery)
  → completed                   (admin released payment to carrier)
```

**Side states** (can occur from multiple points):
- `cancelled` — cancelled before payment
- `cancellation_requested` — cancelled after payment_processing
- `compliance_rejected` — declaration failed compliance review → full refund
- `compliance_timeout` — sender did not complete declaration within SLA → refund
- `suspended_pending_review` — shipment details changed after declaration submitted → ops review
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
   - Status → `locked_pending_compliance`
   - Sets `payment_confirmed_at`, `compliance_locked_at`
   - Writes `SHIPMENT_LOCKED` chain-of-custody event
   - Emails **sender**: "Complete your item declaration" (48h deadline)
   - Emails **traveller**: "Payment confirmed — compliance check underway"
   - Contact details are **not** released yet

3. Sender completes and submits item declaration via `/api/matches/[id]/declare` (POST)
   - Status → `compliance_in_progress`; sets `compliance_review_started_at`
   - Writes `DECLARATION_SUBMITTED` + `COMPLIANCE_REVIEW_STARTED` events
   - Auto-check runs immediately:
     - Clean (no flags, low value) → auto-approved → Status → `active`, contacts released
     - Flagged (currency, meds, jewellery, high value) → admin emailed for manual review
     - Prohibited (weapons, hazardous) → auto-rejected → `compliance_rejected`, full refund

4. Admin approves via `POST /api/admin/compliance/approve`
   - Status → `active`; sets `sealed_at`
   - Writes `COMPLIANCE_APPROVED`, `SHIPMENT_SEALED`, `SHIPMENT_LOCK_OVERRIDDEN` (audited) events
   - Emails **both parties** with each other's contact details

5. Both parties now see contact details on the match page and can coordinate directly

---

## Shipment Lock Rule (Compliance Gate)

Once admin confirms payment received, the match does **not** move directly to `active`. Instead it enters a compliance gate before the shipment is sealed for transit.

### Sub-State Model

```
payment_processing
  → locked_pending_compliance   (escrow secured — sender must now submit item declaration)
      → compliance_in_progress  (declaration submitted — AI + optional admin review running)
          → sealed_for_transit  (COMPLIANCE_APPROVED — shipment locked, handover can proceed)
          → compliance_rejected (COMPLIANCE_REJECTED → cancelled_refunded)
          → compliance_timeout  (COMPLIANCE_TIMEOUT → cancelled_refunded or escalated)
      → suspended_pending_review (any shipment detail changed after declaration submitted)
```

### Declaration Draft Window

- Before the sender submits their declaration it is in `DRAFT` state.
- The sender may freely edit a DRAFT declaration — item description, dimensions, value — without triggering any suspension or penalty.
- Once the sender explicitly **submits** the declaration it becomes **immutable**.
- Any attempt to modify shipment details (item, destination, traveller assignment) **after submission** automatically transitions the match to `suspended_pending_review` and notifies BootHop operations.
- Only an authorised administrator can resolve a suspension — either reinstating the original shipment state or requiring cancellation and rebooking.

### Compliance SLA Timers

| Step | Timer | On Expiry |
|------|-------|-----------|
| Sender submits declaration | **48 hours** from `locked_pending_compliance` | Auto-cancel → `compliance_timeout` → full refund to sender |
| Compliance review completes | **24 hours** from `compliance_in_progress` | Escalate to admin review queue |
| Traveller inspection + seal activation | **48 hours** from `sealed_for_transit` | Admin notified; match may be escalated or cancelled |

Reminder notifications are sent to the sender at **24h** and **6h** before each SLA expires.

### Escrow Handling on Each Outcome

| Outcome | Escrow Action |
|---------|--------------|
| `compliance_approved` → `sealed_for_transit` | Escrow remains held until delivery confirmed + payment released by admin |
| `compliance_rejected` | Full refund to sender. Platform review fee (if applicable) retained per policy. No fee to traveller. |
| `compliance_timeout` (sender never submitted) | Full refund to sender. No penalty to traveller — match returns to pool for re-matching if traveller wishes. |
| Traveller backs out during compliance (before sealing) | Shipment returns to `locked_pending_compliance` for re-matching. Escrow held. Sender notified. |
| `suspended_pending_review` resolved by admin — reinstate | Match returns to state it was in before suspension. |
| `suspended_pending_review` resolved by admin — cancel | Full cancellation. Refund per cancellation policy. |

> **Escrow and refund amounts** (platform fee retention, partial refunds, processing fees) are defined in the separate Escrow & Dispute Policy document. This must be explicitly finalised before implementation — the state machine does not hardcode amounts.

### Admin Override

- Only an authorised administrator can unlock, override, or manually transition any `locked_pending_compliance`, `compliance_in_progress`, or `suspended_pending_review` state.
- All override actions are **audited** — recorded as chain-of-custody events (see below).
- Admin actions are protected by `ADMIN_SECRET` and must pass through `/api/admin/compliance/` routes.

### Chain-of-Custody Events

Every compliance-related state transition is recorded as an immutable event in the `shipment_events` table:

| Event Type | Triggered By |
|-----------|-------------|
| `SHIPMENT_LOCKED` | Admin confirms payment → match enters `locked_pending_compliance` |
| `DECLARATION_DRAFT_SAVED` | Sender saves a draft declaration |
| `DECLARATION_SUBMITTED` | Sender submits declaration (makes it immutable) |
| `COMPLIANCE_REVIEW_STARTED` | AI compliance engine begins review |
| `COMPLIANCE_APPROVED` | Review passed → `sealed_for_transit` |
| `COMPLIANCE_REJECTED` | Review failed → `compliance_rejected` |
| `COMPLIANCE_TIMEOUT` | SLA expired without submission → `compliance_timeout` |
| `SHIPMENT_SEALED` | Traveller activates seal → `active` |
| `SHIPMENT_SUSPENDED` | Post-submission change detected → `suspended_pending_review` |
| `SHIPMENT_LOCK_OVERRIDDEN` | Admin manually overrides lock/suspension (audited) |
| `SHIPMENT_CANCELLED_TIMEOUT` | Match cancelled due to SLA expiry |

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
| `locked_pending_compliance` | Sender may request cancel → full refund (escrow not yet earned) |
| `compliance_in_progress` | Cancel blocked — declaration under review. Sender must wait for outcome. |
| `compliance_rejected` | Auto-cancelled, full refund per escrow policy |
| `compliance_timeout` | Auto-cancelled, full refund per escrow policy |
| `suspended_pending_review` | Admin resolves — either reinstate or cancel with refund per policy |
| `sealed_for_transit`, `active`, `delivery_confirmed`, `disputed`, `completed` | Cannot cancel — shown dispute option instead |

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
| `/api/cron/compliance-sla` | Every hour | Check compliance SLA timers — send reminders at 24h/6h remaining, auto-cancel at 48h expiry, escalate overdue reviews |

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
| `item_declarations` | Sender item declarations per match (DRAFT → SUBMITTED, immutable after submit) |
| `shipment_events` | Immutable chain-of-custody audit log — one row per compliance/lock event |

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
