# WhatsApp Business — Setup Guide

**Status as of 23 October 2026: not production ready.**

This guide takes BootHop from the Meta sandbox it is currently sitting on to sending
real delivery updates to real users on WhatsApp.

Written against the live account, not from documentation — every "current state" claim
below was verified directly against Meta's Graph API on 23 October 2026.

---

## 1. Where you actually are right now

A Graph API call against your configured credentials returns this:

```
display_phone_number:      +1 555-199-1183
verified_name:             "Test Number"
code_verification_status:  NOT_VERIFIED
platform_type:             CLOUD_API
quality_rating:            GREEN
```

> **That is Meta's shared sandbox number, not yours.**
>
> It is handed to every new Meta app automatically. It can only message up to
> **5 pre-registered test recipients**, and it can never be used for production traffic.

Your message templates tell the same story:

| Status | Category | Name |
| --- | --- | --- |
| APPROVED | MARKETING | `jaspers_market_media_carousel_v1` |
| APPROVED | UTILITY | `hello_world` |
| APPROVED | MARKETING | `jaspers_market_image_cta_v1` |
| APPROVED | UTILITY | `jaspers_market_order_confirmation_v1` |
| APPROVED | MARKETING | `jaspers_market_plain_text_v1` |

All five are Meta's demo samples. "Jasper's Market" is Meta's fictional sample business.
**Nothing belonging to BootHop has been submitted.**

### What exists in the codebase

| Piece | State |
| --- | --- |
| `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID` | Set, token valid |
| `WHATSAPP_NUMBER` (+447405746302) | Set — but this is only the click-to-chat number, a *different* number from the API one |
| `/api/webhook/whatsapp` (inbound) | Written — but writes to `whatsapp_messages`, **a table that does not exist** |
| Outbound send function | **Does not exist.** No code anywhere sends a WhatsApp message |

---

## 2. The one rule that governs everything

> **Business-initiated messages must use a pre-approved template.**
>
> You may send free-form text **only** inside a 24-hour window that opens when the
> user messages you first. Outside that window — which is every delivery notification
> BootHop would ever send — it must be an approved template, or Meta rejects the call.

This is why "just send them a WhatsApp" is never a one-day job. Template approval is
a review queue you do not control.

---

## 3. Setup, in order

Each step blocks the ones below it.

### Step 1 — Meta Business verification

Business Manager → **Settings → Business Info → Start Verification**

You will need:

- Legal business name exactly as registered
- Companies House registration number
- A business utility bill or bank statement showing name and address
- A business phone number Meta can call or text

> **Timeline: 2–10 business days.** This is the longest pole. Start it first, today,
> and do the remaining steps while it sits in review.

### Step 2 — Add and verify your real number

WhatsApp Manager → **Phone Numbers → Add phone number**

- The number must **not** be registered to a personal WhatsApp account. If it is,
  delete that account first and wait roughly 24 hours.
- A landline works — choose voice verification.
- After verification, set the display name. Meta reviews this too, and rejects names
  that do not clearly match the verified business.

> **Decision needed:** use +447405746302 (your current click-to-chat number) or a new,
> dedicated one? Using the existing number means losing it as a human-answered line,
> because the API takes it over completely. A separate number is usually the better call.

Once verified, `WHATSAPP_PHONE_NUMBER_ID` changes. **Update it in Vercel env vars.**

### Step 3 — Create BootHop's templates

WhatsApp Manager → **Message Templates → Create Template**

Category matters more than anything else here:

- **UTILITY** — transactional, triggered by a user action. Cheaper. What you want.
- **MARKETING** — promotional. More expensive, and users can opt out of it wholesale.

> **Every template below is UTILITY.** If you label a delivery notification as
> MARKETING you pay more and reach fewer people.

Suggested starting set, mapped to the existing email triggers:

**`match_found`**

```
Hi {{1}}, good news — we found a match for your {{2}} trip on {{3}}.

Agreed price: £{{4}}

Tap below to accept or decline.
```
Button: *Visit website* → `https://www.boothop.com/dashboard`

**`match_accepted`**

```
Your match for {{1}} was accepted at £{{2}}.

Next step: complete your identity verification.
```

**`delivery_confirmed`**

```
Delivery confirmed for {{1}}.

If anything is wrong, you have 24 hours to raise an issue.
```

**`payment_received`**

```
We've received your payment of £{{1}} for {{2}}. Funds are held securely
until delivery is confirmed.
```

> **Approval takes minutes to 24 hours.** Rejections are usually caused by
> promotional phrasing in a UTILITY template, or a variable at the very start
> or end of the message body — Meta disallows both.

### Step 4 — Collect numbers, with real consent

Add to the `trips` table (or wherever you settle user identity — see the open
question about the empty `users` table):

