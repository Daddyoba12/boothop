# BootHop Compliance Gate — Backlog

Items deferred from the main compliance gate build (Stages 1–8). Not scheduled; pick up when capacity allows.

---

## 1. CLEARED-path delivery PIN extension

**Priority:** Medium

**Context:**  
Shipments that receive a `CLEARED` classification skip inspection and seal entirely, going straight from `compliance_in_progress` → `active`. Because there is no SecureSeal, there is no `shipment_secure_seals` row and no `delivery_pin_hash`. These shipments therefore cannot use the `/delivery/pin` + `/delivery/confirm-pin` PIN-based delivery flow introduced in Stage 7.

**Current behaviour:**  
- CLEARED shipments use the legacy dual-confirmation path (`booter_confirmed_delivery` + `hooper_confirmed_receipt` via `/confirm-delivery`).
- After delivery, `delivery_confirmed_at` is `null` (it is only set by `confirm-pin`).
- `/delivery/report-issue` returns 409 for these shipments and redirects to `/disputes/create`.

**What to build:**  
Option A — Add a synthetic seal row for CLEARED shipments at approval time so they can use the same PIN flow. Requires a database row with `status = 'cleared_bypass'` and the delivery columns.  
Option B — Create a separate lightweight PIN flow that does not require a seal row, gated by a CLEARED flag on the match.

**Design note:**  
Option A is simpler — the PIN infrastructure already exists. The seal row would be a guard record only; no physical label is generated or applied.

---

## 2. QR scan-event logging (`shipment_seal_scans` + `/api/seal/verify`)

**Priority:** Low

**Context:**  
The original Stage 7 plan included a `shipment_seal_scans` audit table and a `/api/seal/verify` endpoint for logging every QR code scan (courier portal, customs, BootHop ops). This was dropped during the Stage 7 redesign when the delivery mechanism shifted to PIN/OTP.

**What to build:**  
1. Migration: `shipment_seal_scans` table (`id`, `seal_id`, `scanned_by`, `scan_source` enum, `location_hint`, `metadata`, `created_at`).
2. `POST /api/seal/verify` — unauthenticated or token-gated endpoint; accepts seal QR payload, validates token hash, writes a scan event, returns shipment status (safe subset only).
3. Extend admin `ComplianceMatchDetail.tsx` to show scan events in the chain-of-custody section.

**Design note:**  
Scan events should be written to `shipment_seal_scans`, not `shipment_events`, to keep the compliance audit log clean. Surface them separately in the admin timeline.

---

## 4. Seal activation photo — Supabase Storage existence check

**Priority:** Low — prefix check (Stage 9B.3) already prevents cross-match faking; this would close the remaining gap where a client supplies a correctly-prefixed but non-existent key.

**Context:**
`POST /api/matches/[id]/seal/activate` validates that `activation_photo_url` starts with `${matchId}/` (added Stage 9B.3). However it does not verify that the key resolves to a real object in the `seal-photos` bucket. A client could supply `matchId/fabricated.jpg` and activation would succeed with a broken storage link.

**Current mitigation:**
- The mobile client always uploads first via `POST /seal/activation-photo` and only passes the returned `storageKey` to activate — so legitimate usage always produces a real key.
- The prefix check blocks cross-match and fully fabricated keys.
- A tampered client supplying a correctly-prefixed non-existent key is the remaining attack surface.

**What to build:**
In `activate/route.ts`, after the prefix check, perform a Supabase Storage existence check:
```ts
const { data: photoExists } = await supabase.storage
  .from('seal-photos')
  .list(matchId, { search: activation_photo_url.replace(`${matchId}/`, '') });
if (!photoExists?.length) {
  return NextResponse.json({ error: 'Activation photo not found in storage.' }, { status: 422 });
}
```
Or use `createSignedUrl` with a short TTL to confirm existence without exposing a URL.

**Trade-off:** Adds one extra Supabase Storage round-trip on every activation. Given activation happens once per shipment, latency is acceptable. Deferred because prefix check already blocks 99% of attack surface and legitimate usage is never affected.

---

## 3. Inspection fail done-screen: no differentiation between escalation paths

**Priority:** Low — cosmetic, affects both web and mobile

**Context:**  
After a traveller submits a failed inspection, the done-screen shows generic "Inspection flagged / Our team has been alerted" copy regardless of which failure_reason was chosen. The server returns `status: 'external_verification_required'` or `status: 'suspended_pending_review'` in the response body, but the client (web `page.tsx:282–299`, mobile `app/inspect/[id].tsx:120–133`) reads only `result.result` ('passed'/'failed') and discards `result.status`.

**Effect:**  
A traveller who selected `prohibited_or_suspicious` or `sender_refused_inspection` (which immediately escalate to external verification) sees the same screen as one whose mismatch went to standard admin review. The differentiation is only visible later, on the match screen's status card.

**What to build:**  
Read `result.status` from the POST response and branch the done-screen copy:
- `external_verification_required` → "This shipment has been escalated to BootHop's verification team. You will be contacted directly. Do not accept the item."
- `suspended_pending_review` → "This shipment has been paused pending admin review. Our team has been alerted and will contact both parties."

**Scope:** Web inspection `page.tsx` and mobile `app/inspect/[id].tsx` — same change in both.
