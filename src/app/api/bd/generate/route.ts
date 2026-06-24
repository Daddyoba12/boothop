import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { getBdSession } from '@/lib/auth/session';

const PILLAR_CONTEXT: Record<string, string> = {
  logistics_stories:     'a real or realistic logistics company/brand story — courier startup disrupting the market, DHL/UPS/FedEx crisis, or African logistics company changing the game.',
  travel_hacks:          'a practical travel hack about shipping abroad, customs, or saving money with lots of luggage. Must be specific and actionable.',
  airport_deliveries:    'a dramatic story about airport logistics — missed packages, customs seizures, last-minute saves, or airport workers going above and beyond.',
  supply_chain_failures: 'a famous real-world supply chain failure — Suez Canal, COVID PPE, port strikes. Explain the lesson simply.',
};

const TONE: Record<string, string> = {
  documentary:     'calm, authoritative, mini-documentary narrator',
  urgent_news:     'fast-paced, urgent, breaking-news energy',
  travel_hack:     'friendly, helpful, slightly surprised',
  supply_chain:    'analytical, slightly alarmed, expert commentator',
  airport_mystery: 'suspenseful, curious, dramatic',
  boothop_cta:     'informative but leading naturally toward BootHop at the end',
  // Newspaper editorial formats
  nyt_feature:          'authoritative, long-form New York Times prestige journalism',
  global_logistics:     'regional business press, West Africa co-founder profile, community-driven',
  daily_mail_consumer:  'British tabloid consumer affairs — price shock, outrage, accessible',
  dlt_trade:            'trade publication, industry authority, problem/solution structure',
};

const NEWSPAPER_TEMPLATES = new Set(['nyt_feature', 'global_logistics', 'daily_mail_consumer', 'dlt_trade']);

const FOUNDERS = [
  { name: 'Titi Olufeko',       title: 'Founder & CEO'          },
  { name: 'Omobola Famimoluwa', title: 'Co-Founder & CFO'        },
  { name: 'Dotun Asekun',       title: 'Co-Founder & CRO (Chief Risk Officer)' },
];

// Visual asset references for content prompts
const ASSETS = {
  // Business backdrop: professional branded photo of founders at desk with BootHop backdrop
  businessBackdrop: 'the BootHop branded professional backdrop — founders seated at a dark executive desk, BootHop logo illuminated behind them, navy/teal brand colours, shot in a modern UK/Nigeria office setting',
  // Logos
  logoB2B:      '/images/boothop-bd-logo.png — BootHop BD logo, dark navy background, teal/blue gradient B icon with traveller figure, "BootHop BD — Beyond Delivery", Journeys | People | Trust | Impact icons',
  logoConsumer: '/images/boothop-logo.png — BootHop logo, white background, teal runner-with-luggage B icon, "BootHop — Beyond Delivery"',
};

function pickFounder() {
  return FOUNDERS[Math.floor(Math.random() * FOUNDERS.length)];
}

