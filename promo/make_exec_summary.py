"""
BootHop Executive Summary Generator
Output: ../public/downloads/boothop-executive-summary.pdf
Install: pip install fpdf2
Run:     python make_exec_summary.py
"""

from fpdf import FPDF
from pathlib import Path

OUTPUT = Path(__file__).parent.parent / "public" / "downloads" / "boothop-executive-summary.pdf"
LOGO   = Path(__file__).parent.parent / "public" / "images" / "logo.jpg"

# Brand colours
NAVY   = (2,   6,  23)
DARK   = (12,  30,  61)
BLUE   = (37,  99, 235)
LBLUE  = (59, 130, 246)
WHITE  = (255, 255, 255)
GREY   = (100, 116, 139)
LGREY  = (148, 163, 184)
YELLOW = (251, 191,  36)
BLACK  = (15,  23,  42)

W, H = 210, 297  # A4 portrait mm


class ES(FPDF):

    def _rule(self, y, x=15, w=None, color=BLUE, h=0.5):
        self.set_fill_color(*color)
        self.rect(x, y, w or W - 30, h, 'F')

    def _section(self, title, y):
        self.set_fill_color(*BLUE)
        self.rect(15, y, 3, 6, 'F')
        self.set_font('Helvetica', 'B', 9)
        self.set_text_color(*BLUE)
        self.set_xy(21, y)
        self.cell(W - 36, 6, title.upper())
        self._rule(y + 7, color=(*DARK,), h=0.4)
        return y + 11

    def _body(self, text, x, y, w, size=8.5, color=BLACK, line_h=5):
        self.set_font('Helvetica', '', size)
        self.set_text_color(*color)
        self.set_xy(x, y)
        self.multi_cell(w, line_h, text)
        return self.get_y()

    def _kpi(self, x, y, val, label, w=38, h=20):
        self.set_fill_color(*DARK)
        self.rect(x, y, w, h, 'F')
        self.set_fill_color(*BLUE)
        self.rect(x, y, w, 2, 'F')
        self.set_font('Helvetica', 'B', 13)
        self.set_text_color(*WHITE)
        self.set_xy(x + 3, y + 4)
        self.cell(w - 6, 8, val)
        self.set_font('Helvetica', '', 6.5)
        self.set_text_color(*LGREY)
        self.set_xy(x + 3, y + 13)
        self.cell(w - 6, 4, label)

    def _tag(self, x, y, text):
        tw = self.get_string_width(text) + 6
        self.set_fill_color(*BLUE)
        self.rect(x, y, tw, 6, 'F')
        self.set_font('Helvetica', 'B', 6.5)
        self.set_text_color(*WHITE)
        self.set_xy(x + 3, y)
        self.cell(tw - 6, 6, text)
        return x + tw + 3


