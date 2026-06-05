import Anthropic from '@anthropic-ai/sdk';

export interface CarouselSlide {
  text: string;
  pexels_query: string;
}

export interface BootHopContent {
  theme: string;
  scenario: string;
  hook: string;
  slides: CarouselSlide[];
  caption: string;
  hashtags: string;
}

// Rotates daily so content stays fresh
const THEMES = [
  { theme: 'passport_emergency',  route: 'London to Manchester',    urgency: 'flight at 6am' },
  { theme: 'wedding_outfit',      route: 'UK to Lagos Nigeria',      urgency: 'wedding in 24 hours' },
  { theme: 'business_critical',   route: 'London to Dubai',          urgency: 'board meeting tomorrow' },
  { theme: 'family_sending_home', route: 'UK to Accra Ghana',        urgency: 'mothers birthday' },
  { theme: 'medical_supplies',    route: 'Birmingham to Nairobi',    urgency: 'urgent prescription needed' },
  { theme: 'missing_charger',     route: 'Leeds to London',          urgency: 'presentation in 3 hours' },
  { theme: 'birthday_gift',       route: 'Manchester to Lagos',      urgency: 'birthday party tonight' },
  { theme: 'forgotten_documents', route: 'Edinburgh to Heathrow',    urgency: 'visa interview tomorrow' },
  { theme: 'baby_items',          route: 'UK to Kumasi Ghana',       urgency: 'new baby arrived' },
  { theme: 'aog_parts',           route: 'London to Abu Dhabi',      urgency: 'aircraft on ground' },
  { theme: 'exam_materials',      route: 'Nottingham to London',     urgency: 'exam at 9am' },
  { theme: 'anniversary_gift',    route: 'UK to Enugu Nigeria',      urgency: '30th anniversary tomorrow' },
  { theme: 'job_contract',        route: 'Bristol to Lagos',         urgency: 'contract signing deadline' },
  { theme: 'medication',          route: 'London to Abuja',          urgency: 'ran out of medication' },
] as const;

export async function generateDailyContent(): Promise<BootHopContent> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000
  );
  const { theme, route, urgency } = THEMES[dayOfYear % THEMES.length];

  const prompt = `You write punchy Instagram carousel content for BootHop — a platform where verified travellers carry parcels on their existing journeys. Senders pay far less than a courier. Travellers earn from spare luggage space.

The golden rule: people stop scrolling for PROBLEMS, not platforms. Never open with a logo or a product name.

Today's scenario:
- Theme: ${theme}
- Route: ${route}
- Urgency: ${urgency}

Return ONLY valid JSON — no markdown, no explanation:
{
  "scenario": "one vivid sentence describing the real-world problem",
  "hook": "10 words max — states the problem sharply, no brand name",
  "slides": [
    { "text": "slide 1 — the problem (max 12 words)", "pexels_query": "relevant stock photo search" },
    { "text": "slide 2 — tension/consequences (max 12 words)", "pexels_query": "relevant stock photo search" },
    { "text": "slide 3 — the twist (someone is already travelling that route)", "pexels_query": "person travelling luggage" },
    { "text": "slide 4 — the outcome (problem solved)", "pexels_query": "relief happy travel success" },
    { "text": "BootHop. Link in bio.", "pexels_query": "airport departure gate morning" }
  ],
  "caption": "3-4 sentence Instagram caption. Human, conversational, ends with a question to drive comments. No hashtags here.",
  "hashtags": "#boothop #peertopeerdelivery #internationalshipping #sendingparcelabroad #uknigeria #diasporadelivery #verifiedtraveller #luggagespace #earningwhiletravelling #affordableshipping #${theme.replace('_','')} #uklogistics #travelhack #parcelsending #communitydelivery"
}

Rules:
- Slide 1 must be the RAW PROBLEM — no solution, no brand
- Slide 3 MUST mention someone already travelling that route (this is the BootHop magic)
- Caption: write like a real person, not a brand. Use "you" not "our customers"
- Keep hooks under 10 words`;

  const response = await client.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages:   [{ role: 'user', content: prompt }],
  });

  const raw  = (response.content[0] as { text: string }).text;
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Claude returned no JSON');

  const parsed = JSON.parse(match[0]) as Omit<BootHopContent, 'theme'>;
  return { theme, ...parsed };
}

// ── Hashtag pools for manual use / future research ─────────────────────────
export const BOOTHOP_HASHTAGS = {
  core:      ['#boothop', '#peertopeerdelivery', '#verifiedtraveller', '#luggagespace'],
  routes:    ['#uktolagos', '#uktoghanana', '#uktonairobi', '#uktodubai', '#uktonigerai', '#londontolago'],
  diaspora:  ['#diasporalife', '#nigeriansinuk', '#ghanaiansinuk', '#africansinlondon', '#sendingmoneyhome'],
  logistics: ['#internationalshipping', '#affordabledelivery', '#parcelsending', '#courieralternative'],
  travel:    ['#earningwhiletravelling', '#travelhack', '#luggageearnings', '#makemoneytravel'],
};
