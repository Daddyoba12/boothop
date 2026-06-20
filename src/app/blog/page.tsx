import { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Tag, ArrowRight, BookOpen } from 'lucide-react';
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

function excerpt(html: string, maxChars = 180): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxChars).trimEnd() + '…';
}

function firstImage(html: string): string | null {
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

const STATIC_POSTS = [
  {
    slug: 'customs-clearance-services',
    title: 'Beyond the Border: Why AI is the Secret to Seamless Customs Clearance',
    excerpt: 'Learn how pre-departure AI compliance screening is eliminating customs holds, documentation errors, and hidden import fees on cross-border deliveries.',
    date: '2026-05-19',
    labels: ['Customs & Compliance', 'Cross-Border Delivery'],
    gradient: 'from-blue-900/40 to-slate-900/30',
  },
  {
    slug: 'small-business-cross-border-shipping',
    title: 'Scale Fast: The Small Business Guide to Cross-Border Shipping in 2026',
    excerpt: 'How small businesses are shipping internationally without the cost, complexity, or customs risk of traditional couriers — and saving up to 60% per parcel.',
    date: '2026-05-19',
    labels: ['Small Business', 'B2B Logistics'],
    gradient: 'from-emerald-900/40 to-slate-900/30',
  },
  {
    slug: 'on-board-courier-time-critical-logistics',
    title: 'Zero to Destination: How On-Board Couriers Are Solving Time-Critical Logistics',
    excerpt: 'When hours matter — not days — on-board courier delivery is the only option. Discover how BootHop makes in-cabin, zero-handoff delivery accessible to every business.',
    date: '2026-05-19',
    labels: ['Time-Critical Logistics', 'On-Board Courier'],
    gradient: 'from-violet-900/40 to-slate-900/30',
  },
];

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <NavBar />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold px-4 py-2 rounded-full mb-8 uppercase tracking-widest">
          <BookOpen className="h-3.5 w-3.5" /> BootHop Blog
        </div>
        <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6">
          Insights &{' '}
          <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Updates
          </span>
        </h1>
        <p className="text-slate-400 text-xl max-w-2xl mx-auto">
          Logistics, diaspora delivery, customs compliance, and the future of community-powered movement — from the BootHop team.
        </p>
      </section>

      {/* Posts grid */}
      <main className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Static SEO posts — always shown first */}
          {STATIC_POSTS.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/3 hover:border-blue-500/30 hover:bg-white/5 hover:-translate-y-1 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 flex flex-col"
            >
              <div className={`h-48 bg-gradient-to-br ${post.gradient} flex items-center justify-center`}>
                <BookOpen className="h-12 w-12 text-blue-500/30" />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {post.labels.map(label => (
                    <span key={label} className="inline-flex items-center gap-1 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
                      <Tag className="h-2.5 w-2.5" />{label}
                    </span>
                  ))}
                </div>
                <h2 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors mb-2 leading-snug flex-1">
                  {post.title}
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">{post.excerpt}</p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(post.date)}
                  </div>
                  <span className="text-xs font-semibold text-blue-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                    Read <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {/* Blogger posts */}
          {posts.map((entry) => {
            const img = firstImage(entry.content.$t);
            const labels = entry.category?.map(c => c.term) ?? [];
            const slug = postId(entry);
            return (
              <Link
                key={slug}
                href={`/blog/${slug}`}
                className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/3 hover:border-blue-500/30 hover:bg-white/5 hover:-translate-y-1 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 flex flex-col"
              >
                {img ? (
                  <div className="relative h-48 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={entry.title.$t} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-blue-900/30 to-slate-900/30 flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-blue-500/30" />
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">
                  {labels.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {labels.slice(0, 3).map(label => (
                        <span key={label} className="inline-flex items-center gap-1 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
                          <Tag className="h-2.5 w-2.5" />{label}
                        </span>
                      ))}
                    </div>
                  )}

                  <h2 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors mb-2 leading-snug flex-1">
                    {entry.title.$t}
                  </h2>

                  <p className="text-sm text-slate-400 leading-relaxed mb-4">
                    {excerpt(entry.content.$t)}
                  </p>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(entry.published.$t)}
                    </div>
                    <span className="text-xs font-semibold text-blue-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                      Read <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}

          {posts.length === 0 && STATIC_POSTS.length === 0 && (
            <div className="col-span-3 text-center py-24 text-slate-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-semibold text-slate-400">First post coming soon.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