function buildNewspaperPrompt(pillar: string, templateKey: string) {
  const topic = PILLAR_CONTEXT[pillar] ?? PILLAR_CONTEXT.logistics_stories;

  // PROSE QUALITY RULE — prepended to every newspaper prompt
  const PROSE_RULE = `
CRITICAL WRITING RULES — READ BEFORE WRITING:
1. Write COMPLETE, PUBLICATION-QUALITY prose throughout. Every sentence must be a full readable sentence.
2. NO placeholder text. NO square-bracket instructions in the output. Write the actual content in every field.
3. Every section must contain REAL written paragraphs that make sense when a reader zooms into a printed newspaper.
4. The company is always referred to as "BootHop BD LTD" (full legal name, registered in the UK). BD stands for Beyond Delivery.
5. All articles, documents, and editorial pieces are published under the BootHop BD LTD brand.
6. Quotes from founders must be specific, insightful, and directly relevant — never generic or filler.
7. Real Stories sections must each be a FULL readable sentence — not a headline fragment.`;

  if (templateKey === 'nyt_feature') {
    const primary   = pickFounder();
    const secondary = FOUNDERS.find(f => f.name !== primary.name) ?? FOUNDERS[1];
    return `You are a New York Times feature journalist writing about what is REALLY happening in global supply chain and logistics right now.
Topic angle: ${topic}
Audience: Global, educated, 25-45, business-minded.
${PROSE_RULE}

${primary.name} (${primary.title}, BootHop BD LTD) and ${secondary.name} (${secondary.title}, BootHop BD LTD) are quoted as expert commentators — positioned as thought leaders reacting to the world event, not as advertisers. Their quotes must be sharp and specific.

Write a complete, print-ready NYT-style newspaper article. Output the actual article text, not instructions:

LABEL: [Write one of: SPECIAL INVESTIGATION / EXCLUSIVE INTERVIEW / ANALYSIS — choose most fitting]

HEADLINE: [Write a 2-line bold statement about the real-world supply chain story. Each line max 10 words. Powerful and factual.]

STANDFIRST: [Write one sentence connecting headline to the article. Max 20 words.]

BYLINE: By [invent a realistic reporter name], Global Correspondent

LEAD:
[Write a 3-4 sentence opening paragraph. Lead with the most important fact. Name a specific country, commodity, or route affected. Inverted pyramid — most newsworthy first.]

BODY:
[Write three substantial paragraphs of journalism. In the second paragraph, embed a direct quote from ${primary.name}, ${primary.title}, BootHop BD LTD — a real insight, not a sales pitch. In the third paragraph, embed a quote from ${secondary.name}, ${secondary.title}, BootHop BD LTD — a different angle on risk, opportunity, or human cost. The quotes must flow naturally into the reporting.]

SIDEBAR — A GROWING NETWORK BUILT ON TRUST:
[Write 4 bullet points — each a complete sentence explaining how BootHop BD LTD's verified-traveller model addresses the supply chain gap described in the article]

REAL STORIES. REAL IMPACT:
Aviation Part Delivered: [Write one full sentence describing a specific real-world example of BootHop BD LTD delivering a critical aviation component between two cities]
Document Saved a Deal: [Write one full sentence describing a specific example of a legal or business document reaching its destination via BootHop BD LTD in time to save a deal]
Luggage Reunited: [Write one full sentence describing how a traveller's left-behind luggage was reunited with its owner through BootHop BD LTD]

FOOTER: Movement Already Exists. We Make It Work Smarter. — BootHop BD LTD

Return ONLY valid JSON. hook = 2-line headline joined with newline. script = the complete printed article exactly as written above.
visual_desc = describe the newspaper as a visual design brief: NYT broadsheet layout, serif black masthead "The New York Times", multi-column body text, main photo using ${ASSETS.businessBackdrop}, founders captioned by name and title below photo, regular BootHop logo (${ASSETS.logoConsumer}) bottom-right — this is a P2P/consumer press story so use the standard logo not BD.
{"hook":"...","script":"LABEL:\\n...\\n\\nHEADLINE:\\n...\\n\\nSTANDFIRST:\\n...\\n\\nBYLINE:\\n...\\n\\nLEAD:\\n...\\n\\nBODY:\\n...\\n\\nSIDEBAR — A GROWING NETWORK BUILT ON TRUST:\\n...\\n\\nREAL STORIES. REAL IMPACT:\\n...\\n\\nFOOTER:\\n...","caption":"...","hashtags":"#supplychain #globallogistics #boothop ...","visual_desc":"..."}`;
  }

  if (templateKey === 'global_logistics') {
    const subject     = pickFounder();
    const labelType   = subject.title.startsWith('Founder') ? 'EXCLUSIVE FOUNDER INTERVIEW' : 'EXCLUSIVE CO-FOUNDER INTERVIEW';
    const subjectAngle = subject.title.includes('CEO')
      ? 'the founding vision, why West Africa needs this right now, and how BootHop BD LTD is building opportunity from movement that already exists'
      : subject.title.includes('CFO')
      ? 'financial inclusion, making peer delivery economically fair, and why trust is the currency that drives every transaction on the platform'
      : 'risk management, building a verified network, and why safety and accountability are the backbone of everything BootHop BD LTD does';

    return `You are a senior journalist for "Global Logistics Times" — the leading trade publication for logistics and commerce in West Africa.
Topic angle: ${topic}
Audience: West African diaspora, Nigerian and Ghanaian business community, logistics SME owners, 25-45.
Subject of this feature: ${subject.name}, ${subject.title} of BootHop BD LTD (Beyond Delivery).
${PROSE_RULE}

Write a complete, print-ready Global Logistics Times front-page profile. Output the actual article — no instructions, real prose only:

LABEL: ${labelType}

HEADLINE: ${subject.name.toUpperCase()}: [Write a bold 1-2 line statement in their voice about changing West African logistics. Max 8 words after the colon. Do not repeat the name.]

STANDFIRST: [Write one sentence about what ${subject.name} is building and why it matters for the region. Max 20 words.]

LEAD:
[Write 3 paragraphs. Open with a Lagos, NIGERIA dateline. Set the scene — describe the everyday logistics pain felt by ordinary West Africans sending documents, medication, or personal items across borders. Then introduce ${subject.name} and their focus: ${subjectAngle}. Use vivid, specific detail — real routes, real scenarios.]

THE PAIN IS REAL:
⚠ DELAYED DELIVERIES: [Write one complete sentence on how delayed business deliveries are costing West African companies millions and damaging relationships.]
📄 DOCUMENTS MISSING DEADLINES: [Write one complete sentence describing a real consequence of documents — contracts, legal papers, visas — arriving too late.]
💼 LEFT-BEHIND LUGGAGE: [Write one complete sentence on the emotional and financial cost of travellers losing items they couldn't carry.]
💊 ESSENTIAL ITEMS DELAYED: [Write one complete sentence on the life-or-death risk of medication and critical items failing to arrive on time.]
💰 HIGH COSTS, LOW OPTIONS: [Write one complete sentence on how expensive traditional couriers are and why human-powered alternatives don't yet exist at scale.]

PULL QUOTE: "[Write a sharp, specific, original quote from ${subject.name} — something that captures their personal conviction about BootHop BD LTD's mission. It must reflect their role as ${subject.title}. Not generic. Not promotional. Real and human.]" — ${subject.name}, ${subject.title}, BootHop BD LTD

HOW WE'RE CHANGING THINGS:
[Write 2 full paragraphs in reported speech, covering BootHop BD LTD's people-powered approach — verified travellers, airport-to-airport handoffs, real-time tracking — through ${subject.name}'s perspective. Include one direct quote embedded naturally in the second paragraph.]

PEOPLE POWERED: [Write one complete sentence on how BootHop BD LTD turns everyday travellers into a trusted delivery network.]
FOCUS ON TRUST: [Write one complete sentence on how every carrier on the platform is verified and how trust is built into every interaction.]
FOCUSED ON IMPACT: [Write one complete sentence on the measurable difference BootHop BD LTD has made to families, businesses, and communities across West Africa.]

ROUTES IN HIGH DEMAND:
Lagos to Accra | Abuja to Dakar | Lagos to Kano | Port Harcourt to Lagos | Accra to Abuja | and more routes added daily.

A NEW NARRATIVE. A BETTER WAY FORWARD. — BootHop BD LTD

Return ONLY valid JSON. hook = the full HEADLINE line including the name prefix. script = the complete printed article.
visual_desc = describe the newspaper as a visual design brief: Global Logistics Times broadsheet, gold-on-navy masthead, date and price bar, QR code top-right corner, main photo using ${ASSETS.businessBackdrop} with ${subject.name} captioned by name and title, routes sidebar right column in navy/teal, BootHop BD logo (${ASSETS.logoB2B}) in masthead and footer — this is a B2B trade publication.
{"hook":"...","script":"LABEL:\\n...\\n\\nHEADLINE:\\n...\\n\\nSTANDFIRST:\\n...\\n\\nLEAD:\\n...\\n\\nTHE PAIN IS REAL:\\n...\\n\\nPULL QUOTE:\\n...\\n\\nHOW WE'RE CHANGING THINGS:\\n...\\n\\nPEOPLE POWERED:\\n...\\n\\nFOCUS ON TRUST:\\n...\\n\\nFOCUSED ON IMPACT:\\n...\\n\\nROUTES IN HIGH DEMAND:\\n...\\n\\nA NEW NARRATIVE. A BETTER WAY FORWARD.","caption":"...","hashtags":"#WestAfrica #BoothopBD #logistics ...","visual_desc":"..."}`;
  }

  if (templateKey === 'daily_mail_consumer') {
    return `You are a Daily Mail consumer affairs journalist exposing the true cost of sending parcels from the UK to Nigeria, Ghana, and West Africa.
Topic angle: ${topic}
Audience: British public, especially UK-Nigeria and UK-Ghana diaspora, 25-55, frustrated with courier prices.
${PROSE_RULE}

Write a complete, print-ready Daily Mail tabloid front page. Output the actual article — no instructions, real prose only:

TOP BANNER: EXCLUSIVE: [Write a short, outrage-inducing exclusive label. Max 10 words. Make it feel like a scandal.]

HEADLINE: [Write a big tabloid headline in CAPS. Shocking price or statistic. Max 8 words. e.g. BRITONS ARE PAYING £150 TO SEND A £20 GIFT]

STANDFIRST: [Write 1-2 sentences. Name the courier industry as the villain. Explain the human cost. Make readers angry on behalf of the families affected.]

BYLINE: By [invent a realistic British journalist name], Consumer Affairs Editor

THE REAL COST OF SENDING:
COURIER QUOTE: £[write a specific amount between £95–£180] | [write a realistic delivery timeframe e.g. 7–14 days]
SAME DAY WITH A TRAVELLER VIA BOOTHOP BD LTD: £[write a lower amount between £15–£45] | Next day or same day

LEAD:
[Write 4 paragraphs. Open with a specific, believable human story — a British-Nigerian father in London trying to send a birthday gift to his daughter in Lagos, or a mother sending medication to a sick relative in Abuja. Name the person (invented), the city, the item, the cost they were quoted by DHL or FedEx. Then show what happened when they discovered BootHop BD LTD — the human, peer-powered alternative. Include the emotional payoff. Make it real.]

REAL PROBLEMS. REAL PEOPLE:
LEFT BEHIND LUGGAGE: [Write one full sentence — a specific story of a traveller whose suitcase was left behind and had to pay £120 to a courier to retrieve it, only for it to arrive three weeks late.]
URGENT DOCUMENTS: [Write one full sentence — a specific story of a business owner in Birmingham who needed signed contracts in Lagos before a deal closed, and how the courier missed the deadline.]
BIRTHDAY GIFT TOO LATE: [Write one full sentence — a specific story of a gift bought months in advance that arrived three weeks after a child's birthday.]
ESSENTIAL ITEMS DELAYED: [Write one full sentence — a specific story of critical medication — asthma inhaler, insulin — sent by courier and delayed by two weeks due to customs.]

THERE'S A SMARTER WAY:
[Write 3 sentences. Introduce BootHop BD LTD (Beyond Delivery) as the people-powered solution. Explain how verified travellers already flying the route carry items for a fraction of courier prices. End with the call to action.]
BootHop BD LTD | BootHop.com | The People Powered Network | Verified Travellers • Airport to Airport • Same Day Possibilities

Return ONLY valid JSON. hook = the tabloid headline. script = the complete printed article.
visual_desc = describe the newspaper as a visual design brief: classic British tabloid front page, bold red masthead strip, oversized black serif headline, cost comparison box centre-right, "Real Problems. Real People." icon row at bottom, main photo using ${ASSETS.businessBackdrop} cropped to portrait, regular BootHop logo (${ASSETS.logoConsumer}) in the footer — this is consumer/P2P-facing, use standard logo not BD.
{"hook":"...","script":"TOP BANNER:\\n...\\n\\nHEADLINE:\\n...\\n\\nSTANDFIRST:\\n...\\n\\nBYLINE:\\n...\\n\\nTHE REAL COST OF SENDING:\\n...\\n\\nLEAD:\\n...\\n\\nREAL PROBLEMS. REAL PEOPLE:\\n...\\n\\nTHERE'S A SMARTER WAY:\\n...","caption":"...","hashtags":"#UKNigeria #diaspora #boothopBD ...","visual_desc":"..."}`;
  }

  // dlt_trade — Daily Logistics Times
  const dltPrimary   = FOUNDERS[Math.floor(Math.random() * FOUNDERS.length)];
  const dltSecondary = FOUNDERS.find(f => f.name !== dltPrimary.name) ?? FOUNDERS[1];
  return `You are a staff reporter for "Daily Logistics Times" — the voice of logistics and commerce in West Africa.
Topic angle: ${topic}
Audience: Logistics industry professionals, SME owners, diaspora travellers, West Africa, 25-50.
${PROSE_RULE}

Write a complete, print-ready Daily Logistics Times front page. Output the actual article — no instructions, real prose only:

LABEL: EXCLUSIVE INTERVIEW

HEADLINE: [Write a bold 2-line statement. First line: the core problem or breakthrough in the logistics world. Second line: who is solving it. Max 8 words per line.]

SUBHEADING: [Write one sentence that expands on the headline — names BootHop BD LTD (Beyond Delivery) and the mission of the founders.]

BYLINE: By DLT Staff Reporter | LAGOS, NIGERIA

LEAD:
[Write 4 paragraphs of trade journalism. Open with the scale of the problem across West Africa — Lagos to Accra, Abuja to Dakar, Port Harcourt to Freetown — cite a believable statistic about delivery failures. Describe the human cost. Then introduce BootHop BD LTD and quote ${dltPrimary.name} (${dltPrimary.title}, BootHop BD LTD) on what drove them to build the platform. The quote must be specific to their role.]

SECONDARY STORY — HOW BOOTHOP BD LTD IS CHANGING THE NARRATIVE IN WEST AFRICA:
[Write 3 paragraphs of reported speech. Cover how BootHop BD LTD's verified-traveller network works, the routes it serves, and the community it has built. Quote ${dltSecondary.name} (${dltSecondary.title}, BootHop BD LTD) on a different angle — risk, financial model, or operational insight.]

SIDEBAR — A GROWING PROBLEM:
DELAYED DELIVERIES: [Write one complete sentence on how slow, unreliable shipping costs West African businesses and individuals millions.]
DOCUMENTS THAT MISS DEADLINES: [Write one complete sentence on the business and legal consequences of important papers arriving late.]
LEFT-BEHIND LUGGAGE: [Write one complete sentence on how often travellers lose items and how long reunification takes through traditional means.]
AVIATION PARTS DELAYED: [Write one complete sentence on how grounded aircraft and delayed critical parts affect aviation safety and airline operations.]
HIGH COSTS, LOW OPTIONS: [Write one complete sentence on the pricing gap between expensive couriers and affordable human-powered alternatives.]

THE BOOTHOP BD LTD SOLUTION:
[Write 3 sentences explaining how BootHop BD LTD connects verified travellers with people who need urgent items delivered — safely, reliably, and on time.]
People Powered | Secure and Verified | Airport to Airport | Same-Day Possibilities | Real-Time Updates
Movement already exists. We make it work smarter.

REAL STORIES. REAL IMPACT:
AVIATION PART DELIVERED: [Write one full sentence — a critical aircraft component moved from Lagos to Accra in 18 hours via a verified BootHop BD LTD traveller, preventing a grounding that would have cost the airline £2.3 million.]
DOCUMENT DELIVERED: [Write one full sentence — legal documents needed in Abuja reached Port Harcourt the same day via BootHop BD LTD, saving a property deal worth £180,000.]
LUGGAGE REUNITED: [Write one full sentence — a traveller's suitcase left behind in London reached its owner in Lagos within 48 hours through the BootHop BD LTD network.]
MEDICATION DELIVERED: [Write one full sentence — life-saving insulin sent from Accra arrived in Lagos the same day via a verified BootHop BD LTD carrier for a patient in critical need.]

HIGH DEMAND ROUTES:
Lagos to Accra | Abuja to Dakar | Lagos to Kano | Port Harcourt to Lagos | Accra to Abuja | and more routes added daily.

FOOTER: A NEW NARRATIVE. A BETTER WAY FORWARD. | People Powered. Purpose Driven. West Africa Focused. | JOIN THE MOVEMENT: BootHop.com | BootHop BD LTD — Beyond Delivery

Return ONLY valid JSON. hook = 2-line headline joined by newline. script = the complete printed article.
visual_desc = describe the newspaper as a visual design brief: Daily Logistics Times broadsheet, red DLT square badge top-left, newspaper name in bold black serif, date bar, N500 price, QR code top-right, main photo using ${ASSETS.businessBackdrop} with both founders captioned by name and title, growing-problem sidebar right column, routes table bottom-right, BootHop BD logo (${ASSETS.logoB2B}) in masthead and footer — this is a B2B trade publication.
{"hook":"...","script":"LABEL:\\n...\\n\\nHEADLINE:\\n...\\n\\nSUBHEADING:\\n...\\n\\nBYLINE:\\n...\\n\\nLEAD:\\n...\\n\\nSECONDARY STORY — HOW BOOTHOP BD LTD IS CHANGING THE NARRATIVE IN WEST AFRICA:\\n...\\n\\nSIDEBAR — A GROWING PROBLEM:\\n...\\n\\nTHE BOOTHOP BD LTD SOLUTION:\\n...\\n\\nREAL STORIES. REAL IMPACT:\\n...\\n\\nHIGH DEMAND ROUTES:\\n...\\n\\nFOOTER:\\n...","caption":"...","hashtags":"#WestAfrica #logistics #BoothopBD ...","visual_desc":"..."}`;
}