```sql
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS whatsapp_number   text,
  ADD COLUMN IF NOT EXISTS whatsapp_opted_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_opted_in_at timestamptz;
```

> **A required field is not consent.**
>
> Making the number mandatory at signup is fine. Messaging that number is a separate
> permission, and it needs a distinct, unticked checkbox with plain wording:
>
> *"Send me delivery updates on WhatsApp"*
>
> Store the timestamp. If Meta ever queries your number quality, proof of opt-in is
> what you produce. Collecting numbers and messaging without this is what drives a
> quality rating from GREEN to RED, and a RED number gets throttled then blocked.

Store numbers in **E.164** format (`+2348012345678`) — Meta rejects anything else.

### Step 5 — Create the missing table

The inbound webhook already expects this and currently fails on every call:

```sql
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wa_message_id text UNIQUE,
  direction    text NOT NULL CHECK (direction IN ('inbound','outbound')),
  from_number  text,
  to_number    text,
  body         text,
  template_name text,
  status       text,
  raw          jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_whatsapp_messages" ON public.whatsapp_messages
  FOR ALL USING (auth.role() = 'service_role');
```

### Step 6 — Build the send function

Does not exist yet. It belongs in `src/lib/services/whatsapp.ts`, alongside the
existing Telnyx service, and should mirror how `sendPushToEmail()` is structured —
fire-and-forget, never able to break the calling request.

```ts
const GRAPH = 'https://graph.facebook.com/v21.0';

export async function sendWhatsAppTemplate(params: {
  to: string;                 // E.164
  template: string;
  language?: string;          // default 'en'
  variables?: string[];       // fills {{1}}, {{2}}, ... in order
}): Promise<void> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return;

  try {
    const res = await fetch(`${GRAPH}/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: params.to,
        type: 'template',
        template: {
          name: params.template,
          language: { code: params.language ?? 'en' },
          components: params.variables?.length
            ? [{
                type: 'body',
                parameters: params.variables.map((text) => ({ type: 'text', text })),
              }]
            : undefined,
        },
      }),
    });

    if (!res.ok) {
      // Meta returns 200 with an error body in some failure modes, so log both.
      console.error('[whatsapp] send failed', {
        to: params.to,
        template: params.template,
        status: res.status,
        body: await res.text(),
      });
    }
  } catch (e) {
    console.error('[whatsapp] send threw', String(e));
  }
}
```

> **Log the failures.** The Resend client in this codebase swallowed every error for
> months because the SDK returns `{ error }` rather than throwing, and nobody could
> see it. Do not repeat that here.

### Step 7 — Wire it into the existing notification points

The triggers already exist and already send email. WhatsApp goes alongside, never
instead of — email stays the system of record.

| Trigger | File |
| --- | --- |
| Match found | `src/app/api/cron/auto-match/route.ts` |
| Match accepted | `src/app/api/matches/[id]/respond/route.ts` |
| Delivery confirmed | `src/app/api/matches/[id]/confirm-delivery/route.ts` |

---

## 4. Costs

Meta charges per message for template sends, priced by **recipient country** and
**template category**, with UTILITY cheaper than MARKETING.

> **Do not budget from a number written in this document.** Meta has changed WhatsApp
> pricing repeatedly — including a move to per-message pricing — and any figure here
> will age badly. Pull the current rate card from Meta's official pricing page for
> **GB** and **NG**, the two corridors that matter for BootHop, before committing.

Relevant to the decision: Nigeria and the UK sit in different pricing tiers, and most
BootHop notifications touch both sides of a match.

---

## 5. Realistic sequencing

| | Work | Blocked by | Elapsed |
| --- | --- | --- | --- |
| 1 | Start Meta business verification | — | 2–10 days (waiting) |
| 2 | Add + verify real number | Step 1 | ~1 hour |
| 3 | Submit templates | Step 2 | minutes–24h (waiting) |
| 4 | Schema + consent UI | nothing — **can start now** | ~half a day |
| 5 | Send function + wiring | Steps 3, 4 | ~half a day |

> **Start step 1 today.** Everything else is short; the verification queue is what
> actually sets the launch date.

---

## 6. Do push first

Push notifications are **already fully built** for both the website and the mobile
app — `sendPushToEmail()` handles Expo tokens and web-push VAPID correctly, and both
`/api/push/subscribe` and `/api/push/subscribe-mobile` exist and work.

The entire system is disabled by a single missing database column,
`push_subscriptions.updated_at`, which makes every subscription write fail silently.
That is fixed in `supabase/migrations/20261023_missing_columns.sql`.

> Push costs nothing per message, needs no Meta approval, no template review and no
> consent flow. It gives you a second notification channel the same day WhatsApp
> verification is still sitting in a queue.

WhatsApp is the right **second** investment — for a Lagos↔London user base it
comfortably beats SMS on both cost and deliverability. It is not the fast one.
