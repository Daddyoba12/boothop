"""
Non-technical BootHop snapshot for co-founders Omobola and Dotun.
Sent to omobola.famutimi@outlook.com and asheks2000@yahoo.com, CC oluwatoyinb@yahoo.com
"""

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email.mime.text import MIMEText
from email import encoders
from fpdf import FPDF

NAVY  = (2, 6, 23)
DARK  = (12, 30, 61)
BLUE  = (37, 99, 235)
WHITE = (255, 255, 255)
GRAY  = (100, 116, 139)
LGRAY = (241, 245, 249)
GREEN = (16, 185, 129)
AMBER = (245, 158, 11)
LIGHT = (219, 234, 254)


class SnapDoc(FPDF):
    def header(self):
        self.set_fill_color(*NAVY)
        self.rect(0, 0, 210, 14, 'F')
        self.set_font('Helvetica', 'B', 9)
        self.set_text_color(*WHITE)
        self.set_xy(10, 3)
        self.cell(0, 8, 'BootHop  |  Snapshot for the Founding Team  |  August 2025')
        self.ln(12)

    def footer(self):
        self.set_y(-12)
        self.set_font('Helvetica', '', 7)
        self.set_text_color(*GRAY)
        self.cell(0, 8, f'Page {self.page_no()} | Private - BootHop Founding Team Only', align='C')

    def cover(self):
        self.add_page()
        self.set_fill_color(*DARK)
        self.rect(0, 14, 210, 75, 'F')
        self.set_fill_color(*BLUE)
        self.rect(0, 86, 210, 3, 'F')

        self.set_font('Helvetica', 'B', 40)
        self.set_text_color(*WHITE)
        self.set_xy(0, 26)
        self.cell(210, 16, 'BootHop', align='C')

        self.set_font('Helvetica', '', 13)
        self.set_text_color(180, 200, 240)
        self.set_xy(0, 46)
        self.cell(210, 8, 'Ship Anything. Anywhere. Anytime.', align='C')

        self.set_font('Helvetica', 'B', 14)
        self.set_text_color(*WHITE)
        self.set_xy(0, 60)
        self.cell(210, 10, 'Where We Are Today  --  August 2025', align='C')

        self.set_font('Helvetica', '', 10)
        self.set_text_color(*LIGHT)
        self.set_xy(0, 92)
        self.cell(210, 7, 'Prepared for Omobola Famutimi and Dotun Asekun', align='C')

        self.set_xy(20, 108)
        self.set_font('Helvetica', '', 11)
        self.set_text_color(*DARK)
        self.multi_cell(170, 6,
            'Hi Omobola and Dotun,\n\n'
            'Here is a plain-English snapshot of what BootHop is today, what is built '
            'and live on www.boothop.com, and what services are available. No technical '
            'detail -- just what you need to know as co-founders to talk about the product '
            'confidently and understand where we are.')

    def heading(self, text, colour=BLUE):
        self.ln(5)
        self.set_fill_color(*colour)
        self.rect(10, self.get_y(), 190, 10, 'F')
        self.set_font('Helvetica', 'B', 11)
        self.set_text_color(*WHITE)
        self.set_x(14)
        self.cell(180, 10, text, ln=True)
        self.ln(3)

    def body(self, text):
        self.set_font('Helvetica', '', 10)
        self.set_text_color(30, 41, 59)
        self.set_x(14)
        self.multi_cell(182, 5.5, text)
        self.ln(2)

    def bullet(self, items, colour=BLUE):
        self.set_font('Helvetica', '', 10)
        self.set_text_color(30, 41, 59)
        for item in items:
            self.set_x(14)
            self.set_font('Helvetica', 'B', 10)
            self.set_text_color(*colour)
            self.cell(6, 6, '-')
            self.set_font('Helvetica', '', 10)
            self.set_text_color(30, 41, 59)
            self.multi_cell(178, 5.5, item)
        self.ln(2)

    def service_box(self, title, who, what, colour=BLUE):
        y = self.get_y()
        self.set_fill_color(*colour)
        self.rect(10, y, 5, 22, 'F')
        self.set_fill_color(*LGRAY)
        self.rect(15, y, 185, 22, 'F')
        self.set_font('Helvetica', 'B', 10)
        self.set_text_color(*colour)
        self.set_xy(17, y + 2)
        self.cell(80, 5, title)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(*GRAY)
        self.cell(100, 5, 'For: ' + who, ln=True)
        self.set_font('Helvetica', '', 9)
        self.set_text_color(30, 41, 59)
        self.set_x(17)
        self.multi_cell(181, 4.5, what)
        self.ln(3)


