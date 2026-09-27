import { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Tag, ArrowRight, BookOpen, FileCheck2, Building2, PlaneTakeoff } from 'lucide-react';
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

function postUrl(entry: Entry): string {
  const alt = entry.link.find(l => l.rel === 'alternate');
  return alt?.href ?? '#';
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
  return m ? m[1] : null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

/* ── Category-specific fallback (icon + gradient) for posts with no cover image ── */
const CATEGORY_FALLBACKS: { match: RegExp; icon: typeof BookOpen; gradient: string; iconClass: string }[] = [
  { match: /customs|compliance/i, icon: FileCheck2, gradient: 'from-blue-50 to-slate-100', iconClass: 'text-blue-600' },
  { match: /small business|b2b/i, icon: Building2, gradient: 'from-emerald-50 to-slate-100', iconClass: 'text-emerald-600' },
  { match: /time-critical|on-board|courier/i, icon: PlaneTakeoff, gradient: 'from-violet-50 to-slate-100', iconClass: 'text-violet-600' },
];
function categoryFallback(labels: string[]) {
  const joined = labels.join(' ');
  return CATEGORY_FALLBACKS.find(f => f.match.test(joined))
    ?? { icon: BookOpen, gradient: 'from-blue-50 to-slate-100', iconClass: 'text-blue-600' };
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
            const fallback = categoryFallback(post.labels);
            const FallbackIcon = fallback.icon;
            return (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50 hover:-translate-y-1 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 flex flex-col"
            >
              {post.image ? (
                <div className="relative h-48 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.image}
                    alt={post.alt}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent" />
                </div>
              ) : (
                <div className={`h-48 bg-gradient-to-br ${fallback.gradient} flex items-center justify-center`}>
                  <FallbackIcon className={`h-12 w-12 ${fallback.iconClass}`} />
                </div>
              )}
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
            const fallback = categoryFallback(labels);
            const FallbackIcon = fallback.icon;
            return (
              <Link
                key={slug}
                href={`/blog/${slug}`}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50 hover:-translate-y-1 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 flex flex-col"
              >
                {img ? (
                  <div className="relative h-48 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
                  </div>
                ) : (
                  <div className={`h-48 bg-gradient-to-br ${fallback.gradient} flex items-center justify-center`}>
                    <FallbackIcon className={`h-12 w-12 ${fallback.iconClass}`} />
                  </div>
                )}

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
