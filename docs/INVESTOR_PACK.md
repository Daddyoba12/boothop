# BootHop — Investor Pack
### Confidential · May 2026

---

## Executive Summary

**BootHop** is a dual-sided logistics platform with two distinct revenue channels operating from a single technology base:

**Channel 1 — C2C Marketplace:** Connects verified travellers (Booters) with people who need goods moved between cities (Hoopers). No couriers. No warehouses. The traveller is already making the journey — BootHop adds structure, trust, and payment.

**Channel 2 — B2B Enterprise Logistics:** A separate business portal targeting industries where delivery failure is catastrophic — aerospace, engineering, pharma, legal, and events. Pricing starts at £300 for UK domestic and £7,000 for critical international hand-carry. A Priority Partner tier offers £10,000–£15,000 annual retainers drawn down against deliveries.

Both channels are served by a third product:

**The AI Compliance Engine:** A Claude AI-powered customs checker that validates any item against 20-country regulatory databases in real time. Users declare their goods, receive an instant risk decision (Allowed / Restricted / Blocked), and get a required document checklist — before a match is ever made. This is not a guide. It is a live regulatory screening tool embedded into every transaction.

The platform is **live, functional, and multi-featured.** This raise is about team, legal infrastructure, and growth — not product development.

**We are raising £350,000 in pre-seed investment.**

---

## The Problem

### C2C: The Diaspora Delivery Gap

Over 400,000 Nigerians live in the UK. They regularly send goods home — clothes, electronics, medicine, documents, gifts. The options are:

- **Traditional couriers (DHL/FedEx/UPS):** £80–£250 per shipment to Nigeria. Slow. Impersonal.
- **Informal networks:** "I'm giving it to someone who's going next week." No accountability. No tracking. No insurance. Goods lost or seized with no recourse.

The informal peer-to-peer delivery economy already exists and is enormous — it simply has no structured, trusted platform. BootHop is that platform.

At the same time, millions of travellers fly international routes every year with spare baggage capacity they cannot monetise. A traveller flying London → Lagos with 5kg spare could earn £80 on a journey they were already taking.

### B2B: The Critical Delivery Gap

In aerospace, engineering, and manufacturing, a grounded aircraft (AOG) or halted production line costs £10,000+ per hour. Companies in these sectors need a carrier who can pick up a part, board a flight, and hand-carry it across borders with zero delays. Standard couriers cannot do this reliably. International freight takes days. BootHop's B2B channel fills this gap with same-day, hand-carry, dedicated carrier delivery — at a price point far below the cost of downtime.

---

## The Solution

### C2C — Peer-to-Peer Delivery Marketplace

A Hooper posts what they need to send. A Booter posts their travel route. BootHop matches them on route, date, price, and distance. Both parties pass identity verification (KYC), agree terms, and payment is held in Stripe escrow. Contact details are only released after all checks pass. Both confirm delivery before funds are released. Every step is automated.

### B2B — Enterprise Logistics Portal

Businesses log in with their company email, submit a delivery job (route, goods, weight, urgency), receive an instant price from the published rate card, upload commercial documents (invoice, packing list, certificate of origin), and a vetted carrier is assigned. Job status tracks through: `pending → review → assigned → in_transit → delivered`. Priority Partners have a 2-hour response guarantee and a dedicated account manager.

### AI Customs Compliance Engine

Users enter their item, destination country (20 supported), declared value, and quantity. The engine — powered by Anthropic's Claude API — returns:
- A risk score (0–100) across five factors: item type, country regulatory tier, user profile, declared value, and quantity
- A decision: **Allowed / Restricted (admin review) / Blocked**
- A required document checklist
- Country-specific prohibited item guidance

This protects the platform from liability, educates users before they commit, and creates a compliance audit trail for every transaction.

---

## Product — What Is Built

This is not a concept. Every feature listed below is live in the codebase and deployed.

### C2C Platform

