import { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Tag, ArrowRight, BookOpen } from 'lucide-react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Blog | BootHop — Logistics, Diaspora & Same-Day Delivery Insights',
  description: 'Insights on same-day delivery, cross-border logistics, diaspora shipping, customs compliance, and the future of community-powered delivery from the BootHop team.',
};

const BLOGGER_BLOG_ID  = process.env.BLOGGER_BLOG_ID  ?? '';
const BLOGGER_API_KEY  = process.env.BLOGGER_API_KEY  ?? '';

interface BlogPost {
  id: string;
  title: string;
  published: string;
  url: string;
  labels?: string[];
  content: string;
}

async function getPosts(): Promise<BlogPost[]> {
  if (!BLOGGER_BLOG_ID || !BLOGGER_API_KEY) return [];
  try {
    const res = await fetch(
      `https://www.googleapis.com/blogger/v3/blogs/${BLOGGER_BLOG_ID}/posts?key=${BLOGGER_API_KEY}&maxResults=20&fetchBodies=true&status=live`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.items ?? [];
  } catch {
    return [];
  }
}

function excerpt(html: string, maxChars = 180): string {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > maxChars ? text.slice(0, maxChars).trimEnd() + '…' : text;
}

function firstImage(html: string): string | null {
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

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
        {posts.length === 0 ? (
          <div className="text-center py-24 text-slate-500">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Posts coming soon.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, i) => {
              const img = firstImage(post.content);
              const slug = encodeURIComponent(post.id);
              return (
                <Link
                  key={post.id}
                  href={`/blog/${slug}`}
                  className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/3 hover:border-blue-500/30 hover:bg-white/5 hover:-translate-y-1 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 flex flex-col"
                >
                  {/* Cover image */}
                  {img ? (
                    <div className="relative h-48 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-blue-900/30 to-slate-900/30 flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-blue-500/30" />
                    </div>
                  )}

                  <div className="p-6 flex flex-col flex-1">
                    {/* Labels */}
                    {post.labels && post.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {post.labels.slice(0, 3).map(label => (
                          <span key={label} className="inline-flex items-center gap-1 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
                            <Tag className="h-2.5 w-2.5" />{label}
                          </span>
                        ))}
                      </div>
                    )}

                    <h2 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors duration-300 mb-2 leading-snug flex-1">
                      {post.title}
                    </h2>

                    <p className="text-sm text-slate-400 leading-relaxed mb-4">
                      {excerpt(post.content)}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(post.published)}
                      </div>
                      <span className="text-xs font-semibold text-blue-400 flex items-center gap-1 group-hover:gap-2 transition-all duration-300">
                        Read <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
