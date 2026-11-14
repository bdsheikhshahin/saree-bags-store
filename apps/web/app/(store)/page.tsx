import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import ProductCard from '@/components/ProductCard';
import { getBlogPosts, getCategories, getProducts, getSections } from '@/lib/api';
import { stripMarkdown } from '@/lib/markdown';
import { jsonLdScript } from '@/lib/seo';
import { siteUrl } from '@/lib/api';

export default async function HomePage() {
  // Homepage sections come from /api/sections (managed in /admin/sections).
  // If the API is unavailable, getSections() returns [] and the homepage
  // falls back to the original Featured products block.
  const [products, categories, posts, sections] = await Promise.all([
    getProducts(), getCategories(), getBlogPosts(), getSections(),
  ]);
  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Saree & Bags',
    url: siteUrl(),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(orgLd)} />
      <h1>Shop Saree &amp; Bags Online in Bangladesh</h1>
      <p>Handloom sarees, leather and jute bags — with cash on delivery, bKash, Nagad and SSLCommerz.</p>

      <h2>Shop by category</h2>
      <ul>
        {categories.map((c) => (
          <li key={c.slug}><Link href={`/category/${c.slug}`}>{c.name}</Link> — {stripMarkdown(c.description ?? '')}</li>
        ))}
      </ul>

      {sections.length > 0 ? (
        sections.map((section) => (
          <div key={section._id ?? section.title}>
            <h2>{section.title}</h2>
            {section.description ? <ReactMarkdown>{section.description}</ReactMarkdown> : null}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {section.products.map((p) => <ProductCard key={p.slug} product={p} />)}
            </div>
          </div>
        ))
      ) : (
        <>
          <h2>Featured products</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {products.slice(0, 6).map((p) => <ProductCard key={p.slug} product={p} />)}
          </div>
        </>
      )}
      <p><Link href="/products">View all products →</Link></p>

      <h2>From the blog</h2>
      <ul>
        {posts.slice(0, 3).map((post) => (
          <li key={post.slug}><Link href={`/blog/${post.slug}`}>{post.title}</Link> — {stripMarkdown(post.excerpt)}</li>
        ))}
      </ul>
    </>
  );
}