| Feature | Status | Detail |
|---------|--------|--------|
| Smart matching engine | Live | Auto-matches by route, date ±3 days, price ±20%, pickup distance ≤20 miles |
| Price negotiation | Live | Automated midpoint proposal; both parties must accept before proceeding |
| Fee & customs calculation | Live | Platform commission, goods value, and customs estimates calculated upfront automatically |
| Stripe escrow payments | Live | Funds held by Stripe, not BootHop — released only on dual delivery confirmation |
| KYC identity verification | Live | Stripe Identity — government ID + selfie; video verification also scoped |
| 9-stage trust pipeline | Live | Intent → Match → Agree → Commit → KYC → Escrow → Contact Release → Delivery → Release |
| Contact gating | Live | Personal details revealed only after KYC + payment — never before |
| In-app messaging | Live | Content-filtered: phone numbers, emails, social handles blocked until payment confirmed |
| Dispute resolution | Live | Admin-mediated; four outcomes: pay carrier / refund sender / split / no action |
| Cancellation & refund logic | Live | Free before payment; 90% refund after payment; no refund post-contact release |
| Ratings system | Live | 1–5 stars, post-completion, both parties |
| Automated cron jobs | Live | Matching (6h), delivery reminders (6h), stale match expiry (3h) |
| Hooper dashboard | Live | Matches, trips, drafts, status labels |
| Booter dashboard | Live | Earnings, trips, match management |
| PWA | Live | Installable on Android and iOS — no App Store required |
| £20 signup credit | Live | First 500 members get £20 applied automatically at checkout |
| Google Maps integration | Live | Location autocomplete for accurate route matching |

### B2B Business Portal

| Feature | Status | Detail |
|---------|--------|--------|
| Separate business auth | Live | OTP-based business email login; separate session from C2C |
| Three delivery lanes | Live | UK domestic (£300–£1,200), EU (£1,000–£2,500), Global (£2,000–£7,000) |
| Instant pricing calculator | Live | Route + weight + urgency → price shown before commitment |
| Job management portal | Live | Full job lifecycle: post → review → assigned → in transit → delivered |
| Document upload | Live | Commercial invoice, packing list, certificate of origin, other (PDF/JPG/PNG/Word) |
| Job amendment & cancellation | Live | Edit pickup/dropoff/dates before carrier assignment; cancel up to assigned status |
| Priority Partner application | Live | £10,000 (UK) / £15,000 (International) annual retainer with dedicated account manager |
| Add-on services | Live | Night service (+£200), immediate dispatch (+£200), weekend (+20%), dedicated driver (+£300), airport meet & greet (£175/end) |
| Admin business hub | Live | Full job management, status updates, carrier assignment |
| Industries served | Live | Aerospace/AOG, engineering, pharma, legal, events, general commercial |

### AI Compliance Engine

| Feature | Status | Detail |
|---------|--------|--------|
| 20-country regulatory database | Live | UK, Nigeria, USA, Canada, Germany, France, UAE, Saudi Arabia, China, India, Australia, South Africa, Kenya, Ghana, Netherlands, Italy, Spain, Ireland, Singapore, Japan |
| AI risk scoring | Live | Claude API — 5-factor risk model per item/destination/user profile |
| Three-tier decision output | Live | Allowed / Restricted (admin review) / Blocked |
| Required document checklist | Live | Auto-generated per risk decision |
| Country risk browser | Live | Expandable cards per country: tier, prohibited items, specific rules |
| Duty & VAT estimator | Live | `/customs/duties` — pre-booking cost estimate |
| Admin compliance queue | Live | Restricted items held for review before matching proceeds |
| AML/customs admin panel | Live | Separate admin view for flagged shipments |

### Technology Stack

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 16.1.6 (App Router) |
| Frontend | React 19, Tailwind CSS 4, Framer Motion |
| Database | Supabase (PostgreSQL, RLS enforced) |
| Payments & KYC | Stripe (Payments, Escrow, Identity) |
| AI Engine | Anthropic Claude API |
| Email | Resend (transactional) |
| Location | Google Maps API |
| Forms | React Hook Form + Zod |
| Hosting | Vercel |