def build(path):
    pdf = SnapDoc()
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.cover()

    # ── WHAT IS BOOTHOP ──────────────────────────────────────────────────────
    pdf.add_page()
    pdf.heading('WHAT IS BOOTHOP?', DARK)
    pdf.body(
        'BootHop is a peer-to-peer delivery marketplace based in the UK. '
        'It connects two types of people:\n\n'
        '  HOOPERS -- people who need to send something (a parcel, a gift, food, '
        'documents, electronics) from one city or country to another.\n\n'
        '  BOOTERS -- travellers who are already flying or travelling on that route '
        'and have spare luggage space. They agree to carry the item and earn money for it.\n\n'
        'Instead of paying expensive courier fees, a Hooper pays a Booter directly. '
        'BootHop handles the matching, the safety checks, the payment, and the paperwork. '
        'We take a small 5% fee from each transaction. '
        'The platform is live at www.boothop.com right now.'
    )

    pdf.heading('THE JOURNEY IN 6 STEPS', BLUE)
    pdf.bullet([
        'STEP 1 -- Hooper posts what they need sent: item description, route, date, value.',
        'STEP 2 -- BootHop matches them with a Booter travelling on the same route.',
        'STEP 3 -- Both agree to the delivery. Hooper pays into secure escrow.',
        'STEP 4 -- Item is checked by the Booter (inspection), declared for customs, and collected.',
        'STEP 5 -- Booter travels and delivers the item. A QR code on the package confirms handover.',
        'STEP 6 -- Both parties confirm receipt. Payment is released. Ratings are left.',
    ])

    pdf.heading('WHAT IS LIVE ON THE WEBSITE TODAY', GREEN)
    pdf.body('Everything listed below is fully built and working on www.boothop.com right now:')
    pdf.bullet([
        'Full registration and login system (email OTP -- no passwords to forget).',
        'Live journey marketplace -- travellers post their trips, senders browse and match.',
        'Delivery request creation -- senders describe their item and it goes live on the platform.',
        'Secure payment and escrow -- money is held safely until delivery is confirmed.',
        'In-app messaging -- sender and carrier chat inside BootHop (not on WhatsApp).',
        'Live parcel tracking -- senders can watch their delivery on a map in real time.',
        'KYC identity checks -- Stripe Identity verifies carriers before they can carry goods.',
        'Customs declaration system -- senders declare what they are sending for compliance.',
        'AI Safety Assistant -- anyone can check if an item is allowed on a route before sending.',
        'Compliance engine -- items are automatically scanned against customs rules.',
        'QR code seal and delivery pin -- proves physical handover at both ends.',
        'Ratings and reviews -- both parties rate each other after every delivery.',
        'Blog and SEO content -- articles on customs, shipping tips, and business delivery.',
        'Help centre, FAQ, terms, privacy policy, and carrier agreement -- all published.',
        'WhatsApp quick-contact and full contact form.',
    ])

    # ── SERVICES ─────────────────────────────────────────────────────────────
    pdf.add_page()
    pdf.heading('SERVICES AVAILABLE ON BOOTHOP.COM', DARK)
    pdf.body('BootHop offers three groups of service:')

    pdf.heading('1. PEER-TO-PEER DELIVERY (CORE SERVICE)', BLUE)
    pdf.service_box('Standard P2P Delivery', 'Individual senders and travellers',
        'Any individual can post a delivery request or a travel journey. '
        'The platform matches them automatically, handles payment, and guides both parties '
        'through the full delivery process.', BLUE)
    pdf.service_box('International Delivery', 'Individuals sending abroad',
        'BootHop handles the complexity of cross-border delivery: customs declarations, '
        'prohibited items checks, duty guidance, and carrier KYC. Popular routes include '
        'UK to Nigeria, UK to Ghana, UK to Jamaica and across Europe.', BLUE)
    pdf.service_box('AI Safety Check', 'Anyone -- free to use, no login needed',
        'Before sending anything, users can visit boothop.com/ai-check and type what they '
        'want to send. The AI checks customs rules, airline restrictions, and BootHop policy '
        'in seconds and tells them if it is allowed, restricted, or prohibited.', BLUE)

    pdf.heading('2. BUSINESS PORTAL (B2B SERVICE)', AMBER)
    pdf.service_box('Business Standard', 'Small and medium businesses',
        'Businesses can create an account on the BootHop Business Portal and post delivery '
        'jobs. They access the same carrier network as individuals but with a business '
        'dashboard, invoice downloads, and volume tracking.', AMBER)
    pdf.service_box('Business Express', 'Businesses needing urgent delivery',
        'Same-day and next-available-flight delivery for urgent business items. '
        'Targeted at businesses that need something moved fast -- documents, samples, '
        'equipment -- without using expensive courier services.', AMBER)
    pdf.service_box('Priority Partner', 'Established businesses with regular volume',
        'Premium B2B tier with SLA guarantees, a dedicated account manager, priority '
        'carrier matching, and a dedicated portal with full reporting. '
        'Businesses pay a subscription fee for this tier.', AMBER)
    pdf.service_box('Carrier Network (B2B)', 'Independent carriers and logistics companies',
        'Carriers and logistics companies can join the BootHop Business Carrier Network '
        'to receive regular business delivery jobs. They get access to a separate carrier '
        'portal and are paid per confirmed delivery.', AMBER)

    pdf.heading('3. SPECIALIST & ADD-ON SERVICES', GREEN)
    pdf.service_box('Customs Duty Calculator', 'All users',
        'A free tool on the website that estimates import duty and tax for common item '
        'categories on popular routes. Helps senders know what to expect at the border.', GREEN)
    pdf.service_box('KYC Verification', 'All carriers (mandatory)',
        'Every carrier is identity-verified using Stripe Identity before they can accept '
        'their first delivery. This protects senders and keeps the platform safe.', GREEN)
    pdf.service_box('BFI Flight Intelligence (Internal)', 'BootHop team only',
        'An internal dashboard that monitors all live journeys, carrier locations, flight '
        'data, compliance alerts, and platform analytics. The team uses this to manage '
        'operations day-to-day.', GREEN)

    # ── WHERE WE ARE ─────────────────────────────────────────────────────────
    pdf.add_page()
    pdf.heading('WHERE WE ARE AS A BUSINESS', DARK)
    pdf.body(
        'BootHop launched 4 months ago and is generating early revenue -- approximately '
        'GBP 500 per month at this stage. The platform is fully built and live. '
        'We are now focused on growing the number of users on both sides -- more Hoopers '
        'posting requests and more Booters posting their travel plans.'
    )
    pdf.bullet([
        'Website: www.boothop.com -- live and taking real bookings.',
        'Team: 3 co-founders. Oluwatoyin (tech and product), Omobola (procurement and ops), Dotun (systems and customs).',
        'Revenue: Early stage -- GBP 500/month. Growing through word of mouth and social.',
        'Geography: UK-based, serving international routes. Strongest demand on UK-Nigeria corridor.',
        'Registered: BootHop Ltd -- registered in England and Wales.',
        'Funding: Bootstrapped. Actively applying for accelerator programmes including gener8tor Wisconsin.',
    ])

    pdf.heading('WHAT MAKES US DIFFERENT', BLUE)
    pdf.bullet([
        'We are not a courier. We match real people who are already travelling -- no vans, no depots.',
        'Our AI safety check is unique -- no other P2P platform checks items against customs rules before sending.',
        'We handle the compliance and paperwork that makes international delivery complicated for individuals.',
        'We serve corridors that traditional couriers either ignore or charge a fortune for (e.g. UK to Nigeria).',
        'Both the sender and carrier are verified, rated, and protected by escrow payment.',
    ])

    pdf.heading('WHAT IS COMING NEXT', GREEN)
    pdf.bullet([
        'Mobile app -- boothop-mobile is already in development alongside the website.',
        'More routes -- expanding beyond UK to cover Nigeria, Ghana, Jamaica, and diaspora corridors.',
        'Business growth -- onboarding more Priority Partners and building the B2B carrier network.',
        'Marketing push -- social content, influencer partnerships, and referral programme.',
        'Accelerator funding -- if selected for gener8tor Wisconsin, this accelerates everything.',
    ])

    pdf.heading('YOUR ROLES AS CO-FOUNDERS', DARK)
    pdf.body(
        'Each of you brings something the team needs:\n\n'
        'OMOBOLA FAMUTIMI -- Over 20 years in procurement. Your expertise helps BootHop '
        'manage carrier relationships, vet business clients, and build the B2B carrier network. '
        'You understand supply chain and how to manage people at scale.\n\n'
        'DOTUN ASEKUN -- Over 20 years in systems testing and customs systems. Your knowledge '
        'of customs processes is directly embedded in how BootHop checks items and guides '
        'users through declarations. You help us stay compliant and trustworthy.\n\n'
        'Together with Oluwatoyin\'s 27 years of system development across banking and '
        'supply chain, we have the right team to build this properly.'
    )

    pdf.set_xy(14, pdf.get_y() + 6)
    pdf.set_fill_color(*DARK)
    pdf.rect(10, pdf.get_y(), 190, 18, 'F')
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(*WHITE)
    pdf.set_x(14)
    pdf.cell(182, 9, 'Any questions -- reach Toyin at titobalo12@gmail.com or +44 7506 553755')
    pdf.ln(9)
    pdf.set_font('Helvetica', '', 9)
    pdf.set_text_color(180, 200, 240)
    pdf.set_x(14)
    pdf.cell(182, 7, 'www.boothop.com  |  info@boothop.com  |  BootHop Ltd, Nottingham, UK')

    pdf.output(path)
    print('Snapshot written:', path)


