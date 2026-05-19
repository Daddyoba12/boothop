import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, Tag, ArrowLeft } from 'lucide-react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

const BLOG_ID = process.env.BLOGGER_BLOG_ID ?? '8031835400295900689';

async function getPost(postId: string) {
  try {
    const res = await fetch(
      `https://www.blogger.com/feeds/${BLOG_ID}/posts/default/${postId}?alt=json`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Post Not Found | BootHop Blog' };
  const title = post.title?.$t ?? 'Blog Post';
  const text  = (post.content?.$t ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
  return { title: `${title} | BootHop Blog`, description: text };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const title   = post.title?.$t ?? '';
  const content = post.content?.$t ?? '';
  const date    = post.published?.$t ?? '';
  const labels: string[] = (post.category ?? []).map((c: { term: string }) => c.term);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <NavBar />

      <main className="max-w-3xl mx-auto px-6 pt-32 pb-24">

        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-10 group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-300" />
          All posts
        </Link>

        {labels.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {labels.map((label) => (
              <span key={label} className="inline-flex items-center gap-1 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full">
                <Tag className="h-2.5 w-2.5" />{label}
              </span>
            ))}
          </div>
        )}

        <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">{title}</h1>

        {date && (
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-10 pb-8 border-b border-white/8">
            <Calendar className="h-4 w-4" />
            {formatDate(date)}
          </div>
        )}

        {/* Full post HTML — handles long content and images */}
        <div
          className="
            prose prose-invert prose-lg max-w-none
            prose-headings:font-black prose-headings:text-white
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-slate-300 prose-p:leading-relaxed prose-p:mb-5
            prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-white prose-li:text-slate-300
            prose-img:rounded-xl prose-img:w-full prose-img:my-8 prose-img:shadow-2xl
            prose-blockquote:border-l-blue-500 prose-blockquote:text-slate-400
          "
          dangerouslySetInnerHTML={{ __html: content }}
        />

        <div className="mt-16 pt-10 border-t border-white/8 text-center">
          <p className="text-slate-400 mb-4">Ready to try BootHop?</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold px-8 py-3 rounded-xl hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300"
          >
            Get started at boothop.com
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
