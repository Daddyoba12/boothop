# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start development server
npm run build      # Prebuild (bumps SW version) + next build
npm run start      # Start production server
npm run lint       # Run ESLint
```

There is no test suite — manual testing via the dev server is the workflow.

## Architecture Overview

BootHop is a **peer-to-peer delivery marketplace** built on **Next.js 16 (App Router) + Supabase + Tailwind CSS 4**. It connects:
- **Hoopers** (senders) who need goods transported
- **Booters** (travelers) who carry goods for a fee

### Auth Model

**Custom JWT cookies only — never Supabase Auth.**

- Cookie: `boothop_session` (signed with `APP_SESSION_SECRET`, 7-day TTL)
- Payload: `{ email, verified: true }`
- Helper: `getAppSession(cookieStore)` in `src/lib/auth/session.ts`
- OTP codes: 4 digits + 1 letter, SHA-256 hashed, stored in `email_login_codes` table
- Business portal uses a separate cookie: `boothop_biz_session`
- Middleware protects `/dashboard`, `/journeys/create`, `/profile`

### Database

Supabase PostgreSQL with **all RLS policies set to service role only** — the browser client (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) is limited; all meaningful DB access goes through the server-side admin client (`SUPABASE_SERVICE_ROLE_KEY`) in `src/lib/supabase/admin.ts`.

**Supabase join quirk:** joins return arrays even for single rows — always unwrap with `Array.isArray(x) ? x[0] : x`.

### Match State Machine (Core Business Logic)

```
matched → agreed → committed → kyc_pending → kyc_complete
  → payment_processing → active → delivery_confirmed → completed

Side states: cancelled | cancellation_requested | disputed
```

Full state transition logic and cancellation rules are documented in `docs/BUSINESS_LOGIC.md`.

### Payment Model

**Stripe is used for KYC (Stripe Identity) only — there is no Stripe payment processing.**

Payments are manual:
1. Sender submits payment info → status: `payment_processing`
2. Admin receives email alert → clicks "Confirm Payment Received" link
3. Admin confirms → status: `active`, both parties receive each other's email
4. After delivery confirmed by both → admin clicks "Release Payment" link → `completed`

Admin actions are protected by `ADMIN_SECRET`, passed as `?adminKey=` (GET) or `x-admin-key` header (POST).

### Email System

All transactional email via **Resend**. **Never instantiate `new Resend(...)` at module level** — always inside the function body. All email helpers are in `src/lib/email/`.

Action tokens (`action_tokens` table) power one-click email links for accept/decline/confirm-delivery flows.

### Cron Jobs

Three scheduled endpoints under `src/app/api/cron/`, all protected by `CRON_SECRET`:
- `/auto-match` — match unmatched trips (runs every 6h)
- `/delivery-reminders` — send delivery confirmation nudges (6h)
- `/expire-matches` — cancel stale matches (3h)

### Next.js Route Handler Rules

**Params must be awaited** — Next.js 15+ changed dynamic route params to `Promise`. Pattern:
```ts
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

### Message Filtering

In-app chat (`src/app/api/messages/`) filters content for phone numbers, email addresses, and social media handles to keep communication in-platform until payment is confirmed.

### Business Portal

A separate sub-application under `src/app/business/` and `src/app/api/business/` for businesses to post delivery jobs. It has its own auth flow, compliance checking, and driver assignment. Largely independent from the peer-to-peer flows above.

## Key Environment Variables

| Variable | Purpose |
|---|---|
| `APP_SESSION_SECRET` | Signs JWT session cookies |
| `ADMIN_SECRET` | Protects admin API routes |
| `CRON_SECRET` | Protects cron endpoints |
| `RESEND_API_KEY` | Transactional email |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side DB access (bypasses RLS) |
| `STRIPE_SECRET_KEY` | Stripe Identity KYC only |
| `STRIPE_IDENTITY_WEBHOOK_SECRET` | Stripe webhook verification |
| `NEXT_PUBLIC_APP_URL` | Base URL used in email links |
| `ADMIN_EMAIL` / `SUPPORT_EMAIL` | Admin and support inboxes |
| `WHATSAPP_NUMBER` | WhatsApp contact number in international format (e.g. `447506553755`). Used by `/api/whatsapp` redirect — never exposed to the browser. Add to Vercel env vars to change the number without touching code. |

## Reference Docs

- `docs/BUSINESS_LOGIC.md` — Authoritative developer reference: all flows, state machine, DB tables, email system, RLS model
- `docs/PROCESS_FLOW.md` — Plain-English step-by-step user journey
- `docs/SCREENS_AND_EMAILS.md` — UI screens and email templates
- `USER_GUIDE.md` — End-user guide (cancellations, disputes, refunds, customs)
