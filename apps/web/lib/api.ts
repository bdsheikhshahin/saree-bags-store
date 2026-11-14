// API client — tries the Express API first, falls back to local seed data
// (lib/data.ts) when the API is not running, so the storefront still renders.
import type { BlogPost, Category, HomepageSectionWithProducts, Product, Review } from '@ecommerce/shared';
import { blogPosts, categories, products, searchProductsLocal } from './data';

export type { Review };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function fetchJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate: 60 } });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export async function getProducts(category?: string): Promise<Product[]> {
  const data = await fetchJson<{ items: Product[] }>(`/api/products${category ? `?category=${category}` : ''}`, { items: products });
  const list = data.items ?? products;
  return category ? list.filter((p) => p.category === category) : list;
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  const item = await fetchJson<Product | null>(`/api/products/${slug}`, null);
  return item ?? products.find((p) => p.slug === slug);
}

export interface ProductSearchParams {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: string; // relevance | price-asc | price-desc | newest | rating
  page?: number;
}

export interface ProductSearchResult {
  items: Product[];
  total: number;
  page: number;
  totalPages: number;
}

/** Search products via GET /api/products; falls back to local seed filtering when the API is down. */
export async function searchProducts(params: ProductSearchParams): Promise<ProductSearchResult> {
  const qs = new URLSearchParams();
  if (params.q) qs.set('search', params.q);
  if (params.category) qs.set('category', params.category);
  if (params.minPrice !== undefined) qs.set('minPrice', String(params.minPrice));
  if (params.maxPrice !== undefined) qs.set('maxPrice', String(params.maxPrice));
  if (params.minRating !== undefined) qs.set('minRating', String(params.minRating));
  if (params.sort) qs.set('sort', params.sort);
  if (params.page) qs.set('page', String(params.page));
  const query = qs.toString();
  const fallbackItems = searchProductsLocal(params);
  return fetchJson<ProductSearchResult>(`/api/products${query ? `?${query}` : ''}`, {
    items: fallbackItems,
    total: fallbackItems.length,
    page: 1,
    totalPages: 1,
  });
}

export interface ProductReviews {
  reviews: Review[];
  averageRating: number;
  count: number;
}

/** Approved reviews for a product (empty list when the API is down). */
export async function getProductReviews(slug: string): Promise<ProductReviews> {
  return fetchJson<ProductReviews>(`/api/products/${slug}/reviews`, { reviews: [], averageRating: 0, count: 0 });
}

/** Submit a review — it is created unapproved and shown after admin approval. */
export async function submitReview(slug: string, body: { name: string; rating: number; comment: string }): Promise<Review> {
  const res = await fetch(`${API_URL}/api/products/${slug}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: unknown };
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : `Could not submit review (${res.status})`);
  }
  return data as Review;
}

export async function getCategories(): Promise<Category[]> {
  return fetchJson<Category[]>('/api/categories', categories);
}

export async function getCategory(slug: string): Promise<Category | undefined> {
  const item = await fetchJson<Category | null>(`/api/categories/${slug}`, null);
  return item ?? categories.find((c) => c.slug === slug);
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  return fetchJson<BlogPost[]>('/api/blog', blogPosts);
}

export async function getBlogPost(slug: string): Promise<BlogPost | undefined> {
  const item = await fetchJson<BlogPost | null>(`/api/blog/${slug}`, null);
  return item ?? blogPosts.find((p) => p.slug === slug);
}

/** Enabled homepage sections with resolved products; [] when the API is unavailable (homepage falls back to Featured products). */
export async function getSections(): Promise<HomepageSectionWithProducts[]> {
  return fetchJson<HomepageSectionWithProducts[]>('/api/sections', []);
}

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}
