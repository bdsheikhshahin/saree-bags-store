// JSON-LD helpers — Product, BreadcrumbList and Article schema.
import type { BlogPost, Product } from '@ecommerce/shared';
import { siteUrl } from './api';
import { stripMarkdown } from './markdown';

export function productJsonLd(p: Product): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: stripMarkdown(p.description),
    sku: p.sku,
    image: p.images.map((i) => (i.startsWith('http') ? i : `${siteUrl()}${i}`)),
    offers: { '@type': 'Offer', price: p.price, priceCurrency: p.currency ?? 'BDT', availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: item.url })),
  };
}

export function articleJsonLd(post: BlogPost): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: stripMarkdown(post.excerpt),
    author: { '@type': 'Person', name: post.author },
    datePublished: post.publishedAt,
    image: post.coverImage,
  };
}

export function jsonLdScript(data: Record<string, unknown>): { __html: string } {
  return { __html: JSON.stringify(data) };
}
