"""
BootHop Pitch Deck Generator
Output: ../public/downloads/boothop-pitch-deck.pdf
Install: pip install fpdf2
Run:     python make_pitch_deck.py
"""

from fpdf import FPDF
from pathlib import Path

OUTPUT = Path(__file__).parent.parent / "public" / "downloads" / "boothop-pitch-deck.pdf"
LOGO   = Path(__file__).parent.parent / "public" / "images" / "logo.jpg"

# Brand colours (R, G, B)
NAVY   = (2,   6,  23)
DARK   = (12,  30,  61)
BLUE   = (37,  99, 235)
LBLUE  = (59, 130, 246)
WHITE  = (255, 255, 255)
GREY   = (148, 163, 184)
YELLOW = (251, 191,  36)
GREEN  = (74,  222, 128)
RED    = (248, 113, 113)

W, H   = 320, 180   # mm -- 16:9
TOTAL  = 12


class Deck(FPDF):

    def _bg(self, color=NAVY):
        self.set_fill_color(*color)
        self.rect(0, 0, W, H, 'F')

    def _bar(self, color=BLUE, h=2):
        self.set_fill_color(*color)
        self.rect(0, 0, W, h, 'F')

    def _logo(self):
        self.set_fill_color(*BLUE)
        self.rect(6, 5, 9, 9, 'F')
        self.set_font('Helvetica', 'B', 9)
        self.set_text_color(*WHITE)
        self.set_xy(6, 5)
        self.cell(9, 9, 'B', align='C')
        self.set_font('Helvetica', 'B', 8)
        self.set_text_color(*WHITE)
        self.set_xy(17, 6)
        self.cell(30, 4, 'BootHop')
        self.set_font('Helvetica', '', 6)
        self.set_text_color(*GREY)
        self.set_xy(17, 11)
        self.cell(40, 3, 'www.boothop.com')

    def _n(self, n):
        self.set_font('Helvetica', '', 6)
        self.set_text_color(*GREY)
        self.set_xy(W - 20, H - 7)
        self.cell(15, 5, f'{n} / {TOTAL}', align='R')

    def _h(self, text, y=22, size=20):
        self.set_font('Helvetica', 'B', size)
        self.set_text_color(*WHITE)
        self.set_xy(10, y)
        self.cell(W - 20, 10, text)

    def _rule(self, y, w=40):
        self.set_fill_color(*BLUE)
        self.rect(10, y, w, 1, 'F')

    def _sub(self, text, x=10, y=36, w=None, size=9, color=GREY):
        self.set_font('Helvetica', '', size)
        self.set_text_color(*color)
        self.set_xy(x, y)
        self.multi_cell(w or W - 20, 5.5, text)

    def _card(self, x, y, w, h, title, body, bg=DARK):
        self.set_fill_color(*bg)
        self.rect(x, y, w, h, 'F')
        self.set_fill_color(*BLUE)
        self.rect(x, y, 1.5, h, 'F')
        self.set_font('Helvetica', 'B', 8)
        self.set_text_color(*LBLUE)
        self.set_xy(x + 4, y + 4)
        self.cell(w - 6, 5, title)
        self.set_font('Helvetica', '', 7.5)
        self.set_text_color(*WHITE)
        self.set_xy(x + 4, y + 11)
        self.multi_cell(w - 8, 4.5, body)

    def _bullet(self, text, x, y, size=7.5, color=GREY):
        self.set_font('Helvetica', '', size)
        self.set_text_color(*color)
        self.set_xy(x, y)
        self.cell(4, 5, chr(149))
        self.set_xy(x + 4, y)
        self.multi_cell(W - x - 15, 4.5, text)


