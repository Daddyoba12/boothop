# BootHop Compliance Gate — Backlog

Items deferred from the main compliance gate build (Stages 1–8). Not scheduled; pick up when capacity allows.

---

## AUDIT NOTE — statusInfo.test.ts pre-commit count discrepancy

Pre-commit test count for `statusInfo.test.ts` dropped from a reported 72 to 53 between Stage 9A and the first real commit (`6a3c074` on mobile, 2026-07-24). No version history exists to explain the delta. Current 53-test coverage was manually reviewed post-hoc and found structurally complete against the 8-status/2-role matrix (blocks 1/3/7 cover presence, forbidden-fields, and shape exhaustively; block 4 covers the 4 asymmetric statuses only; block 5 covers the 3 terminal statuses). The 72→53 delta is recorded here as a known unknown, not a resolved discrepancy.

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

## 3. Traveller inspection evidence upload

**Priority:** Low

**Context:**  
The inspection screen shows the sender's declaration evidence (read-only) but provides no mechanism for the traveller to upload their own photos during inspection (e.g. to document item condition at handover, supporting a disputed-outcome claim later). This was deliberately excluded from Stage 9B.2 — it was never in the original spec and requires new server scope.

**What to build:**  
1. New Supabase Storage bucket (`inspection-evidence`, private).
2. Server: add an evidence upload endpoint (e.g. `POST /api/matches/[id]/inspection/evidence`) and optionally an `inspection_photo_url` field on the `shipment_inspections` POST body.
3. Mobile: add an `uploadInspectionEvidence` API wrapper and a photo-picker section to the inspection screen, disabled until the traveller has answered at least one checklist item.

**Design note:**  
Mirrors the declaration-evidence upload pattern (`declaration-evidence` bucket, `POST /declare/evidence`). Access should be limited to the traveller for the match in question. Evidence uploaded here should be surfaced in the admin compliance timeline alongside declaration evidence.

---

~~## 4. Seal activation photo — Supabase Storage existence check~~ **RESOLVED** — storage `.list()` existence check added to `activate/route.ts` after the prefix check. Returns 422 if the key is not found in the `seal-photos` bucket.

---

~~## 3. Inspection fail done-screen~~ **RESOLVED** — both web (`inspection/page.tsx:282–308`) and mobile (`app/inspect/[id].tsx:127–144`) already capture `result.status` and branch the done-screen copy on `external_verification_required` vs `suspended_pending_review`. Implemented during 9B.2 build.

~~## 5. Category proof-of-ownership check~~ **RESOLVED** — `validate.ts` substring changed to exact match + `VALID_CATEGORIES` enum guard added to `validateSubmit`; mobile `lib/declarations.ts` substring changed to exact match. Web `declare/page.tsx` was already correct.
