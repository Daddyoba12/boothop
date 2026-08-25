"""
Generate two BootHop site-map PDFs and email them via Gmail SMTP.
  Doc 1 - Public & User Pages
  Doc 2 - Business Portal, Admin & Internal Tools
"""

import smtplib
import sys
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email.mime.text import MIMEText
from email import encoders
from fpdf import FPDF

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
        self.cell(100, 8, 'BootHop  |  ' + self.doc_title)
        self.set_xy(110, 3)
        self.cell(90, 8, 'www.boothop.com', align='R')
        self.ln(12)

    def footer(self):
        self.set_y(-12)
        self.set_font('Helvetica', '', 7)
        self.set_text_color(*GRAY)
        self.cell(0, 8, f'Page {self.page_no()} | Confidential - BootHop Ltd', align='C')

    def cover(self, subtitle, date_str):
        self.add_page()
        self.set_fill_color(*DARK)
        self.rect(0, 14, 210, 70, 'F')
        self.set_fill_color(*BLUE)
        self.rect(0, 80, 210, 4, 'F')
        self.set_font('Helvetica', 'B', 36)
        self.set_text_color(*WHITE)
        self.set_xy(0, 28)
        self.cell(210, 14, 'BootHop', align='C')
        self.set_font('Helvetica', '', 12)
        self.set_text_color(180, 200, 240)
        self.set_xy(0, 48)
        self.cell(210, 8, 'Peer-to-Peer Delivery Marketplace', align='C')
        self.set_font('Helvetica', 'B', 16)
        self.set_text_color(*WHITE)
        self.set_xy(0, 60)
        self.cell(210, 10, subtitle, align='C')
        self.set_font('Helvetica', '', 9)
        self.set_text_color(*LIGHT)
        self.set_xy(0, 88)
        self.cell(210, 8, date_str + '  |  Confidential', align='C')
        self.set_xy(20, 100)
        self.set_font('Helvetica', '', 11)
        self.set_text_color(*DARK)
        self.multi_cell(170, 6,
            'This document provides a complete reference of all pages and routes on '
            'www.boothop.com. Each entry shows the URL, who it is for, what it does, '
            'and key functionality. Use this as an operational guide for the team.')

    def section_heading(self, text, colour=BLUE):
        self.ln(4)
        self.set_fill_color(*colour)
        self.rect(10, self.get_y(), 190, 9, 'F')
        self.set_font('Helvetica', 'B', 10)
        self.set_text_color(*WHITE)
        self.set_x(14)
        self.cell(180, 9, text.upper())
        self.ln(11)

    def route_row(self, url, audience, description, note=None):
        # Measure description height at col width 92mm, font size 8
        self.set_font('Helvetica', '', 8)
        line_h = 4
        # Estimate lines needed (approx 14 chars per mm at size 8)
        chars_per_line = int(92 / (8 * 0.35))  # rough estimate
        desc_lines = max(1, -(-len(description) // chars_per_line))  # ceiling div
        note_lines = max(1, -(-len(note) // int(92 / (7 * 0.35)))) if note else 0
        row_h = max(8, desc_lines * line_h + (note_lines * 3.5 if note else 0) + 4)

        # Check if row fits on current page
        if self.get_y() + row_h > 272:
            self.add_page()

        y = self.get_y()

        # URL pill (left column, 68mm wide)
        self.set_fill_color(*LGRAY)
        self.set_font('Helvetica', 'B', 7)
        self.set_text_color(*DARK)
        self.set_xy(10, y + 1)
        self.cell(68, 6, url[:38], fill=True)

        # Audience badge (middle, 26mm wide)
        badge_col = GREEN if 'User' in audience else (PURPLE if 'Admin' in audience else AMBER)
        self.set_fill_color(*badge_col)
        self.set_text_color(*WHITE)
        self.set_font('Helvetica', 'B', 6)
        self.set_xy(80, y + 2)
        self.cell(26, 5, audience, fill=True, align='C')

        # Description (right column, 92mm wide) - use multi_cell but track Y manually
        self.set_text_color(51, 65, 85)
        self.set_font('Helvetica', '', 8)
        self.set_xy(108, y + 1)
        self.multi_cell(92, line_h, description)
        desc_bottom = self.get_y()

        # Note in italics below description
        if note:
            self.set_xy(108, desc_bottom)
            self.set_font('Helvetica', 'I', 7)
            self.set_text_color(*GRAY)
            self.multi_cell(92, 3.5, note)
            row_bottom = self.get_y()
        else:
            row_bottom = desc_bottom

        # Ensure minimum row height
        row_bottom = max(row_bottom, y + 8)

        # Divider line
        self.set_draw_color(226, 232, 240)
        self.line(10, row_bottom + 1, 200, row_bottom + 1)
        self.set_y(row_bottom + 3)


# ── PAGE DATA ──────────────────────────────────────────────────────────────────

PUBLIC_PAGES = [
    ('/', 'User', 'Homepage: Landing page with live journey stats, how-it-works overview, role switcher (Send / Travel), testimonials, and sign-up call-to-action.', 'Entry point for all visitors. Showcases the BootHop value proposition.'),
    ('/how-it-works', 'User', 'How It Works: Step-by-step visual explainer of the full peer-to-peer delivery process from posting a request to delivery confirmation.', 'Aimed at first-time visitors who need to understand the model.'),
    ('/pricing', 'User', 'Pricing: Transparent pricing page showing service fees, commission structure (5%), and example cost breakdowns for senders and carriers.', None),
    ('/about', 'User', 'About BootHop: Company story, mission statement, founding team profiles, and UK registration details.', None),
    ('/contact', 'User', 'Contact Us: Contact form, email address, phone number, and WhatsApp quick-link for direct support.', None),
    ('/help', 'User', 'Help Centre: FAQ library covering cancellations, refunds, disputes, KYC, and customs for both senders and carriers.', None),
    ('/guide', 'User', 'User Guide: Detailed written guide on using the platform end-to-end including tips, customs advice, and safety best practices.', None),
    ('/trust-safety', 'User', 'Trust and Safety: Explains KYC verification, compliance checks, escrow payment protection, and how BootHop keeps both parties safe.', None),
    ('/carrier-agreement', 'User', 'Carrier Agreement: Full legal agreement that all carriers must accept before carrying goods. Covers liability and prohibited items.', None),
    ('/edi-policy', 'User', 'Equality and Diversity Policy: Public-facing equality, diversity, and inclusion policy statement.', None),
    ('/terms', 'User', 'Terms of Service: Full platform terms and conditions governing use of BootHop by senders and carriers.', None),
    ('/privacy', 'User', 'Privacy Policy: GDPR-compliant privacy policy explaining data collection, retention, third-party sharing, and user rights.', None),
    ('/cookie-policy', 'User', 'Cookie Policy: Details cookie categories used on boothop.com and consent management.', None),
]

AUTH_PAGES = [
    ('/login', 'User', 'Login: Email-based OTP login. User enters email, receives a 4-digit and 1-letter code, verified without a password.', 'Uses custom JWT session cookie (boothop_session), not Supabase Auth.'),
    ('/register', 'User', 'Register: New user registration form collecting name, email, phone, and role. Sends OTP verification email.', None),
    ('/verify', 'User', 'Verify OTP: OTP entry page. User types the code received by email to complete login or registration.', None),
    ('/intent', 'User', 'Choose Your Role: Post-login screen asking "Do you want to Send or Travel?" Routes user to the appropriate dashboard.', None),
    ('/start', 'User', 'Quick Start Wizard: Multi-step form to specify role, route, item size, date, and budget. Creates a draft request or journey.', None),
]

HOOPER_PAGES = [
    ('/send', 'User', 'Send an Item Landing: Marketing landing for senders with testimonials, cost estimate, and quick-start button.', None),
    ('/send/uk-same-day', 'User', 'UK Same-Day Delivery: Landing page for UK domestic same-day delivery requests. SEO-targeted.', None),
    ('/send/uk-to-europe', 'User', 'UK to Europe Delivery: Landing page for UK-to-Europe route requests. Highlights customs advice.', None),
    ('/send/working-away', 'User', 'Working Away Delivery: Targeted at professionals working abroad who need items sent from home.', None),
    ('/send/student-delivery', 'User', 'Student Delivery: Targeted at students needing items sent to university cities.', None),
    ('/send/business-urgent', 'User', 'Business Urgent Delivery: Landing for businesses needing same-day or next-flight urgent delivery.', None),
    ('/send/[cityroute]', 'User', 'City Route Landing (Dynamic): SEO pages for specific city pairs e.g. /send/london-to-lagos. Shows live journey availability.', None),
    ('/requests/create', 'User', 'Create Delivery Request: Full item declaration form with description, dimensions, weight, value, and customs declarations.', 'Hoopers use this to post what they need carried.'),
    ('/requests', 'User', 'Browse Requests: Marketplace of open delivery requests. Booters browse, filter by route and date, and claim a request.', None),
    ('/hooper-dashboard', 'User', 'Hooper Dashboard: Sender control centre showing active matches, pending requests, delivery history, and spending summary.', None),
    ('/checkout/[matchId]', 'User', 'Payment Checkout: Secure payment page. Sender submits payment details. Funds held in escrow until delivery confirmed.', 'Manual escrow model - no Stripe payment processing.'),
    ('/payment/success', 'User', 'Payment Confirmed: Confirmation screen after payment submission. Shows next steps and links to the match detail page.', None),
]

BOOTER_PAGES = [
    ('/journeys', 'User', 'Live Journeys Marketplace: Browse all active traveller journeys. Filter by route, date, weight capacity, and price.', None),
    ('/journeys/create', 'User', 'Post a Journey: Form for travellers to post their upcoming trip with route, dates, weight, price, and item restrictions. Includes inline AI route compliance check that fires automatically for international routes.', None),
    ('/booter-dashboard', 'User', 'Booter Dashboard: Carrier control centre showing posted journeys, active deliveries, earnings summary, and KYC status.', None),
]

MATCH_PAGES = [
    ('/matches/[id]', 'User', 'Match Detail: Central hub for a confirmed match showing status timeline, chat link, KYC progress, declaration status, seal QR code, and delivery pin.', 'Status: matched > agreed > committed > kyc_pending > active > completed.'),
    ('/matches/[id]/declare', 'User', 'Item Declaration: Customs declaration form with item categories, prohibited items checklist, value declaration, and legal acknowledgement.', 'Required before payment can be released.'),
    ('/matches/[id]/inspection', 'User', 'Carry-On Inspection: Carrier confirms physical inspection of the item before accepting: packaging, description match, no prohibited items.', None),
    ('/matches/[id]/seal/print', 'User', 'Print Seal / QR Label: Generates a printable QR-code seal for the package. Scanning at delivery confirms handover.', None),
    ('/messages', 'User', 'All Messages: Inbox listing all active match conversations. Phone numbers and emails are filtered until payment is confirmed.', None),
    ('/messages/[matchId]', 'User', 'Match Chat: In-app messaging thread between sender and carrier. Content-filtered to keep communication on-platform.', None),
    ('/track/[matchId]', 'User', 'Live Tracking: Real-time delivery map showing carrier location, route history, and delivery event timeline.', None),
    ('/commit', 'User', 'Commit to Delivery: Carrier confirms they have accepted the item and are committed to completing the delivery.', None),
    ('/confirm', 'User', 'Confirm Delivery: Both parties confirm the item has been handed over. Triggers escrow release once both confirm.', None),
    ('/ratings/create', 'User', 'Leave a Rating: Post-delivery star rating and review form. Both sender and carrier rate each other after completion.', None),
    ('/share', 'User', 'Share BootHop: Referral sharing page with personalised link, social share buttons, and referral tracking.', None),
]

COMPLIANCE_PAGES = [
    ('/ai-check', 'User', 'AI Safety Assistant: Free tool to check if any item can be carried on a specific route. Claude AI checks customs rules, airline restrictions, and BootHop policy in real time.', 'Returns PERMITTED / RESTRICTED / PROHIBITED / REVIEW_REQUIRED. Flags admin by email on review cases.'),
    ('/kyc', 'User', 'KYC Overview: Explains the identity verification requirement, what documents are needed, and why it is required for international deliveries.', None),
    ('/kyc/[matchId]', 'User', 'KYC Verification: Stripe Identity-powered ID verification flow tied to a specific match. Carrier completes selfie and document check.', None),
    ('/kyc/video', 'User', 'KYC Video Verification: Alternative video-based identity verification for carriers who cannot complete the standard flow.', None),
    ('/customs', 'User', 'Customs Guide: Plain-English guide to UK customs, import duties, prohibited items, and declaration requirements.', None),
    ('/customs/duties', 'User', 'Duty Calculator: Interactive tool to estimate import duties and taxes for common item categories across popular destination countries.', None),
    ('/carrier/accept', 'User', 'Accept Carrier Agreement: One-click page for carriers to formally accept the Carrier Agreement before their first delivery.', None),
]

ACCOUNT_PAGES = [
    ('/dashboard', 'User', 'Main Dashboard: Smart dashboard showing the most relevant content based on user role - pending matches, open requests, journey listings, and recent activity.', None),
    ('/profile', 'User', 'My Profile: Edit name, phone, photo, notification preferences, and view verification status.', None),
    ('/delete-account', 'User', 'Delete Account: Account deletion request page requiring confirmation. Triggers GDPR-compliant data erasure.', None),
    ('/delete-data', 'User', 'Delete My Data: GDPR right-to-erasure request form. Submits a data deletion request without full account deletion.', None),
]

BLOG_PAGES = [
    ('/blog', 'User', 'Blog Home: BootHop blog hub listing all articles covering customs, delivery tips, and travel logistics guides.', None),
    ('/blog/customs-clearance-services', 'User', 'Blog - Customs Clearance: SEO article explaining customs clearance services and how BootHop simplifies the process.', None),
    ('/blog/small-business-cross-border-shipping', 'User', 'Blog - SME Shipping: Guide for small businesses on cost-effective cross-border shipping using peer-to-peer delivery.', None),
    ('/blog/on-board-courier-time-critical-logistics', 'User', 'Blog - On-Board Courier: Article on time-critical on-board courier logistics and how BootHop serves this use case.', None),
    ('/blog/[slug]', 'User', 'Blog Post (Dynamic): Dynamic blog post page. Fetches content from the CMS by slug. Supports structured article content.', None),
]

FLIGHTS_PAGES = [
    ('/flights', 'User', 'Flight Search: Flight search and browse page showing upcoming flights on popular routes relevant to BootHop journeys.', None),
    ('/flights/[route]', 'User', 'Route Flights (Dynamic): Shows all flights on a specific route e.g. /flights/london-lagos. Helps travellers plan delivery trips.', None),
    ('/flights/airlines/[code]', 'User', 'Airline Page (Dynamic): Airline-specific page showing routes, baggage policies, and BootHop compatibility for that carrier.', None),
    ('/flights/airports/[code]', 'User', 'Airport Page (Dynamic): Airport information with terminal details, customs notes, and active journeys departing from that airport.', None),
]

MISC_PAGES = [
    ('/open', 'User', 'Deep Link Handler: Handles universal deep links redirecting users from email or external sources into the correct in-app page.', None),
    ('/open-file', 'User', 'File Open Handler: Handles opening shared BootHop files or documents passed via external link such as seal QR codes.', None),
    ('/watch', 'User', 'Watch / Media: Video content or live stream page for BootHop promotional or tutorial content.', None),
]

BUSINESS_PAGES = [
    ('/business', 'Business', 'Business Portal Home: Landing page for the BootHop Business Portal. Showcases B2B delivery services with video testimonials and sign-up CTA.', None),
    ('/business/how-it-works', 'Business', 'Business - How It Works: Step-by-step explainer of the business delivery service: post a job, match carrier, track, confirm receipt.', None),
    ('/business/pricing', 'Business', 'Business Pricing: Tiered pricing for business accounts - standard, express, and priority partner plans with volume discounts.', None),
    ('/business/get-started', 'Business', 'Business Get Started: Onboarding form for new business clients collecting company name, delivery volume, and contact details.', None),
    ('/business/express', 'Business', 'Express Business Delivery: Landing page for same-day and next-flight express business delivery. Targets urgent B2B logistics.', None),
    ('/business/contact', 'Business', 'Business Contact: Dedicated contact form for business enquiries. Routes to the business sales team inbox.', None),
    ('/business/sign-in', 'Business', 'Business Sign In: Login page for standard business portal accounts using email and password.', None),
    ('/business/priority-sign-in', 'Business', 'Priority Partner Sign In: Login page for Priority Partner business accounts. Higher tier with dedicated account management.', None),
    ('/business/carrier-sign-in', 'Business', 'Carrier Portal Sign In: Login for carriers registered to work with business accounts.', None),
    ('/business/priority-partner', 'Business', 'Priority Partner: Premium B2B tier landing page with SLA guarantees, dedicated account manager, and API access.', None),
    ('/business/priority-partner/payment', 'Business', 'Priority Partner Payment: Payment page for Priority Partner subscription fee. Handles recurring billing setup.', None),
    ('/business/carrier-network', 'Business', 'Carrier Network: Information page for independent carriers wanting to join the BootHop business carrier network.', None),
    ('/business/carrier-network/payment', 'Business', 'Carrier Network Payment: Payment page for carrier network registration fee.', None),
    ('/business/portal', 'Business', 'Business Client Portal: Main dashboard for business clients - post delivery jobs, view active shipments, download invoices.', None),
    ('/business/portal/priority', 'Business', 'Priority Portal: Enhanced dashboard for Priority Partner accounts with SLA monitoring and dedicated carrier assignments.', None),
    ('/business/carrier-portal', 'Business', 'Business Carrier Portal: Operations hub for carriers working business accounts - accept jobs, update status, confirm delivery.', None),
]

ADMIN_PAGES = [
    ('/admin/login', 'Admin', 'Admin Login: Secure admin login page with email and password. Uses separate admin session cookie.', 'Protected by ADMIN_SECRET environment variable.'),
    ('/admin', 'Admin', 'Admin Home: Admin root redirects to hub or shows quick-access links to all admin sections.', None),
    ('/admin/hub', 'Admin', 'Admin Operations Hub: Master control panel - view all users, matches, journeys, compliance flags, payment approvals, and platform stats.', 'Primary daily-ops tool for the BootHop team.'),
    ('/admin/compliance', 'Admin', 'Compliance Dashboard: List of all compliance flags, REVIEW_REQUIRED items, and pending manual reviews. Approve or reject each case.', None),
    ('/admin/compliance/[matchId]', 'Admin', 'Compliance Case Detail: Full detail view for a single compliance case with item declaration, risk score, AI verdict, and approve/reject actions.', None),
    ('/admin/customs', 'Admin', 'Customs Admin: Admin view of customs declarations submitted by senders. Flag, approve, or escalate to external verification.', None),
    ('/admin/journeys/[id]', 'Admin', 'Journey Admin Detail: Admin view of a specific journey with carrier details, capacity, matched requests, and status controls.', None),
    ('/admin/verification-providers', 'Admin', 'Verification Providers: Manage third-party verification providers used for external compliance checks. Add, activate, or deactivate.', None),
    ('/admin/change-password', 'Admin', 'Admin Change Password: Allows admin users to change their admin portal password. Required on first login with temp password.', None),
    ('/admin/business', 'Admin', 'Business Admin Home: Admin overview of all business portal accounts, activity, and revenue.', None),
    ('/admin/business/carriers', 'Admin', 'Business Carriers Admin: Manage carriers on the business carrier network - approve applications, suspend accounts, view history.', None),
    ('/admin/business/ops', 'Admin', 'Business Ops Admin: Operational view of all live business deliveries with status, carrier assignment, and SLA tracking.', None),
    ('/admin/business/priority', 'Admin', 'Priority Partners Admin: Manage Priority Partner accounts - contracts, billing status, SLA performance, and account health.', None),
]

BFI_PAGES = [
    ('/bfi', 'Admin', 'BFI Mission Control: BootHop Flight Intelligence dashboard. Live overview of all flight-linked journeys, alerts, and carrier activity.', 'BFI = BootHop Flight Intelligence. Internal operations codename.'),
    ('/bfi/routes', 'Admin', 'BFI Routes: All active and historical delivery routes with volume, revenue, and performance metrics per route.', None),
    ('/bfi/logs', 'Admin', 'BFI Activity Logs: Full audit log of all platform events - match created, payment confirmed, compliance flagged, delivery completed.', None),
    ('/bfi/alerts', 'Admin', 'BFI Alerts: Real-time alert feed for compliance flags, failed payments, SLA breaches, and system errors requiring attention.', None),
    ('/bfi/analytics', 'Admin', 'BFI Analytics: Platform analytics showing GMV, active users, delivery success rate, route popularity, and revenue trends.', None),
    ('/bfi/reports', 'Admin', 'BFI Reports: Generate and download periodic reports - weekly ops summary, compliance report, revenue breakdown.', None),
    ('/bfi/providers', 'Admin', 'BFI Providers: Third-party service provider management - verification vendors, customs brokers, and logistics partners.', None),
    ('/bfi/airlines', 'Admin', 'BFI Airlines: Airline database management - update baggage allowances, restricted item policies, and route availability.', None),
]

COMMANDER_PAGES = [
    ('/commander', 'Admin', 'Commander Login: Entry login page for the Commander internal CRM tool. Separate from main admin auth.', 'Commander is an internal client management and pipeline tool.'),
    ('/commander/dashboard', 'Admin', 'Commander Dashboard: Overview of all business pipeline clients, deal stages, activity feed, and revenue forecast.', None),
    ('/commander/pipeline/[clientSlug]', 'Admin', 'Client Pipeline Detail: Individual client record in Commander CRM with contact info, deal stage, notes, and activity history.', None),
    ('/commander/music', 'Admin', 'Commander Music: Internal team music tool integrated into the Commander workspace.', None),
    ('/commander/change-password', 'Admin', 'Commander Change Password: Password change flow for Commander portal users.', None),
    ('/commander/reset', 'Admin', 'Commander Password Reset: Password reset and recovery flow for Commander accounts.', None),
    ('/commanderNew', 'Admin', 'Commander V2 Beta: Next version of the Commander interface being built alongside the current version.', None),
]

PIPELINE_PAGES = [
    ('/pipeline/onboard', 'Business', 'Business Pipeline Onboard: Onboarding form for businesses entering the BootHop sales pipeline. Captures company details and service requirements.', None),
    ('/client-onboarding', 'Business', 'Client Onboarding: Client-facing onboarding flow for new BootHop business clients to complete setup after contract signing.', None),
    ('/onboard/admin', 'Admin', 'Admin Onboard: Admin tool for manually onboarding new users or business clients when self-service is not available.', None),
]


def build_doc1(path):
    pdf = Doc('Document 1 - Public and User Pages')
    pdf.cover('Complete Public and User Page Reference', 'August 2025')

    pdf.add_page()
    pdf.section_heading('SECTION 1 - PUBLIC MARKETING PAGES')
    for url, aud, desc, note in PUBLIC_PAGES:
        pdf.route_row(url, aud, desc, note)

    pdf.section_heading('SECTION 2 - AUTHENTICATION AND ONBOARDING')
    for url, aud, desc, note in AUTH_PAGES:
        pdf.route_row(url, aud, desc, note)

    pdf.section_heading('SECTION 3 - SENDING ITEMS (HOOPER FLOW)', colour=GREEN)
    for url, aud, desc, note in HOOPER_PAGES:
        pdf.route_row(url, aud, desc, note)

    pdf.section_heading('SECTION 4 - CARRYING ITEMS (BOOTER FLOW)', colour=(59, 130, 246))
    for url, aud, desc, note in BOOTER_PAGES:
        pdf.route_row(url, aud, desc, note)

    pdf.section_heading('SECTION 5 - MATCH AND DELIVERY FLOW', colour=DARK)
    for url, aud, desc, note in MATCH_PAGES:
        pdf.route_row(url, aud, desc, note)

    pdf.section_heading('SECTION 6 - COMPLIANCE AND SAFETY', colour=(220, 38, 38))
    for url, aud, desc, note in COMPLIANCE_PAGES:
        pdf.route_row(url, aud, desc, note)

    pdf.section_heading('SECTION 7 - ACCOUNT MANAGEMENT')
    for url, aud, desc, note in ACCOUNT_PAGES:
        pdf.route_row(url, aud, desc, note)

    pdf.section_heading('SECTION 8 - BLOG AND CONTENT')
    for url, aud, desc, note in BLOG_PAGES:
        pdf.route_row(url, aud, desc, note)

    pdf.section_heading('SECTION 9 - FLIGHTS AND TRAVEL')
    for url, aud, desc, note in FLIGHTS_PAGES:
        pdf.route_row(url, aud, desc, note)

    pdf.section_heading('SECTION 10 - UTILITY AND MISC')
    for url, aud, desc, note in MISC_PAGES:
        pdf.route_row(url, aud, desc, note)

    pdf.output(path)
    print('Doc 1 written:', path)


def build_doc2(path):
    pdf = Doc('Document 2 - Business Portal, Admin and Internal Tools')
    pdf.cover('Business Portal, Admin and Internal Tools Reference', 'August 2025')

    pdf.add_page()
    pdf.section_heading('SECTION 1 - BUSINESS PORTAL', colour=AMBER)
    for url, aud, desc, note in BUSINESS_PAGES:
        pdf.route_row(url, aud, desc, note)

    pdf.section_heading('SECTION 2 - ADMIN HUB', colour=(220, 38, 38))
    for url, aud, desc, note in ADMIN_PAGES:
        pdf.route_row(url, aud, desc, note)

    pdf.section_heading('SECTION 3 - BFI FLIGHT INTELLIGENCE', colour=DARK)
    for url, aud, desc, note in BFI_PAGES:
        pdf.route_row(url, aud, desc, note)

    pdf.section_heading('SECTION 4 - COMMANDER INTERNAL CRM', colour=PURPLE)
    for url, aud, desc, note in COMMANDER_PAGES:
        pdf.route_row(url, aud, desc, note)

    pdf.section_heading('SECTION 5 - PIPELINE AND ONBOARDING', colour=GREEN)
    for url, aud, desc, note in PIPELINE_PAGES:
        pdf.route_row(url, aud, desc, note)

    pdf.output(path)
    print('Doc 2 written:', path)


def send_email(app_password, doc1_path, doc2_path):
    sender = 'titobalo12@gmail.com'
    recipient = 'oluwatoyinb@yahoo.com'

    msg = MIMEMultipart()
    msg['From']    = 'Oluwatoyin Olufeko <titobalo12@gmail.com>'
    msg['To']      = recipient
    msg['Subject'] = 'BootHop Site Reference - All Pages and How They Work (Updated)'

    body = MIMEText(
        'Hi,\n\n'
        'Please find attached the updated two-document site reference for www.boothop.com.\n\n'
        'Document 1 - Public and User Pages\n'
        'Covers all public marketing pages, the sender (Hooper) flow, the carrier (Booter)\n'
        'flow, match/delivery pages, compliance tools, blog, and flights.\n\n'
        'Document 2 - Business Portal, Admin and Internal Tools\n'
        'Covers the BootHop Business Portal, Admin Hub, BFI Flight Intelligence dashboard,\n'
        'Commander CRM, and onboarding pipeline.\n\n'
        'Each entry shows: URL, who it is for, what it does, and key technical notes.\n\n'
        'Best regards,\n'
        'Oluwatoyin Olufeko\n'
        'Co-Founder, BootHop\n'
        'www.boothop.com',
        'plain'
    )
    msg.attach(body)

    for fpath, fname in [
        (doc1_path, 'BootHop-Public-User-Pages.pdf'),
        (doc2_path, 'BootHop-Admin-Business-Pages.pdf'),
    ]:
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


if __name__ == '__main__':
    pwd = sys.argv[1] if len(sys.argv) > 1 else 'howq mtby fbei ydzj'
    out1 = 'public/downloads/boothop-site-doc1-user-pages.pdf'
    out2 = 'public/downloads/boothop-site-doc2-admin-pages.pdf'
    build_doc1(out1)
    build_doc2(out2)
    send_email(pwd, out1, out2)
    print('Done.')