def send(path):
    sender = 'titobalo12@gmail.com'
    to_list = ['omobola.famutimi@outlook.com', 'asheks2000@yahoo.com']
    cc_list = ['oluwatoyinb@yahoo.com']

    msg = MIMEMultipart()
    msg['From']    = 'Oluwatoyin Olufeko <titobalo12@gmail.com>'
    msg['To']      = ', '.join(to_list)
    msg['Cc']      = ', '.join(cc_list)
    msg['Subject'] = 'BootHop Today -- A Snapshot for the Team'

    body = MIMEText(
        'Hi Omobola and Dotun,\n\n'
        'Here is a snapshot of where BootHop is today.\n\n'
        'The attached document covers:\n'
        '  - What BootHop does and how it works\n'
        '  - Everything that is live on the website right now\n'
        '  - All the services available (individual delivery, business portal, AI check)\n'
        '  - Where we are as a business\n'
        '  - What makes us different\n'
        '  - What is coming next\n\n'
        'No technical detail -- just the full picture as co-founders.\n\n'
        'Let me know if you have any questions.\n\n'
        'Toyin\n'
        'Co-Founder, BootHop\n'
        'www.boothop.com',
        'plain'
    )
    msg.attach(body)

    with open(path, 'rb') as f:
        part = MIMEBase('application', 'octet-stream')
        part.set_payload(f.read())
    encoders.encode_base64(part)
    part.add_header('Content-Disposition', 'attachment; filename="BootHop-Snapshot-August-2025.pdf"')
    msg.attach(part)

    all_recipients = to_list + cc_list
    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
        server.login(sender, 'howq mtby fbei ydzj')
        server.sendmail(sender, all_recipients, msg.as_string())
    print('Snapshot email sent to', ', '.join(all_recipients))


if __name__ == '__main__':
    out = 'public/downloads/boothop-team-snapshot-aug2025.pdf'
    build(out)
    send(out)
    print('Done.')