def build():
    pdf = Deck(orientation='L', unit='mm', format=(H, W))
    pdf.set_auto_page_break(False)
    pdf.set_margins(0, 0, 0)

    # ── SLIDE 1 -- COVER ───────────────────────────────────────────────────────
    pdf.add_page()
    pdf._bg()
    pdf.set_fill_color(*BLUE)
    pdf.rect(0, 0, 108, H, 'F')
    pdf.set_fill_color(30, 64, 175)
    pdf.rect(0, 0, 3, H, 'F')
    pdf._n(1)

    if LOGO.exists():
        pdf.image(str(LOGO), x=8, y=10, w=28)
        ty = 48
    else:
        pdf.set_font('Helvetica', 'B', 26)
        pdf.set_text_color(*WHITE)
        pdf.set_xy(8, 8)
        pdf.cell(92, 16, 'BootHop')
        ty = 34

    pdf.set_font('Helvetica', 'B', 19)
    pdf.set_text_color(*WHITE)
    pdf.set_xy(8, ty)
    pdf.multi_cell(92, 11, 'Smarter\nMovement.\nTrusted\nDelivery.')

    pdf.set_font('Helvetica', '', 8)
    pdf.set_text_color(219, 234, 254)
    pdf.set_xy(8, ty + 58)
    pdf.multi_cell(92, 5, 'Peer-to-peer delivery marketplace\nconnecting travelers with senders\nacross borders and cities.')

    pdf.set_font('Helvetica', '', 7)
    pdf.set_text_color(219, 234, 254)
    pdf.set_xy(8, H - 12)
    pdf.cell(92, 5, 'www.boothop.com')

    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(*BLUE)
    pdf.set_xy(116, 16)
    pdf.cell(W - 126, 7, 'INVESTOR PITCH DECK')
    pdf.set_font('Helvetica', '', 8)
    pdf.set_text_color(*GREY)
    pdf.set_xy(116, 25)
    pdf.cell(W - 126, 5, '2025  .  Pre-Seed Round')

    stats = [
        ('$500/mo',  'Monthly Revenue'),
        ('4 months', 'Platform Live'),
        ('3 - 5',    'Core Team'),
        ('UK + Global', 'Active Markets'),
    ]
    sy = 38
    for val, label in stats:
        pdf.set_fill_color(*DARK)
        pdf.rect(116, sy, 90, 22, 'F')
        pdf.set_fill_color(*BLUE)
        pdf.rect(116, sy, 2, 22, 'F')
        pdf.set_font('Helvetica', 'B', 15)
        pdf.set_text_color(*WHITE)
        pdf.set_xy(121, sy + 3)
        pdf.cell(82, 8, val)
        pdf.set_font('Helvetica', '', 7)
        pdf.set_text_color(*GREY)
        pdf.set_xy(121, sy + 12)
        pdf.cell(82, 5, label)
        sy += 26

    # ── SLIDE 2 -- THE PROBLEM ─────────────────────────────────────────────────
    pdf.add_page()
    pdf._bg()
    pdf._bar()
    pdf._logo()
    pdf._n(2)
    pdf._h('The Problem', y=20)
    pdf._rule(33)

    problems = [
        ('Expensive & Slow Shipping',
         'Traditional couriers charge premium rates for cross-border delivery -- out of reach for individuals and small businesses.'),
        ('Underserved Diaspora Corridors',
         'Millions send care packages internationally with no safe, structured solution -- relying on WhatsApp groups and word of mouth.'),
        ('Compliance & Security Risks',
         'Informal peer arrangements have no identity verification, no escrow, no customs awareness -- leaving both parties exposed.'),
        ('Wasted Cargo Capacity',
         'Every day, millions of travelers cross routes with empty bag space that could be monetised safely -- that capacity is lost.'),
    ]

    positions = [(10, 38), (164, 38), (10, 95), (164, 95)]
    for (x, y), (title, desc) in zip(positions, problems):
        pdf._card(x, y, 148, 50, title, desc)

    pdf.set_fill_color(*BLUE)
    pdf.rect(10, 153, W - 20, 0.5, 'F')
    pdf.set_font('Helvetica', 'B', 9)
    pdf.set_text_color(*YELLOW)
    pdf.set_xy(10, 157)
    pdf.cell(W - 20, 6, '"The informal peer delivery market is massive -- and completely unprotected."', align='C')

    # ── SLIDE 3 -- OUR SOLUTION ────────────────────────────────────────────────
    pdf.add_page()
    pdf._bg()
    pdf._bar()
    pdf._logo()
    pdf._n(3)
    pdf._h('Our Solution', y=20)
    pdf._sub(
        'BootHop connects Hoopers (senders) with Booters (travelers) who carry goods for a fee -- '
        'with escrow, KYC, and privacy-first trust built in.',
        y=33,
    )

    values = [
        ('Cost-Efficient',  'Senders pay a fraction\nof courier rates'),
        ('Traveler Income', 'Booters earn from trips\nalready being made'),
        ('Escrow Safety',   'Funds held until delivery\nis confirmed by both'),
        ('KYC Verified',    'Every user identity-checked\nbefore contact is shared'),
        ('Privacy First',   'No contact revealed\nuntil payment secured'),
        ('Global Ready',    'Built for UK, Nigeria\nand diaspora corridors'),
    ]

    vx, vy = 10, 58
    for i, (title, desc) in enumerate(values):
        col, row = i % 3, i // 3
        x, y = vx + col * 103, vy + row * 52
        pdf.set_fill_color(*DARK)
        pdf.rect(x, y, 97, 46, 'F')
        pdf.set_fill_color(*BLUE)
        pdf.rect(x, y, 97, 3, 'F')
        pdf.set_font('Helvetica', 'B', 9)
        pdf.set_text_color(*WHITE)
        pdf.set_xy(x + 5, y + 7)
        pdf.cell(87, 5, title)
        pdf.set_font('Helvetica', '', 8)
        pdf.set_text_color(*GREY)
        pdf.set_xy(x + 5, y + 15)
        pdf.multi_cell(87, 5, desc)

    # ── SLIDE 4 -- HOW IT WORKS ────────────────────────────────────────────────
    pdf.add_page()
    pdf._bg()
    pdf._bar()
    pdf._logo()
    pdf._n(4)
    pdf._h('How It Works', y=20)
    pdf._rule(33)

    steps = [
        ('1', 'Post Intent',  'Sender posts what to ship.\nTraveler posts route & capacity.'),
        ('2', 'Match',        'System pairs compatible\nroutes, dates, prices.'),
        ('3', 'Agree & KYC', 'Both agree price, accept terms,\npass identity verification.'),
        ('4', 'Pay & Hold',  'Sender pays -- funds held in\nescrow. Contact still hidden.'),
        ('5', 'Deliver',     'Booter carries goods.\nBoth confirm handover.'),
        ('6', 'Release',     'BootHop releases payment.\nBoth rate each other.'),
    ]

    step_w = 50
    sx = 10
    for i, (num, title, desc) in enumerate(steps):
        ey, ex = 45, sx + 10
        pdf.set_fill_color(*BLUE)
        pdf.ellipse(ex, ey, 15, 15, 'F')
        pdf.set_font('Helvetica', 'B', 11)
        pdf.set_text_color(*WHITE)
        pdf.set_xy(ex, ey)
        pdf.cell(15, 15, num, align='C')
        if i < 5:
            pdf.set_fill_color(*GREY)
            pdf.rect(ex + 15, ey + 6.5, step_w - 14, 0.5, 'F')
        pdf.set_font('Helvetica', 'B', 8)
        pdf.set_text_color(*WHITE)
        pdf.set_xy(sx, 64)
        pdf.cell(step_w, 5, title, align='C')
        pdf.set_font('Helvetica', '', 7)
        pdf.set_text_color(*GREY)
        pdf.set_xy(sx, 71)
        pdf.multi_cell(step_w, 4.5, desc, align='C')
        sx += step_w + 3

    pdf.set_fill_color(*DARK)
    pdf.rect(10, 118, W - 20, 22, 'F')
    pdf.set_font('Helvetica', 'B', 8)
    pdf.set_text_color(*BLUE)
    pdf.set_xy(10, 123)
    pdf.cell(W - 20, 6, 'Intent  ->  Match  ->  Agree  ->  KYC  ->  Pay (Escrow)  ->  Deliver  ->  Confirm  ->  Release', align='C')
    pdf.set_font('Helvetica', '', 7)
    pdf.set_text_color(*GREY)
    pdf.set_xy(10, 131)
    pdf.cell(W - 20, 5, 'No contact shared before payment.  No payment released before delivery confirmed.', align='C')

    # ── SLIDE 5 -- BUSINESS MODEL ──────────────────────────────────────────────
    pdf.add_page()
    pdf._bg()
    pdf._bar()
    pdf._logo()
    pdf._n(5)
    pdf._h('Business Model', y=20)
    pdf._rule(33)

    streams = [
        ('Transaction Fees (Core)',
         '3% from the sender + 5% from the traveler on every completed delivery. Both sides pay -- platform earns on every transaction.'),
        ('Goods Insurance',
         'Optional 10% of declared item value added at checkout. High-margin, zero-cost add-on for the platform.'),
        ('Business Portal (B2B)',
         'Flat fees or subscription plans for companies posting commercial delivery jobs to vetted carriers.'),
        ('Premium Service Tiers',
         'Priority matching, airport-to-airport handoffs, same-day delivery -- all carry a higher margin uplift.'),
    ]

    sy = 38
    for title, desc in streams:
        pdf._card(10, sy, 178, 28, title, desc)
        sy += 31

    pdf.set_fill_color(*DARK)
    pdf.rect(196, 38, 114, 118, 'F')
    pdf.set_fill_color(*BLUE)
    pdf.rect(196, 38, 114, 4, 'F')
    pdf.set_font('Helvetica', 'B', 8)
    pdf.set_text_color(*WHITE)
    pdf.set_xy(200, 46)
    pdf.cell(106, 5, 'Unit Economics  (example)')

    rows = [
        ('Agreed delivery price',    '£100',  WHITE),
        ('Sender pays  (+3%)',        '£103',  GREY),
        ('Traveler receives  (-5%)',  '£95',   GREY),
        ('',                          '',      GREY),
        ('Platform gross revenue',    '£8',    LBLUE),
        ('+ Insurance (10% of value)','£10',   LBLUE),
        ('Total platform revenue',    '£18',   YELLOW),
    ]
    ry = 56
    for label, val, color in rows:
        if not label:
            pdf.set_fill_color(*BLUE)
            pdf.rect(200, ry, 106, 0.5, 'F')
            ry += 5
            continue
        pdf.set_font('Helvetica', '', 7.5)
        pdf.set_text_color(*GREY)
        pdf.set_xy(200, ry)
        pdf.cell(78, 5, label)
        pdf.set_font('Helvetica', 'B', 7.5)
        pdf.set_text_color(*color)
        pdf.set_xy(278, ry)
        pdf.cell(28, 5, val, align='R')
        ry += 9

    pdf.set_font('Helvetica', 'B', 8)
    pdf.set_text_color(*YELLOW)
    pdf.set_xy(196, ry + 5)
    pdf.cell(114, 6, 'Asset-light.  No fleet.  No inventory.', align='C')

    # ── SLIDE 6 -- MARKET OPPORTUNITY ──────────────────────────────────────────
    pdf.add_page()
    pdf._bg()
    pdf._bar()
    pdf._logo()
    pdf._n(6)
    pdf._h('Market Opportunity', y=20)
    pdf._rule(33)

    markets = [
        ('$150B+', 'Global P2P / crowdsourced\nlogistics & delivery'),
        ('$700B+', 'International remittance &\ndiaspora goods annually'),
        ('40M+',   'UK & US African diaspora\ntransferring goods home'),
        ('$8B',    'Same-day delivery market\nby 2027'),
    ]

    mx = 10
    for val, desc in markets:
        pdf.set_fill_color(*DARK)
        pdf.rect(mx, 40, 73, 60, 'F')
        pdf.set_fill_color(*BLUE)
        pdf.rect(mx, 40, 73, 3, 'F')
        pdf.set_font('Helvetica', 'B', 22)
        pdf.set_text_color(*BLUE)
        pdf.set_xy(mx + 5, 48)
        pdf.cell(63, 13, val)
        pdf.set_font('Helvetica', '', 8)
        pdf.set_text_color(*GREY)
        pdf.set_xy(mx + 5, 63)
        pdf.multi_cell(63, 5, desc)
        mx += 77

    pdf.set_font('Helvetica', 'B', 9)
    pdf.set_text_color(*WHITE)
    pdf.set_xy(10, 112)
    pdf.cell(W - 20, 7, 'BootHop targets the informal delivery layer -- the largest, most underserved segment.', align='C')
    pdf.set_font('Helvetica', '', 8)
    pdf.set_text_color(*GREY)
    pdf.set_xy(10, 122)
    pdf.multi_cell(
        W - 20, 5,
        'Priority markets: UK domestic corridors  ->  UK-Nigeria diaspora routes  ->  US expansion (Wisconsin, via gener8tor)',
        align='C',
    )

    # ── SLIDE 7 -- TRACTION ────────────────────────────────────────────────────
    pdf.add_page()
    pdf._bg()
    pdf._bar()
    pdf._logo()
    pdf._n(7)
    pdf._h('Traction', y=20)
    pdf._sub('4 months live  .  www.boothop.com', y=33, color=LBLUE)

    kpis = [
        ('$500/mo',  'Monthly Revenue\n(USD equivalent)'),
        ('4 months', 'Platform Live'),
        ('Full KYC', 'Identity Verification\nOperational'),
        ('2 Portals', 'Consumer P2P\n& Business B2B'),
    ]

    kx = 10
    for val, label in kpis:
        pdf.set_fill_color(*DARK)
        pdf.rect(kx, 43, 73, 40, 'F')
        pdf.set_fill_color(*BLUE)
        pdf.rect(kx, 43, 73, 3, 'F')
        pdf.set_font('Helvetica', 'B', 18)
        pdf.set_text_color(*WHITE)
        pdf.set_xy(kx + 5, 51)
        pdf.cell(63, 11, val)
        pdf.set_font('Helvetica', '', 7.5)
        pdf.set_text_color(*GREY)
        pdf.set_xy(kx + 5, 64)
        pdf.multi_cell(63, 4.5, label)
        kx += 77

    built = [
        ('Two-sided marketplace  (Hooper + Booter flows)',      'Automated matching engine  (runs every 15 min)'),
        ('KYC identity verification  (in-house + Stripe)',      'Dispute resolution portal with evidence upload'),
        ('Escrow payments with admin-controlled fund release',  'Business portal for commercial delivery clients'),
        ('In-app messaging with contact-info filtering',        'Social content pipeline  (TikTok / Instagram)'),
    ]

    pdf.set_font('Helvetica', 'B', 8)
    pdf.set_text_color(*WHITE)
    pdf.set_xy(10, 92)
    pdf.cell(W - 20, 6, 'What we have built:')

    by = 100
    for left, right in built:
        pdf._bullet(left,  12,  by)
        pdf._bullet(right, 165, by)
        by += 9

    # ── SLIDE 8 -- COMPETITIVE LANDSCAPE ──────────────────────────────────────
    pdf.add_page()
    pdf._bg()
    pdf._bar()
    pdf._logo()
    pdf._n(8)
    pdf._h('Competitive Landscape', y=20)
    pdf._rule(33)

    col_headers = ['', 'P2P Matching', 'KYC Verified', 'Escrow', 'Diaspora Focus', 'B2B Portal', 'Cost']
    col_ws      = [62, 38, 36, 30, 42, 34, 28]

    pdf.set_fill_color(*BLUE)
    pdf.rect(10, 38, sum(col_ws), 11, 'F')
    cx = 10
    for h, cw in zip(col_headers, col_ws):
        pdf.set_font('Helvetica', 'B', 7)
        pdf.set_text_color(*WHITE)
        pdf.set_xy(cx, 38)
        pdf.cell(cw, 11, h, align='C')
        cx += cw

    competitors = [
        ('BootHop',             ['Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'Low'],     True),
        ('Grabr',               ['Yes', 'Partial', 'No', 'Partial', 'No', 'Low'], False),
        ('Nimber',              ['Yes', 'No', 'No', 'No', 'No', 'Low'],          False),
        ('DHL / FedEx',         ['No', 'Yes', 'N/A', 'No', 'Yes', 'High'],       False),
        ('Informal (WhatsApp)', ['Manual', 'No', 'No', 'Yes', 'No', 'Free'],     False),
    ]

    row_colors = [(12, 30, 61), (2, 6, 23)]
    ry = 49
    for idx, (name, vals, highlight) in enumerate(competitors):
        bg = (30, 64, 175) if highlight else row_colors[idx % 2]
        pdf.set_fill_color(*bg)
        pdf.rect(10, ry, sum(col_ws), 13, 'F')
        pdf.set_font('Helvetica', 'B' if highlight else '', 8)
        pdf.set_text_color(*WHITE if highlight else GREY)
        pdf.set_xy(10, ry)
        pdf.cell(col_ws[0], 13, name, align='C')
        cx2 = 10 + col_ws[0]
        for val, cw in zip(vals, col_ws[1:]):
            if val == 'Yes':
                color = (187, 247, 208) if highlight else GREEN
            elif val == 'No':
                color = WHITE if highlight else RED
            else:
                color = WHITE
            pdf.set_font('Helvetica', 'B' if highlight else '', 7.5)
            pdf.set_text_color(*color)
            pdf.set_xy(cx2, ry)
            pdf.cell(cw, 13, val, align='C')
            cx2 += cw
        ry += 14

    pdf.set_font('Helvetica', 'B', 8)
    pdf.set_text_color(*YELLOW)
    pdf.set_xy(10, ry + 5)
    pdf.cell(W - 20, 6, 'BootHop is the only platform combining P2P matching + KYC + escrow + B2B in one trusted flow.', align='C')

    # ── SLIDE 9 -- TEAM ────────────────────────────────────────────────────────
    pdf.add_page()
    pdf._bg()
    pdf._bar()
    pdf._logo()
    pdf._n(9)
    pdf._h('The Team', y=20)
    pdf._sub('70+ years combined experience across technology, logistics, procurement & finance.', y=33)

    team = [
        ('OO', 'Oluwatoyin Olufeko',   'CEO & CTO',
         '27 years in system development, banking, and supply chain. Built BootHop end-to-end. Track record across fintech, enterprise systems, and logistics platforms.',
         'OTB-MIDAS.com'),
        ('OF', 'Omobolarinwa Famutimi', 'COO',
         '20+ years in procurement and supply chain operations. Deep commercial networks across UK and West Africa. Leads B2B partnerships and operational delivery.',
         ''),
        ('DA', 'Dotun Asekun',          'Head of Compliance & QA',
         '20+ years in system testing and customs systems. Compliance, cross-border customs logic, and quality assurance are embedded from day one -- a rare skill set at this stage.',
         ''),
    ]

    tx = 10
    for initials, name, role, bio, link in team:
        pdf.set_fill_color(*DARK)
        pdf.rect(tx, 44, 98, 100, 'F')
        pdf.set_fill_color(*BLUE)
        pdf.rect(tx, 44, 98, 4, 'F')
        pdf.set_fill_color(*BLUE)
        pdf.ellipse(tx + 6, 53, 18, 18, 'F')
        pdf.set_font('Helvetica', 'B', 9)
        pdf.set_text_color(*WHITE)
        pdf.set_xy(tx + 6, 53)
        pdf.cell(18, 18, initials, align='C')
        pdf.set_font('Helvetica', 'B', 8.5)
        pdf.set_text_color(*WHITE)
        pdf.set_xy(tx + 27, 55)
        pdf.multi_cell(68, 5, name)
        pdf.set_font('Helvetica', 'B', 7.5)
        pdf.set_text_color(*BLUE)
        pdf.set_xy(tx + 27, 66)
        pdf.cell(68, 5, role)
        pdf.set_font('Helvetica', '', 7.5)
        pdf.set_text_color(*GREY)
        pdf.set_xy(tx + 6, 78)
        pdf.multi_cell(86, 4.5, bio)
        if link:
            pdf.set_font('Helvetica', 'I', 7)
            pdf.set_text_color(*LBLUE)
            pdf.set_xy(tx + 6, 132)
            pdf.cell(86, 4, link)
        tx += 104

    # ── SLIDE 10 -- GO-TO-MARKET ───────────────────────────────────────────────
    pdf.add_page()
    pdf._bg()
    pdf._bar()
    pdf._logo()
    pdf._n(10)
    pdf._h('Go-to-Market Strategy', y=20)
    pdf._rule(33)

    phases = [
        ('Phase 1', 'UK  (Live Now)',   'UK domestic corridors.\nDiaspora senders UK-Nigeria.\nEarly B2B portal clients.'),
        ('Phase 2', 'Nigeria  Q1 2026', 'Lagos pilot: high-density\nroutes, airport handoffs,\nauto parts micro-logistics.'),
        ('Phase 3', 'US  Q2-Q3 2026',  'Wisconsin entry via\ngener8tor Soft Landing Pad.\nUS diaspora + B2B.'),
        ('Phase 4', 'Scale  2027+',    'Multi-city US, Canada,\nWest Africa expansion.\nSeries A raise.'),
    ]

    px = 10
    for i, (phase, timeline, desc) in enumerate(phases):
        pdf.set_fill_color(*DARK)
        pdf.rect(px, 40, 73, 75, 'F')
        pdf.set_fill_color(*BLUE)
        pdf.rect(px, 40, 73, 4, 'F')
        pdf.set_font('Helvetica', 'B', 7.5)
        pdf.set_text_color(*GREY)
        pdf.set_xy(px + 5, 48)
        pdf.cell(63, 5, phase)
        pdf.set_font('Helvetica', 'B', 9)
        pdf.set_text_color(*WHITE)
        pdf.set_xy(px + 5, 55)
        pdf.multi_cell(63, 5.5, timeline)
        pdf.set_font('Helvetica', '', 7.5)
        pdf.set_text_color(*GREY)
        pdf.set_xy(px + 5, 68)
        pdf.multi_cell(63, 5, desc)
        if i < 3:
            pdf.set_font('Helvetica', 'B', 14)
            pdf.set_text_color(*BLUE)
            pdf.set_xy(px + 73, 68)
            pdf.cell(6, 8, '>')
        px += 78

    channels = [
        'Diaspora community partnerships & ambassador programs',
        'B2B direct sales  (e-commerce sellers, auto parts vendors)',
        'Travel & airline partnership integrations',
        'Automated social content engine  (TikTok / Instagram)',
    ]

    pdf.set_font('Helvetica', 'B', 8)
    pdf.set_text_color(*WHITE)
    pdf.set_xy(10, 126)
    pdf.cell(W - 20, 6, 'Key Acquisition Channels:')

    chx = 10
    for i, ch in enumerate(channels):
        pdf._bullet(ch, chx, 134)
        chx += 78
        if i == 1:
            chx = 10

    # ── SLIDE 11 -- ROADMAP ────────────────────────────────────────────────────
    pdf.add_page()
    pdf._bg()
    pdf._bar()
    pdf._logo()
    pdf._n(11)
    pdf._h('12-Month Roadmap', y=20)
    pdf._rule(33)

    milestones = [
        ('Q3 2025\n(Now)', [
            'Platform live & generating revenue',
            'KYC, escrow, B2B portal operational',
            'Social content pipeline running',
        ]),
        ('Q4 2025', [
            'US market entry via gener8tor',
            '1,000 completed deliveries target',
            'First US B2B merchant partners',
        ]),
        ('Q1 2026', [
            'Nigeria Lagos pilot launch',
            'Airport-to-airport premium lane',
            'Insurance partner integration',
        ]),
        ('Q2-Q3 2026', [
            'Series A preparation',
            'API marketplace integrations',
            'Volume subscription products live',
        ]),
    ]

    rmx = 10
    for period, items in milestones:
        pdf.set_fill_color(*DARK)
        pdf.rect(rmx, 40, 73, 110, 'F')
        pdf.set_fill_color(*BLUE)
        pdf.rect(rmx, 40, 73, 14, 'F')
        pdf.set_font('Helvetica', 'B', 9)
        pdf.set_text_color(*WHITE)
        pdf.set_xy(rmx, 40)
        pdf.cell(73, 14, period, align='C')
        iy = 62
        for item in items:
            pdf.set_font('Helvetica', '', 8)
            pdf.set_text_color(*GREY)
            pdf.set_xy(rmx + 5, iy)
            pdf.cell(4, 5, chr(149))
            pdf.set_xy(rmx + 10, iy)
            pdf.multi_cell(58, 5, item)
            iy += 18
        rmx += 77

    # ── SLIDE 12 -- THE ASK ────────────────────────────────────────────────────
    pdf.add_page()
    pdf._bg()
    pdf.set_fill_color(*BLUE)
    pdf.rect(0, 0, 115, H, 'F')
    pdf.set_fill_color(30, 64, 175)
    pdf.rect(0, 0, 3, H, 'F')
    pdf._n(12)

    pdf.set_font('Helvetica', 'B', 10)
    pdf.set_text_color(219, 234, 254)
    pdf.set_xy(8, 16)
    pdf.cell(99, 7, 'PRE-SEED ROUND')
    pdf.set_font('Helvetica', 'B', 26)
    pdf.set_text_color(*WHITE)
    pdf.set_xy(8, 26)
    pdf.cell(99, 17, 'The Ask')
    pdf.set_font('Helvetica', '', 8.5)
    pdf.set_text_color(219, 234, 254)
    pdf.set_xy(8, 50)
    pdf.multi_cell(
        99, 5.5,
        'BootHop is raising its first external round to accelerate US market entry, '
        'grow transaction volume, and build the infrastructure for global scale.',
    )
    pdf.set_font('Helvetica', 'B', 9)
    pdf.set_text_color(*WHITE)
    pdf.set_xy(8, 95)
    pdf.cell(99, 6, 'Contact Us')
    pdf.set_font('Helvetica', '', 8)
    pdf.set_text_color(219, 234, 254)
    pdf.set_xy(8, 104)
    pdf.multi_cell(99, 5.5, 'Oluwatoyin Olufeko  .  CEO\ntitobalo12@gmail.com\n+44 7506553755\nwww.boothop.com')

    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(*WHITE)
    pdf.set_xy(123, 18)
    pdf.cell(W - 133, 7, 'Use of Funds')
    pdf.set_fill_color(*BLUE)
    pdf.rect(123, 28, 45, 1, 'F')

    uses = [
        ('40%', 'Product & Technology',
         'Matching engine improvements, mobile app, API integrations for merchant and partner onboarding.'),
        ('30%', 'Operations & Compliance',
         'US entity setup, legal / regulatory compliance, traveler onboarding & training programs.'),
        ('20%', 'Go-to-Market',
         'US launch campaigns, B2B sales, diaspora community partnerships, content engine.'),
        ('10%', 'Insurance & Risk',
         'Insurance partner integration, claims infrastructure, fraud monitoring systems.'),
    ]

    uy = 34
    for pct, title, desc in uses:
        pdf.set_fill_color(*DARK)
        pdf.rect(123, uy, W - 133, 32, 'F')
        pdf.set_fill_color(*BLUE)
        pdf.rect(123, uy, 3, 32, 'F')
        pdf.set_font('Helvetica', 'B', 15)
        pdf.set_text_color(*BLUE)
        pdf.set_xy(129, uy + 5)
        pdf.cell(25, 10, pct)
        pdf.set_font('Helvetica', 'B', 9)
        pdf.set_text_color(*WHITE)
        pdf.set_xy(156, uy + 5)
        pdf.cell(W - 166, 6, title)
        pdf.set_font('Helvetica', '', 7.5)
        pdf.set_text_color(*GREY)
        pdf.set_xy(156, uy + 13)
        pdf.multi_cell(W - 166, 4.5, desc)
        uy += 35

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(OUTPUT))
    print(f'Pitch deck saved -> {OUTPUT}')


if __name__ == '__main__':
    build()
