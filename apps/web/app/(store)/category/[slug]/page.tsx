import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import ProductCard from '@/components/ProductCard';
import { getCategories, getCategory, getProducts, siteUrl } from '@/lib/api';
import { stripMarkdown } from '@/lib/markdown';

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const c = await getCategory(params.slug);
  if (!c) return { title: 'Category not found' };
  return {
    title: c.seo?.title ?? c.name,
    description: c.seo?.description ?? stripMarkdown(c.description ?? ''),
    alternates: { canonical: `${siteUrl()}/category/${c.slug}` },
  };
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const category = await getCategory(params.slug);
  if (!category) notFound();
  const products = await getProducts(params.slug);
  return (
    <>
      <h1>{category.name}</h1>
      {category.description ? <ReactMarkdown>{category.description}</ReactMarkdown> : null}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        {products.map((p) => <ProductCard key={p.slug} product={p} />)}
      </div>
      {products.length === 0 ? <p>No products in this category yet.</p> : null}
    </>
  );
}
