"""
Oluwatoyin Olufeko - Ultimate CV Generator
Output: ../public/downloads/oluwatoyin-olufeko-cv.pdf
Install: pip install fpdf2
Run:     python make_cv.py
"""

from fpdf import FPDF
from pathlib import Path

OUTPUT = Path(__file__).parent.parent / "public" / "downloads" / "oluwatoyin-olufeko-cv.pdf"

# Colours
NAVY  = (2,   6,  23)
DARK  = (12,  30,  61)
BLUE  = (37,  99, 235)
LBLUE = (59, 130, 246)
WHITE = (255, 255, 255)
GREY  = (100, 116, 139)
LGREY = (148, 163, 184)
BLACK = (15,  23,  42)
LIGHT = (241, 245, 249)

W, H = 210, 297  # A4


class CV(FPDF):

    def _rule(self, y, x=0, w=None, color=BLUE, h=0.4):
        self.set_fill_color(*color)
        self.rect(x, y, w or W, h, 'F')

    def _section(self, title, y):
        self.set_font('Helvetica', 'B', 9)
        self.set_text_color(*BLUE)
        self.set_xy(15, y)
        self.cell(W - 30, 6, title.upper())
        self._rule(y + 7, x=15, w=W - 30, color=BLUE, h=0.5)
        return y + 11

    def _job(self, company, location, title, dates, bullets, y):
        self.set_font('Helvetica', 'B', 9)
        self.set_text_color(*BLACK)
        self.set_xy(15, y)
        self.cell(110, 5, company)
        self.set_font('Helvetica', '', 8)
        self.set_text_color(*GREY)
        self.set_xy(125, y)
        self.cell(70, 5, location, align='R')
        y += 5
        self.set_font('Helvetica', 'B', 8)
        self.set_text_color(*BLUE)
        self.set_xy(15, y)
        self.cell(110, 5, title)
        self.set_font('Helvetica', 'I', 7.5)
        self.set_text_color(*GREY)
        self.set_xy(125, y)
        self.cell(70, 5, dates, align='R')
        y += 6
        for b in bullets:
            self.set_font('Helvetica', '', 7.8)
            self.set_text_color(*BLACK)
            self.set_xy(17, y)
            self.cell(4, 4.5, chr(149))
            self.set_xy(22, y)
            self.multi_cell(W - 37, 4.5, b)
            y = self.get_y() + 0.5
        return y + 3

    def _skill_col(self, items, x, y, col_w):
        for item in items:
            self.set_font('Helvetica', '', 7.8)
            self.set_text_color(*BLACK)
            self.set_xy(x, y)
            self.cell(4, 4.5, chr(149))
            self.set_xy(x + 4, y)
            self.cell(col_w - 6, 4.5, item)
            y += 4.8
        return y


