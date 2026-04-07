# BootHop — Screens & Email Flow Guide

---

## PART 1 — All Screens (Windows) in the App

### Public Screens (no login needed)

| Screen | URL | What it does |
|--------|-----|-------------|
| **Home** | `/` | Landing page — explains BootHop, entry point to register or browse |
| **How It Works** | `/how-it-works` | Step-by-step explainer for new visitors |
| **Journeys** | `/journeys` | Browse all live trip listings |
| **Pricing** | `/pricing` | Platform fee and insurance pricing info |
| **About** | `/about` | Company background |
| **Contact** | `/contact` | Contact form |
| **Help** | `/help` | FAQ and support |
| **Trust & Safety** | `/trust-safety` | How we keep the platform safe |
| **Customs** | `/customs` | Customs/prohibited items guide |
| **Terms** | `/terms` | Full Terms & Conditions |
| **Privacy** | `/privacy` | Privacy policy |
| **Cookie Policy** | `/cookie-policy` | Cookie policy |

---

### Auth Screens

| Screen | URL | What it does |
|--------|-----|-------------|
| **Login** | `/login` | Enter email → receive OTP code |
| **Verify** | `/verify` | Enter the 6-digit OTP to confirm identity and get session cookie |
| **Register** | `/register` | New user journey — choose Hooper or Booter, fill in trip details |

---

### User Journey Screens (login required)

| Screen | URL | What it does |
|--------|-----|-------------|
| **Intent** | `/intent` | After login — user states what they want to do (send or travel) |
| **Dashboard** | `/dashboard` | Main hub — shows all matches, trips, and drafts |
| **Match Detail** | `/matches/[id]` | Full detail of one match — status, contact, messaging, dispute, rating |
| **Commit** | `/commit` | Sign Terms & Conditions for a specific match |
| **KYC** | `/kyc` | Identity verification — starts Stripe Identity check, shows payment request form |
| **KYC (redirect)** | `/kyc/[matchId]` | Old URL — redirects to `/kyc?matchId=X` |
| **Confirm** | `/confirm` | Shown after a one-click action (e.g. accept match, confirm delivery) |
| **Profile** | `/profile` | User profile and rating history |
| **Messages** | `/messages` | All conversations list |
| **Messages (thread)** | `/messages/[matchId]` | Full message thread for a match |
| **Create Request** | `/requests/create` | Post a new send request |
| **Requests** | `/requests` | Browse open send requests |
| **Create Journey** | `/journeys/create` | Post a new travel listing |
| **Ratings** | `/ratings/create` | Submit a rating (legacy page) |
| **Checkout** | `/checkout/[matchId]` | Payment request submission for a specific match |
| **Payment Success** | `/payment/succes` | Shown after payment request submitted |

---

### Admin Screens (restricted)

| Screen | URL | What it does |
|--------|-----|-------------|
| **Admin Hub** | `/admin/hub?adminKey=SECRET` | Full operations panel — payments, disputes, refunds |
| **Admin** | `/admin` | Basic admin landing / redirect target for email links |
| **Admin Compliance** | `/admin/compliance` | Compliance and flagged content review |

---

### Legacy / Specialised Screens

| Screen | URL | What it does |
|--------|-----|-------------|
| **Booter Dashboard** | `/booter-dashboard` | Old dashboard specific to carriers |
| **Hooper Dashboard** | `/hooper-dashboard` | Old dashboard specific to senders |
| **KYC Video** | `/kyc/video` | Video verification step (if used) |

---

## PART 2 — Email Flow Diagram

Every email, when it fires, who receives it, and what triggers it.

