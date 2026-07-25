# Security Notes

Closed security findings. Each entry records what was exposed, for how long, and what fixed it.

---

## CLOSED — Risk field exposure via over-fetching in inspection and declaration GET endpoints

**Severity:** Medium — internal risk assessment data visible to authenticated non-admin users  
**Status:** Closed  
**Introduced:** Stage 3 (shipment compliance gate)  
**Fixed:** Stage 9B.2 audit pass, 2026-07-25  
**Disclosed:** Developer self-disclosure during 9B.4 planning

### What leaked

`GET /api/matches/[id]/inspection` fetched the `item_declarations` row with `select('*')`, returning every column including:

- `risk_score` — numeric 0–100 risk assessment score
- `risk_classification` — one of `CLEARED | STANDARD_REVIEW | MANUAL_REVIEW | EXTERNAL_VERIFICATION_REQUIRED | REJECTED`
- Any future columns added to `item_declarations` (wildcard behaviour)

Fields that exist on the table schema and would have been returned if populated: `triggered_rules`, `reviewer_notes`.

Any authenticated traveller on an `inspection_pending` shipment could retrieve their shipment's internal risk assessment data by inspecting the JSON response in devtools or through a proxy.

`GET /api/matches/[id]/declare` had the same `select('*')` on `item_declarations`, exposing the same risk fields to the sender during the declaration filling stage.

`GET /api/matches/[id]/inspection` also used `select('*')` on `shipment_inspections`. That table does not store risk assessment fields, but the wildcard was still incorrect.

In addition, the web inspection page (`src/app/matches/[id]/inspection/page.tsx`) rendered a `risk_classification` badge on the declaration summary card, sourced from the over-fetched data. This badge was visible to the traveller during the inspection flow. It was a Stage 3 design element predating the Stage 8 rule that prohibited exposing risk data to non-admin users.

### Fix (all in one pass)

1. `GET /api/matches/[id]/inspection` — declaration SELECT replaced with explicit 12-column allowlist; inspection SELECT replaced with explicit 8-column allowlist. Neither list includes any risk assessment field.

2. `GET /api/matches/[id]/declare` — declaration SELECT replaced with explicit allowlist covering the full set of declaration fields the sender/traveller legitimately needs. Risk fields excluded.

3. `src/app/matches/[id]/inspection/page.tsx` — `risk_classification` and `risk_score` removed from the `Declaration` interface; the risk badge JSX removed from the declaration summary card header.

4. Tests added in `boothop-mobile/__tests__/inspectionForm.test.ts` (section G-B) and `declarationForm.test.ts` (section C-B): four per-field assertions confirming `risk_classification`, `risk_score`, `triggered_rules`, and `reviewer_notes` are absent from the GET responses for both endpoints.

### Scope

- Affects authenticated users who were party to a match in `inspection_pending` (traveller) or `locked_pending_compliance` (sender) state since Stage 3.
- No financial data, identity documents, or third-party PII was in the over-fetched columns.
- Risk score and classification are internal operational intelligence. Exposure allows a user to probe the detection logic, not to extract payments or personal data about others.
- No forensic investigation required. Fix closes the exposure going forward.