---

## Revenue Model

BootHop has three distinct revenue streams:

### Stream 1 — C2C Platform Fees

| Party | Fee | Example (£100 agreed delivery) |
|-------|-----|-------------------------------|
| Hooper (sender) | +3% | Pays £103 |
| Booter (carrier) | −5% | Receives £95 |
| **BootHop gross** | **8%** | **£8.00** |

Optional goods insurance at 10% of declared value adds to this.

### Stream 2 — B2B Per-Job Revenue

| Lane | Price Range | BootHop Margin |
|------|------------|----------------|
| UK domestic | £300–£1,200 | Platform takes spread between carrier cost and charge |
| UK ↔ EU | £1,000–£2,500 | Higher margin on critical/same-day |
| UK → Global | £2,000–£7,000 | Premium hand-carry rates |
| Add-ons | +£175 to +£300 per add-on | Full margin |
| Insurance (>£1,000 goods) | 8% of declared value, mandatory | High-margin ancillary |

### Stream 3 — Priority Partner Retainer (Recurring)

| Tier | Annual Fee | Structure |
|------|-----------|-----------|
| UK Partner | £10,000/yr | Fee held on account, drawn down per delivery |
| International Partner | £15,000/yr | Fee held on account, drawn down per delivery |

**One Priority Partner = £10,000–£15,000 ARR before any per-job fees.** Five Priority Partners = £50,000–£75,000 guaranteed annual revenue — before a single delivery is made.

### Illustrative Revenue Projections

| Year | C2C Transactions | C2C Revenue | B2B Jobs | B2B Revenue | Priority Partners | Retainer ARR | Total |
|------|-----------------|-------------|----------|-------------|-------------------|--------------|-------|
| Year 1 | 500 | £4,000 | 50 | £25,000 | 2 | £20,000 | £49,000 |
| Year 2 | 3,000 | £24,000 | 200 | £100,000 | 8 | £90,000 | £214,000 |
| Year 3 | 10,000 | £80,000 | 500 | £300,000 | 20 | £250,000 | £630,000 |

---

## Market Opportunity

### C2C — Diaspora Delivery (UK → Africa / Global)

| Metric | Data |
|--------|------|
| Nigerians in the UK | 400,000+ |
| Annual Nigeria remittance inflow | $20B+ (World Bank) |
| Informal peer-to-peer goods transfer market | Estimated £500M–£1B annually |
| Average BootHop C2C transaction | £60–£150 (carry fee) |
| Active UK–Nigeria travellers (annual) | Millions |

The informal market already exists. BootHop is not creating new behaviour — it is giving existing behaviour a trusted, safe structure.

**Near-term corridor expansion:** UK → Ghana, UK → India/Pakistan, UK → Caribbean, Nigeria → UK (return goods).

### B2B — Critical Logistics

| Metric | Data |
|--------|------|
| Global AOG (Aircraft-on-Ground) market | $2.5B+ annually |
| Average AOG cost per hour | £10,000–£150,000 |
| UK same-day delivery market | £2B+ |
| UK–EU critical freight market | Growing post-Brexit (new documentation requirements = more specialist demand) |

A single aerospace AOG customer generating 20 jobs/year at an average of £3,000/job = £60,000 annual revenue. Three such clients = £180,000 before retainer fees.

### Total Addressable Market

The **global peer-to-peer delivery market** is valued at $8.5B (2024), growing at 18% CAGR. The **global same-day delivery market** is $9.6B, growing at 20.2% CAGR. BootHop does not need a fraction of a percent of either to build a highly profitable business.

---

## Competitive Landscape

