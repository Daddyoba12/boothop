"""
BootHop - gener8tor Soft Landing Pad Application Document
Output: ../public/downloads/boothop-gener8tor-application.pdf
        C:/Users/babso/Desktop/boothop-gener8tor-application.pdf
Install: pip install fpdf2
Run:     python make_application.py
"""

from fpdf import FPDF
from pathlib import Path
import shutil

OUTPUT  = Path(__file__).parent.parent / "public" / "downloads" / "boothop-gener8tor-application.pdf"
DESKTOP = Path(r"C:\Users\babso\Desktop") / "boothop-gener8tor-application.pdf"

NAVY  = (2,   6,  23)
DARK  = (12,  30,  61)
BLUE  = (37,  99, 235)
LBLUE = (59, 130, 246)
WHITE = (255, 255, 255)
GREY  = (100, 116, 139)
LGREY = (148, 163, 184)
BLACK = (15,  23,  42)
YELLOW= (251, 191,  36)

W, H  = 210, 297  # A4


class App(FPDF):

    def _rule(self, y, x=15, w=None, color=BLUE, h=0.4):
        self.set_fill_color(*color)
        self.rect(x, y, w or W - 30, h, 'F')

    def _q(self, question, y):
        """Render a question label and return new y."""
        self.set_fill_color(*DARK)
        self.rect(0, y, W, 9, 'F')
        self.set_fill_color(*BLUE)
        self.rect(0, y, 3, 9, 'F')
        self.set_font('Helvetica', 'B', 8.5)
        self.set_text_color(*LBLUE)
        self.set_xy(7, y)
        self.cell(W - 14, 9, question)
        return y + 12

    def _a(self, text, y, indent=15):
        """Render an answer block and return new y."""
        self.set_font('Helvetica', '', 8.5)
        self.set_text_color(*BLACK)
        self.set_xy(indent, y)
        self.multi_cell(W - indent - 15, 5.2, text)
        return self.get_y() + 6

    def _kv(self, label, value, y):
        """Render a key-value pair."""
        self.set_font('Helvetica', 'B', 8.5)
        self.set_text_color(*GREY)
        self.set_xy(15, y)
        self.cell(45, 5.5, label + ':')
        self.set_font('Helvetica', '', 8.5)
        self.set_text_color(*BLACK)
        self.set_xy(60, y)
        self.cell(W - 75, 5.5, value)
        return y + 6

    def _tag_row(self, items, y):
        x = 15
        for item in items:
            tw = self.get_string_width(item) + 6
            if x + tw > W - 15:
                x = 15
                y += 8
            self.set_fill_color(*DARK)
            self.rect(x, y, tw, 6, 'F')
            self.set_fill_color(*BLUE)
            self.rect(x, y, tw, 1.5, 'F')
            self.set_font('Helvetica', '', 7)
            self.set_text_color(*WHITE)
            self.set_xy(x + 3, y)
            self.cell(tw - 6, 6, item)
            x += tw + 3
        return y + 10

    def _page_header(self, n):
        self.set_fill_color(*NAVY)
        self.rect(0, 0, W, 12, 'F')
        self.set_fill_color(*BLUE)
        self.rect(0, 0, W, 2, 'F')
        self.set_font('Helvetica', 'B', 8)
        self.set_text_color(*WHITE)
        self.set_xy(15, 3)
        self.cell(100, 6, 'BootHop - gener8tor Soft Landing Pad Application')
        self.set_font('Helvetica', '', 7)
        self.set_text_color(*LGREY)
        self.set_xy(0, 3)
        self.cell(W - 15, 6, f'Page {n}  |  Confidential', align='R')

    def _check_page(self, y, needed=30):
        if y > H - needed:
            self.add_page()
            self._page_header(self.page)
            return 20
        return y


