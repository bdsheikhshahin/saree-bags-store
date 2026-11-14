import type { HomepageSection, HomepageSectionWithProducts, Product } from '@ecommerce/shared';
/** Default homepage sections, seeded on first run and used as the fallback when the DB is down. */
export declare const defaultSections: HomepageSection[];
export declare function resolveSectionProducts(section: HomepageSection, all: Product[], limit?: number): Product[];
/** Resolve enabled sections (in order) against a product list. */
export declare function withProducts(sections: HomepageSection[], all: Product[]): HomepageSectionWithProducts[];
/** Fallback sections when MongoDB is not connected. */
export declare function fallbackSections(): HomepageSectionWithProducts[];
//# sourceMappingURL=sections.d.ts.map