def build():
    pdf = CV(orientation='P', unit='mm', format='A4')
    pdf.set_auto_page_break(False)
    pdf.set_margins(0, 0, 0)
    pdf.add_page()

    # ── HEADER ────────────────────────────────────────────────────────────────
    pdf.set_fill_color(*NAVY)
    pdf.rect(0, 0, W, 48, 'F')
    pdf.set_fill_color(*BLUE)
    pdf.rect(0, 0, W, 3, 'F')

    pdf.set_font('Helvetica', 'B', 22)
    pdf.set_text_color(*WHITE)
    pdf.set_xy(15, 10)
    pdf.cell(W - 30, 12, 'Oluwatoyin Olufeko')

    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(219, 234, 254)
    pdf.set_xy(15, 23)
    pdf.cell(W - 30, 6, 'Senior IBM i Technical Lead  |  Full-Stack Architect  |  Founder & CEO')

    # Contact strip
    pdf.set_fill_color(*BLUE)
    pdf.rect(0, 34, W, 14, 'F')

    contacts = [
        'Nottingham, United Kingdom',
        'titobalo12@gmail.com',
        '+44 7506 553755',
        'www.boothop.com',
        'OTB-MIDAS.com',
    ]
    cw = W / len(contacts)
    for i, c in enumerate(contacts):
        pdf.set_font('Helvetica', '', 7.5)
        pdf.set_text_color(*WHITE)
        pdf.set_xy(i * cw, 34)
        pdf.cell(cw, 14, c, align='C')

    # ── PROFILE ───────────────────────────────────────────────────────────────
    y = 54
    y = pdf._section('Professional Profile', y)
    pdf.set_font('Helvetica', '', 8.5)
    pdf.set_text_color(*BLACK)
    pdf.set_xy(15, y)
    pdf.multi_cell(
        W - 30, 5,
        'Senior IBM i / AS400 Technical Lead, Full-Stack Software Architect and Entrepreneur with over 27 years '
        'of experience delivering mission-critical enterprise solutions across banking, financial services, aviation, '
        'logistics, retail and supply chain sectors. Proven track record with global institutions including UBS, '
        'Credit Suisse, JPMorgan Chase, DHL Aviation, Walgreens Boots Alliance and Thermo Fisher Scientific. '
        'Deep expertise in IBM i, RPGLE, DB2, MQ Series, REST APIs and enterprise integration. '
        'In parallel, Founder and CEO of BootHop (www.boothop.com) -- a live, revenue-generating peer-to-peer '
        'delivery marketplace built entirely using Next.js, Supabase, TypeScript and Stripe, demonstrating '
        'full-stack product delivery, commercial thinking and entrepreneurial execution at speed.'
    )
    y = pdf.get_y() + 5

    # ── CORE SKILLS (3 columns) ───────────────────────────────────────────────
    y = pdf._section('Core Technical Skills', y)

    col_w = (W - 30) / 3
    col1_x, col2_x, col3_x = 15, 15 + col_w, 15 + col_w * 2

    col1 = [
        'IBM i / AS400 / iSeries',
        'RPG III / RPG IV / RPGLE',
        'Free Format RPG / SQLRPGLE',
        'CL / CLLE / Embedded SQL',
        'DB2/400 / MQ Series',
        'REST APIs / SOAP / JSON / XML',
        'SWIFT Messaging (MT544/MT546)',
        'YAJL / Service Programs',
    ]
    col2 = [
        'Next.js 16 / React / TypeScript',
        'Supabase / PostgreSQL',
        'Tailwind CSS / Node.js',
        'Stripe Identity (KYC)',
        'Vercel / CI-CD Pipelines',
        'Jenkins / ServiceNow / Aldon',
        'WebSphere / RDi / SYNON',
        'Azure / REST Integrations',
    ]
    col3 = [
        'Agile / Scrum / Waterfall',
        'SDLC / DevOps / ITIL',
        'Offshore Team Leadership',
        'Incident & Production Support',
        'Banking System Integration',
        'Customs Declaration Systems',
        'Aviation Hub Systems',
        'Product Architecture & Design',
    ]

    y1 = pdf._skill_col(col1, col1_x, y, col_w)
    y2 = pdf._skill_col(col2, col2_x, y, col_w)
    y3 = pdf._skill_col(col3, col3_x, y, col_w)
    y = max(y1, y2, y3) + 4

    # ── PROFESSIONAL EXPERIENCE ───────────────────────────────────────────────
    y = pdf._section('Professional Experience', y)

    y = pdf._job(
        'BootHop Ltd', 'Nottingham, United Kingdom',
        'Founder & CEO / Full-Stack Architect',
        '2024 - Present',
        [
            'Founded and built BootHop (www.boothop.com) -- a live, peer-to-peer delivery marketplace connecting '
            'senders with travelers to carry goods for a fee, with KYC, escrow payments, and dispute resolution built in.',
            'Architected and delivered the entire platform solo using Next.js 16, TypeScript, Supabase (PostgreSQL), '
            'Tailwind CSS 4, Stripe Identity, and Resend -- deployed on Vercel with automated cron operations.',
            'Implemented full business logic: anonymous intent matching, two-sided KYC, escrow payment model, '
            'content-filtered in-app messaging, admin-controlled fund release, and dispute evidence system.',
            'Built a separate B2B business portal for commercial delivery clients with its own auth, compliance checks, '
            'and carrier assignment workflows.',
            'Platform generating revenue within 4 months of launch, with automated matching engine, social content '
            'pipeline (TikTok/Instagram), and active user base in UK diaspora corridors.',
        ],
        y,
    )

    y = pdf._job(
        'OTB Midas Ltd / Target Group', 'Cardiff, United Kingdom',
        'Senior IBM i Technical Lead / AS400 Lead Associate',
        'June 2022 - Present',
        [
            'Subject Matter Expert for the CENTRAC Loan Management platform supporting 60-80 UK banking institutions.',
            'Lead IBM i development and application support across RPGLE, SQLRPGLE, CLLE and Azure integrated environments.',
            'Manage offshore and onshore support teams ensuring SLA compliance and operational stability.',
            'Deliver banking system integrations and process improvements for Barclays, Credit Suisse and Morgan Stanley.',
            'Drive Agile delivery, governance reviews and stakeholder engagement across the programme.',
        ],
        y,
    )

    y = pdf._job(
        'UBS', 'London, United Kingdom',
        'Senior IBM i Consultant / AS400 Lead Associate',
        'August 2023 - June 2025',
        [
            'Supported critical IBM i banking applications within a highly regulated financial environment.',
            'Participated in the Credit Suisse mortgage platform integration programme following the UBS acquisition.',
            'Developed and enhanced RPGLE, SQLRPGLE and DB2 solutions supporting mortgage and banking operations.',
            'Worked on SWIFT settlement messaging including MT544 and MT546 integrations.',
            'Supported API-driven modernisation initiatives and legacy application enhancements.',
        ],
        y,
    )

    # ── PAGE 2 ────────────────────────────────────────────────────────────────
    pdf.add_page()

    # Continuation header
    pdf.set_fill_color(*NAVY)
    pdf.rect(0, 0, W, 14, 'F')
    pdf.set_fill_color(*BLUE)
    pdf.rect(0, 0, W, 2, 'F')
    pdf.set_font('Helvetica', 'B', 9)
    pdf.set_text_color(*WHITE)
    pdf.set_xy(15, 4)
    pdf.cell(100, 6, 'Oluwatoyin Olufeko  --  CV continued')
    pdf.set_font('Helvetica', '', 8)
    pdf.set_text_color(*LGREY)
    pdf.set_xy(0, 4)
    pdf.cell(W - 15, 6, 'titobalo12@gmail.com  |  +44 7506 553755', align='R')

    y = 20

    y = pdf._job(
        'Thermo Fisher Scientific', 'Loughborough, United Kingdom',
        'IBM i Developer',
        'November 2021 - June 2023',
        [
            'Developed and enhanced IBM i applications using RPGLE, SQLRPGLE and CLLE.',
            'Supported Customs Declaration Systems (CDS) and supply chain integration platforms.',
            'Delivered system optimisation initiatives improving operational performance.',
            'Worked with MQ messaging, Jenkins deployment pipelines and Jira-based delivery processes.',
        ],
        y,
    )

    y = pdf._job(
        'AGCO', 'Coventry, United Kingdom',
        'Senior IBM i Engineer',
        'April 2021 - August 2021',
        [
            'Investigated and resolved pricing, inventory and manufacturing system issues.',
            'Delivered custom reporting and operational analytics solutions.',
            'Improved reliability and maintainability of IBM i applications through code reviews and health assessments.',
        ],
        y,
    )

    y = pdf._job(
        'Walgreens Boots Alliance', 'Nottingham, United Kingdom',
        'AS400 Lead Consultant',
        'April 2016 - April 2021',
        [
            'Led IBM i application modernisation and decommissioning projects across multiple business functions.',
            'Analysed RPGLE applications, dependencies and integration points for migration planning.',
            'Managed integration with Java, .NET and external enterprise systems.',
            'Supervised offshore development teams and coordinated Agile delivery activities.',
        ],
        y,
    )

    y = pdf._job(
        'VF Corporation', 'Prague, Czech Republic',
        'Analyst Programmer',
        'August 2014 - March 2016',
        [
            'Supported warehouse management, financial systems and supply chain platforms.',
            'Developed enhancements to JBA financial applications and WMS reporting platforms.',
            'Delivered inventory reconciliation and KPI reporting systems.',
        ],
        y,
    )

    y = pdf._job(
        'JPMorgan Chase', 'Glasgow, United Kingdom',
        'IBM i Consultant',
        '',
        [
            'Supported GMI banking systems and regulatory / financial system updates.',
            'Participated in Turnover to Aldon migration activities.',
        ],
        y,
    )

    y = pdf._job(
        'DHL Aviation', 'United Kingdom / Belgium / Germany',
        'Analyst Programmer & IT Development Manager',
        'February 2006 - March 2014',
        [
            'Developed aviation and logistics systems using RPG, CLLE, SQL and DB2 across international hubs.',
            'Participated in the development of DHL Aviation Hub Systems (AHS).',
            'Designed and supported MQ-based integrations between aviation platforms and customs systems.',
            'Supported Track & Trace solutions and Customs Declaration processing.',
            'Led migration activities from Turnover to Aldon and managed cross-border delivery teams.',
        ],
        y,
    )

    # ── KEY ACHIEVEMENTS ──────────────────────────────────────────────────────
    y = pdf._section('Key Achievements', y)

    achievements = [
        'Founded BootHop -- a live, revenue-generating P2P delivery marketplace built and launched in under 4 months.',
        'Delivered Credit Suisse mortgage integration support for UBS following major financial acquisition.',
        'Subject Matter Expert for CENTRAC banking systems used by 60-80 UK banking institutions.',
        'Designed and built MQ-integrated aviation and customs platforms for DHL Aviation across 3 countries.',
        'Led multiple IBM i modernisation and migration programmes across FTSE 100 and global organisations.',
        'Successfully managed offshore development and support teams across multiple international programmes.',
        'Built enterprise integration solutions using RPGLE, REST APIs, JSON, XML, SWIFT and MQ technologies.',
    ]

    for ach in achievements:
        pdf.set_font('Helvetica', '', 8)
        pdf.set_text_color(*BLACK)
        pdf.set_xy(17, y)
        pdf.cell(4, 4.5, chr(149))
        pdf.set_xy(22, y)
        pdf.multi_cell(W - 37, 4.5, ach)
        y = pdf.get_y() + 0.5

    y += 4

    # ── EDUCATION & CERTIFICATIONS ────────────────────────────────────────────
    y = pdf._section('Education & Certifications', y)

    for cert, issuer in [
        ('IBM Certified Specialist', 'IBM United Kingdom'),
        ('IBM AS400 Foundation Certification', 'IBM United Kingdom'),
    ]:
        pdf.set_font('Helvetica', 'B', 8.5)
        pdf.set_text_color(*BLACK)
        pdf.set_xy(15, y)
        pdf.cell(110, 5, cert)
        pdf.set_font('Helvetica', '', 8)
        pdf.set_text_color(*GREY)
        pdf.set_xy(125, y)
        pdf.cell(70, 5, issuer, align='R')
        y += 6

    y += 3

    # ── ENTREPRENEURIAL VENTURE ───────────────────────────────────────────────
    y = pdf._section('Entrepreneurial Venture', y)
    pdf.set_font('Helvetica', 'B', 8.5)
    pdf.set_text_color(*BLUE)
    pdf.set_xy(15, y)
    pdf.cell(80, 5, 'BootHop  --  www.boothop.com')
    pdf.set_font('Helvetica', '', 8)
    pdf.set_text_color(*GREY)
    pdf.set_xy(95, y)
    pdf.cell(90, 5, 'Founder & CEO  |  2024 - Present', align='R')
    y += 6
    pdf.set_font('Helvetica', '', 8)
    pdf.set_text_color(*BLACK)
    pdf.set_xy(15, y)
    pdf.multi_cell(
        W - 30, 4.8,
        'A peer-to-peer delivery marketplace connecting senders with travelers who carry goods for a fee -- '
        'fully live with KYC identity verification, escrow payments, in-app messaging, dispute resolution, '
        'and a B2B business portal. Stack: Next.js 16, TypeScript, Supabase, PostgreSQL, Stripe, Vercel. '
        'Built end-to-end by Oluwatoyin and generating revenue within 4 months of launch.'
    )
    y = pdf.get_y() + 5

    # ── FOOTER ────────────────────────────────────────────────────────────────
    fy = H - 12
    pdf.set_fill_color(*NAVY)
    pdf.rect(0, fy, W, 12, 'F')
    pdf.set_fill_color(*BLUE)
    pdf.rect(0, fy, W, 1, 'F')
    pdf.set_font('Helvetica', '', 7)
    pdf.set_text_color(*LGREY)
    pdf.set_xy(15, fy + 3)
    pdf.cell(W - 30, 5,
        'Oluwatoyin Olufeko  |  titobalo12@gmail.com  |  +44 7506 553755  |  Nottingham, UK  |  www.boothop.com  |  OTB-MIDAS.com',
        align='C')

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(OUTPUT))
    print(f'CV saved -> {OUTPUT}')


if __name__ == '__main__':
    build()