def build():
    pdf = App(orientation='P', unit='mm', format='A4')
    pdf.set_auto_page_break(False)
    pdf.set_margins(0, 0, 0)
    pdf.add_page()

    # ── COVER HEADER ──────────────────────────────────────────────────────────
    pdf.set_fill_color(*NAVY)
    pdf.rect(0, 0, W, 52, 'F')
    pdf.set_fill_color(*BLUE)
    pdf.rect(0, 0, W, 3, 'F')

    pdf.set_font('Helvetica', 'B', 9)
    pdf.set_text_color(*LGREY)
    pdf.set_xy(15, 10)
    pdf.cell(W - 30, 6, 'APPLICATION DOCUMENT')

    pdf.set_font('Helvetica', 'B', 20)
    pdf.set_text_color(*WHITE)
    pdf.set_xy(15, 18)
    pdf.cell(W - 30, 12, 'BootHop')

    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(219, 234, 254)
    pdf.set_xy(15, 31)
    pdf.cell(W - 30, 6, 'gener8tor Soft Landing Pad  --  Wisconsin, USA')

    pdf.set_fill_color(*BLUE)
    pdf.rect(0, 42, W, 10, 'F')
    pdf.set_font('Helvetica', '', 8)
    pdf.set_text_color(*WHITE)
    pdf.set_xy(0, 42)
    pdf.cell(W, 10, 'www.boothop.com  |  titobalo12@gmail.com  |  +44 7506 553755  |  Nottingham, UK', align='C')

    y = 60

    # ── SECTION 1: APPLICANT DETAILS ──────────────────────────────────────────
    pdf.set_font('Helvetica', 'B', 10)
    pdf.set_text_color(*BLUE)
    pdf.set_xy(15, y)
    pdf.cell(W - 30, 7, 'APPLICANT DETAILS')
    pdf._rule(y + 8)
    y += 13

    y = pdf._kv('Full Name',     'Oluwatoyin Olufeko', y)
    y = pdf._kv('Email',         'titobalo12@gmail.com', y)
    y = pdf._kv('Phone',         '+44 7506 553755', y)
    y = pdf._kv('Location',      'Nottingham, United Kingdom', y)
    y = pdf._kv('Company',       'BootHop', y)
    y = pdf._kv('Website',       'www.boothop.com', y)
    y = pdf._kv('Co-Founders',   'Omobolarinwa Famutimi, Dotun Asekun', y)
    y = pdf._kv('Team Size',     '3 - 5', y)
    y = pdf._kv('Stage',         'Pre-Seed (Bootstrapped, live & generating revenue)', y)
    y = pdf._kv('Industries',    'Commerce and Shopping  |  Transportation  |  Financial Services', y)

    y += 4
    pdf.set_font('Helvetica', 'B', 8)
    pdf.set_text_color(*GREY)
    pdf.set_xy(15, y)
    pdf.cell(40, 5, 'Keywords:')
    y += 5
    y = pdf._tag_row([
        'Marketplace', 'Peer-to-Peer', 'Logistics', 'Last Mile Delivery',
        'Sharing Economy', 'Gig Economy', 'Crowdsourcing', 'Freight Service',
        'Payments', 'Escrow', 'Identity Verification', 'Travel',
        'E-Commerce', 'FinTech', 'Mobile',
    ], y)

    y += 2

    # ── SECTION 2: Q&A ────────────────────────────────────────────────────────
    pdf.set_font('Helvetica', 'B', 10)
    pdf.set_text_color(*BLUE)
    pdf.set_xy(15, y)
    pdf.cell(W - 30, 7, 'APPLICATION QUESTIONS & ANSWERS')
    pdf._rule(y + 8)
    y += 14

    # Q1 - Company Description
    y = pdf._check_page(y)
    y = pdf._q('Company Description', y)
    y = pdf._a(
        'BootHop is a peer-to-peer delivery marketplace that connects people who need to send goods '
        '("Hoopers") with travelers already heading to the same destination ("Booters"). Instead of paying '
        'expensive courier rates, senders pay a fraction of the cost -- and travelers earn extra income '
        'from a trip they were already making. BootHop acts as the trusted middleman: verifying identities, '
        'holding funds in escrow, and only releasing payment and contact details once both parties are '
        'verified and the delivery is confirmed.',
        y,
    )

    # Q2 - Business Model
    y = pdf._check_page(y, 60)
    y = pdf._q('Business Model', y)
    y = pdf._a(
        'BootHop operates a transaction-fee marketplace model, taking a cut from every successful delivery '
        'completed on the platform. When a sender (Hooper) and traveler (Booter) agree on a delivery price, '
        'BootHop charges the sender a 3% platform fee on top of the agreed amount, and retains 5% from the '
        'traveler\'s payout -- meaning the platform earns from both sides of every transaction without holding '
        'inventory or owning vehicles. On top of the core transaction fee, we offer optional goods insurance '
        'at 10% of the declared item value, giving senders peace of mind and adding a meaningful revenue line '
        'on higher-value deliveries. All funds are held in escrow by BootHop until delivery is confirmed by '
        'both parties, which protects users and gives the platform full visibility and control over every '
        'transaction. We also operate a separate Business Portal, where companies can post commercial delivery '
        'jobs and assign vetted carriers -- opening a B2B revenue stream alongside the peer-to-peer consumer '
        'model. As transaction volume scales, the dual-sided fee structure compounds quickly: a £100 agreed '
        'price generates £8 in platform revenue before insurance. Our model is asset-light, globally portable, '
        'and requires no courier fleet -- the more people travel, the more capacity we have.',
        y,
    )

    # Q3 - Competitors
    y = pdf._check_page(y, 70)
    y = pdf._q('Competitors', y)
    y = pdf._a(
        'BootHop operates in a space with several layers of competition. The most direct competitors are '
        'peer-to-peer delivery platforms such as Grabr, Nimber, and Piggybee, which also connect travelers '
        'with senders -- however, these platforms lack BootHop\'s structured trust infrastructure: our escrow '
        'model, in-platform KYC identity verification, message filtering, and admin-controlled payment release '
        'set us meaningfully apart. Traditional courier and logistics companies -- DHL, FedEx, UPS, Royal Mail, '
        'and Parcelforce -- represent the incumbent competition; they are expensive, slow for cross-border '
        'personal deliveries, and entirely inaccessible for the informal and diaspora economy we serve. Our '
        'largest real-world competitor is the informal status quo: WhatsApp groups, Facebook community pages, '
        'and word-of-mouth arrangements where diaspora communities ask friends or strangers to carry items -- '
        'this is unregulated, uninsured, and unsafe, but extremely common. Uber Connect competes at the '
        'same-city level, but does not address intercity or international routes. What differentiates BootHop '
        'is that we are the only platform combining anonymous intent matching, verified identity, escrowed '
        'payments, and controlled contact reveal in a single flow -- meaning neither party is exposed until '
        'trust is fully established. We are building the infrastructure layer that turns informal behaviour '
        'into a safe, regulated, and scalable marketplace.',
        y,
    )

    # Q4 - Team
    y = pdf._check_page(y, 60)
    y = pdf._q('Team', y)
    y = pdf._a(
        'BootHop is led by three co-founders with a combined 70+ years of industry experience across '
        'technology, logistics, procurement, and finance -- backgrounds that map directly onto every layer '
        'of what BootHop needs to succeed. Oluwatoyin Olufeko (CEO) brings 27 years of hands-on experience '
        'in system development, banking, and supply chain, having built and delivered complex platforms across '
        'multiple sectors for UBS, JPMorgan Chase, DHL Aviation, and Walgreens Boots Alliance; he architected '
        'and built the BootHop platform end-to-end. Omobolarinwa Famutimi brings over 20 years in procurement '
        'and supply chain operations, giving the team deep commercial insight into how goods move, how supplier '
        'relationships are structured, and what enterprises need from a logistics partner -- critical for the '
        'B2B side of BootHop\'s business portal. Dotun Asekun brings 20+ years specialising in system testing '
        'and customs systems, an unusually rare skill set for a startup at this stage -- his expertise means '
        'BootHop is built with compliance, cross-border customs logic, and quality assurance embedded from day '
        'one rather than bolted on later. Together the team covers product, operations, and compliance without '
        'needing to outsource any core function. Full professional backgrounds for all three founders can be '
        'viewed at OTB-MIDAS.com.',
        y,
    )

    # Q5 - Traction
    y = pdf._check_page(y, 60)
    y = pdf._q('Traction', y)
    y = pdf._a(
        'BootHop launched four months ago and is already generating approximately $500 per month in revenue '
        '(USD equivalent) -- a meaningful early signal for a marketplace that requires trust-building on both '
        'sides before transactions occur. The platform is fully live at www.boothop.com with real paying users '
        'completing end-to-end deliveries through our match, KYC, escrow, and confirmation flow. In four months '
        'we have built and deployed a complete two-sided marketplace including identity verification, escrow '
        'payments, in-app messaging, dispute resolution, a business portal for commercial clients, and an '
        'automated matching engine -- infrastructure that typically takes funded startups 12-18 months to ship. '
        'Our focus for the next phase is growing transaction volume and expanding our active user base across '
        'UK diaspora corridors and into the US market. All current revenue figures are in USD equivalent.',
        y,
    )

    # Q6 - Biggest Challenges
    y = pdf._check_page(y, 80)
    y = pdf._q('Biggest Challenges (besides funding)', y)
    y = pdf._a(
        'BootHop\'s biggest challenges are trust, liquidity, and cross-border compliance. First, building trust '
        'on both sides of a two-sided marketplace is hard -- senders must trust a stranger to carry their goods, '
        'and travelers must trust the platform to hold and release their money fairly. We are solving this through '
        'our layered trust model: KYC identity verification, escrow payments, content-filtered messaging, and '
        'admin-controlled fund release. But trust takes time and transaction history to compound. Second, the '
        'classic cold-start problem: a marketplace needs supply (travelers) and demand (senders) in the same '
        'corridors at the same time. Too few travelers means slow matching; too few senders means travelers '
        'don\'t bother listing. We are addressing this through targeted diaspora community outreach and our '
        'automated matching engine, but growing both sides simultaneously in new markets remains our most '
        'operationally intensive challenge. Third, cross-border compliance: different markets have different '
        'customs laws, prohibited goods lists, and financial regulations. We have built compliance prompts, '
        'terms acceptance tracking, and customs guidance into the platform, but scaling this across multiple '
        'jurisdictions will require legal partnerships in each market -- particularly for US entry. Finally, '
        'changing informal behaviour: our biggest real-world competitor is not another app, it is the WhatsApp '
        'group. Convincing diaspora communities to move from informal arrangements to a structured platform '
        'requires consistent education and a trust track record we are still building.',
        y,
    )

    # Q7 - Reason for Selection
    y = pdf._check_page(y, 60)
    y = pdf._q('Reason for Selection -- Why should we select your team?', y)
    y = pdf._a(
        'BootHop is not a concept -- it is a live, revenue-generating platform built and shipped in under four '
        'months by a three-person team with a combined 70 years of experience across enterprise technology, '
        'supply chain, procurement, and cross-border compliance. We are solving a real, underserved problem in '
        'a market we know intimately: the diaspora delivery corridor between the UK, Nigeria, and now the United '
        'States, where millions of people currently rely on unregulated WhatsApp arrangements with no identity '
        'verification, no escrow, and no legal protection. Our team brings exactly what a Soft Landing Pad '
        'programme needs -- a technical founder who has delivered mission-critical systems for UBS, JPMorgan '
        'Chase, and DHL Aviation, an operations lead with 20 years of procurement networks across the UK and '
        'West Africa, and a compliance lead with 20 years in customs and system testing who ensures we build '
        'right, not just fast. We are not coming to Wisconsin to figure out our idea -- we are coming to execute '
        'a US market entry strategy with a working product, paying customers, and the operational discipline to '
        'grow. gener8tor\'s network and mentorship would give us the relationships and local credibility to do '
        'in months what would otherwise take us years to build from scratch.',
        y,
    )

    # ── FOOTER (last page) ────────────────────────────────────────────────────
    fy = H - 14
    pdf.set_fill_color(*NAVY)
    pdf.rect(0, fy, W, 14, 'F')
    pdf.set_fill_color(*BLUE)
    pdf.rect(0, fy, W, 1, 'F')
    pdf.set_font('Helvetica', '', 7)
    pdf.set_text_color(*LGREY)
    pdf.set_xy(15, fy + 4)
    pdf.cell(W - 30, 5,
        'BootHop Ltd  |  Registered in England & Wales  |  www.boothop.com  |  titobalo12@gmail.com  |  Confidential',
        align='C')

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(OUTPUT))
    shutil.copy(OUTPUT, DESKTOP)
    print(f'Application saved -> {OUTPUT}')
    print(f'Desktop copy   -> {DESKTOP}')


if __name__ == '__main__':
    build()