| Competitor | Type | Gap vs. BootHop |
|------------|------|-----------------|
| DHL / FedEx / UPS | Traditional courier | 3–5× more expensive for C2C; no peer-to-peer model |
| Airfrov (Asia) | P2P carry app | No UK/Africa presence; no AI compliance engine; no B2B |
| Piggybee (EU) | P2P carry app | Limited trust pipeline; no AI customs; no enterprise channel |
| SendMyBag | Excess baggage | Courier model only; no P2P; no enterprise |
| Informal WhatsApp networks | Unstructured | No KYC, no escrow, no insurance, no customs compliance |
| Enterprise courier/freight | B2B only | No P2P; expensive; slow; no hand-carry specialisation |

**BootHop's compound moat:**
1. The only platform combining P2P carry + enterprise logistics + AI customs compliance in one product
2. Built specifically for diaspora corridors — no competitor has this focus
3. AI compliance engine using Claude — scales to new countries without manual rules updates
4. 9-stage trust pipeline — more rigorous than any P2P competitor
5. Stripe escrow architecture — platform does not hold client money, reducing regulatory burden
6. Priority Partner retainer model — predictable ARR from day one

---

## Where Investment Is Needed — Beyond Advertising

The platform is built. Capital goes into compliance, team, and growth infrastructure.

### 1. Legal & Regulatory Compliance — £60,000

BootHop operates across international borders, processes personal identity data, uses AI to make compliance decisions, and charges fees on cross-border transactions. Getting the legal structure right is non-negotiable before scaling:

- **ICO registration** — mandatory for any UK business processing personal data; GDPR compliance audit
- **Nigeria NDPA compliance** — Nigerian Data Protection Act for data flowing between UK and Nigerian users
- **Terms of Service and user agreements** — drafted by a commercial lawyer; platform liability limits; customs responsibility clauses; carrier indemnification
- **Customs compliance advisory structure** — formal relationship with a licensed customs broker to underpin the AI engine's guidance (ensures the platform is not giving unaccredited customs advice)
- **Company structure review** — shareholder agreements, IP ownership, SEIS/EIS eligibility for investors (SEIS gives investors 50% income tax relief — a significant attraction for UK angels)
- **B2B contract templates** — Priority Partner agreements, enterprise service agreements, carrier agreements

Note: because **Stripe holds escrow funds**, not BootHop, the FCA money service business licensing burden is significantly reduced. This is a structural advantage of the Stripe escrow architecture.

### 2. Multi-Currency & Payment Expansion — £30,000

Stripe escrow is live and working for C2C. The expansion priorities are:

- **USD pricing** for the B2B channel and non-UK users
- **Nigerian Naira gateway** — Paystack or Flutterwave integration reduces friction for Nigerian-side senders and expands the addressable market
- **Automated B2B payment processing** — B2B currently uses bank transfer (appropriate for enterprise clients); adding card payment and invoice options increases conversion for smaller B2B accounts
- **Stripe fee optimisation** at volume — treasury structuring review

### 3. Insurance Partnership — £15,000

BootHop charges a goods insurance fee but does not yet have a formal underwritten insurance product behind it. This needs to be resolved before scaling:

- Partner with a specialist MGA (Managing General Agent) or Lloyd's of London broker
- White-label a goods-in-transit policy for the platform
- This converts the insurance fee from a platform charge into a **regulated, underwritten product** — increasing user confidence and removing consumer rights exposure
- The B2B 8% insurance surcharge (mandatory on goods >£1,000) becomes a proper product, not just a fee

### 4. KYC Infrastructure Reserve — £25,000

Stripe Identity charges per verification session. At growth:

- 1,000 new verified users = approximately £2,000–£4,000 in KYC costs
- The video verification flow (scoped in the product) adds additional cost per session
- This reserve covers KYC costs through the first 12 months of user growth without affecting operating margin

### 5. Operations & Growth Team — £80,000 (12 months)

The platform is highly automated — onboarding is self-serve, fees and customs values are calculated upfront, the matching engine runs on schedule. Routine transactions require zero human input.

Two hires unlock the next phase:

**Trust & Operations Lead:** The platform's automation handles 97%+ of transactions without intervention. The remaining 2–3% — genuine disputes, fraud flags, failed KYC edge cases, regulatory queries — need a trained human. At 1,000 monthly transactions, that is 20–30 cases/month. One person can manage this volume; it should not be the founder.

**Business Development Executive:** The B2B portal and Priority Partner tier are built. They need someone to sell them. A single aerospace client generates more annual revenue than 300 C2C transactions. This hire targets industries (aerospace, pharma, legal) where the value proposition is obvious and the sales cycle is defined.

### 6. Technology Enhancements — £40,000

Features scoped but not yet fully deployed:

- **Push notifications** — match alerts by push (not email only); critical for time-sensitive matches where a traveller departs in 24 hours
- **Phone number verification** — SMS OTP as an additional trust layer beyond email
- **Enhanced video KYC** — the video identity flow is scoped; full deployment adds a third verification signal beyond ID + selfie
- **AI customs engine expansion** — adding destination countries and item categories to the compliance database; the Anthropic SDK integration scales without structural changes
- **B2B carrier mobile interface** — carriers assigned to B2B jobs need a lightweight mobile update interface for real-time status

### 7. Advertising & Brand Awareness — £35,000

- £15,000 — Diaspora community digital marketing (Facebook/Instagram, targeting UK-Nigerian community networks)
- £10,000 — Influencer and content creator partnerships (Nigerian UK YouTubers, community voices, travel creators)
- £5,000 — Event presence (Nigerian community events, UK trade fairs, diaspora festivals)
- £5,000 — SEO and content (diaspora corridor search terms, customs guidance content, route-specific landing pages)

The £20 signup credit for first 500 members is already built into the platform — advertising spend triggers that growth mechanic.

### 8. Contingency / Runway — £65,000

Buffer for extended sales cycles in B2B, unexpected compliance costs, or platform scaling costs.

---

## Full Use of Funds

| Category | Amount | % |
|----------|--------|---|
| Legal & regulatory compliance | £60,000 | 17% |
| Operations & growth team (12 months) | £80,000 | 23% |
| Multi-currency & payment expansion | £30,000 | 9% |
| Technology enhancements | £40,000 | 11% |
| KYC infrastructure reserve | £25,000 | 7% |
| Insurance partnership | £15,000 | 4% |
| Advertising & brand awareness | £35,000 | 10% |
| Contingency / runway | £65,000 | 19% |
| **Total** | **£350,000** | **100%** |

---

## The Ask

**We are raising £350,000 in pre-seed investment.**

Suggested structure: **SAFE or Convertible Note** with a valuation cap and 20% discount to Series A. This gives investors meaningful upside without requiring a formal valuation at this stage. The platform's SEIS/EIS eligibility (subject to legal review in use of funds) offers UK angel investors up to 50% income tax relief on investment.

### 12-Month Milestones This Capital Funds

| Milestone | Target |
|-----------|--------|
| ICO registered, T&Cs legally reviewed | Month 1–2 |
| Insurance product live (regulated) | Month 2–4 |
| First 500 verified users | Month 3–6 |
| First £50,000 gross transaction volume | Month 4–6 |
| 5 Priority Partner accounts signed | Month 6–9 |
| USD and Naira payment lanes live | Month 6 |
| £100,000 B2B revenue | Month 9–12 |
| AI compliance engine expanded to 30 countries | Month 12 |
| Profitable unit economics per transaction | Month 12–15 |

### Why Now

- **Product is built.** Capital goes to growth and compliance, not development.
- **Two revenue channels.** C2C provides volume; B2B provides value; Priority Partner provides predictable ARR.
- **No direct competitor.** The combination of P2P carry + enterprise logistics + AI compliance on a diaspora corridor is not replicated.
- **Stripe escrow architecture** reduces regulatory risk significantly compared to platforms that hold money directly.
- **AI compliance engine** scales to new countries without manual rules updates — it is a genuine technology moat.
- **The informal market is already large.** Millions of pounds of goods move on diaspora routes every month through unstructured networks. BootHop is not creating demand; it is capturing it.