function buildPrompt(pillar: string, templateKey: string, platform: string) {
  if (NEWSPAPER_TEMPLATES.has(templateKey)) return buildNewspaperPrompt(pillar, templateKey);

  return `You are a content creator for a faceless ${platform === 'youtube_shorts' ? 'YouTube Shorts' : 'TikTok/Instagram Reels'} page "How things move around the world".
Tone: ${TONE[templateKey] ?? TONE.documentary}. No fluff.
Audience: 18-35 UK/Nigeria diaspora who ship things abroad or travel frequently.

Generate content about: ${PILLAR_CONTEXT[pillar] ?? PILLAR_CONTEXT.logistics_stories}

Formula — HOOK(1 line, <12 words, stops scroll) → PROBLEM(2-3 lines) → STAKES(1-2 lines) → RESOLUTION(2-3 lines) → LESSON(1 punchy line)

Also provide:
CAPTION: 3-4 sentences with CTA.
HASHTAGS: 20 hashtags (logistics, travel, UK/Nigeria diaspora, boothop).
VISUAL_DESC: 2-3 sentences on ideal visuals.

Return ONLY valid JSON:
{"hook":"...","script":"HOOK:\\n...\\n\\nPROBLEM:\\n...\\n\\nSTAKES:\\n...\\n\\nRESOLUTION:\\n...\\n\\nLESSON:\\n...","caption":"...","hashtags":"#logistics ...","visual_desc":"..."}`;
}