def build():
    pdf = ES(orientation='P', unit='mm', format='A4')
    pdf.set_auto_page_break(False)
    pdf.set_margins(0, 0, 0)
    pdf.add_page()

    # ── HEADER BAR ────────────────────────────────────────────────────────────
    pdf.set_fill_color(*NAVY)
    pdf.rect(0, 0, W, 42, 'F')
    pdf.set_fill_color(*BLUE)
    pdf.rect(0, 0, W, 2, 'F')

    # Logo block
    if LOGO.exists():
        pdf.image(str(LOGO), x=15, y=8, w=22)
        lx = 40
    else:
        pdf.set_fill_color(*BLUE)
        pdf.rect(15, 8, 22, 22, 'F')
        pdf.set_font('Helvetica', 'B', 14)
        pdf.set_text_color(*WHITE)
        pdf.set_xy(15, 8)
        pdf.cell(22, 22, 'B', align='C')
        lx = 40

    pdf.set_font('Helvetica', 'B', 20)
    pdf.set_text_color(*WHITE)
    pdf.set_xy(lx, 10)
    pdf.cell(80, 10, 'BootHop')
    pdf.set_font('Helvetica', '', 8.5)
    pdf.set_text_color(219, 234, 254)
    pdf.set_xy(lx, 21)
    pdf.cell(80, 5, 'Smarter Movement. Trusted Delivery.')

    # Right side header info
    pdf.set_font('Helvetica', 'B', 7)
    pdf.set_text_color(*LGREY)
    pdf.set_xy(130, 9)
    pdf.cell(65, 5, 'EXECUTIVE SUMMARY', align='R')
    pdf.set_font('Helvetica', '', 7)
    pdf.set_text_color(148, 163, 184)
    for i, line in enumerate(['www.boothop.com', 'titobalo12@gmail.com', '+44 7506553755', '2025 . Pre-Seed Round']):
        pdf.set_xy(130, 15 + i * 5.5)
        pdf.cell(65, 5, line, align='R')

    # ── TAGLINE BAND ──────────────────────────────────────────────────────────
    pdf.set_fill_color(*BLUE)
    pdf.rect(0, 42, W, 10, 'F')
    pdf.set_font('Helvetica', 'B', 8.5)
    pdf.set_text_color(*WHITE)
    pdf.set_xy(0, 42)
    pdf.cell(W, 10,
        'Peer-to-peer delivery marketplace connecting senders with travelers -- '
        'safe, verified, and escrow-protected.',
        align='C')

    # ── KPI ROW ───────────────────────────────────────────────────────────────
    kpis = [
        ('$500/mo',   'Monthly Revenue (USD)'),
        ('4 months',  'Platform Live'),
        ('3 - 5',     'Core Team'),
        ('70+ yrs',   'Combined Experience'),
        ('2 Portals', 'P2P + B2B Live'),
    ]
    kx = 15
    for val, label in kpis:
        pdf._kpi(kx, 57, val, label, w=35)
        kx += 38

    y = 84

    # ── OVERVIEW ──────────────────────────────────────────────────────────────
    y = pdf._section('Company Overview', y)
    y = pdf._body(
        'BootHop is a peer-to-peer delivery marketplace that connects people who need to send goods '
        '("Hoopers") with travelers already heading to the same destination ("Booters"). Instead of '
        'paying expensive courier rates, senders pay a fraction of the cost -- and travelers earn extra '
        'income from a trip they were already making. BootHop acts as the trusted middleman: verifying '
        'identities via KYC, holding funds in escrow, filtering all communications, and only releasing '
        'payment and contact details once both parties are verified and delivery is confirmed.',
        15, y, W - 30,
    ) + 4

    # ── PROBLEM + SOLUTION (2 columns) ────────────────────────────────────────
    col_w = (W - 36) / 2

    y = pdf._section('The Problem', y)
    py = y
    pdf._body(
        'Traditional couriers are expensive and inaccessible for individuals, small businesses, and '
        'diaspora communities. Millions of people send goods internationally through informal, unregulated '
        'WhatsApp arrangements -- no identity checks, no escrow, no legal protection. Every day, millions '
        'of travelers cross these same routes with empty bag space that goes completely to waste.',
        15, py, col_w, line_h=4.8,
    )

    y = pdf._section('Our Solution', py)
    pdf._body(
        'BootHop turns every traveler into a verified, trusted courier. Our flow: Post Intent -> Match -> '
        'Agree Price -> KYC -> Escrow Payment -> Delivery -> Confirm -> Release. No contact is shared '
        'before payment is secured. No payment is released before both parties confirm delivery. '
        'Privacy-first, compliance-ready, and globally scalable.',
        15 + col_w + 6, py, col_w, line_h=4.8,
    )

    y = pdf.get_y() + 6

    # ── BUSINESS MODEL ────────────────────────────────────────────────────────
    y = pdf._section('Business Model & Revenue', y)

    streams = [
        ('Transaction Fees',  '3% from sender + 5% from traveler on every delivery. Both sides pay -- platform earns on every transaction.'),
        ('Goods Insurance',   'Optional 10% of declared item value at checkout. High-margin, zero-cost add-on for the platform.'),
        ('Business Portal',   'Flat fees / subscriptions for companies posting commercial jobs to vetted carriers (B2B revenue stream).'),
        ('Premium Tiers',     'Priority matching, airport-to-airport handoffs, same-day delivery -- all carry higher margin uplift.'),
    ]

    sx = 15
    for title, desc in streams:
        pdf.set_fill_color(*DARK)
        pdf.rect(sx, y, 42, 18, 'F')
        pdf.set_fill_color(*BLUE)
        pdf.rect(sx, y, 42, 2, 'F')
        pdf.set_font('Helvetica', 'B', 7)
        pdf.set_text_color(*WHITE)
        pdf.set_xy(sx + 2, y + 4)
        pdf.cell(38, 4, title)
        pdf.set_font('Helvetica', '', 6.5)
        pdf.set_text_color(*LGREY)
        pdf.set_xy(sx + 2, y + 9)
        pdf.multi_cell(38, 3.8, desc)
        sx += 45

    y += 22

    # Unit economics inline
    pdf.set_fill_color(*NAVY)
    pdf.rect(15, y, W - 30, 10, 'F')
    pdf.set_font('Helvetica', 'B', 7.5)
    pdf.set_text_color(*LGREY)
    pdf.set_xy(18, y + 1.5)
    pdf.cell(40, 4, 'Unit Economics:')
    pdf.set_font('Helvetica', '', 7.5)
    items = [
        ('Sender pays', '£103'),
        ('Traveler receives', '£95'),
        ('Platform earns', '£8'),
        ('+ Insurance', '£10'),
        ('Total revenue', '£18'),
    ]
    ix = 55
    for label, val in items:
        pdf.set_text_color(*LGREY)
        pdf.set_xy(ix, y + 1.5)
        pdf.cell(22, 4, label)
        pdf.set_font('Helvetica', 'B', 7.5)
        pdf.set_text_color(*YELLOW)
        pdf.set_xy(ix + 22, y + 1.5)
        pdf.cell(12, 4, val)
        pdf.set_font('Helvetica', '', 7.5)
        ix += 36

    y += 14

    # ── MARKET OPPORTUNITY ────────────────────────────────────────────────────
    y = pdf._section('Market Opportunity', y)
    mkt_w = (W - 36) / 4
    mx = 15
    for val, label in [('$150B+', 'Global P2P logistics'), ('$700B+', 'Diaspora goods transfers'), ('40M+', 'UK/US African diaspora'), ('$8B', 'Same-day delivery by 2027')]:
        pdf.set_font('Helvetica', 'B', 13)
        pdf.set_text_color(*BLUE)
        pdf.set_xy(mx, y)
        pdf.cell(mkt_w, 8, val)
        pdf.set_font('Helvetica', '', 6.5)
        pdf.set_text_color(*GREY)
        pdf.set_xy(mx, y + 8)
        pdf.cell(mkt_w, 4, label)
        mx += mkt_w + 2

    y += 16

    # ── TRACTION ──────────────────────────────────────────────────────────────
    y = pdf._section('Traction', y)
    traction_text = (
        'BootHop launched 4 months ago and is live at www.boothop.com with real paying users. '
        'The platform is fully operational: two-sided marketplace, KYC identity verification, escrow payments, '
        'in-app messaging with content filtering, dispute resolution, business portal for commercial clients, '
        'automated matching engine (runs every 15 minutes), and a social content pipeline driving organic growth '
        'on TikTok and Instagram. Current revenue: $500/month (USD equivalent). Infrastructure that typically '
        'takes funded startups 12-18 months to ship was built and deployed in 4 months.'
    )
    y = pdf._body(traction_text, 15, y, W - 30, line_h=4.8) + 4

    # ── TEAM ──────────────────────────────────────────────────────────────────
    y = pdf._section('The Team', y)
    team = [
        ('Oluwatoyin Olufeko', 'CEO & CTO',
         '27 years in system development, banking, and supply chain. Built BootHop end-to-end. OTB-MIDAS.com'),
        ('Omobolarinwa Famutimi', 'COO',
         '20+ years in procurement and supply chain operations. Leads B2B partnerships and operational delivery.'),
        ('Dotun Asekun', 'Head of Compliance & QA',
         '20+ years in system testing and customs systems. Cross-border compliance embedded from day one.'),
    ]
    tm_w = (W - 36) / 3
    tx = 15
    for name, role, bio in team:
        pdf.set_fill_color(*DARK)
        pdf.rect(tx, y, tm_w - 2, 22, 'F')
        pdf.set_fill_color(*BLUE)
        pdf.rect(tx, y, tm_w - 2, 2, 'F')
        pdf.set_font('Helvetica', 'B', 7.5)
        pdf.set_text_color(*WHITE)
        pdf.set_xy(tx + 3, y + 4)
        pdf.multi_cell(tm_w - 8, 4, name)
        pdf.set_font('Helvetica', 'B', 6.5)
        pdf.set_text_color(*LBLUE)
        pdf.set_xy(tx + 3, y + 11)
        pdf.cell(tm_w - 8, 4, role)
        pdf.set_font('Helvetica', '', 6.3)
        pdf.set_text_color(*LGREY)
        pdf.set_xy(tx + 3, y + 16)
        pdf.multi_cell(tm_w - 8, 3.5, bio)
        tx += tm_w

    y += 26

    # ── COMPETITIVE EDGE + GTM (2 col) ────────────────────────────────────────
    y = pdf._section('Competitive Advantage', y)
    pdf._body(
        'BootHop is the only platform combining P2P matching, KYC identity verification, escrow payments, '
        'content-filtered messaging, and a B2B commercial portal in a single trusted flow. Competitors '
        '(Grabr, Nimber, informal WhatsApp networks) lack one or more of these layers. Traditional couriers '
        '(DHL, FedEx) cannot compete on price or flexibility for micro-shipments and diaspora corridors.',
        15, y, W - 30, line_h=4.5,
    )

    y = pdf.get_y() + 5

    # ── THE ASK ───────────────────────────────────────────────────────────────
    pdf.set_fill_color(*BLUE)
    pdf.rect(0, y, W, 38, 'F')

    pdf.set_font('Helvetica', 'B', 12)
    pdf.set_text_color(*WHITE)
    pdf.set_xy(15, y + 5)
    pdf.cell(W - 30, 7, 'Pre-Seed Round  |  The Ask')

    uses = [
        ('40%', 'Product & Tech -- matching engine, mobile app, API integrations'),
        ('30%', 'Operations & Compliance -- US entity, legal, traveler onboarding'),
        ('20%', 'Go-to-Market -- US launch, B2B sales, diaspora partnerships'),
        ('10%', 'Insurance & Risk -- claims infrastructure, fraud monitoring'),
    ]
    uy = y + 14
    for pct, desc in uses:
        pdf.set_font('Helvetica', 'B', 8)
        pdf.set_text_color(*YELLOW)
        pdf.set_xy(15, uy)
        pdf.cell(12, 5, pct)
        pdf.set_font('Helvetica', '', 8)
        pdf.set_text_color(219, 234, 254)
        pdf.set_xy(27, uy)
        pdf.cell(W - 42, 5, desc)
        uy += 5.5

    # ── FOOTER ────────────────────────────────────────────────────────────────
    fy = H - 14
    pdf.set_fill_color(*NAVY)
    pdf.rect(0, fy, W, 14, 'F')
    pdf._rule(fy, color=BLUE, h=0.5)

    pdf.set_font('Helvetica', 'B', 7)
    pdf.set_text_color(*WHITE)
    pdf.set_xy(15, fy + 4)
    pdf.cell(60, 5, 'BootHop Ltd  |  Registered in England & Wales')

    pdf.set_font('Helvetica', '', 7)
    pdf.set_text_color(*LGREY)
    pdf.set_xy(15, fy + 9)
    pdf.cell(60, 4, 'Confidential -- For investor use only')

    contact = 'www.boothop.com  |  titobalo12@gmail.com  |  +44 7506553755'
    pdf.set_font('Helvetica', '', 7)
    pdf.set_text_color(*LGREY)
    pdf.set_xy(0, fy + 4)
    pdf.cell(W - 15, 5, contact, align='R')

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(OUTPUT))
    print(f'Executive summary saved -> {OUTPUT}')


if __name__ == '__main__':
    build()
