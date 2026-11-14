import type { Metadata } from 'next';
import ProductCard from '@/components/ProductCard';
import ProductListTracker from '@/components/ProductListTracker';
import { getProducts } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Shop All Products',
  description: 'Shop saree and bags online in Bangladesh. Cash on delivery, bKash, Nagad and SSLCommerz.',
};

export default async function ProductsPage({ searchParams }: { searchParams?: { category?: string; search?: string } }) {
  const products = await getProducts(searchParams?.category);
  const filtered = searchParams?.search
    ? products.filter((p) => p.name.toLowerCase().includes(searchParams.search!.toLowerCase()))
    : products;
  return (
    <>
      <ProductListTracker products={filtered} />
      <h1>All products</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        {filtered.map((p) => <ProductCard key={p.slug} product={p} />)}
      </div>
      {filtered.length === 0 ? <p>No products found.</p> : null}
    </>
  );
}