function buildVariantPrompt(hook: string, caption: string) {
  return `Expert at viral logistics/travel social media hooks.
Original hook: "${hook}"
Caption start: "${caption.slice(0, 100)}"
Generate 2 variant hooks (B=money angle, C=urgency angle).
Return ONLY valid JSON: {"variantB":{"hook":"...","caption_opener":"..."},"variantC":{"hook":"...","caption_opener":"..."}}`;
}

async function sendTelegram(message: string) {
  const token  = process.env.TELEGRAM_BOT_TOKEN  || '8717698733:AAF7GI9Yw1DhdYVv_TK35fYQcwaGdk4caeA';
  const chatId = process.env.TELEGRAM_CHAT_ID    || '8641867751';
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method:  'POST',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
    });
  } catch { /* non-fatal */ }
}

async function callClaude(prompt: string) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: {
      'x-api-key':         process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
    },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 4096, messages: [{ role: 'user', content: prompt }] }),
  });
  const data  = await res.json();
  const raw   = (data.content?.[0]?.text ?? '').trim();
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON in response');
  return JSON.parse(match[0]);
}

export async function POST(request: Request) {
  try {
    const adminKey = request.headers.get('x-admin-key');
    const isAdmin  = adminKey && adminKey === process.env.ADMIN_SECRET;
    if (!isAdmin) {
      const cookieStore = await cookies();
      if (!getBdSession(cookieStore)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pillar = 'logistics_stories', templateKey = 'documentary', platform = 'all', slot, slotLabel } = await request.json();

    const content  = await callClaude(buildPrompt(pillar, templateKey, platform));
    const variants = await callClaude(buildVariantPrompt(content.hook, content.caption)).catch(() => null);

    const supabase = createSupabaseAdminClient();

    const { data: item, error } = await supabase
      .from('bd_content')
      .insert({
        pillar, template_key: templateKey, platform,
        slot: slot ?? null, slot_label: slotLabel ?? null,
        hook:        content.hook,
        script:      content.script,
        caption:     content.caption,
        hashtags:    content.hashtags,
        visual_desc: content.visual_desc,
        status:      'draft',
      })
      .select('*')
      .single();

    if (error) throw error;

    // Insert variants
    if (variants && item) {
      await supabase.from('bd_variants').insert([
        { content_id: item.id, label: 'A', hook: content.hook, caption: content.caption },
        { content_id: item.id, label: 'B', hook: variants.variantB.hook, caption: variants.variantB.caption_opener },
        { content_id: item.id, label: 'C', hook: variants.variantC.hook, caption: variants.variantC.caption_opener },
      ]);
    }

    await supabase.from('bd_notifications').insert({ message: `Generated: "${content.hook.slice(0, 60)}..."`, type: 'success' });

    const { data: full } = await supabase.from('bd_content').select('*, bd_variants(*)').eq('id', item!.id).single();
    return NextResponse.json({ ok: true, item: full });

  } catch (error) {
    console.error('bd/generate error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
