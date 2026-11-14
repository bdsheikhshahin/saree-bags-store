import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import ProductCard from '@/components/ProductCard';
import ProductListTracker from '@/components/ProductListTracker';
import SearchSort from '@/components/SearchSort';
import { getCategories, searchProducts } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search saree and bags online in Bangladesh.',
};

function numParam(value: string | undefined): number | undefined {
  if (value === undefined || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export default async function SearchPage({ searchParams }: {
  searchParams?: { q?: string; category?: string; minPrice?: string; maxPrice?: string; minRating?: string; sort?: string };
}) {
  const q = searchParams?.q ?? '';
  const category = searchParams?.category ?? '';
  const minPrice = searchParams?.minPrice ?? '';
  const maxPrice = searchParams?.maxPrice ?? '';
  const minRating = searchParams?.minRating ?? '';
  const sort = searchParams?.sort ?? 'relevance';
  const [categories, result] = await Promise.all([
    getCategories(),
    searchProducts({
      q,
      category: category || undefined,
      minPrice: numParam(minPrice),
      maxPrice: numParam(maxPrice),
      minRating: numParam(minRating),
      sort,
    }),
  ]);

  return (
    <>
      <ProductListTracker products={result.items} />
      <h1>{q ? `Search results for “${q}”` : 'Search'}</h1>
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <aside style={{ width: 220, flexShrink: 0, border: '1px solid #e5e5e5', borderRadius: 8, padding: 16 }}>
          <form action="/search" method="get">
            <input type="hidden" name="q" value={q} />
            <p style={{ margin: '0 0 12px' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Category</label>
              <select name="category" defaultValue={category} style={{ width: '100%', padding: '6px 8px' }}>
                <option value="">All categories</option>
                {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </p>
            <p style={{ margin: '0 0 12px' }}>
              <span style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Price (৳)</span>
              <span style={{ display: 'flex', gap: 8 }}>
                <input type="number" name="minPrice" placeholder="Min" defaultValue={minPrice} min={0} style={{ width: '100%', padding: '6px 8px' }} />
                <input type="number" name="maxPrice" placeholder="Max" defaultValue={maxPrice} min={0} style={{ width: '100%', padding: '6px 8px' }} />
              </span>
            </p>
            <p style={{ margin: '0 0 12px' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Minimum rating</label>
              <select name="minRating" defaultValue={minRating} style={{ width: '100%', padding: '6px 8px' }}>
                <option value="">Any rating</option>
                <option value="3">3★ &amp; up</option>
                <option value="4">4★ &amp; up</option>
                <option value="4.5">4.5★ &amp; up</option>
              </select>
            </p>
            <button type="submit" style={{ background: '#111', color: '#fff', border: '1px solid #111', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, width: '100%' }}>
              Apply filters
            </button>
            {(category || minPrice || maxPrice || minRating) ? (
              <p style={{ margin: '12px 0 0' }}><Link href={q ? `/search?q=${encodeURIComponent(q)}` : '/search'}>Clear filters</Link></p>
            ) : null}
          </form>
        </aside>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <p style={{ margin: 0 }}>{result.total} result{result.total === 1 ? '' : 's'}</p>
            <Suspense>
              <SearchSort value={sort} />
            </Suspense>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {result.items.map((p) => <ProductCard key={p.slug} product={p} />)}
          </div>
          {result.items.length === 0 ? <p>No products found{q ? ` for “${q}”` : ''}. Try a different search or clear the filters.</p> : null}
        </div>
      </div>
    </>
  );
}
