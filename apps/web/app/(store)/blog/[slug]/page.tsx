import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import ProductCard from '@/components/ProductCard';
import { getBlogPost, getBlogPosts, getProduct, siteUrl } from '@/lib/api';
import { stripMarkdown } from '@/lib/markdown';
import { articleJsonLd, breadcrumbJsonLd, jsonLdScript } from '@/lib/seo';

// The page already renders the post title as <h1>, so a leading "# Title"
// heading in the Markdown body (identical to the title) is dropped to avoid
// a duplicated heading. The seed data itself is left untouched.
function stripLeadingTitle(content: string, title: string): string {
  const lines = content.split('\n');
  if (lines[0]?.startsWith('# ')) {
    const heading = lines[0].slice(2).trim();
    if (heading.toLowerCase() === title.trim().toLowerCase()) {
      return lines.slice(1).join('\n').trimStart();
    }
  }
  return content;
}

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getBlogPost(params.slug);
  if (!post) return { title: 'Blog post not found' };
  return {
    title: post.seo?.title ?? post.title,
    description: post.seo?.description ?? stripMarkdown(post.excerpt),
    alternates: { canonical: `${siteUrl()}/blog/${post.slug}` },
    openGraph: { title: post.seo?.title ?? post.title, description: post.seo?.description ?? stripMarkdown(post.excerpt), type: 'article' },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getBlogPost(params.slug);
  if (!post) notFound();
  const related = (await Promise.all((post.relatedProducts ?? []).map((slug) => getProduct(slug)))).filter((p): p is NonNullable<typeof p> => Boolean(p));
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(articleJsonLd(post))} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(breadcrumbJsonLd([
        { name: 'Home', url: siteUrl() },
        { name: 'Blog', url: `${siteUrl()}/blog` },
        { name: post.title, url: `${siteUrl()}/blog/${post.slug}` },
      ]))} />
      <p><Link href="/blog">← Blog</Link></p>
      <h1>{post.title}</h1>
      <p>By {post.author}{post.publishedAt ? ` · ${new Date(post.publishedAt).toLocaleDateString('en-GB')}` : ''}</p>
      <article>
        <ReactMarkdown>{stripLeadingTitle(post.content, post.title)}</ReactMarkdown>
      </article>
      {related.length > 0 ? (
        <>
          <h2>Products mentioned in this post</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {related.map((p) => <ProductCard key={p.slug} product={p} />)}
          </div>
        </>
      ) : null}
    </>
  );
}