---

## Risk & Mitigation

| Risk | Mitigation |
|------|-----------|
| Regulatory (customs, data, FCA) | Legal compliance first in use of funds; Stripe escrow removes money-holding risk |
| Trust / fraud | KYC + escrow + contact gating + dual-confirmation delivery + AI compliance screening |
| C2C supply (not enough travellers) | B2B channel provides parallel revenue not dependent on C2C supply |
| B2B sales cycle length | Priority Partner retainer creates immediate large-ticket revenue; B2B pricing at £300+ makes small number of clients high-value |
| AI compliance accuracy | Anthropic Claude API; restricted items go to human admin review queue — AI assists, human approves |
| KYC cost at scale | £25,000 reserve in use of funds; in-house OCR scoped as cost reduction path |
| Competition from incumbents | No incumbent has diaspora-specific trust pipeline + AI customs + enterprise retainer model in one product |

---

## Traction

BootHop has not spent a pound on paid marketing. Everything below was built organically.

| Signal | Detail |
|--------|--------|
| Completed deliveries | 2 real end-to-end deliveries facilitated through the platform between real users. Evidenced by WhatsApp message records. The product works in production — goods moved, parties coordinated, delivery confirmed. |
| Active listings | Users have signed up and posted live adverts on the platform. Supply side is building organically. |
| TikTok community | 3,800 followers — organic, zero paid promotion. A logistics startup attracting this audience before advertising spend is evidence of genuine market pull in the diaspora community. |
| Development cost | £0 external. The entire technical asset — C2C marketplace, B2B portal, AI compliance engine — was built by the founder alone. |
| Time in market | 12–13 years of concept refinement, industry observation, and problem research before and during development. |
| B2B portal | Live and accepting job submissions. |
| AI compliance engine | Live across 20 countries. |
| Priority Partner tier | Live — applications open at £10,000–£15,000/year. |

**On the completed deliveries:** Payment was not collected on these transactions — they were early proof-of-concept runs to validate the end-to-end flow. The significance is not the revenue (zero) but the proof: real people found BootHop, posted journeys, matched, coordinated, and completed a delivery. The platform worked as designed in a live environment, without the founder being involved in the handoff.

The 3,800 TikTok followers represent a pre-marketing diaspora audience who chose to follow a logistics platform without incentive. When advertising spend is applied, this community is the first wave of activated users — already warm, already aware.

---

## Founder

BootHop was conceived, designed, and built entirely by its founder — a solo technical founder with over 30 years of directly relevant professional experience spanning international logistics, aerospace, pharmaceutical supply chain, enterprise banking infrastructure, and financial services.

This is not a generalist with adjacent experience. Every vertical in BootHop's B2B product — aerospace, engineering, pharma, financial services — maps to a named institution the founder has worked with directly.

---

### Aerospace & Engineering (B2B AOG Vertical)

**Boeing** and **Rolls-Royce** — two of the world's most demanding aerospace organisations. The founder has direct knowledge of aerospace operations and the Aircraft-on-Ground (AOG) problem. BootHop's B2B portal pricing model (critical delivery lanes, 2-hour response guarantee, hand-carry international) was built by someone who understands what AOG actually costs and how parts movement works at the enterprise level.

**AGCO** — global agricultural machinery and engineering manufacturer. Direct exposure to spare parts logistics in heavy engineering — the same problem BootHop's engineering/manufacturing B2B vertical solves.

---

### Pharmaceutical & Retail Logistics (B2B Pharma Vertical)

**Boots / Walgreens Boots Alliance (WBA)** — one of the UK's largest pharmaceutical and retail chains. Direct operational knowledge of pharmaceutical supply chain requirements: temperature-sensitive goods, regulatory compliance, time-critical delivery, documentation standards. The pharma vertical in BootHop's B2B portal was not designed from research — it was designed from experience.

---

### Banking & Financial Infrastructure