```
USER REGISTERS / LOGS IN
│
├─► [EMAIL 1] OTP Verification Code
│     To:      The user
│     When:    They enter their email on /login or /register
│     Content: 6-digit code, valid for 10 minutes
│     File:    sendVerificationEmail.ts
│
▼
MATCH FOUND (auto-match cron runs every 6h)
│
├─► [EMAIL 2] Match Interest Email
│     To:      Both Hooper and Booter
│     When:    Auto-match cron finds a compatible pair
│     Content: Match details + one-click ACCEPT / DECLINE buttons
│     File:    sendMatchEmail → sendInterestEmail()
│
▼
BOTH ACCEPT THE MATCH  →  status: agreed
│
├─► [EMAIL 3] Match Confirmed Email
│     To:      Both parties
│     When:    Both click Accept in their emails
│     Content: Confirmation that both accepted, next step = sign terms
│     File:    sendMatchEmail → sendMatchConfirmedEmail()
│
▼
BOTH SIGN TERMS & CONDITIONS  →  status: committed
│
├─► [EMAIL 4] Terms Acceptance Notification
│     To:      The party who just signed (sent each time someone signs)
│     When:    Each party clicks "I Agree" on /commit
│     Content: Confirmation they signed, waiting for other party if needed
│     File:    sendTermsEmail → sendTermsAcceptanceEmail()
│
├─► [EMAIL 5] Both Terms Accepted
│     To:      Both parties
│     When:    The SECOND person signs (completing the pair)
│     Content: Both signed — next step is identity verification
│     File:    sendTermsEmail → sendBothTermsAcceptedEmail()
│
▼
IDENTITY VERIFICATION (KYC)  →  status: kyc_pending → kyc_complete
│
├─► [EMAIL 6] Your Identity Verified
│     To:      The party who just passed KYC
│     When:    Stripe Identity webhook fires (single party verified)
│     Content: Your ID is verified, waiting for the other party
│     File:    sendKycEmail → sendKycVerifiedEmail()
│
├─► [EMAIL 7] Both Identities Verified
│     To:      Both parties
│     When:    The SECOND person passes KYC (both now verified)
│     Content:
│               → Hooper: "Both verified — please submit payment"
│               → Booter: "Both verified — waiting for sender to pay"
│     File:    sendKycEmail → sendBothKycVerifiedEmail()
│
▼
HOOPER SUBMITS PAYMENT  →  status: payment_processing
│
├─► [EMAIL 8] Admin Payment Alert  ⚡ ADMIN ACTION REQUIRED
│     To:      admin@boothop.com
│     When:    Hooper clicks "Submit Payment" on /kyc
│     Content: Match details, amounts, green CONFIRM PAYMENT button
│              (button link: /api/admin/confirm-payment?matchId=X&adminKey=SECRET)
│     File:    sendPaymentEmail → sendAdminPaymentAlertEmail()
│
├─► [EMAIL 9] Payment Request Received
│     To:      Hooper (sender)
│     When:    Same moment as above
│     Content: "We received your payment, our team will contact you"
│     File:    sendPaymentEmail → sendPaymentRequestedEmail()
│
▼
ADMIN CONFIRMS PAYMENT  →  status: active
│
├─► [EMAIL 10] Contact Details Released
│     To:      Both parties
│     When:    Admin clicks the Confirm Payment button (email or hub)
│     Content: The OTHER party's email address is now revealed
│              Both can now contact each other and arrange handover
│     File:    sendPaymentEmail → sendContactReleasedEmail()
│
▼
DELIVERY IN PROGRESS  (cron runs every 6h)
│
├─► [EMAIL 11] Carrier Delivery Reminder
│     To:      Booter (carrier)
│     When:    Cron job — match is active and delivery not yet confirmed
│     Content: "Have you delivered the goods?" + one-click CONFIRM button
│              (button link: /api/auth/confirm-action?token=X)
│     File:    sendDeliveryEmail → sendCarrierDeliveryReminderEmail()
│
├─► [EMAIL 12] Sender Receipt Reminder
│     To:      Hooper (sender)
│     When:    Same cron job
│     Content: "Have you received your goods?" + one-click CONFIRM button
│     File:    sendDeliveryEmail → sendSenderReceiptReminderEmail()
│
▼
BOTH CONFIRM DELIVERY  →  status: delivery_confirmed
│
├─► [EMAIL 13] Admin — Release Payment  ⚡ ADMIN ACTION REQUIRED
│     To:      admin@boothop.com
│     When:    Both parties have clicked confirm delivery
│     Content: Both confirmed — release payment to carrier
│              (button link: /api/admin/release-payment?matchId=X&adminKey=SECRET)
│     File:    sendDeliveryEmail → sendAdminDeliveryConfirmedEmail()
│
├─► [EMAIL 14] Delivery Complete
│     To:      Both parties
│     When:    Same moment — both confirmed
│     Content: "Your delivery is complete. Payment is being processed."
│     File:    sendDeliveryEmail → sendDeliveryCompleteEmail()
│
▼
ADMIN RELEASES PAYMENT  →  status: completed
│
├─► [EMAIL 15] Rating Request
│     To:      Both parties
│     When:    Admin clicks Release Payment (email or hub)
│     Content: "How did it go? Leave a rating" + link to /matches/[id]
│     File:    sendRatingEmail → sendRatingRequestEmail()
│
▼
✅ TRANSACTION COMPLETE
```

---

