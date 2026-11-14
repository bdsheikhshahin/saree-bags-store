import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import AddToCartButton from '@/components/AddToCartButton';
import ReviewForm from '@/components/ReviewForm';
import ViewItemTracker from '@/components/ViewItemTracker';
import { formatBdt } from '@/components/ProductCard';
import { getProduct, getProductReviews, getProducts, siteUrl } from '@/lib/api';
import { stripMarkdown } from '@/lib/markdown';
import { breadcrumbJsonLd, jsonLdScript, productJsonLd } from '@/lib/seo';

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await getProduct(params.slug);
  if (!p) return { title: 'Product not found' };
  return {
    title: p.seo?.title ?? p.name,
    description: p.seo?.description ?? stripMarkdown(p.description),
    alternates: { canonical: p.seo?.canonicalUrl ?? `${siteUrl()}/products/${p.slug}` },
    openGraph: { title: p.seo?.title ?? p.name, description: p.seo?.description ?? stripMarkdown(p.description), type: 'website', images: p.images[0] ? [{ url: p.images[0] }] : undefined },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const p = await getProduct(params.slug);
  if (!p) notFound();
  const { reviews, averageRating, count } = await getProductReviews(p.slug);
  // No approved reviews yet: show the product's stored rating instead.
  const displayRating = count > 0 ? averageRating : (p.rating ?? 0);
  const displayCount = count;
  return (
    <>
      <ViewItemTracker product={p} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(productJsonLd(p))} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(breadcrumbJsonLd([
        { name: 'Home', url: siteUrl() },
        { name: 'Shop', url: `${siteUrl()}/products` },
        { name: p.name, url: `${siteUrl()}/products/${p.slug}` },
      ]))} />
      <p><Link href="/products">← All products</Link> · <Link href={`/category/${p.category}`}>{p.category}</Link></p>
      <h1>{p.name}</h1>
      <Image src={p.images[0] ?? '/images/placeholder.jpg'} alt={p.name} width={800} height={800} style={{ maxWidth: 500, height: 'auto' }} />
      <p><strong>{formatBdt(p.price)}</strong> {p.compareAtPrice ? <s>{formatBdt(p.compareAtPrice)}</s> : null}</p>
      <ReactMarkdown>{p.description}</ReactMarkdown>
      <p>SKU: {p.sku} · Stock: {p.stock}</p>
      {p.variants?.map((v) => <p key={v.name}>{v.name}</p>)}
      <AddToCartButton product={p} />
      <section style={{ marginTop: 32 }}>
        <h2>Reviews</h2>
        <p>
          <strong>★ {displayRating.toFixed(1)}</strong>{' '}
          {displayCount > 0 ? `(${displayCount} review${displayCount > 1 ? 's' : ''})` : '(no reviews yet)'}
        </p>
        {reviews.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {reviews.map((r) => (
              <li key={r._id ?? `${r.name}-${r.createdAt}`} style={{ borderTop: '1px solid #eee', padding: '12px 0' }}>
                <p style={{ margin: '0 0 4px' }}>
                  <strong>{r.name}</strong>{' '}
                  <span style={{ color: '#f59e0b' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>{' '}
                  {r.createdAt ? <span style={{ color: '#666', fontSize: 13 }}>{new Date(r.createdAt).toLocaleDateString('en-GB')}</span> : null}
                </p>
                <p style={{ margin: 0 }}>{r.comment}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No reviews yet — be the first to review this product.</p>
        )}
        <ReviewForm slug={p.slug} />
      </section>
    </>
  );
}
