import type { MetadataRoute } from 'next';
import { getBlogPosts, getCategories, getProducts, siteUrl } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [products, categories, posts] = await Promise.all([getProducts(), getCategories(), getBlogPosts()]);
  return [
    { url: base, lastModified: new Date() },
    { url: `${base}/products`, lastModified: new Date() },
    { url: `${base}/blog`, lastModified: new Date() },
    ...products.map((p) => ({ url: `${base}/products/${p.slug}`, lastModified: new Date() })),
    ...categories.map((c) => ({ url: `${base}/category/${c.slug}`, lastModified: new Date() })),
    ...posts.map((post) => ({ url: `${base}/blog/${post.slug}`, lastModified: post.publishedAt ? new Date(post.publishedAt) : new Date() })),
  ];
}
