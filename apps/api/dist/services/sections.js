"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultSections = void 0;
exports.resolveSectionProducts = resolveSectionProducts;
exports.withProducts = withProducts;
exports.fallbackSections = fallbackSections;
const seed_1 = require("../data/seed");
/** Default homepage sections, seeded on first run and used as the fallback when the DB is down. */
exports.defaultSections = [
    { title: 'Exclusive Offer', type: 'exclusive-offer', mode: 'auto', autoRule: 'highest-discount', order: 1, enabled: true },
    { title: 'Trendy Products', type: 'trendy', mode: 'auto', autoRule: 'best-rating', order: 2, enabled: true },
    {
        title: 'Hot Sale', type: 'hot-sale', mode: 'manual',
        productSlugs: ['womens-crossbody-bag-black', 'brown-pu-shoulder-tote-bag-2-piece', 'tangail-tat-cotton-saree-maroon', 'tangail-half-silk-chumki-saree-pink'],
        order: 3, enabled: true,
    },
    { title: 'Best Selling', type: 'best-selling', mode: 'auto', autoRule: 'best-selling', order: 4, enabled: true },
];
function discountPct(p) {
    if (!p.compareAtPrice || p.compareAtPrice <= p.price)
        return 0;
    return (p.compareAtPrice - p.price) / p.compareAtPrice;
}
function resolveSectionProducts(section, all, limit = 8) {
    if (section.mode === 'manual') {
        const wanted = section.productSlugs ?? [];
        const bySlug = new Map(all.map((p) => [p.slug, p]));
        return wanted.map((s) => bySlug.get(s)).filter((p) => Boolean(p)).slice(0, limit);
    }
    const rule = section.autoRule ?? 'newest';
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
function withProducts(sections, all) {
    return sections
        .filter((s) => s.enabled)
        .sort((a, b) => a.order - b.order)
        .map((s) => ({ ...s, products: resolveSectionProducts(s, all) }));
}
/** Fallback sections when MongoDB is not connected. */
function fallbackSections() {
    return withProducts(exports.defaultSections, seed_1.seedProducts);
}
//# sourceMappingURL=sections.js.map