**HSBC** — At DHL, the founder managed the physical logistics of time-critical financial documents for HSBC, one of the world's largest banks. This required understanding of secure handling, chain of custody, compliance protocols, and the intersection of financial services with physical logistics — directly informing BootHop's approach to document handling, KYC compliance, and B2B financial sector clients.

**Credit Suisse** and **UBS** — two of the world's largest investment banks. Enterprise-level financial services experience across both institutions.

**Centrac Loan Management System** — a core banking platform deployed across 20+ financial institutions. The founder worked on infrastructure used by more than twenty banks simultaneously. This is the source of BootHop's unusually sophisticated financial architecture: Stripe escrow design, KYC audit trails, compliance queues, admin payment controls, and dual-confirmation release logic are not features a typical startup founder builds — they reflect deep knowledge of how financial systems work at scale.

**Mortgage industry** — structured financial product knowledge, directly applicable to BootHop's insurance product design and the escrow/release model.

---

### Courier, Logistics & Tracking Systems

**DHL — Founding Member, Aviation Hub System (AHS)**

The founder was one of the founding members of the **Aviation Hub System (AHS)** at DHL — a tracking and trace platform that monitors goods from the point of pickup through to final delivery across international air routes.

Beyond tracking, the team developed an **Advance Shipment Manifest (ASM)** — a system that pre-notifies customs authorities of goods in transit before the aircraft lands. This means:
- Customs officers are informed of incoming goods while they are still in the air
- Import duty assessments are prepared in advance
- Owners can arrange payment of duties before arrival
- Clearance is faster, delays are reduced, and delivery windows shrink significantly

This was not a feature the founder used — it was a system the founder helped create at one of the world's largest logistics companies.

**Both concepts are now embedded directly in BootHop.**

BootHop's AI customs compliance engine pre-screens every item before a match is made — not after goods arrive at a border. The declared value, destination country, and item category are assessed upfront, duty estimates are surfaced, required documents are listed, and restricted items are flagged for review before any transaction proceeds. This is the same architectural principle as the AHS/ASM system: move the compliance conversation to the earliest possible point in the journey, so that by the time goods are in transit, everything is already prepared.

The founder did not read about this approach. They invented it at DHL and rebuilt it — improved, AI-powered, and accessible to individuals — inside BootHop.

---

### Media & Large-Scale Enterprise Operations

**BBC** — one of the UK's largest organisations. Enterprise procurement, operations, and large-scale project delivery experience.

---

### What This Means for Investors

Most pre-seed startups require three people to do what one founder has done here: a technical co-founder to build the product, a domain expert to validate the market, and an operator to design the workflows.

BootHop has all three in one person. The capital raised does not need to fund a development team — the entire platform was built by the founder alone at zero external cost. Every investment pound goes into compliance, growth infrastructure, and the two hires that free the founder to focus on scaling.

The B2B portal does not guess at what aerospace, pharma, or engineering clients need. It was built by someone who has worked alongside Boeing, Rolls-Royce, AGCO, and Boots. The financial architecture does not approximate how payment systems should work — it was built by someone who has shipped core banking infrastructure to 20+ institutions.

**Due diligence assets available:** Corporate project documentation across named institutions. WhatsApp-evidenced transaction records from completed platform deliveries.

---

The informal diaspora delivery network is real, it is large, and it is entirely unstructured. Enterprise clients pay £10,000+ per hour in downtime waiting for a part that should have been hand-carried on a morning flight. BootHop solves both — built by the one person who had the experience to see both problems clearly, and the technical ability to solve them alone.

---

## Contact

**Website:** boothop.co.uk
**Email:** admin@boothop.com
**Support:** support@boothop.co.uk

---

*This document is confidential and intended solely for the named recipient. It does not constitute a financial promotion under the Financial Services and Markets Act 2000. BootHop is a pre-revenue platform. All financial projections are illustrative. Past traveller journeys do not guarantee future platform volumes.*

*© 2026 BootHop. All rights reserved.*
