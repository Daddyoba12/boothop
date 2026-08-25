"""
BootHop Platform Reference - Version 2  (August 2025)
Produces THREE PDFs:
  Doc 1  -  Public & User Pages (web)
  Doc 2  -  Business Portal, Admin & Internal Tools (web)
  Doc 3  -  Mobile App Reference (iOS & Android)
Emails all three to oluwatoyinb@yahoo.com via Gmail SMTP.
"""

import smtplib
import sys
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email.mime.text import MIMEText
from email import encoders
from fpdf import FPDF

# ?? Colour palette ?????????????????????????????????????????????????????????????
NAVY   = (2, 6, 23)
DARK   = (12, 30, 61)
BLUE   = (37, 99, 235)
LIGHT  = (219, 234, 254)
WHITE  = (255, 255, 255)
GRAY   = (100, 116, 139)
LGRAY  = (241, 245, 249)
GREEN  = (16, 185, 129)
AMBER  = (245, 158, 11)
PURPLE = (124, 58, 237)
RED    = (220, 38, 38)
TEAL   = (20, 184, 166)


# ?? Base PDF class ?????????????????????????????????????????????????????????????
class Doc(FPDF):
    def __init__(self, title):
        super().__init__('P', 'mm', 'A4')
        self.doc_title = title
        self.set_auto_page_break(auto=True, margin=18)

    def header(self):
        self.set_fill_color(*NAVY)
        self.rect(0, 0, 210, 14, 'F')
        self.set_font('Helvetica', 'B', 9)
        self.set_text_color(*WHITE)
        self.set_xy(10, 3)
        self.cell(100, 8, 'BootHop  |  ' + self.doc_title + '  |  v2.0')
        self.set_xy(110, 3)
        self.cell(90, 8, 'www.boothop.com', align='R')
        self.ln(12)

    def footer(self):
        self.set_y(-12)
        self.set_font('Helvetica', '', 7)
        self.set_text_color(*GRAY)
        self.cell(0, 8, f'Page {self.page_no()}  |  Confidential  -  BootHop Ltd  |  Version 2.0  -  August 2025', align='C')

    # ?? Cover page ?????????????????????????????????????????????????????????????
    def cover(self, subtitle, desc_lines, badge_texts=None):
        self.add_page()
        self.set_fill_color(*DARK)
        self.rect(0, 14, 210, 72, 'F')
        self.set_fill_color(*BLUE)
        self.rect(0, 82, 210, 4, 'F')

        self.set_font('Helvetica', 'B', 38)
        self.set_text_color(*WHITE)
        self.set_xy(0, 26)
        self.cell(210, 14, 'BootHop', align='C')

        self.set_font('Helvetica', '', 12)
        self.set_text_color(180, 200, 240)
        self.set_xy(0, 46)
        self.cell(210, 8, 'UK Peer-to-Peer Delivery Marketplace  |  www.boothop.com', align='C')

        self.set_font('Helvetica', 'B', 17)
        self.set_text_color(*WHITE)
        self.set_xy(0, 60)
        self.cell(210, 10, subtitle, align='C')

        self.set_font('Helvetica', '', 8)
        self.set_text_color(*LIGHT)
        self.set_xy(0, 88)
        self.cell(210, 8, 'Version 2.0  |  August 2025  |  Confidential  -  Internal Use Only', align='C')

        # What is BootHop  -  overview block
        self.set_xy(15, 104)
        self.set_fill_color(*LGRAY)
        self.rect(15, 102, 180, 8, 'F')
        self.set_font('Helvetica', 'B', 9)
        self.set_text_color(*DARK)
        self.set_xy(18, 103)
        self.cell(170, 6, 'WHAT IS BOOTHOP?')
        self.set_font('Helvetica', '', 9)
        self.set_text_color(51, 65, 85)
        self.set_xy(15, 113)
        self.multi_cell(180, 5,
            'BootHop is a UK-registered peer-to-peer delivery marketplace that connects Hoopers '
            '(people who need goods transported) with Booters (travellers with spare luggage capacity). '
            'Instead of paying for a courier, senders pay travellers who are already flying or driving '
            'the route  -  achieving 60-80% savings while travellers earn extra income on trips they were '
            'already making.\n\n'
            'BootHop handles the full logistics chain: item posting, AI safety checks, KYC identity '
            'verification, in-app messaging, a tamper-evident QR seal system, real-time delivery '
            'tracking, and manual escrow payment release. A Business Portal serves SMEs needing '
            'same-day or priority deliveries, and a Priority Partner tier provides SLA-backed enterprise '
            'logistics with dedicated carriers. The platform operates across the web (boothop.com) and '
            'via native iOS/Android apps (BootHop Mobile v1.2.0).')

        # Stat badges
        badges = badge_texts or []
        bx = 15
        self.set_xy(bx, 183)
        for label, val in badges:
            self.set_fill_color(*BLUE)
            self.rect(bx, 183, 54, 18, 'F')
            self.set_font('Helvetica', 'B', 13)
            self.set_text_color(*WHITE)
            self.set_xy(bx, 184)
            self.cell(54, 9, val, align='C')
            self.set_font('Helvetica', '', 7)
            self.set_text_color(180, 210, 255)
            self.set_xy(bx, 193)
            self.cell(54, 6, label, align='C')
            bx += 58

        # What's in this document
        self.set_xy(15, 210)
        self.set_fill_color(*LGRAY)
        self.rect(15, 208, 180, 8, 'F')
        self.set_font('Helvetica', 'B', 9)
        self.set_text_color(*DARK)
        self.set_xy(18, 209)
        self.cell(170, 6, "WHAT'S IN THIS DOCUMENT")
        self.set_font('Helvetica', '', 9)
        self.set_text_color(51, 65, 85)
        self.set_xy(15, 220)
        for line in desc_lines:
            self.set_xy(15, self.get_y())
            self.cell(5, 5, '-')
            self.set_xy(20, self.get_y())
            self.multi_cell(175, 5, line)

    # ?? Section heading ?????????????????????????????????????????????????????????
    def section_heading(self, text, colour=BLUE):
        self.ln(4)
        self.set_fill_color(*colour)
        self.rect(10, self.get_y(), 190, 9, 'F')
        self.set_font('Helvetica', 'B', 10)
        self.set_text_color(*WHITE)
        self.set_x(14)
        self.cell(180, 9, text.upper())
        self.ln(11)

    def sub_heading(self, text):
        self.ln(2)
        self.set_font('Helvetica', 'BI', 9)
        self.set_text_color(*GRAY)
        self.set_x(12)
        self.cell(180, 6, text)
        self.ln(7)

    # ?? Route / screen row ??????????????????????????????????????????????????????
    def route_row(self, url, audience, description, note=None):
        self.set_font('Helvetica', '', 8)
        line_h = 4.2
        chars_per_line = int(88 / (8 * 0.35))
        desc_lines = max(1, -(-len(description) // chars_per_line))
        note_lines = max(1, -(-len(note) // int(88 / (7 * 0.35)))) if note else 0
        row_h = max(9, desc_lines * line_h + (note_lines * 3.5 if note else 0) + 5)

        if self.get_y() + row_h > 272:
            self.add_page()

        y = self.get_y()

        # URL pill (left 70mm)
        self.set_fill_color(*LGRAY)
        self.set_font('Helvetica', 'B', 7)
        self.set_text_color(*DARK)
        self.set_xy(10, y + 1)
        self.cell(68, 6, url[:42], fill=True)

        # Audience badge (26mm)
        if audience == 'Admin':
            badge_col = RED
        elif audience == 'Business':
            badge_col = AMBER
        elif audience == 'Mobile':
            badge_col = TEAL
        elif 'Carrier' in audience:
            badge_col = (59, 130, 246)
        else:
            badge_col = GREEN
        self.set_fill_color(*badge_col)
        self.set_text_color(*WHITE)
        self.set_font('Helvetica', 'B', 6)
        self.set_xy(80, y + 2)
        self.cell(26, 5, audience, fill=True, align='C')

        # Description (right 96mm)
        self.set_text_color(51, 65, 85)
        self.set_font('Helvetica', '', 8)
        self.set_xy(108, y + 1)
        self.multi_cell(96, line_h, description)
        desc_bottom = self.get_y()

        if note:
            self.set_xy(108, desc_bottom)
            self.set_font('Helvetica', 'I', 7)
            self.set_text_color(*GRAY)
            self.multi_cell(96, 3.5, note)
            row_bottom = self.get_y()
        else:
            row_bottom = desc_bottom

        row_bottom = max(row_bottom, y + 9)
        self.set_draw_color(226, 232, 240)
        self.line(10, row_bottom + 1, 200, row_bottom + 1)
        self.set_y(row_bottom + 3)


# ??????????????????????????????????????????????????????????????????????????????
# WEB PAGE DATA  (Document 1  -  Public & User)
# ??????????????????????????????????????????????????????????????????????????????

PUBLIC_PAGES = [
    ('/', 'User',
     'Homepage: The primary entry point for all visitors. Displays live journey availability stats (active carriers, live routes), a role switcher (Send / Travel / Business), animated how-it-works overview, social proof testimonials, trust signals (KYC badge, escrow badge, AI safety badge), featured routes, and a prominent sign-up call-to-action. The page is dynamically rendered with live data from Supabase.',
     'SEO-optimised with structured data markup. Loads live journey count and top routes from the public API.'),

    ('/how-it-works', 'User',
     'How It Works: Full visual explainer of the BootHop peer-to-peer delivery process. Covers both the Hooper (sender) and Booter (carrier) perspectives across 6 illustrated steps: Post Item  ->  Find a Match  ->  Agree Terms  ->  KYC & Compliance Check  ->  Carrier Collects & Seals  ->  Delivery Confirmed & Funds Released.',
     'Includes a 30-second explainer video embed and downloadable one-page summary.'),

    ('/pricing', 'User',
     'Pricing Page: Transparent, calculator-style pricing page. Explains the platform commission structure (currently 5% of the agreed reward), shows example scenarios (small parcel Lagos -> London = £45 reward, sender pays £47.25), and compares BootHop costs against courier alternatives. No hidden fees.',
     'Pricing is subject to change. Business portal pricing is on a separate /business/pricing page.'),

    ('/about', 'User',
     'About BootHop: Company story, founding vision ("What if you could ship a parcel on the next flight for the price of a coffee?"), mission statement, UK company registration details (Companies House), and founding team profiles. Includes an interactive timeline from founding to current milestones.',
     'Registered in England & Wales. Company details verified and displayed for trust.'),

    ('/contact', 'User',
     'Contact Us: Multi-channel contact page with a web form (routed to info@boothop.com via Resend), direct email link, UK phone number, WhatsApp quick-link, and office address. Form fields: Name, Email, Subject, Category (Support / Business / Press / Other), Message. Submissions trigger an auto-reply and admin email.',
     'WhatsApp link uses dynamic number from WHATSAPP_NUMBER env var to avoid hardcoding.'),

    ('/help', 'User',
     'Help Centre: Searchable FAQ library organised into categories: Getting Started, Sending Items, Carrying Items, Payments & Refunds, Disputes & Cancellations, KYC & Identity, Customs & Compliance, Mobile App. Each answer links to the relevant platform page for direct action. Expandable accordion format.',
     None),

    ('/guide', 'User',
     'User Guide: Comprehensive written guide (8,000+ words) covering the complete end-to-end user journey from registration to delivery. Includes: how matching works, what to do when matched, KYC steps, how to seal a package, tracking your delivery, confirming receipt, and how escrow release works. Also covers prohibited items, customs advice, and dispute process.',
     'This is the authoritative help document  -  all support staff reference this first.'),

    ('/trust-safety', 'User',
     'Trust & Safety Hub: Detailed explanation of every safety mechanism built into BootHop. Covers: mandatory KYC identity verification (Stripe Identity) before funds release, AI-powered pre-flight item safety check (Claude AI), tamper-evident QR package seal, in-app escrow (funds held until both parties confirm delivery), content-filtered messaging (no phone numbers shared until payment confirmed), and dispute resolution process.',
     'This page is critical for user confidence. Updates here require legal review.'),

    ('/carrier-agreement', 'User',
     'Carrier Agreement: Full legal agreement that all carriers must read and formally accept before making their first delivery. Covers: carrier responsibilities, prohibited item list, packaging standards, liability limits, KYC compliance obligation, insurance guidance, and BootHop\'s right to suspend or ban carriers for violations. Electronically signed via /carrier/accept.',
     None),

    ('/edi-policy', 'User',
     'Equality, Diversity & Inclusion Policy: Public-facing EDI policy statement. Covers BootHop\'s commitment to equal treatment of users regardless of background, race, religion, gender, or disability. Includes reporting mechanism for discriminatory behaviour.',
     None),

    ('/terms', 'User',
     'Terms of Service: Full platform terms and conditions (T&Cs) governing use of boothop.com and the mobile app. Covers: user eligibility, prohibited uses, payment terms, intellectual property, dispute resolution process, limitation of liability, governing law (England & Wales), and account termination clauses. Last updated August 2025.',
     None),

    ('/privacy', 'User',
     'Privacy Policy: GDPR-compliant privacy policy explaining what personal data is collected (name, email, phone, ID documents, device data), how it is used, legal basis for processing, retention periods, who it is shared with (Supabase, Stripe, Resend, Anthropic AI), how to exercise data rights (access, erasure, portability), and DPO contact details.',
     None),

    ('/cookie-policy', 'User',
     'Cookie Policy: Explains all cookie categories used on boothop.com: Strictly Necessary (session, CSRF), Analytics (Google Analytics GA4), Functionality (preferences). Lists specific cookie names, purposes, and lifetimes. Includes a cookie consent management component  -  users can accept or reject non-essential cookies.',
     None),
]

AUTH_PAGES = [
    ('/login', 'User',
     'Login Page: Passwordless email OTP login. User enters their registered email address and clicks "Send Code". They receive a 5-character code (4 digits + 1 letter) by email. Valid for 10 minutes. On success, issues a signed JWT cookie (boothop_session, 7-day TTL). Failed attempts are rate-limited (5 attempts per 15 minutes per IP).',
     'Uses custom JWT session cookies  -  NOT Supabase Auth. Cookie: boothop_session. Business portal uses boothop_biz_session.'),

    ('/register', 'User',
     'Registration Page: New user sign-up form. Collects: Full Name, Email Address, Phone Number (international format), and Role Selection (Sender / Carrier / Both). On submit, checks for existing account, sends OTP verification email via Resend, creates a draft user record. No password required  -  the OTP proves email ownership.',
     None),

    ('/verify', 'User',
     'OTP Verification Page: Code entry screen. User enters the 5-character code from their email. Shows a 10-minute countdown timer. Incorrect code shows an error with remaining attempts. On success, marks the user as verified, issues the session cookie, and redirects to /intent (role selection) for new users or the last page for returning users.',
     None),

    ('/intent', 'User',
     'Role Intent Screen: Post-login screen shown to new users or users who have not selected a role. Two large action cards: "I want to SEND something" (routes to /requests/create or /hooper-dashboard) and "I want to CARRY something and earn" (routes to /journeys/create or /booter-dashboard). Selection is saved to the user record.',
     None),

    ('/start', 'User',
     'Quick Start Wizard: Multi-step guided form to create the first request or journey without knowing the full platform. Steps: (1) Choose role, (2) Enter route (from/to), (3) Pick travel date, (4) Describe item size, (5) Set budget. At the end, the wizard creates a draft record and guides the user to complete it.',
     None),
]

HOOPER_PAGES = [
    ('/send', 'User',
     'Send an Item  -  Landing Page: Marketing hub for senders (Hoopers). Hero section with live carrier count and active routes. Explains cost savings vs. couriers, social proof testimonials from senders, and a quick cost estimator widget. Large CTA buttons direct to /requests/create (post an item) or /journeys (browse available carriers). SEO-optimised for keywords like "peer-to-peer parcel delivery UK".',
     None),

    ('/send/uk-same-day', 'User',
     'UK Same-Day Delivery  -  Landing Page: SEO-targeted page for domestic same-day delivery within the UK. Features available carrier cards on UK routes, estimated delivery windows, and pricing examples. Directs users to post a same-day request. Targets searches like "same day delivery courier UK alternative".',
     None),

    ('/send/uk-to-europe', 'User',
     'UK to Europe Delivery  -  Landing Page: Landing for UK-to-EU route requests. Highlights customs advice specific to post-Brexit trade, popular EU routes (UK-France, UK-Germany, UK-Netherlands), carrier profiles, and example delivery stories. Links to the customs guide for EU-bound items.',
     None),

    ('/send/working-away', 'User',
     'Working Away  -  Delivery Landing Page: Targeted at professionals living or working abroad who need items from home (medication, documents, food, clothing). Shows popular routes and carrier availability. Human interest copy and testimonials from diaspora users. CTA posts a request on their home-to-current-country route.',
     None),

    ('/send/student-delivery', 'User',
     'Student Delivery  -  Landing Page: Student-specific landing page targeting university cities. Showcases how students use BootHop to have items sent by family when visiting home or starting term. Shows popular routes (Lagos -> Manchester, Delhi -> London, Accra -> Birmingham). CTA for parents to post a request.',
     None),

    ('/send/business-urgent', 'User',
     'Business Urgent Delivery  -  Landing Page: B2B-adjacent page for businesses needing same-day or next-flight urgent delivery of documents, samples, or spare parts. Differentiates from the full Business Portal  -  aimed at one-off urgent jobs rather than ongoing accounts. Shows typical turnaround times and case studies.',
     None),

    ('/send/[cityroute]', 'User',
     'City Route Dynamic Landing Pages (110+ pages): Dynamic SEO pages for specific city pairs (e.g. /send/london-to-lagos, /send/dubai-to-accra). Each page shows live carrier availability on that route, average delivery time, typical pricing, and a pre-filled "Post Request" button. Slug is resolved by the routing API.',
     'Examples: /send/london-to-lagos, /send/accra-to-london, /send/toronto-to-abuja. Auto-generated for all active routes.'),

    ('/requests/create', 'User',
     'Create Delivery Request Form: The primary sender workflow entry point. A multi-step form collecting: Item Name, Description, Category (documents, clothing, electronics, food, other), Dimensions (L x W x H cm), Weight (kg), Declared Value (GBP), Origin City & Country, Destination City & Country, Preferred Delivery Date, Reward Offer (GBP). AI safety check fires automatically for international routes on item name entry. The submission creates a request record in Supabase and triggers matching logic.',
     'Prohibited items are blocked at submission. The AI check is advisory  -  admin always reviews flagged items.'),

    ('/requests', 'User',
     'Browse Delivery Requests Marketplace: Public marketplace of all open (unmatched) delivery requests posted by Hoopers. Carriers (Booters) browse, filter, and claim requests. Filter options: Origin City, Destination City, Date Range, Item Category, Max Weight, Min Reward. Each card shows: item description (not exact  -  redacted until matched), route, date, weight, and reward. Claim button opens a confirmation flow.',
     'Item descriptions are partially hidden pre-match to prevent direct contact bypass.'),

    ('/hooper-dashboard', 'User',
     'Hooper (Sender) Dashboard: Personal control centre for senders. Shows: Active Matches (with status chip and action buttons), Posted Requests (open, awaiting carrier), Completed Deliveries (history with ratings), and a Spending Summary (total paid, in-escrow amount). Each match card links to /matches/[id]. Notifications panel shows pending actions (e.g. "Confirm your item has arrived").',
     None),

    ('/checkout/[matchId]', 'User',
     'Payment Checkout Page: The escrow payment submission page. Shows the agreed reward amount + BootHop commission breakdown. Payment is MANUAL  -  sender completes a guided form with bank transfer reference or submits proof of payment. Funds are NOT processed by Stripe here (Stripe is only used for KYC). On submit, match status moves to payment_processing, admin receives an email alert to confirm receipt.',
     'Manual escrow model. No card processing at this step. Admin must confirm receipt before status advances to active.'),

    ('/payment/success', 'User',
     'Payment Confirmed Page: Success screen shown after payment submission. Confirms BootHop has received the payment request. Shows: reference number, expected confirmation timeline (1-2 business hours during UK business hours), next steps, and a link back to /matches/[id] to monitor status. Sends a confirmation email to the sender.',
     None),
]

BOOTER_PAGES = [
    ('/journeys', 'User',
     'Live Journeys Marketplace: Browse all active carrier journeys posted by Booters. Each card shows: Origin  ->  Destination, Departure Date, Arrival Date, Available Capacity (kg), Price per kg, Airline (where disclosed), and carrier rating. Filter sidebar: Departure City, Destination City, Date Range, Min Capacity, Max Price. Clicking a journey card opens a summary modal with an "Express Interest" button to initiate a match.',
     None),

    ('/journeys/create', 'User',
     'Post a Journey Form: The primary carrier (Booter) entry point. Multi-step form collecting: Origin City & Country, Destination City & Country, Departure Date, Arrival Date, Airline, Flight Number (optional), Spare Capacity (kg), Price per kg (GBP), Item Restrictions (free text). For international routes, an inline AI route compliance panel appears automatically after 800ms idle  -  it fires a real-time check to Claude AI via /api/ai/safety-check and displays PERMITTED / RESTRICTED / PROHIBITED results. Submitting creates a journey record and makes it visible in the marketplace.',
     'AI check uses real-time country customs knowledge  -  NAFDAC (Nigeria), HMRC (UK), CBP (US), CITES (endangered species), etc. Admin is notified by email on any REVIEW_REQUIRED verdict.'),

    ('/booter-dashboard', 'User',
     'Booter (Carrier) Dashboard: Personal control centre for carriers. Shows: Active Deliveries (with status chip and action buttons), Your Posted Journeys (open, accepting requests), Completed Deliveries (history with ratings and earnings), and an Earnings Summary (total earned, pending release). KYC status is shown prominently  -  carriers are prompted to complete KYC if verification is pending for an active match.',
     None),
]

MATCH_PAGES = [
    ('/matches/[id]', 'User',
     'Match Detail Page: The central hub for a confirmed match. Shows: Match Status Timeline (matched  ->  agreed  ->  committed  ->  kyc_pending  ->  kyc_complete  ->  payment_processing  ->  active  ->  delivery_confirmed  ->  completed), Sender and Carrier profile summaries, Item details, Delivery route and dates. Action buttons change based on role and status (e.g. "Agree to Terms", "Commit to Delivery", "Confirm Receipt"). Tabs: Overview, Chat, KYC, Declaration, Tracking. All sub-flows (declaration, inspection, seal) link out from this page.',
     'Status badge colours: grey=matched, blue=agreed, amber=committed, orange=kyc_pending, purple=active, green=completed, red=cancelled.'),

    ('/matches/[id]/declare', 'User',
     'Item Declaration Form: Formal customs declaration required before payment is released. Fields: Item Category (dropdown with 40+ customs categories), Detailed Description, Country of Origin, Declared Value (GBP), Number of Items, Is it a Gift? (yes/no), Prohibited Items Checklist (carrier must confirm item does not contain 15 categories of restricted goods), Legal Acknowledgement (digital signature). Can be saved as draft. Evidence uploads (photos of the item) are attached here.',
     'Required for all matches. Incomplete declarations block escrow release. Admin reviews all international declarations.'),

    ('/matches/[id]/inspection', 'User',
     'Carry-On Inspection Confirmation: Screen where the carrier confirms they have physically inspected the item before accepting it. Checklist: Packaging is intact, Item matches description, No prohibited items detected, Weight is as declared, Sender was present during inspection. The carrier must tick all boxes and submit. This step is logged with a timestamp and creates an audit trail. If inspection fails any point, the carrier can flag the issue and the match enters a disputed state.',
     None),

    ('/matches/[id]/seal/print', 'User',
     'Print Seal / QR Label: Generates a unique tamper-evident QR code seal for the package. The QR code contains an encrypted token linked to this specific match. Printing instructions are provided for standard A6 label printers or plain paper. The QR label is attached to the package by the sender in the presence of the carrier. Scanning the QR code at delivery confirms handover and is logged as a blockchain-style audit event.',
     'QR token is one-time use and match-specific. Scanning logs the time, GPS location, and device ID.'),

    ('/messages', 'User',
     'All Messages Inbox: Unified messaging inbox listing all active and historical match conversations. Each thread shows: other party\'s name (redacted pre-payment), match route, last message preview, unread count badge, and match status chip. Threads are sorted by most recent activity. Content filtering is active throughout  -  phone numbers, emails, and social handles are detected and masked until payment is confirmed.',
     'Message filtering uses regex + AI pattern detection for contact detail extraction attempts.'),

    ('/messages/[matchId]', 'User',
     'Match Chat Thread: Full in-app messaging thread between sender and carrier for a specific match. Real-time via Supabase Realtime subscriptions. Shows message history, delivery read receipts, and system events (e.g. "Payment confirmed by admin  -  full contact details now shared"). Photo attachment is supported for sharing packing photos. Content filter runs on every message before delivery.',
     None),

    ('/track/[matchId]', 'User',
     'Live Delivery Tracking: Real-time tracking screen for an active delivery. Shows: interactive map with carrier\'s last known location (updated every 2 minutes via carrier location API), delivery route line, status timeline with timestamps, and estimated arrival window. Also shows: Item sealed status, KYC cleared badge, and one-tap contact button (visible only after payment confirmed). Match must be in "active" status for tracking to display.',
     None),

    ('/commit', 'User',
     'Commit to Delivery: The carrier\'s commitment confirmation page. Reached after KYC is complete and the carrier has physically received the item from the sender. Carrier confirms: "I have received this item, inspected it, and am committed to completing this delivery." Submitting moves the match status from kyc_complete to active and notifies the sender that the carrier is in transit.',
     None),

    ('/confirm', 'User',
     'Confirm Delivery: Dual-confirmation delivery completion page. Both the sender and carrier must separately confirm that the item was delivered. Sender confirms on their side; carrier confirms on theirs. When both confirmations are received, the match moves to delivery_confirmed and admin receives an email prompt to release escrow funds. One-click confirmation links are also sent by email.',
     None),

    ('/ratings/create', 'User',
     'Leave a Rating: Post-delivery rating and review form. Both parties rate each other (1-5 stars) across three dimensions: Reliability, Communication, and Item Safety (senders also rate packaging compliance). Free-text review is optional (max 500 characters). Ratings are public and shown on profile cards in the marketplace. Both parties must rate before reviews are published to prevent bias.',
     None),

    ('/share', 'User',
     'Referral Share Page: Personal referral hub. Shows the user\'s unique referral link and QR code. Share buttons for WhatsApp, Twitter/X, LinkedIn, Facebook, and email. Tracks click-through and sign-up conversion per referral. Referral rewards (credit towards next booking) are shown in the dashboard once a referral converts.',
     None),
]

COMPLIANCE_PAGES = [
    ('/ai-check', 'User',
     'AI Safety Assistant  -  Free Public Tool: A standalone version of the BootHop AI compliance check, available to any visitor without login. User enters: Item Description, Origin Country, Destination Country. Claude AI (claude-sonnet-4-6) analyses the item against real-time country customs rules and returns one of four verdicts: PERMITTED (safe to carry, no restrictions), RESTRICTED (can be carried with conditions  -  documentation required), PROHIBITED (cannot be carried  -  full stop), or REVIEW_REQUIRED (AI is uncertain  -  human review needed). Explanation is shown in plain English with specific references to relevant laws (e.g. NAFDAC Act s.5, UK HMRC Notice 701/21).',
     'Admin receives an email notification for every REVIEW_REQUIRED result, even from unauthenticated users. This powers the main platform safety check too.'),

    ('/kyc', 'User',
     'KYC Overview Page: Plain-English explanation of the Know Your Customer (KYC) identity verification requirement. Explains: why it is required (anti-money laundering, customs compliance, UK regulations), what documents are accepted (passport, driving licence, national ID), what the selfie check involves, typical completion time (2-5 minutes), and what happens if KYC fails. Links to /kyc/[matchId] when a specific match requires verification.',
     None),

    ('/kyc/[matchId]', 'User',
     'KYC Verification Flow: Stripe Identity-powered identity verification tied to a specific match. The carrier completes: (1) Document selection (passport / driving licence / national ID), (2) Front and back photo of the document, (3) Selfie with liveness check, (4) Stripe runs automated verification (30-60 seconds). On pass, match advances to kyc_complete; on fail, admin is notified and carrier can re-attempt after 24 hours. The link is match-specific to prevent KYC gaming.',
     'Stripe Identity handles all biometric data. BootHop receives only a pass/fail result  -  no raw biometric data is stored by BootHop.'),

    ('/kyc/video', 'User',
     'Video KYC Verification: Alternative verification path for carriers who cannot complete the standard Stripe Identity flow (e.g. unsupported document type, accessibility requirements). Carrier records a short video selfie holding their ID document and stating their name and the match ID. Video is reviewed manually by the BootHop compliance team within 4 business hours. Admin is notified by email with a review link.',
     None),

    ('/customs', 'User',
     'Customs Guide: Comprehensive plain-English customs guide covering: UK import/export rules, prohibited and restricted items (full HMRC list), declaration thresholds (what triggers duty), how BootHop handles customs declarations end-to-end, CITES-protected item guidance, food and plant import rules, and country-specific sections (Nigeria/NAFDAC, US/CBP, EU, Canada/CBSA). Written for non-experts.',
     None),

    ('/customs/duties', 'User',
     'Duty Calculator: Interactive tool for estimating import duties and taxes. User selects: Item Category (dropdown), Destination Country, Declared Value (GBP). Tool returns: estimated duty rate (%), estimated total duty payable, whether VAT applies, and any specific exemptions. Data is based on the latest published HMRC and WCO tariff schedules. Disclaimer: estimates only  -  actual duty determined by receiving country customs authority.',
     None),

    ('/carrier/accept', 'User',
     'Accept Carrier Agreement: One-page carrier agreement acceptance flow. Shows a summary of key obligations (no prohibited items, inspection required, KYC mandatory, no direct payment outside platform). Single checkbox: "I have read and agree to the Carrier Agreement." On submit, logs the acceptance with timestamp and IP address to the user record. Required before a carrier can complete their first delivery. Link emailed to new carriers after their first match.',
     None),
]

ACCOUNT_PAGES = [
    ('/dashboard', 'User',
     'Main Dashboard (Smart Redirect): Role-aware dashboard entry point. Detects the user\'s primary role (sender or carrier) and shows the most relevant view. Senders see their active matches with pending actions, posted requests awaiting carriers, and recent delivery history. Carriers see active deliveries, posted journeys, earnings summary, and KYC status. Dashboard also shows system notifications: payment confirmed, review required, delivery reminder.',
     None),

    ('/profile', 'User',
     'My Profile: Account management page. Edit: Full Name, Phone Number, Profile Photo (uploaded to Supabase Storage), Language Preference. View (read-only): Email Address (cannot change after registration), KYC Verification Status, Carrier Agreement Status, Member Since Date. Notification Preferences section: toggle email notifications for match updates, payment events, and promotional messages. Save triggers a Resend confirmation email.',
     None),

    ('/delete-account', 'User',
     'Delete Account: Account deletion request page. User must type "DELETE" to confirm intent. On submit, triggers a GDPR-compliant erasure workflow: anonymises the user record, cancels active matches, sends refund instructions for any escrowed funds, and queues deletion of all personal data within 30 days. Admin is notified of the deletion request. A confirmation email is sent with an undo link valid for 7 days.',
     None),

    ('/delete-data', 'User',
     'Delete My Data (GDPR Erasure): Right-to-erasure request form under GDPR Article 17. User submits their email address and the type of data they want deleted (all data / messages only / delivery history only). Request is logged in the admin panel and must be actioned within 30 days per GDPR. User receives an acknowledgement email with a case reference number.',
     None),
]

BLOG_PAGES = [
    ('/blog', 'User',
     'Blog Home: The BootHop content hub. Lists all published articles in reverse chronological order with featured image, title, excerpt, author name, and publication date. Categories: Customs & Compliance, Delivery Tips, Travel Logistics, BootHop Updates, Industry News. Sidebar shows popular articles, tag cloud, and a newsletter sign-up widget. Articles are fetched from Blogger CMS via the Blogger API.',
     None),

    ('/blog/customs-clearance-services', 'User',
     'Blog: What Are Customs Clearance Services? Explains how traditional customs brokers work, why they are expensive, and how BootHop\'s AI-assisted declaration and carrier-based model simplifies clearance for small shipments under de minimis thresholds. Includes a comparison table of clearance costs.',
     None),

    ('/blog/small-business-cross-border-shipping', 'User',
     'Blog: Cross-Border Shipping for Small Businesses: A practical guide for UK SMEs on how to reduce international shipping costs using peer-to-peer delivery. Covers: when BootHop is suitable, how to declare goods for business use, VAT implications, and how to use the Business Portal for higher volumes.',
     None),

    ('/blog/on-board-courier-time-critical-logistics', 'User',
     'Blog: On-Board Courier  -  The Secret of Time-Critical Logistics: Explains the on-board courier (OBC) model where a traveller hand-carries urgent items. BootHop automates this through the platform. Includes case studies from BootHop deliveries: a spare part for a manufacturing line flown from Birmingham to Lagos in 18 hours.',
     None),

    ('/blog/[slug]', 'User',
     'Blog Post (Dynamic): Dynamic template that renders any Blogger article by slug. Fetches content via the Blogger API (BLOGGER_API_KEY). Supports: rich text, embedded images, YouTube video embeds, custom code blocks. Open Graph meta tags are set from article metadata for social sharing previews. Related articles suggested at the bottom.',
     None),
]

FLIGHTS_PAGES = [
    ('/flights', 'User',
     'Flight Search Hub: Browse and search upcoming flights on routes where BootHop carriers are active. Shows a live feed of recently posted carrier journeys grouped by route, along with flight search links (powered by Travelpayouts affiliate integration). Helps travellers discover routes where they can earn by carrying goods on their upcoming flights.',
     'Travelpayouts affiliate integration  -  flight links include affiliate marker for commission.'),

    ('/flights/[route]', 'User',
     'Route Flights Page (Dynamic): Shows all flights and active carrier journeys on a specific route (e.g. /flights/london-lagos). Displays: upcoming flight options (departure times, airlines, duration), active BootHop carriers on this route who have open capacity, typical delivery times for this route, and customs notes specific to the origin/destination country pair.',
     None),

    ('/flights/airlines/[code]', 'User',
     'Airline Detail Page (Dynamic): Airline-specific information page (e.g. /flights/airlines/BA for British Airways). Shows: routes served by this airline, baggage allowance policy (checked and carry-on), BootHop-specific carriage notes (e.g. known restrictions on certain item types), and active BootHop carriers on this airline\'s routes.',
     None),

    ('/flights/airports/[code]', 'User',
     'Airport Detail Page (Dynamic): Airport information page (e.g. /flights/airports/LOS for Lagos Murtala Muhammed). Shows: terminal layout notes, customs contact details, active BootHop journeys departing from this airport, average carrier wait times, and BootHop-specific tips (e.g. NAFDAC inspection desk location at MMIA).',
     None),
]

MISC_PAGES = [
    ('/open', 'User',
     'Universal Deep Link Handler: Processes incoming deep links from emails and push notifications. Parses a returnTo parameter and redirects to the appropriate in-app page (e.g. match detail, declaration form, payment page). Handles auth state  -  if user is not logged in, stores the target URL and redirects to /login, then resumes after successful OTP verification.',
     None),

    ('/open-file', 'User',
     'File Open Handler: Handles opening shared BootHop files from external links. Used for seal QR codes shared via WhatsApp or email. Validates the file reference, checks user auth, and renders the appropriate file view (seal label PDF, declaration receipt, or KYC confirmation letter).',
     None),

    ('/watch', 'User',
     'Watch / Media Page: BootHop video content hub. Hosts explainer videos, carrier success stories, and BootHop promotional content. Videos are embedded from YouTube (via the YouTube API). Autoplay feature cycles through featured content. Optimised for WhatsApp sharing links with Open Graph video preview.',
     None),
]


# ??????????????????????????????????????????????????????????????????????????????
# WEB PAGE DATA  (Document 2  -  Business, Admin & Internal)
# ??????????????????????????????????????????????????????????????????????????????

BUSINESS_PAGES = [
    ('/business', 'Business',
     'Business Portal Home: Marketing landing page for the BootHop Business Portal. Target audience: SMEs, importers/exporters, logistics managers. Features: video testimonial reel from business clients, service comparison table (Standard / Express / Priority Partner), live delivery stats, and a sign-up CTA. Highlights unique selling points: next-flight delivery option, no contract lock-in, real-time tracking, dedicated account manager (Priority tier).',
     None),

    ('/business/how-it-works', 'Business',
     'Business: How It Works: Step-by-step B2B delivery process. Steps: (1) Create a Business Account, (2) Post a Delivery Job (origin, destination, item type, urgency), (3) BootHop matches to an available carrier on the route, (4) Carrier collects and seals the package, (5) Live tracking available throughout transit, (6) Delivery confirmed by recipient  -  invoice generated. SLA timeline shown per urgency tier.',
     None),

    ('/business/pricing', 'Business',
     'Business Pricing Page: Tiered pricing for business accounts. Three tiers: Standard (no monthly fee, per-delivery commission), Express (£99/month, priority matching, 2-hour SLA on UK domestic), Priority Partner (bespoke contract, dedicated carrier pool, volume discounts, API access). Each tier shows included features and a comparison matrix. CTA to /business/get-started.',
     None),

    ('/business/get-started', 'Business',
     'Business Get Started: Onboarding form for new business enquiries. Collects: Company Name, Company Registration Number, Contact Name, Email, Phone, Estimated Monthly Delivery Volume, Primary Route(s), Urgency Requirements. Submission triggers an email to the business sales team (info@boothop.com) and an auto-reply to the enquirer with expected response time (1 business day). Data saved to Commander CRM pipeline.',
     None),

    ('/business/express', 'Business',
     'Express Business Delivery Landing: Targeted page for same-day and next-flight express B2B delivery. Features urgency scenarios: "Your manufacturing line just stopped  -  we\'ll fly the part to you tonight." Shows express delivery case studies and typical turnaround times by route. Contact form for same-day quotes.',
     None),

    ('/business/contact', 'Business',
     'Business Contact: Dedicated contact form for business enquiries, separate from the general /contact page. Routes to the business sales inbox. Fields: Company Name, Name, Email, Phone, Nature of Enquiry (New Account / Existing Account / Partnership / Press), Message. Auto-assigned to a sales team member via Commander CRM.',
     None),

    ('/business/sign-in', 'Business',
     'Business Portal Sign In: Login page for standard business portal accounts using email and password. Uses the separate boothop_biz_session cookie (not the user session cookie). Password login (not OTP) for business continuity. Account is linked to a Company record, not an individual user. Failed login attempts logged.',
     None),

    ('/business/priority-sign-in', 'Business',
     'Priority Partner Sign In: Dedicated login page for Priority Partner accounts. Higher-security login with two-factor option. Priority Partners have access to the enhanced portal at /business/portal/priority with additional SLA monitoring features and dedicated account manager contact details.',
     None),

    ('/business/carrier-sign-in', 'Business',
     'Business Carrier Portal Sign In: Login for carriers registered to work exclusively with business accounts (as opposed to P2P carriers). These are vetted carriers with commercial insurance. Separate auth flow using boothop_biz_session with carrier role.',
     None),

    ('/business/priority-partner', 'Business',
     'Priority Partner Programme: Premium B2B tier landing page. Features: dedicated carrier pool assigned to the account, SLA guarantee (98% on-time delivery or credit), dedicated account manager, custom reporting dashboard, API access for automated job posting, invoicing on 30-day terms. Targets logistics managers and operations directors at mid-size companies.',
     None),

    ('/business/priority-partner/payment', 'Business',
     'Priority Partner Payment: Payment page for the Priority Partner setup/onboarding fee and first month subscription. Payment is processed via Stripe. On successful payment, the business account is upgraded to Priority Partner tier and a welcome email with portal credentials is sent.',
     None),

    ('/business/carrier-network', 'Business',
     'Business Carrier Network: Information page for independent commercial carriers wanting to join the BootHop business carrier network. Eligibility: commercial driving licence or cargo aviation certificate, minimum 6 months delivery experience, valid insurance. Application form: name, contact, vehicle/capacity type, routes, references. Applications reviewed within 3 business days.',
     None),

    ('/business/carrier-network/payment', 'Business',
     'Business Carrier Network Registration Payment: Payment page for the one-time carrier network registration fee. Covers background check, insurance verification, and initial onboarding training. Stripe-processed.',
     None),

    ('/business/portal', 'Business',
     'Business Client Portal (Main Dashboard): The core operational interface for business clients. Features: Post a Job (create a new delivery request with urgency, route, item details), Active Jobs List (status, carrier, estimated delivery time), Job History (search, filter, download), Invoice Centre (download PDF invoices per delivery), Account Settings. Real-time status updates via Supabase Realtime.',
     None),

    ('/business/portal/priority', 'Business',
     'Priority Partner Enhanced Portal: Extended portal for Priority Partner accounts. Additional features vs. standard portal: SLA Dashboard (on-time delivery rate, average delivery time, exceptions), Dedicated Carrier Profiles (view and message assigned carriers directly), Custom Reporting (download delivery reports by date range / route / carrier), API Key Management (generate keys for automated job posting).',
     None),

    ('/business/carrier-portal', 'Business',
     'Business Carrier Portal: Operations hub for carriers on the business network. Shows: Available Business Jobs (filter by route and urgency), Accepted Jobs (with pickup details and SLA clock), In-Progress Deliveries (with status update buttons), Completed History (earnings summary and ratings). Carriers update job status in real time  -  client portal reflects changes instantly.',
     None),
]

ADMIN_PAGES = [
    ('/admin/login', 'Admin',
     'Admin Login: Secure admin portal login. Email + password (hashed, not OTP). Issues a separate admin session cookie (not the user cookie). Rate-limited: 3 failed attempts trigger a 1-hour lockout. All login events are logged to the audit table.',
     'Protected by ADMIN_SECRET environment variable. Admin session cookie is short-lived (4 hours).'),

    ('/admin', 'Admin',
     'Admin Root: Entry redirect to /admin/hub. If the admin session is invalid or expired, redirects to /admin/login.',
     None),

    ('/admin/hub', 'Admin',
     'Admin Operations Hub: The primary daily-operations control panel for the BootHop team. Shows: Pending Compliance Reviews (REVIEW_REQUIRED flags from the AI check), Pending Payment Confirmations (matches waiting for admin to confirm escrow receipt), Matches Awaiting Payment Release (delivery confirmed by both parties), Active Disputes, New Business Enquiries, Platform Stats (today\'s match count, GMV, active journeys). One-click approve/release links in each section.',
     'Primary tool for daily ops. All admin email action links (confirm payment, release funds) route back here.'),

    ('/admin/compliance', 'Admin',
     'Compliance Dashboard: Full list of all compliance flags across the platform. Columns: Match ID, Item Description, Route, Risk Score (0-100), AI Verdict (PERMITTED/RESTRICTED/PROHIBITED/REVIEW_REQUIRED), Category, Flag Date, Status (Pending/Approved/Rejected). Filter by status, date range, and route. Clicking a row opens the full case detail at /admin/compliance/[matchId].',
     None),

    ('/admin/compliance/[matchId]', 'Admin',
     'Compliance Case Detail: Full detail view for a single compliance case. Shows: Item declaration (all fields), Carrier and sender profiles, Match timeline, AI safety check output (verdict, risk score, explanation, specific regulation references), Evidence uploads, Admin Notes text field, and two action buttons: APPROVE (advance match past compliance hold) and REJECT (cancel match, notify both parties, trigger refund process).',
     None),

    ('/admin/customs', 'Admin',
     'Customs Admin Panel: Admin view of all customs declarations submitted by senders on the platform. Filter by: status (pending, reviewed, flagged, approved), declaration date, route, declared value. Admin can: Flag for follow-up, Request additional documentation (triggers email to sender), Approve (mark as cleared), or Escalate to External Verification (routes to a third-party customs broker via the verification providers system).',
     None),

    ('/admin/journeys/[id]', 'Admin',
     'Journey Admin Detail: Admin view of a specific carrier journey. Shows: Carrier profile, Route, Dates, Capacity, All matched requests on this journey with status, Total journey revenue. Admin actions: Cancel Journey (with notification to affected senders), Adjust Capacity, Flag Carrier for Review, View Carrier KYC Record.',
     None),

    ('/admin/verification-providers', 'Admin',
     'Verification Providers Management: Manage third-party verification service providers integrated with BootHop for external compliance checks. Each provider record: Provider Name, Type (KYC / Customs / Insurance Verification), API endpoint, Active/Inactive toggle, Test/Production mode, Last 10 API calls log. Admin can add new providers, rotate API keys, and set priority order for automatic routing.',
     None),

    ('/admin/change-password', 'Admin',
     'Admin Change Password: Allows admin users to change their admin portal password. Requires: current password, new password (min 12 characters, must include uppercase, number, and symbol), confirm new password. Required on first login with a temporary password issued by the system.',
     None),

    ('/admin/business', 'Admin',
     'Business Admin Home: Overview of all business portal activity. Shows: Total Active Business Accounts, Monthly GMV from Business Portal, New Business Enquiries (last 7 days), Accounts Pending Approval, Priority Partner Account Health summary. Links to sub-sections for carriers and ops.',
     None),

    ('/admin/business/carriers', 'Admin',
     'Business Carriers Admin: Manage all carriers on the business carrier network. Table: Carrier Name, Application Date, Status (Pending/Active/Suspended/Rejected), Last Active, Total Jobs Completed, Average Rating. Actions per carrier: Approve Application, Suspend Account, View KYC Record, View Delivery History, Send Message.',
     None),

    ('/admin/business/ops', 'Admin',
     'Business Ops Admin: Real-time operational view of all live business deliveries. Table: Job ID, Client, Carrier, Route, Urgency, Status, SLA Deadline, ETA. Colour-coded SLA alerts: green (on track), amber (at risk), red (breached). One-click escalate button opens a carrier contact panel. Download ops report button exports CSV.',
     None),

    ('/admin/business/priority', 'Admin',
     'Priority Partners Admin: Manage Priority Partner accounts. Table: Company Name, Account Manager, Contract Start, Monthly Volume, SLA Performance (%), Last Invoice, Status. Actions: View SLA Report, Assign/Change Account Manager, Adjust Volume Discount, Suspend Account, Export Contract.',
     None),
]

BFI_PAGES = [
    ('/bfi', 'Admin',
     'BFI Mission Control (BootHop Flight Intelligence): Live operations intelligence dashboard. Real-time view of: all active flight-linked journeys mapped by route, carrier GPS clusters, AI safety flags in the last 24 hours, payment queue depth, and system health indicators (Supabase, Resend, Stripe, WhatsApp API). Designed for a wall-mounted screen in the operations room. Auto-refreshes every 60 seconds.',
     'BFI = BootHop Flight Intelligence. Internal ops codename for the live monitoring system.'),

    ('/bfi/routes', 'Admin',
     'BFI Routes Intelligence: All active and historical delivery routes with performance analytics. For each route: Total Deliveries, Average Delivery Time, Average Reward (GBP), Dispute Rate (%), Compliance Flag Rate (%), Revenue Generated (GBP). Sort by any column. Time-range filter. Exportable as CSV or PDF report.',
     None),

    ('/bfi/logs', 'Admin',
     'BFI Activity Logs: Full audit log of all platform events. Columns: Timestamp, Event Type, Actor (user email or "system"), Target (match/journey/user ID), Detail, IP Address. Event types: match_created, payment_confirmed, compliance_flagged, kyc_passed, seal_activated, delivery_confirmed, dispute_opened, admin_action, cron_run. Filter by event type, actor, date range, and entity.',
     None),

    ('/bfi/alerts', 'Admin',
     'BFI Alert Feed: Real-time alert stream for events requiring human attention. Alert types: Compliance Flag (AI returned REVIEW_REQUIRED), Payment Overdue (payment_processing for > 4 hours), SLA Breach (Priority Partner job overdue), KYC Failure (3rd attempt failed), Dispute Opened, System Error (Resend/Stripe/Supabase API error). Each alert links to the affected record. Alerts can be acknowledged and assigned to a team member.',
     None),

    ('/bfi/analytics', 'Admin',
     'BFI Platform Analytics: Strategic analytics dashboard. Metrics: GMV (Gross Merchandise Value) by week/month/route, Active Users (unique logins per day), Journey-to-Match Conversion Rate, Delivery Success Rate (%), Average Time-to-Match (hours), Revenue Breakdown (commission + business fees + priority partner subscriptions). Charts: line charts for trends, bar charts for route comparison, pie for revenue split. Date range picker.',
     None),

    ('/bfi/reports', 'Admin',
     'BFI Report Generator: Generate and download periodic reports. Report types: Weekly Operations Summary (match count, GMV, issues), Monthly Compliance Report (all flags, outcomes, breach cases), Quarterly Revenue Breakdown (by stream), Carrier Performance Report (delivery rate, ratings, KYC status by carrier), Route Health Report. Reports generated as PDF and emailed to admin email.',
     None),

    ('/bfi/providers', 'Admin',
     'BFI Third-Party Providers: Management interface for external service providers (verification, customs brokers, logistics partners). Shows provider health status (last successful API call, error rate), contract expiry dates, and integration configuration. Used to manage the ecosystem of services that BootHop connects to for compliance and verification.',
     None),

    ('/bfi/airlines', 'Admin',
     'BFI Airline Database Management: Admin management of the BootHop airline database. For each airline: Routes, Baggage Allowance (checked and carry-on, by class), Known Restricted Item Policies, Last Updated Date, Active/Inactive toggle. Admin can update allowances and policies as airlines change their rules. Changes propagate to /flights/airlines/[code] pages.',
     None),
]

COMMANDER_PAGES = [
    ('/commander', 'Admin',
     'Commander CRM Login: Entry login page for the Commander internal client relationship management tool. Separate from the main admin login. Commander is used by the BootHop sales and account management team to track business client pipelines, manage deals, and coordinate onboarding. Login: email + password.',
     'Commander is a bespoke internal CRM built by BootHop for managing the B2B sales pipeline.'),

    ('/commander/dashboard', 'Admin',
     'Commander Dashboard: Sales pipeline overview. Shows: All active clients by deal stage (Lead  ->  Qualified  ->  Demo Booked  ->  Proposal Sent  ->  Contract Signed  ->  Onboarded  ->  Churned), Revenue Forecast (sum of potential deal values by stage), Activity Feed (recent calls, emails, stage changes), and Quick Actions (add new lead, log a call, schedule follow-up). Data displayed as a Kanban board and a data table.',
     None),

    ('/commander/pipeline/[clientSlug]', 'Admin',
     'Client Pipeline Detail: Full CRM record for an individual business client. Sections: Company Profile (name, registration, industry, size), Contacts (multiple contacts per company with roles), Deal Stage and Value, Activity Timeline (every interaction logged with date/time/actor), Notes (free-text, visible to all team members), File Attachments (contracts, proposals), and Next Action (assigned to a team member with due date). Integrates with the business portal  -  shows live portal usage stats for onboarded clients.',
     None),

    ('/commander/music', 'Admin',
     'Commander Music: Internal team music tool embedded in the Commander workspace. Provides background music for the operations team during working hours. Integrates with a streaming service playlist. (Internal morale/culture feature  -  not client-facing.)',
     None),

    ('/commander/change-password', 'Admin',
     'Commander Change Password: Password change flow for Commander portal users. Standard current/new/confirm password form. Hashed with bcrypt. Required for first login.',
     None),

    ('/commander/reset', 'Admin',
     'Commander Password Reset: Self-service password reset for Commander accounts. User enters their registered Commander email, receives a one-time reset link (valid 30 minutes), clicks the link, and sets a new password.',
     None),
]

PIPELINE_PAGES = [
    ('/pipeline/onboard', 'Business',
     'Business Pipeline Onboard Form: Entry form for businesses entering the BootHop sales pipeline  -  typically reached via a direct link from a sales email or the website. Collects: Company Name, VAT Number, Registered Address, Contact Name, Email, Phone, Estimated Monthly Delivery Jobs, Primary Routes, Service Level Required. On submit, creates a new lead record in Commander CRM and triggers a notification to the sales team.',
     None),

    ('/client-onboarding', 'Business',
     'Client Onboarding Flow: Client-facing onboarding steps for new business clients after contract signing. Steps: (1) Set up Business Portal account, (2) Invite additional team members, (3) Configure notification preferences, (4) Post a test delivery job, (5) Confirm bank details for invoicing. Progress is tracked and the account manager is notified when each step is complete.',
     None),

    ('/onboard/admin', 'Admin',
     'Admin Manual Onboarding: Admin tool for manually onboarding new users or business clients when the self-service flow cannot be used (e.g. onboarding at events, corporate accounts requiring manual setup). Admin inputs user details, role, and account type. Triggers the same welcome email sequence as self-service sign-up.',
     None),
]


# ??????????????????????????????????????????????????????????????????????????????
# MOBILE APP DATA  (Document 3  -  iOS & Android)
# ??????????????????????????????????????????????????????????????????????????????

MOBILE_ONBOARD_SCREENS = [
    ('Onboarding Screen', 'Mobile',
     'First-Run Welcome: Shown once on first launch. Animated 3-card carousel explaining BootHop in under 60 seconds: (1) "Send anything, anywhere  -  pay less than a courier", (2) "Earn money on trips you\'re already making", (3) "Verified carriers. Sealed packages. Tracked delivery." Large "Get Started" button leads to Login. Skip button takes directly to the Home tab.',
     'Only shown on first launch. Uses AsyncStorage to track whether onboarding has been seen.'),

    ('Login (auth/login)', 'Mobile',
     'Email OTP Login: User enters their email address. App calls /api/auth/send-otp, which sends a 5-character code by email via Resend. Redirects to the Verify OTP screen. Rate-limited on the server side. If a returnTo parameter was passed (e.g. from a deep link), it is preserved through the auth flow and honoured after login. Back gesture from onboarding is blocked (cannot go back to onboarding once login starts).',
     'Shares the same OTP backend as the web  -  same /api/auth/send-otp endpoint.'),

    ('Verify OTP (auth/verify)', 'Mobile',
     'OTP Code Entry: 5-character input (4 digits + 1 letter). Calls /api/auth/verify-otp. On success, issues a JWT token stored in SecureStore (Expo\'s encrypted on-device key store  -  not AsyncStorage). 10-minute countdown timer shown. "Resend Code" button available after 60 seconds. On success, navigates to the Intent screen (new users) or Home (returning users).',
     'Token stored in SecureStore  -  the mobile equivalent of an httpOnly cookie. Never stored in plain AsyncStorage.'),

    ('Role Intent (auth/intent)', 'Mobile',
     'Choose Your Role: Post-login role selection screen (shown once to new users). Two large tappable cards: "I want to SEND a package" (teal, routes to Request Create), "I want to CARRY and EARN" (blue, routes to Journey Create). Role preference is saved to the user record via /api/users/me/role. Returning users skip this screen.',
     None),
]

MOBILE_TAB_SCREENS = [
    ('Home Tab (tabs/index)', 'Mobile',
     'Home Dashboard: The main landing screen after login. Split view: top half is a hero section with live stats (active carriers, live journeys on popular routes, delivered this week). Bottom half is a smart action panel  -  adapts to the user\'s recent activity. If the user last sent an item: shows their active matches with status chips and quick-action buttons. If the user last carried: shows their posted journeys and earnings total. Unauthenticated users see a marketing version with "Send" / "Earn" action buttons.',
     'Calls /api/dashboard. Shows the most relevant next action based on match status.'),

    ('Journeys Tab (tabs/journeys)', 'Mobile',
     'Browse Carrier Journeys: Full marketplace of active carrier journeys. Each card shows: Origin  ->  Destination, Departure Date, Spare Capacity (kg), Price per kg (GBP), Carrier rating (stars), Airline name if disclosed. Search bar filters live by city name. Pull-to-refresh reloads from /api/journeys. "Express Interest" button on each card initiates a match request. Non-logged-in users are redirected to login on interest expression.',
     None),

    ('Messages Tab (tabs/messages)', 'Mobile',
     'Messages Inbox: Unified inbox of all match chat threads. Each row: other party\'s first name and avatar, route summary (Lagos -> London), last message preview (truncated 50 chars), timestamp, unread badge count. Tapping opens the Chat screen for that match. Content filtering is active  -  phone numbers, emails, and social handles in previews are masked as "***".',
     None),

    ('Profile Tab (tabs/profile)', 'Mobile',
     'My Profile: View and edit profile details. Shows: Avatar (tap to upload from camera roll or take a new photo), Full Name, Email (read-only), Phone Number, KYC Status badge (Unverified/In Progress/Verified), Member Since. Settings section: Notification Preferences (toggle email and push for match updates, payments, promos), Log Out button. Profile photo uploaded to Supabase Storage via /api/users/upload-avatar.',
     None),

    ('Business Tab (tabs/business)', 'Mobile',
     'Business Delivery Tab: Entry point to business delivery features on mobile. Shows: "Book a Business Delivery" CTA (routes to business/book screen), recent business jobs (if user has a linked business account), and promotional content about the Business Portal. Non-business users see a sign-up prompt for the portal.',
     None),
]

MOBILE_JOURNEY_SCREENS = [
    ('Post a Journey (journey/create)', 'Mobile',
     'Post a Carrier Trip: The main carrier (Booter) creation screen. Fields: Origin City, Origin Country (dropdown), Destination City, Destination Country (dropdown), Departure Date (date picker), Arrival Date, Airline, Flight Number (optional), Spare Capacity (kg, numeric), Price per kg (GBP), Notes / Item Restrictions (free text). Submits to /api/journeys via POST. Journey becomes immediately visible in the marketplace. Validation: all required fields, capacity must be > 0, price must be > 0.',
     'AI safety check is wired in. When origin and destination countries differ, a purple AI Route Safety Check panel appears. Carrier types items they are willing to carry and Claude AI returns a verdict (PERMITTED / RESTRICTED / PROHIBITED / REVIEW_REQUIRED) with explanation and risk score after 800ms idle. Calls /api/ai/safety-check - same endpoint as the web.'),

    ('Post a Delivery Request (request/create)', 'Mobile',
     'Post a Package to Send: The sender (Hooper) screen for posting a new delivery request. Fields: Destination City, Destination Country (dropdown), Item Size (segmented picker: Small <1kg / Medium 1-5kg / Large 5-15kg / Extra Large 15kg+), Weight (kg, auto-populated from size selection but editable), Item Description (free text), Reward Offer (GBP), Latest Delivery Date (optional). Submits to /api/trips via POST (type: "request"). On success, shows an alert and navigates back to the Home tab.',
     None),
]

MOBILE_MATCH_SCREENS = [
    ('Match Detail (match/[id])', 'Mobile',
     'Match Hub: Central screen for a confirmed match. Tabs: Details, Chat, Timeline. Details tab shows: match route, item description, agreed reward, departure date, both party profiles (name, rating, KYC badge). Status timeline strip at top shows current status with colour coding. Action buttons below timeline change based on role and status: "Agree to Terms", "Commit to Delivery", "Start KYC", "Open Declaration", "Confirm Delivery". Tapping each action routes to the appropriate screen.',
     'Status progression: matched  ->  agreed  ->  committed  ->  kyc_pending  ->  kyc_complete  ->  payment_processing  ->  active  ->  delivery_confirmed  ->  completed.'),

    ('Item Declaration (declare/[id])', 'Mobile',
     'Customs Item Declaration: Multi-part declaration form with full parity to the web version. Sections: (1) Item Category (40+ HMRC customs categories in a searchable picker), (2) Detailed Description, (3) Country of Origin, (4) Declared Value (GBP), (5) Quantity, (6) Is this a gift? (Yes/No toggle), (7) Prohibited Items Checklist (15 categories: weapons, drugs, currency, etc.  -  each must be explicitly confirmed), (8) Photo Evidence (uses expo-image-picker  -  camera or gallery), (9) Legal Acknowledgement (typed signature). Form can be saved as a draft at any point. Submit calls /api/declarations/[id].',
     'Photo evidence is uploaded via /api/declarations/[id]/evidence. Accepts JPEG, PNG, HEIC up to 10MB per image.'),

    ('Carry-On Inspection (inspect/[id])', 'Mobile',
     'Carrier Inspection Confirmation: Carrier-side screen confirming physical inspection of the item before collection. Checklist with 5 mandatory items (all must be ticked): Packaging is intact and undamaged, Item matches the description provided, No prohibited items detected, Weight is consistent with the declaration, Inspection was conducted in the presence of the sender. Tapping "Confirm Inspection" submits to /api/matches/[id]/inspect and advances match to the next stage.',
     None),

    ('Payment Checkout (checkout/[id])', 'Mobile',
     'Stripe Payment Sheet: Sender-side payment screen. Shows the agreed reward, BootHop commission (5%), and total amount. Uses Stripe React Native SDK (useStripe hook) with a native payment sheet. Calls /api/checkout/[matchId] to get a Stripe PaymentIntent client secret, ephemeral key, and customer ID. The Stripe payment sheet is presented natively. On payment success, match moves to payment_processing and admin is notified. On failure, error is shown and user can retry.',
     'Stripe is used here for payment collection  -  this is different from the manual escrow model described on the web. The mobile app uses Stripe payment processing.'),

    ('Chat (chat/[matchId])', 'Mobile',
     'Match Chat Thread: In-app real-time chat between the matched sender and carrier. Messages are loaded from /api/messages/[matchId] and updated via polling (every 5 seconds). Send bar at bottom with text input and photo attachment button. Each message shows sender avatar, timestamp, and read status. Contact detail masking is active until payment is confirmed (admin-side action). System messages ("Admin has confirmed payment  -  contact details shared") appear inline.',
     None),
]

MOBILE_DELIVERY_SCREENS = [
    ('QR Seal Activation (seal/[id])', 'Mobile',
     'Package Seal & QR Generation: Carrier-side sealing screen. Shows the match summary and generates a unique QR code for the package (rendered via react-native-qrcode-svg). Steps: (1) Take a photo of the sealed package (expo-camera), (2) Enter confirmed package weight, (3) Optionally scan the printed QR label to verify it matches (QR scanner via expo-camera), (4) Tap "Activate Seal"  -  submits photo, weight, and QR token to /api/seal/[id]/activate. Seal activation is timestamped and geo-logged. Seal must be activated before transit begins.',
     'The generated QR token is cryptographically linked to this specific match and is single-use.'),

    ('Seal Confirmation (seal/[id]/confirm)', 'Mobile',
     'Seal Confirm Screen: Post-activation confirmation. Shows: the activated seal number, activation timestamp, package weight as recorded, and a preview of the QR code. Option to share the QR code image via the native share sheet (WhatsApp, email, AirDrop). Also shows the next action: "Your package is sealed and ready for transit. You\'ll be notified when the carrier reports departure."',
     None),

    ('Delivery Confirmation (deliver/[id]/confirm)', 'Mobile',
     'Confirm Delivery Received: Sender-side confirmation screen. Shows item description, route, and carrier name. "I confirm this item has been delivered to me" button. On tap, calls /api/matches/[id]/confirm-delivery with the sender role. Shows a pending state while waiting for the carrier\'s confirmation. Once both parties confirm, the match moves to delivery_confirmed and admin is prompted to release escrow.',
     None),

    ('Delivery PIN (deliver/[id]/pin)', 'Mobile',
     'Delivery PIN Entry: PIN-based final handover verification. The sender was given a 4-digit PIN at the point of match. At delivery, the carrier asks the recipient to provide the PIN. Carrier enters the PIN on this screen  -  if it matches the stored hash, the delivery is logged as confirmed on the carrier\'s side. Adds an extra layer of fraud prevention (prevents carrier marking false deliveries).',
     None),

    ('Delivery Report (deliver/[id]/report)', 'Mobile',
     'Report a Delivery Issue: Issue reporting screen accessible to both parties if something went wrong with the delivery. Issue categories: Item Damaged, Item Missing, Wrong Item Delivered, Carrier Did Not Arrive, Sender Not Available, Seal Broken on Receipt, Other. Free-text description field (required). Photo upload (optional). Submitting opens a formal dispute, notifies both parties and admin, and pauses escrow release until resolved.',
     None),
]

MOBILE_TRACK_SCREENS = [
    ('Barcode Tracking (track/[barcode])', 'Mobile',
     'Barcode / QR Scan Tracking: Publicly accessible tracking screen reached by scanning a package QR code (no login required for basic status). Shows: Package Status Timeline (9 steps from Match Made  ->  Completed, with colour-coded progress bar), Status Label and Icon per step, Last Update Timestamp. For logged-in users who are party to the match, shows additional detail: carrier name, live tracking link, and action buttons. Fetches status from /api/track/[barcode].',
     'The 9-step status timeline mirrors the match state machine: matched, agreed, committed, kyc_complete, locked_pending_compliance, compliance_in_progress, active, delivery_confirmed, completed.'),

    ('Live Tracking (track/live/[matchId])', 'Mobile',
     'Live Delivery Map: Real-time carrier location tracking for an active (in-transit) delivery. Shows an interactive map (React Native Maps or Expo MapView) with the carrier\'s last reported GPS position, the delivery route drawn as a polyline from origin to destination, and the ETA based on current position. Location updates are pushed from the carrier\'s device every 2 minutes when the tracking is active. Only visible to the matched sender and admin.',
     None),
]

MOBILE_BUSINESS_SCREENS = [
    ('Business Booking (business/book)', 'Mobile',
     'Mobile Business Job Booking: Business delivery booking screen for mobile users. Urgency selector: Planned / Priority / Same Day / Critical (each showing SLA description). Delivery type: UK Local / EU / International. Fields: Origin Address, Destination Address, Package Description, Estimated Weight (kg), Special Instructions. Calls /api/business/jobs to create the job. On success, navigates back to the Business tab showing the new job status.',
     'Requires a linked business account. Personal users see an upgrade prompt.'),
]


# ??????????????????????????????????????????????????????????????????????????????
# BUILD FUNCTIONS
# ??????????????????????????????????????????????????????????????????????????????

def build_doc1(path):
    pdf = Doc('Document 1  -  Public and User Pages (Web)')
    pdf.cover(
        'Web Platform: Public & User Pages Reference',
        [
            'Section 1  -  Public Marketing Pages (13 routes): Homepage, How It Works, Pricing, About, Contact, Help, Guide, Trust & Safety, Legal.',
            'Section 2  -  Authentication & Onboarding (5 routes): Login, Register, OTP Verify, Role Intent, Quick Start Wizard.',
            'Section 3  -  Sending Items / Hooper Flow (12 routes): Send landing, SEO city pages, Create Request, Browse Requests, Hooper Dashboard, Checkout.',
            'Section 4  -  Carrying Items / Booter Flow (3 routes): Journeys marketplace, Post Journey (with AI safety check), Booter Dashboard.',
            'Section 5  -  Match & Delivery Flow (11 routes): Match detail, Declaration, Inspection, Seal print, Messaging, Live tracking, Commit, Confirm, Ratings.',
            'Section 6  -  Compliance & Safety (7 routes): AI Safety Check tool, KYC flow, KYC video, Customs guide, Duty calculator, Carrier agreement.',
            'Section 7  -  Account Management (4 routes): Dashboard, Profile, Delete Account, GDPR data erasure.',
            'Section 8  -  Blog & Content (5 routes): Blog home, published articles, dynamic post template.',
            'Section 9  -  Flights & Travel (4 routes): Flight search, route pages, airline pages, airport pages.',
            'Section 10  -  Utility (3 routes): Deep link handler, file open handler, media/watch page.',
        ],
        [('Total Web Routes', '110+'), ('User Flows', '7'), ('Admin Tools', '25+'), ('Mobile App', 'v1.2.0')],
    )

    pdf.add_page()
    pdf.section_heading('SECTION 1  -  PUBLIC MARKETING PAGES')
    for row in PUBLIC_PAGES:
        pdf.route_row(*row)

    pdf.section_heading('SECTION 2  -  AUTHENTICATION AND ONBOARDING')
    for row in AUTH_PAGES:
        pdf.route_row(*row)

    pdf.section_heading('SECTION 3  -  SENDING ITEMS  (HOOPER FLOW)', colour=GREEN)
    for row in HOOPER_PAGES:
        pdf.route_row(*row)

    pdf.section_heading('SECTION 4  -  CARRYING ITEMS  (BOOTER FLOW)', colour=(59, 130, 246))
    for row in BOOTER_PAGES:
        pdf.route_row(*row)

    pdf.section_heading('SECTION 5  -  MATCH AND DELIVERY FLOW', colour=DARK)
    for row in MATCH_PAGES:
        pdf.route_row(*row)

    pdf.section_heading('SECTION 6  -  COMPLIANCE AND SAFETY', colour=RED)
    for row in COMPLIANCE_PAGES:
        pdf.route_row(*row)

    pdf.section_heading('SECTION 7  -  ACCOUNT MANAGEMENT')
    for row in ACCOUNT_PAGES:
        pdf.route_row(*row)

    pdf.section_heading('SECTION 8  -  BLOG AND CONTENT')
    for row in BLOG_PAGES:
        pdf.route_row(*row)

    pdf.section_heading('SECTION 9  -  FLIGHTS AND TRAVEL')
    for row in FLIGHTS_PAGES:
        pdf.route_row(*row)

    pdf.section_heading('SECTION 10  -  UTILITY AND MISC')
    for row in MISC_PAGES:
        pdf.route_row(*row)

    pdf.output(path)
    print('Doc 1 written:', path)


def build_doc2(path):
    pdf = Doc('Document 2  -  Business Portal, Admin & Internal Tools (Web)')
    pdf.cover(
        'Web Platform: Business Portal, Admin & Internal Tools',
        [
            'Section 1  -  Business Portal (16 routes): Business home, how-it-works, pricing, get-started, express delivery, sign-in pages, Priority Partner, Carrier Network, client portal, carrier portal.',
            'Section 2  -  Admin Hub (13 routes): Admin login, operations hub, compliance dashboard, customs admin, journey admin, verification providers, password management, business admin.',
            'Section 3  -  BFI Flight Intelligence (8 routes): Mission control dashboard, routes intelligence, activity logs, alert feed, platform analytics, report generator, provider management, airline database.',
            'Section 4  -  Commander Internal CRM (6 routes): CRM login, pipeline dashboard, client records, team tools, password management.',
            'Section 5  -  Pipeline & Onboarding (3 routes): Business pipeline form, client onboarding flow, admin manual onboarding.',
        ],
        [('Business Accounts', 'Portal'), ('Admin Sections', '5'), ('BFI Dashboards', '8'), ('CRM Tool', 'Commander')],
    )

    pdf.add_page()
    pdf.section_heading('SECTION 1  -  BUSINESS PORTAL', colour=AMBER)
    for row in BUSINESS_PAGES:
        pdf.route_row(*row)

    pdf.section_heading('SECTION 2  -  ADMIN HUB', colour=RED)
    for row in ADMIN_PAGES:
        pdf.route_row(*row)

    pdf.section_heading('SECTION 3  -  BFI FLIGHT INTELLIGENCE', colour=DARK)
    for row in BFI_PAGES:
        pdf.route_row(*row)

    pdf.section_heading('SECTION 4  -  COMMANDER INTERNAL CRM', colour=PURPLE)
    for row in COMMANDER_PAGES:
        pdf.route_row(*row)

    pdf.section_heading('SECTION 5  -  PIPELINE AND ONBOARDING', colour=GREEN)
    for row in PIPELINE_PAGES:
        pdf.route_row(*row)

    pdf.output(path)
    print('Doc 2 written:', path)


def build_doc3(path):
    pdf = Doc('Document 3  -  Mobile App Reference (iOS & Android)')
    pdf.cover(
        'BootHop Mobile App  -  iOS & Android Reference (v1.2.0)',
        [
            'Section 1  -  Onboarding & Authentication (4 screens): First-run onboarding carousel, Email OTP login, OTP verification, Role selection.',
            'Section 2  -  Main Tabs (5 screens): Home dashboard, Journeys marketplace, Messages inbox, Profile management, Business tab.',
            'Section 3  -  Journey & Request Creation (2 screens): Post a carrier trip, Post a delivery request.',
            'Section 4  -  Match Flow (5 screens): Match detail hub, Item declaration form, Carry-on inspection, Stripe payment checkout, In-app chat.',
            'Section 5  -  Delivery & Sealing (5 screens): QR seal activation, Seal confirmation, Delivery confirmation, Delivery PIN, Issue reporting.',
            'Section 6  -  Tracking (2 screens): Barcode/QR status tracking, Live GPS delivery map.',
            'Section 7  -  Business (1 screen): Mobile business job booking.',
            'API Layer: All 24 screens call the same API endpoints as the web  -  base URL https://www.boothop.com/api (constants/index.ts). All web APIs are fully compatible with the mobile app.',
        ],
        [('Platform', 'iOS & Android'), ('Framework', 'Expo/RN'), ('Version', 'v1.2.0'), ('Screens', '24+')],
    )

    pdf.add_page()
    pdf.section_heading('SECTION 1  -  ONBOARDING AND AUTHENTICATION', colour=PURPLE)
    pdf.sub_heading('First-run experience and OTP-based login  -  no password required')
    for row in MOBILE_ONBOARD_SCREENS:
        pdf.route_row(*row)

    pdf.section_heading('SECTION 2  -  MAIN TAB SCREENS', colour=TEAL)
    pdf.sub_heading('The four persistent bottom-tab screens visible after login')
    for row in MOBILE_TAB_SCREENS:
        pdf.route_row(*row)

    pdf.section_heading('SECTION 3  -  JOURNEY AND REQUEST CREATION', colour=GREEN)
    pdf.sub_heading('Entry-point screens for carriers and senders to post to the marketplace')
    for row in MOBILE_JOURNEY_SCREENS:
        pdf.route_row(*row)

    pdf.section_heading('SECTION 4  -  MATCH FLOW SCREENS', colour=DARK)
    pdf.sub_heading('Screens reached after a match is confirmed  -  one per stage of the delivery pipeline')
    for row in MOBILE_MATCH_SCREENS:
        pdf.route_row(*row)

    pdf.section_heading('SECTION 5  -  DELIVERY AND SEALING SCREENS', colour=(59, 130, 246))
    pdf.sub_heading('Package sealing, delivery confirmation, PIN handover, and issue reporting')
    for row in MOBILE_DELIVERY_SCREENS:
        pdf.route_row(*row)

    pdf.section_heading('SECTION 6  -  TRACKING SCREENS', colour=AMBER)
    pdf.sub_heading('Package status tracking via barcode scan and live GPS map')
    for row in MOBILE_TRACK_SCREENS:
        pdf.route_row(*row)

    pdf.section_heading('SECTION 7  -  BUSINESS SCREENS', colour=RED)
    pdf.sub_heading('Mobile interface for business delivery bookings')
    for row in MOBILE_BUSINESS_SCREENS:
        pdf.route_row(*row)

    # API reference box
    pdf.ln(6)
    y = pdf.get_y()
    if y + 55 > 272:
        pdf.add_page()
        y = pdf.get_y()
    pdf.set_fill_color(*LGRAY)
    pdf.rect(10, y, 190, 55, 'F')
    pdf.set_font('Helvetica', 'B', 9)
    pdf.set_text_color(*DARK)
    pdf.set_xy(14, y + 3)
    pdf.cell(180, 7, 'MOBILE API LAYER  -  HOW THE APP CONNECTS TO THE BACKEND')
    pdf.set_font('Helvetica', '', 8)
    pdf.set_text_color(51, 65, 85)
    pdf.set_xy(14, y + 12)
    pdf.multi_cell(182, 4.5,
        'Base URL (constants/index.ts):  API_BASE = "https://www.boothop.com/api"\n\n'
        'Every API call in the mobile app targets the same Next.js Route Handler endpoints as the web application. '
        'The mobile app adds an Authorization header (Bearer <JWT from SecureStore>) to authenticated requests. '
        'The web app uses an httpOnly cookie  -  both are validated by the same session middleware on the server.\n\n'
        'Key API endpoints used by mobile:\n'
        '  /api/auth/send-otp, /api/auth/verify-otp  -  Authentication\n'
        '  /api/journeys, /api/journeys/create  -  Journey marketplace\n'
        '  /api/trips (type: request)  -  Delivery requests\n'
        '  /api/matches/[id], /api/messages/[matchId]  -  Match & chat\n'
        '  /api/declarations/[id], /api/seal/[id]/activate  -  Compliance\n'
        '  /api/checkout/[matchId]  -  Stripe payment (mobile uses Stripe SDK)\n'
        '  /api/track/[barcode]  -  Package tracking\n'
        '  /api/ai/safety-check  -  AI compliance check (available, not yet wired into mobile journey create)')

    pdf.output(path)
    print('Doc 3 written:', path)


# ??????????????????????????????????????????????????????????????????????????????
# EMAIL DELIVERY
# ??????????????????????????????????????????????????????????????????????????????

def send_email(app_password, paths):
    sender    = 'titobalo12@gmail.com'
    recipient = 'oluwatoyinb@yahoo.com'

    msg = MIMEMultipart()
    msg['From']    = 'Oluwatoyin Olufeko <titobalo12@gmail.com>'
    msg['To']      = recipient
    msg['Subject'] = 'BootHop Platform Reference v2.0  -  Web + Mobile App Documentation'

    body = MIMEText(
        'Hi,\n\n'
        'Please find attached the Version 2.0 BootHop platform reference  -  '
        'updated to include the mobile app (iOS & Android) as a third document '
        'alongside the existing web page references.\n\n'
        'DOCUMENT 1  -  Web: Public & User Pages\n'
        'All 110+ public-facing and authenticated user pages on boothop.com, '
        'organised across 10 sections from the homepage through compliance, '
        'matching, delivery, blog, and flights.\n\n'
        'DOCUMENT 2  -  Web: Business Portal, Admin & Internal Tools\n'
        'The Business Portal (16 routes), Admin Hub (13 routes), BFI Flight '
        'Intelligence dashboard (8 screens), Commander CRM (6 routes), and '
        'pipeline/onboarding tools.\n\n'
        'DOCUMENT 3  -  Mobile App Reference (iOS & Android, v1.2.0)\n'
        'All 24 mobile screens across 7 sections: Onboarding, Main Tabs, '
        'Journey & Request creation, Match flow, Delivery & Sealing, Tracking, '
        'and Business. Includes the mobile API layer reference explaining how '
        'every screen connects to the BootHop backend.\n\n'
        'All three documents are marked Version 2.0, August 2025.\n\n'
        'Best regards,\n'
        'Oluwatoyin Olufeko\n'
        'Co-Founder, BootHop\n'
        'www.boothop.com',
        'plain'
    )
    msg.attach(body)

    attachments = [
        (paths[0], 'BootHop-v2-Doc1-Public-User-Pages.pdf'),
        (paths[1], 'BootHop-v2-Doc2-Admin-Business-Pages.pdf'),
        (paths[2], 'BootHop-v2-Doc3-Mobile-App-Reference.pdf'),
    ]
    for fpath, fname in attachments:
        with open(fpath, 'rb') as f:
            part = MIMEBase('application', 'octet-stream')
            part.set_payload(f.read())
        encoders.encode_base64(part)
        part.add_header('Content-Disposition', f'attachment; filename="{fname}"')
        msg.attach(part)

    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
        server.login(sender, app_password)
        server.sendmail(sender, recipient, msg.as_string())
    print('Email sent to', recipient)


# ??????????????????????????????????????????????????????????????????????????????
# MAIN
# ??????????????????????????????????????????????????????????????????????????????

if __name__ == '__main__':
    pwd  = sys.argv[1] if len(sys.argv) > 1 else 'howq mtby fbei ydzj'
    out1 = 'public/downloads/boothop-v2-doc1-user-pages.pdf'
    out2 = 'public/downloads/boothop-v2-doc2-admin-pages.pdf'
    out3 = 'public/downloads/boothop-v2-doc3-mobile-app.pdf'

    build_doc1(out1)
    build_doc2(out2)
    build_doc3(out3)
    send_email(pwd, [out1, out2, out3])
    print('Done.')