## PART 3 — Side Flows (Disputes & Cancellations)

```
IF DISPUTE RAISED  (from /matches/[id] when status is active or delivery_confirmed)
│
│  →  status: disputed
│
├─► [EMAIL D1] Dispute Raised — Admin Alert  ⚡ ADMIN ACTION REQUIRED
│     To:      admin@boothop.com + support@boothop.com
│     When:    Either party submits a dispute form
│     Content: Who raised it, reason, description + link to Admin Hub
│     File:    sendDisputeEmail → sendDisputeRaisedAdminEmail()
│
├─► [EMAIL D2] Dispute Acknowledged
│     To:      The party who raised the dispute
│     When:    Same moment
│     Content: "We received your dispute, we'll review within 48 hours"
│     File:    sendDisputeEmail → sendDisputeAcknowledgedEmail()
│
▼
ADMIN RESOLVES DISPUTE  (from Admin Hub)
│
├─► [EMAIL D3] Dispute Resolved
│     To:      Both parties
│     When:    Admin selects a resolution and clicks Confirm
│     Content: Decision (pay carrier / refund sender / split / no action)
│              + admin note explaining the decision
│     File:    sendDisputeEmail → sendDisputeResolvedEmail()
```

```
IF MATCH EXPIRES  (expire cron runs every 3h)
│
│  Cancels agreed/committed matches older than 12 hours
│  Cancels kyc_pending matches older than 72 hours
│
├─► [EMAIL X1] Match Expired
│     To:      Both parties
│     When:    Cron detects a stale match and cancels it
│     Content: "Your match has expired — you can create a new one"
│     →  status: cancelled
```

```
IF CANCELLATION REQUESTED  (from /matches/[id])
│
│  Before payment  →  immediate cancel, no email needed, status: cancelled
│
│  After payment submitted (payment_processing):
│
├─► [EMAIL C1] Refund Request — Admin Alert  ⚡ ADMIN ACTION REQUIRED
│     To:      admin@boothop.com
│     When:    User cancels a match that is in payment_processing
│     Content: Who requested, match details, refund amount (90%)
│     →  status: cancellation_requested
│
├─► [EMAIL C2] Cancellation Confirmed
│     To:      Hooper (sender)
│     When:    Same moment
│     Content: "Cancellation received — 90% refund within 3–5 business days"
```

---

## PART 4 — Email Summary Table

| # | Email | Sent To | Trigger |
|---|-------|---------|---------|
| 1 | OTP Code | User | Login / Register |
| 2 | Match Found | Both | Auto-match cron |
| 3 | Match Confirmed | Both | Both accept match |
| 4 | Terms Signed | Signer | Each party signs T&C |
| 5 | Both Terms Signed | Both | Second party signs T&C |
| 6 | Your ID Verified | One party | Stripe KYC webhook (one done) |
| 7 | Both IDs Verified | Both | Stripe KYC webhook (both done) |
| 8 | Payment Alert | Admin | Hooper submits payment |
| 9 | Payment Received | Hooper | Hooper submits payment |
| 10 | Contact Released | Both | Admin confirms payment |
| 11 | Carrier Reminder | Booter | Cron — active match |
| 12 | Sender Reminder | Hooper | Cron — active match |
| 13 | Release Payment Alert | Admin | Both confirm delivery |
| 14 | Delivery Complete | Both | Both confirm delivery |
| 15 | Rate Your Experience | Both | Admin releases payment |
| D1 | Dispute Raised | Admin + Support | User raises dispute |
| D2 | Dispute Acknowledged | Raiser | User raises dispute |
| D3 | Dispute Resolved | Both | Admin resolves dispute |
| X1 | Match Expired | Both | Expire cron |
| C1 | Refund Request | Admin | Cancel after payment |
| C2 | Cancellation Confirmed | Hooper | Cancel after payment |

**Total: 21 distinct emails across the full platform lifecycle.**

---

## PART 5 — Admin Actions Required

There are 3 moments where the admin must manually act. All triggered by email:

| Action | Trigger Email | What admin does |
|--------|--------------|----------------|
| **Confirm payment received** | Email 8 — Payment Alert | Click green button in email or use Admin Hub → Payments tab |
| **Release payment to carrier** | Email 13 — Release Alert | Click button in email or use Admin Hub → Payments tab |
| **Resolve a dispute** | Email D1 — Dispute Alert | Use Admin Hub → Disputes tab, pick a resolution |

Admin Hub URL: `https://www.boothop.com/admin/hub?adminKey=YOUR_ADMIN_SECRET`
