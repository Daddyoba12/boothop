import { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Tag, ArrowRight, BookOpen, FileCheck2, Globe2, Network, TrendingUp, Heart } from 'lucide-react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Blog | BootHop — Logistics, Diaspora & Same-Day Delivery Insights',
  description: 'Insights on same-day delivery, cross-border logistics, diaspora shipping, customs compliance, and the future of community-powered delivery from the BootHop team.',
  alternates: { canonical: 'https://www.boothop.com/blog' },
};

const BLOG_ID = process.env.BLOGGER_BLOG_ID ?? '8031835400295900689';

interface Entry {
  id: { $t: string };
  title: { $t: string };
  published: { $t: string };
  content: { $t: string };
  category?: { term: string }[];
  link: { rel: string; href: string }[];
}

async function getPosts(): Promise<Entry[]> {
  try {
    const res = await fetch(
      `https://www.blogger.com/feeds/${BLOG_ID}/posts/default?alt=json&max-results=20`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data?.feed?.entry ?? [];
  } catch {
    return [];
  }
}

function postId(entry: Entry): string {
  return entry.id.$t.split('post-')[1] ?? entry.id.$t;
}

function decodeEntities(str: string): string {
  return str
    .replace(/&nbsp;/g, ' ')
    .replace(/&rsquo;/g, '’')
    .replace(/&lsquo;/g, '‘')
    .replace(/&rdquo;/g, '”')
    .replace(/&ldquo;/g, '“')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, '\'')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function excerpt(html: string, maxChars = 180): string {
  const text = decodeEntities(
    html
      .replace(/```[\s\S]*?```/g, ' ')        // fenced code blocks
      .replace(/`([^`]+)`/g, '$1')             // inline code
      .replace(/<[^>]+>/g, ' ')                // html tags
      .replace(/^#{1,6}\s+/gm, '')             // markdown headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // markdown links
      .replace(/\*\*([^*]+)\*\*/g, '$1')       // markdown bold
      .replace(/\*([^*]+)\*/g, '$1')           // markdown italics
  ).replace(/\s+/g, ' ').trim();
  return text.length > maxChars ? text.slice(0, maxChars).trimEnd() + '…' : text;
}

function cleanTitle(title: string): string {
  return decodeEntities(title).replace(/\s+/g, ' ').trim();
}

function firstImage(html: string): string | null {
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  const src = m ? m[1] : null;
  // Some posts already have one of our own rotating fallback covers baked into
  // their stored content from an earlier pass — treat that as "no real image"
  // so it goes through resolveCover() instead of repeating the same photo.
  if (src && src.includes('/images/blog/covers/')) return null;
  return src;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

/* ── Cover art for posts with no image of their own ──────────────────────────
   Every topic maps to a small POOL of distinct covers (several colour/layout
   variants of a designed SVG card, sometimes mixed with real photos) rather
   than one fixed design. Each topic keeps its own rotation counter, so two
   posts in the same category never show back-to-back the same card — and
   real photos never repeat back-to-back either. Designed cards are inline
   SVG so they stay crisp and need no extra assets; drop new photos into
   public/images/blog/covers/ and reference them below to grow any pool. */

type Renderer = () => React.JSX.Element;

function PhotoCover({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative h-48 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-500" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 to-transparent" />
    </div>
  );
}

const GLOBE_PALETTES = [
  { bg: 'from-blue-50 via-indigo-50 to-slate-100',   ring: '#93c5fd', a: '#2563eb', b: '#059669', badge: 'text-blue-700' },
  { bg: 'from-teal-50 via-cyan-50 to-slate-100',      ring: '#5eead4', a: '#0d9488', b: '#0891b2', badge: 'text-teal-700' },
  { bg: 'from-violet-50 via-fuchsia-50 to-slate-100', ring: '#c4b5fd', a: '#7c3aed', b: '#db2777', badge: 'text-violet-700' },
];
function GlobeCoverArt({ variant }: { variant: number }) {
  const p = GLOBE_PALETTES[variant % GLOBE_PALETTES.length];
  return (
    <div className={`relative h-48 overflow-hidden bg-gradient-to-br ${p.bg}`}>
      <svg viewBox="0 0 400 200" className="absolute inset-0 h-full w-full" fill="none">
        <circle cx="150" cy="100" r="72" stroke={p.ring} strokeWidth="1.5" opacity="0.7" />
        <ellipse cx="150" cy="100" rx="72" ry="26" stroke={p.ring} strokeWidth="1" opacity="0.55" />
        <ellipse cx="150" cy="100" rx="72" ry="50" stroke={p.ring} strokeWidth="1" opacity="0.4" />
        <line x1="150" y1="28" x2="150" y2="172" stroke={p.ring} strokeWidth="1" opacity="0.5" />
        <line x1="78" y1="100" x2="222" y2="100" stroke={p.ring} strokeWidth="1" opacity="0.5" />
        <path d="M128,78 Q230,15 322,55" stroke={p.a} strokeWidth="1.5" strokeDasharray="3 5" opacity="0.8" />
        <circle cx="128" cy="78" r="4.5" fill={p.a} />
        <circle cx="322" cy="55" r="4.5" fill={p.a} />
        <path d="M168,132 Q260,185 340,150" stroke={p.b} strokeWidth="1.5" strokeDasharray="3 5" opacity="0.8" />
        <circle cx="168" cy="132" r="4.5" fill={p.b} />
        <circle cx="340" cy="150" r="4.5" fill={p.b} />
      </svg>
      <div className={`absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-white/85 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold shadow-sm ${p.badge}`}>
        <Globe2 className="h-3.5 w-3.5" /> Global Reach
      </div>
    </div>
  );
}

const NETWORK_PALETTES = [
  { bg: 'from-emerald-50 via-teal-50 to-slate-100', line: '#10b981', stroke: '#6ee7b7', dot: '#059669', badge: 'text-emerald-700' },
  { bg: 'from-slate-50 via-blue-50 to-slate-100',   line: '#3b82f6', stroke: '#bfdbfe', dot: '#1d4ed8', badge: 'text-blue-700' },
];
function NetworkCoverArt({ variant }: { variant: number }) {
  const p = NETWORK_PALETTES[variant % NETWORK_PALETTES.length];
  return (
    <div className={`relative h-48 overflow-hidden bg-gradient-to-br ${p.bg}`}>
      <svg viewBox="0 0 400 200" className="absolute inset-0 h-full w-full" fill="none">
        <path d="M92,100 L182,58" stroke={p.line} strokeWidth="1.5" opacity="0.7" />
        <path d="M92,100 L182,142" stroke={p.line} strokeWidth="1.5" opacity="0.7" />
        <path d="M232,58 L308,100" stroke={p.line} strokeWidth="1.5" opacity="0.7" />
        <path d="M232,142 L308,100" stroke={p.line} strokeWidth="1.5" opacity="0.7" />
        <rect x="52" y="82" width="44" height="36" rx="9" fill="#fff" stroke={p.stroke} strokeWidth="1.5" />
        <rect x="184" y="40" width="44" height="36" rx="9" fill="#fff" stroke={p.stroke} strokeWidth="1.5" />
        <rect x="184" y="124" width="44" height="36" rx="9" fill="#fff" stroke={p.stroke} strokeWidth="1.5" />
        <rect x="310" y="82" width="44" height="36" rx="9" fill="#fff" stroke={p.stroke} strokeWidth="1.5" />
        <circle cx="74" cy="100" r="4" fill={p.dot} />
        <circle cx="206" cy="58" r="4" fill={p.dot} />
        <circle cx="206" cy="142" r="4" fill={p.dot} />
        <circle cx="332" cy="100" r="4" fill={p.dot} />
      </svg>
      <div className={`absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-white/85 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold shadow-sm ${p.badge}`}>
        <Network className="h-3.5 w-3.5" /> Logistics Network
      </div>
    </div>
  );
}

const COMPLIANCE_PALETTES = [
  { bg: 'from-blue-50 to-slate-100',   line: '#bfdbfe', shield: '#dbeafe', stroke: '#3b82f6', check: '#2563eb', badge: 'text-blue-700' },
  { bg: 'from-slate-50 to-indigo-50',  line: '#c7d2fe', shield: '#e0e7ff', stroke: '#6366f1', check: '#4338ca', badge: 'text-indigo-700' },
];
function ComplianceCoverArt({ variant }: { variant: number }) {
  const p = COMPLIANCE_PALETTES[variant % COMPLIANCE_PALETTES.length];
  return (
    <div className={`relative h-48 overflow-hidden bg-gradient-to-br ${p.bg}`}>
      <svg viewBox="0 0 400 200" className="absolute inset-0 h-full w-full" fill="none">
        <rect x="50" y="55" width="150" height="95" rx="10" fill="#fff" stroke={p.shield} strokeWidth="1.5" />
        <line x1="66" y1="78" x2="184" y2="78" stroke={p.line} strokeWidth="4" strokeLinecap="round" />
        <line x1="66" y1="96" x2="184" y2="96" stroke={p.line} strokeWidth="4" strokeLinecap="round" />
        <line x1="66" y1="114" x2="150" y2="114" stroke={p.line} strokeWidth="4" strokeLinecap="round" />
        <line x1="66" y1="132" x2="165" y2="132" stroke={p.line} strokeWidth="4" strokeLinecap="round" />
        <path d="M282,42 L322,54 L322,96 Q322,136 282,152 Q242,136 242,96 L242,54 Z" fill={p.shield} stroke={p.stroke} strokeWidth="1.5" />
        <path d="M262,96 L276,110 L304,78" stroke={p.check} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className={`absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-white/85 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold shadow-sm ${p.badge}`}>
        <FileCheck2 className="h-3.5 w-3.5" /> Customs & Compliance
      </div>
    </div>
  );
}

const SAVINGS_PALETTES = [
  { bg: 'from-amber-50 via-orange-50 to-slate-100', bars: ['#fde68a', '#fcd34d', '#fbbf24', '#f59e0b'], line: '#b45309', coinBg: '#fef3c7', coinRing: '#f59e0b', text: '#b45309', badge: 'text-amber-700' },
  { bg: 'from-emerald-50 via-lime-50 to-slate-100',  bars: ['#bbf7d0', '#86efac', '#4ade80', '#22c55e'], line: '#15803d', coinBg: '#dcfce7', coinRing: '#22c55e', text: '#15803d', badge: 'text-emerald-700' },
];
function SavingsCoverArt({ variant }: { variant: number }) {
  const p = SAVINGS_PALETTES[variant % SAVINGS_PALETTES.length];
  return (
    <div className={`relative h-48 overflow-hidden bg-gradient-to-br ${p.bg}`}>
      <svg viewBox="0 0 400 200" className="absolute inset-0 h-full w-full" fill="none">
        <rect x="58" y="128" width="34" height="44" rx="5" fill={p.bars[0]} />
        <rect x="106" y="102" width="34" height="70" rx="5" fill={p.bars[1]} />
        <rect x="154" y="76" width="34" height="96" rx="5" fill={p.bars[2]} />
        <rect x="202" y="50" width="34" height="122" rx="5" fill={p.bars[3]} />
        <path d="M58,120 L92,96 L140,110 L188,68 L236,42" stroke={p.line} strokeWidth="2" strokeDasharray="2 5" opacity="0.7" />
        <circle cx="318" cy="92" r="40" fill={p.coinBg} stroke={p.coinRing} strokeWidth="2" />
        <text x="318" y="104" fontSize="34" textAnchor="middle" fill={p.text} fontWeight="700" fontFamily="sans-serif">£</text>
      </svg>
      <div className={`absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-white/85 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold shadow-sm ${p.badge}`}>
        <TrendingUp className="h-3.5 w-3.5" /> Save & Earn
      </div>
    </div>
  );
}

const COMMUNITY_PALETTES = [
  { bg: 'from-rose-50 via-amber-50 to-slate-100', line: '#fb7185', house: '#fb7185', heart: '#fda4af', badge: 'text-rose-700' },
  { bg: 'from-amber-50 via-rose-50 to-slate-100', line: '#f59e0b', house: '#f59e0b', heart: '#fbbf24', badge: 'text-amber-700' },
  { bg: 'from-teal-50 via-rose-50 to-slate-100',  line: '#0d9488', house: '#0d9488', heart: '#fb7185', badge: 'text-teal-700' },
];
function CommunityCoverArt({ variant }: { variant: number }) {
  const p = COMMUNITY_PALETTES[variant % COMMUNITY_PALETTES.length];
  return (
    <div className={`relative h-48 overflow-hidden bg-gradient-to-br ${p.bg}`}>
      <svg viewBox="0 0 400 200" className="absolute inset-0 h-full w-full" fill="none">
        <path d="M90,120 Q200,40 310,110" stroke={p.line} strokeWidth="1.5" strokeDasharray="3 5" opacity="0.75" />
        <path d="M78,132 L78,108 L90,98 L102,108 L102,132 Z" fill="#fff" stroke={p.house} strokeWidth="1.5" />
        <path d="M298,122 L298,98 L310,88 L322,98 L322,122 Z" fill="#fff" stroke={p.house} strokeWidth="1.5" />
        <path d="M200,95 c0,-14 20,-14 20,0 c0,10 -20,22 -20,22 c0,0 -20,-12 -20,-22 c0,-14 20,-14 20,0 Z" fill={p.heart} opacity="0.9" />
      </svg>
      <div className={`absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-white/85 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold shadow-sm ${p.badge}`}>
        <Heart className="h-3.5 w-3.5" /> Community & Diaspora
      </div>
    </div>
  );
}

/* Real photos — folded into the pools below rather than used as one flat
   rotation, so a "community" post might land on a photo OR a designed card,
   never the same choice twice in a row. */
const PHOTO_HANDOVER = { src: '/images/blog/covers/airport-handover-1.jpg', alt: 'Two travellers exchanging a BootHop package at the airport' };
const PHOTO_CHECKIN   = { src: '/images/blog/covers/checkin-verification.jpg', alt: 'A BootHop courier verifying ID at an airport check-in counter' };
const PHOTO_CUSTOMS   = { src: '/images/blog/covers/customs-inspection.jpg', alt: 'A customs officer inspecting a BootHop package' };

/* Each topic's rotation pool. Order doesn't matter much — what matters is
   that every entry in a pool renders differently, so cycling through it
   (mod its length) never repeats a look back-to-back. */
const POOLS: Record<string, Renderer[]> = {
  compliance: [
    () => <ComplianceCoverArt variant={0} />,
    () => <PhotoCover {...PHOTO_CUSTOMS} />,
    () => <ComplianceCoverArt variant={1} />,
  ],
  global: [
    () => <GlobeCoverArt variant={0} />,
    () => <GlobeCoverArt variant={1} />,
    () => <GlobeCoverArt variant={2} />,
  ],
  savings: [
    () => <SavingsCoverArt variant={0} />,
    () => <SavingsCoverArt variant={1} />,
  ],
  network: [
    () => <NetworkCoverArt variant={0} />,
    () => <NetworkCoverArt variant={1} />,
  ],
  community: [
    () => <PhotoCover {...PHOTO_HANDOVER} />,
    () => <CommunityCoverArt variant={0} />,
    () => <PhotoCover {...PHOTO_CHECKIN} />,
    () => <CommunityCoverArt variant={1} />,
    () => <CommunityCoverArt variant={2} />,
  ],
  general: [
    () => <PhotoCover {...PHOTO_HANDOVER} />,
    () => <PhotoCover {...PHOTO_CHECKIN} />,
    () => <PhotoCover {...PHOTO_CUSTOMS} />,
  ],
};

const TOPIC_MATCHERS: { topic: keyof typeof POOLS; match: RegExp }[] = [
  { topic: 'compliance', match: /customs|compliance|duties/i },
  { topic: 'global',     match: /global|international|cross-border|nigeria|netherlands|frankfurt|amsterdam|africa|beyond|worldwide/i },
  { topic: 'savings',    match: /cost saving|cost-saving|savings|earn|income|pricing|afford/i },
  { topic: 'network',    match: /b2b|corporate|client|partner|supply[\s-]?chain/i },
  { topic: 'community',  match: /diaspora|community|culture/i },
];

type Cover = { kind: 'cover'; Render: Renderer };

/** counters: one running index per topic, created fresh per page render and
 *  threaded through every card so the same topic never repeats back-to-back. */
function resolveCover(labels: string[], counters: Record<string, number>): Cover {
  const joined = labels.join(' ');
  const topic = TOPIC_MATCHERS.find(t => t.match.test(joined))?.topic ?? 'general';
  const pool = POOLS[topic];
  const i = counters[topic] ?? 0;
  counters[topic] = i + 1;
  return { kind: 'cover', Render: pool[i % pool.length] };
}

const STATIC_POSTS = [
  {
    slug: 'customs-clearance-services',
    title: 'Beyond the Border: Why AI is the Secret to Seamless Customs Clearance',
    excerpt: 'Learn how pre-departure AI compliance screening is eliminating customs holds, documentation errors, and hidden import fees on cross-border deliveries.',
    date: '2026-05-19',
    labels: ['Customs & Compliance', 'Cross-Border Delivery'],
    image: '/images/Customs1.jpg',
    alt: 'A traveller with a customs-tagged suitcase at an airport check-in counter, discussing paperwork with a BootHop courier',
  },
  {
    slug: 'small-business-cross-border-shipping',
    title: 'Scale Fast: The Small Business Guide to Cross-Border Shipping in 2026',
    excerpt: 'How small businesses are shipping internationally without the cost, complexity, or customs risk of traditional couriers — and saving up to 60% per parcel.',
    date: '2026-05-19',
    labels: ['Small Business', 'B2B Logistics'],
    image: '/images/businessImage/biz-handshake.jpg',
    alt: 'Two small business owners shaking hands in a modern office in front of the BootHop logo',
  },
  {
    slug: 'on-board-courier-time-critical-logistics',
    title: 'Zero to Destination: How On-Board Couriers Are Solving Time-Critical Logistics',
    excerpt: 'When hours matter — not days — on-board courier delivery is the only option. Discover how BootHop makes in-cabin, zero-handoff delivery accessible to every business.',
    date: '2026-05-19',
    labels: ['Time-Critical Logistics', 'On-Board Courier'],
    image: '/images/WBoothop.jpg',
    alt: 'A traveller handing a BootHop-branded parcel to another traveller at an airport departure gate',
  },
];

export default async function BlogPage() {
  const posts = await getPosts();
  const coverCounters: Record<string, number> = {};

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <NavBar />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold px-4 py-2 rounded-full mb-8 uppercase tracking-widest">
          <BookOpen className="h-3.5 w-3.5" /> BootHop Blog
        </div>
        <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6 text-slate-900">
          Insights &{' '}
          <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Updates
          </span>
        </h1>
        <p className="text-slate-600 text-xl max-w-2xl mx-auto">
          Logistics, diaspora delivery, customs compliance, and the future of community-powered movement — from the BootHop team.
        </p>
      </section>

      {/* Posts grid */}
      <main className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Static SEO posts — always shown first */}
          {STATIC_POSTS.map((post) => {
            const cover: Cover = post.image
              ? { kind: 'cover', Render: () => <PhotoCover src={post.image} alt={post.alt} /> }
              : resolveCover(post.labels, coverCounters);
            return (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50 hover:-translate-y-1 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 flex flex-col"
            >
              <div className="relative overflow-hidden">
                <cover.Render />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {post.labels.map(label => (
                    <span key={label} className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                      <Tag className="h-2.5 w-2.5" />{label}
                    </span>
                  ))}
                </div>
                <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors mb-2 leading-snug flex-1">
                  {post.title}
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">{post.excerpt}</p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(post.date)}
                  </div>
                  <span className="text-xs font-semibold text-blue-700 flex items-center gap-1 group-hover:gap-2 transition-all">
                    Read <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </Link>
            );
          })}

          {/* Blogger posts */}
          {posts.map((entry) => {
            const img = firstImage(entry.content.$t);
            const labels = entry.category?.map(c => c.term) ?? [];
            const slug = postId(entry);
            const title = cleanTitle(entry.title.$t);
            const cover: Cover = img
              ? { kind: 'cover', Render: () => <PhotoCover src={img} alt={title} /> }
              : resolveCover(labels, coverCounters);
            return (
              <Link
                key={slug}
                href={`/blog/${slug}`}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50 hover:-translate-y-1 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 flex flex-col"
              >
                <div className="relative overflow-hidden">
                  <cover.Render />
                </div>

                <div className="p-6 flex flex-col flex-1">
                  {labels.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {labels.slice(0, 3).map(label => (
                        <span key={label} className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                          <Tag className="h-2.5 w-2.5" />{label}
                        </span>
                      ))}
                    </div>
                  )}

                  <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors mb-2 leading-snug flex-1">
                    {title}
                  </h2>

                  <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    {excerpt(entry.content.$t)}
                  </p>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(entry.published.$t)}
                    </div>
                    <span className="text-xs font-semibold text-blue-700 flex items-center gap-1 group-hover:gap-2 transition-all">
                      Read <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}

          {posts.length === 0 && STATIC_POSTS.length === 0 && (
            <div className="col-span-3 text-center py-24 text-slate-600">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-semibold text-slate-600">First post coming soon.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
