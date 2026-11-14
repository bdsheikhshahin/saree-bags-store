import type { HomepageSection, HomepageSectionWithProducts, Product, SectionAutoRule } from '@ecommerce/shared';
import { seedProducts } from '../data/seed';

/** Default homepage sections, seeded on first run and used as the fallback when the DB is down. */
export const defaultSections: HomepageSection[] = [
  { title: 'Exclusive Offer', type: 'exclusive-offer', mode: 'auto', autoRule: 'highest-discount', order: 1, enabled: true },
  { title: 'Trendy Products', type: 'trendy', mode: 'auto', autoRule: 'best-rating', order: 2, enabled: true },
  {
    title: 'Hot Sale', type: 'hot-sale', mode: 'manual',
    productSlugs: ['womens-crossbody-bag-black', 'brown-pu-shoulder-tote-bag-2-piece', 'tangail-tat-cotton-saree-maroon', 'tangail-half-silk-chumki-saree-pink'],
    order: 3, enabled: true,
  },
  { title: 'Best Selling', type: 'best-selling', mode: 'auto', autoRule: 'best-selling', order: 4, enabled: true },
];

function discountPct(p: Product): number {
  if (!p.compareAtPrice || p.compareAtPrice <= p.price) return 0;
  return (p.compareAtPrice - p.price) / p.compareAtPrice;
}

export function resolveSectionProducts(section: HomepageSection, all: Product[], limit = 8): Product[] {
  if (section.mode === 'manual') {
    const wanted = section.productSlugs ?? [];
    const bySlug = new Map(all.map((p) => [p.slug, p]));
    return wanted.map((s) => bySlug.get(s)).filter((p): p is Product => Boolean(p)).slice(0, limit);
  }
  const rule: SectionAutoRule = section.autoRule ?? 'newest';
  const list = [...all];
  switch (rule) {
    case 'highest-discount':
      list.sort((a, b) => discountPct(b) - discountPct(a));
      break;
    case 'best-rating':
      list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      break;
    case 'best-selling':
      list.sort((a, b) => (b.salesCount ?? 0) - (a.salesCount ?? 0));
      break;
    case 'trending':
      list.sort((a, b) => Number(b.badges?.trending ?? false) - Number(a.badges?.trending ?? false) || (b.salesCount ?? 0) - (a.salesCount ?? 0));
      break;
    case 'newest':
    default:
      list.sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));
      break;
  }
  return list.slice(0, limit);
}

/** Resolve enabled sections (in order) against a product list. */
export function withProducts(sections: HomepageSection[], all: Product[]): HomepageSectionWithProducts[] {
  return sections
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order)
    .map((s) => ({ ...s, products: resolveSectionProducts(s, all) }));
}

/** Fallback sections when MongoDB is not connected. */
export function fallbackSections(): HomepageSectionWithProducts[] {
  return withProducts(defaultSections, seedProducts);
}
