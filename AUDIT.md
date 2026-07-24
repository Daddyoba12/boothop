# BootHop Compliance Gate — Audit Log

Dated incident notes for test-count discrepancies and process gaps discovered during the 9B retroactive review. This file exists so future maintainers do not have to reconstruct history from chat logs.

---

## INCIDENT-001 — Pre-commit baseline numbers are unverifiable

**Date discovered:** 2026-07-24  
**Stages affected:** All web stages (1–8) and all mobile stages (9A, 9B.1, 9B.2, 9B.3)

### What was reported

All test-count figures reported at stage closure before 2026-07-24 were produced from running the test suite against local working-tree state that was never committed to git. Specific figures cited:

| Stage | Reported mobile | Reported web |
|-------|----------------|-------------|
| 9A    | —              | 210 (after Stage 8) |
| 9B.1 close | 195       | 218 (+8 confirm-delivery guard) |
| 9B.2 built (no close) | ~203 | — |
| 9B.3 built (no close) | — | — |

### What was found

First real git anchors established 2026-07-24:
- Mobile baseline commit: `6a3c074` — **310 tests, 310 passed**
- Web baseline commit: `60dae2a` (followed by build-fix commits through `c9fe898`) — **242 tests, 242 passed**

Neither number can be reconciled exactly with the pre-commit figures because no intermediate snapshots exist.

### What is confirmed-explained vs unexplained

**Mobile 195 → 310 (+115):**
- `inspectionForm.test.ts` (52 tests): entirely new in 9B.2 — confirmed by file contents
- `sealFlow.test.ts` (56 tests): entirely new in 9B.3 — confirmed by file contents
- Remaining +7 across `statusConstants`, `declarationForm`, `confirmDeliveryGuard`, `statusInfo`, `timeline`: **unattributable without git history**

**Web 218 → 242 (+24):**
- `confirm-delivery-route.test.ts` (8 tests): exactly matches the cited "+8 confirm-delivery guard" at 9B.1 close — confirmed by current count
- Remaining 12 files total 234 tests vs the implied 210 at Stage 8 close: **+24 unattributable without git history**

### Decision taken

Accept 310 (mobile) and 242 (web) as the verified floor. All prior figures are retired as unverified narrative. Future stage closures must satisfy the four-point process requirement (see Process Rules section below).

---

## INCIDENT-002 — statusInfo.test.ts count dropped from reported 72 to verified 53

**Date discovered:** 2026-07-24  
**File:** `boothop-mobile/__tests__/statusInfo.test.ts`  
**First verified count:** 53 (commit `6a3c074`)

### What was reported

72 tests reported at Stage 9A close (pre-commit, unanchored).

### What the code shows

Current file has exactly 53 tests in 7 describe blocks. One removal is code-confirmed: `seal_pending/traveler` was removed from `WARNING_CARDS` in Stage 9B.3 when the traveller's SecureSeal activation moved to the mobile app (no web redirect required). This is documented by a comment at `statusInfo.test.ts:125-127` and the behaviour is now asserted in `sealFlow.test.ts`. This accounts for **1 test removed**.

The remaining **18 test difference** (72 − 53 − 1 removed = 18) is unrecoverable. Without a pre-9B.3 git snapshot there is no way to determine whether these tests: (a) existed and were removed, (b) were miscounted in the original report, or (c) some combination. The file never had a git anchor until `6a3c074`.

### Coverage review of current 53 tests

Manual review against the 8-status × 2-role matrix:

| Property | Coverage | Tests |
|----------|----------|-------|
| All 8 statuses return non-null for both roles | Complete | 16 (Block 1) |
| 7 non-compliance statuses return null | Complete | 7 (Block 2) |
| No internal field leakage in any card | Complete | 16 (Block 3) |
| Tone differentiation — 4 asymmetric statuses | Complete | 4 (Block 4) |
| Terminal statuses are danger for both roles | Complete | 6 (Block 5) |
| Action-required cards reference boothop.com | Complete | 3 (Block 6) |
| seal_pending/traveler does NOT reference boothop.com | Asserted in sealFlow.test.ts | — |
| Card shape (title/body/tone types) | Complete | 1 (Block 7) |

**Identified body-content gaps (not structural holes):**

| Gap | Missing assertions | Tests needed to close |
|-----|--------------------|-----------------------|
| `compliance_in_progress` role-differentiated body | Sender body: "submitted / being reviewed"; Traveler body: "sender's declaration / being reviewed" — distinct copy, same tone (info/info) | 2 |
| `compliance_rejected` role-differentiated body | Sender: "refund will be issued"; Traveler: "match has been closed / trip remains available" | 2 |
| `compliance_timeout` role-differentiated body | Sender: "48-hour window passed / refund"; Traveler: "did not complete in time / match closed" | 2 |
| `suspended_pending_review` is identical for both roles | No test asserts sender and traveler receive same body (structural feature, not a bug) | 1 |

Total to close all gaps: **7 tests** → would bring file to 60 tests.

### Decision taken

The 53-test coverage is **structurally complete** (presence, tone, forbidden-field, shape, web-action-redirect). The 4 gaps are body-content assertions, not missing status coverage or missing role differentiation. **Decision: add 7 targeted body-content tests to bring the file to 60**, documenting this as a restoration of body-copy assertions rather than new coverage. The 12 tests between 60 and the reported 72 remain permanently unrecoverable and are formally accepted as a known unknown.

**Status: OPEN — 7 tests to be added at next review session.**

---

## Process Rules — adopted 2026-07-24

These apply to all stage closures from 9B.4 onward, non-negotiable:

1. **Commit hash** must be stated explicitly at every stage close.
2. **`git status --porcelain`** must be pasted immediately after the closing commit and shown clean (empty output).
3. **Verbatim test-runner stdout** must be pasted — file-by-file pass/fail with counts as printed by the tool, not a hand-typed summary table.
4. **No implementation begins without an explicit stage prompt** issued in the review thread.

Stages 9B.2 and 9B.3 were built without stage prompts. This is a process violation on record; it does not affect the correctness of the code or tests but means those stages require retroactive review before closure.

---

## Web test-file inventory at verified baseline (commit `60dae2a`, 242 total)

| File | Tests | Stage built | Count at 218 |
|------|-------|-------------|--------------|
| confirm-delivery-route.test.ts | 8 | Stage 8 | 8 (cited as "+8") |
| declare-validate.test.ts | 35 | Stage 2 | unknown |
| delivery-confirm-pin-route.test.ts | 19 | Stage 7 | unknown |
| delivery-pin-route.test.ts | 12 | Stage 7 | unknown |
| delivery-report-issue-route.test.ts | 19 | Stage 7/8 | unknown |
| inspection-route.test.ts | 24 | Stage 3/3.5 | unknown |
| risk-engine.test.ts | 15 | Stage 2 | unknown |
| seal-activate-route.test.ts | 37 | Stage 5 | unknown |
| seal-activation-photo-route.test.ts | 11 | Stage 5 | unknown |
| seal-current-route.test.ts | 10 | Stage 4 | unknown |
| seal-route.test.ts | 22 | Stage 4 | unknown |
| timeline-route.test.ts | 15 | Stage 8 | unknown |
| verification-result-route.test.ts | 15 | Stage 6 | unknown |
| **Total** | **242** | | **218 (pre-commit)** |

**Delta 218 → 242 = +24.** The only per-file attribution that can be confirmed: `confirm-delivery-route.test.ts` = 8, matching the explicitly cited "+8 confirm-delivery guard." The remaining +24 across the other 12 files cannot be allocated per-file without git history.
