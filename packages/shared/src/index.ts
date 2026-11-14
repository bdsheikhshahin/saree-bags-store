// Shared types for the e-commerce monorepo.
// Categories are generic/scalable: the store starts with saree + bags
// and can grow to many categories (like pickaboo.com) without code changes.

export interface SeoFields {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
}

export interface Category {
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  parent?: string | null; // slug of the parent category, null for top-level
  image?: string;
  seo?: SeoFields;
  isPublished?: boolean;
}

export type ProductVariant = {
  name: string; // e.g. "Colour: Red", "Size: M"
  priceDelta?: number;
  stock?: number;
};

export interface ProductBadges {
  bestSeller?: boolean;
  trending?: boolean;
  hotSale?: boolean;
  offer?: boolean;
}

export interface Product {
  _id?: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: number; // BDT
  compareAtPrice?: number;
  currency?: string; // "BDT"
  images: string[];
  category: string; // category slug
  stock: number;
  variants?: ProductVariant[];
  tags?: string[];
  badges?: ProductBadges; // homepage-section flags, set from the admin panel
  rating?: number; // 0–5 demo rating, used by the "best rating" auto-rule
  baseRating?: number; // seed/demo rating; restored when the last approved review is deleted
  reviewCount?: number; // approved review count; kept in sync by the reviews API
  salesCount?: number; // demo units sold, used by the "best selling" auto-rule
  seo?: SeoFields;
  isPublished?: boolean;
  createdAt?: string;
}

// ---------- Homepage sections (managed from /admin/sections) ----------

export type SectionType = 'exclusive-offer' | 'trendy' | 'hot-sale' | 'best-selling' | 'custom';

export const SECTION_TYPES: { id: SectionType; label: string }[] = [
  { id: 'exclusive-offer', label: 'Exclusive Offer' },
  { id: 'trendy', label: 'Trendy Products' },
  { id: 'hot-sale', label: 'Hot Sale' },
  { id: 'best-selling', label: 'Best Selling' },
  { id: 'custom', label: 'Custom' },
];

export type SectionAutoRule = 'highest-discount' | 'best-rating' | 'newest' | 'best-selling' | 'trending';

export const SECTION_AUTO_RULES: { id: SectionAutoRule; label: string }[] = [
  { id: 'highest-discount', label: 'Highest discount %' },
  { id: 'best-rating', label: 'Best rating' },
  { id: 'newest', label: 'Newest products' },
  { id: 'best-selling', label: 'Best selling' },
  { id: 'trending', label: 'Trending badge' },
];

export interface HomepageSection {
  _id?: string;
  title: string;
  /** Optional short text shown under the section title on the homepage (Markdown). */
  description?: string;
  type: SectionType;
  /** 'manual' = use productSlugs; 'auto' = use autoRule. */
  mode: 'manual' | 'auto';
  productSlugs?: string[];
  autoRule?: SectionAutoRule;
  order: number;
  enabled: boolean;
  createdAt?: string;
}

/** A homepage section with its resolved products (what /api/sections returns). */
export interface HomepageSectionWithProducts extends HomepageSection {
  products: Product[];
}

export interface BlogPost {
  _id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string; // Markdown
  coverImage?: string;
  category: string; // blog category slug, e.g. "guides"
  tags?: string[];
  author: string;
  seo?: SeoFields;
  relatedProducts?: string[]; // product slugs
  status: 'draft' | 'published';
  publishedAt?: string;
}

export interface Review {
  _id?: string;
  productSlug: string;
  name: string;
  rating: number; // 1–5
  comment: string;
  approved: boolean;
  createdAt?: string;
}

export interface CartItem {
  productSlug: string;
  name: string;
  price: number;
  quantity: number;
  variant?: string;
  image?: string;
}

export type PaymentMethod = 'sslcommerz' | 'bkash' | 'nagad' | 'cod';

export type CouponType = 'percent' | 'fixed';

export interface Coupon {
  _id?: string;
  code: string;
  type: CouponType;
  value: number; // percent (e.g. 10 = 10%) or fixed BDT amount
  minOrder: number; // minimum order subtotal (BDT) for the coupon to apply
  expiresAt?: string;
  usageLimit?: number;
  usageCount: number;
  active: boolean;
  createdAt?: string;
}

export const PAYMENT_METHODS: { id: PaymentMethod; label: string; note: string }[] = [
  { id: 'sslcommerz', label: 'SSLCommerz (Card / Mobile Banking)', note: 'Cards, bKash, Nagad and more via SSLCommerz gateway' },
  { id: 'bkash', label: 'bKash', note: 'Pay with bKash' },
  { id: 'nagad', label: 'Nagad', note: 'Pay with Nagad' },
  { id: 'cod', label: 'Cash on Delivery', note: 'Pay in cash when the order arrives' },
];

export interface Order {
  _id?: string;
  orderId: string; // human-readable, e.g. ORD-2026-0001
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentReference?: string;
  paymentTransactionId?: string;
  couponCode?: string;
  discountAmount?: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  customer: { name: string; phone: string; email?: string; address: string };
  createdAt?: string;
}

export interface User {
  _id?: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
}

// ---------- GA4 / GTM dataLayer ----------
// GTM is the only analytics loader (no direct gtag). The GTM container ID
// comes from NEXT_PUBLIC_GTM_ID; nothing is hardcoded.

export interface DataLayerItem {
  item_id: string; // SKU
  item_name: string;
  price: number;
  quantity: number;
  item_category?: string;
  item_variant?: string;
}

export type DataLayerEvent =
  | { event: 'view_item_list'; ecommerce: { items: DataLayerItem[]; item_list_name?: string } }
  | { event: 'view_item'; ecommerce: { currency: string; value: number; items: DataLayerItem[] } }
  | { event: 'add_to_cart'; ecommerce: { currency: string; value: number; items: DataLayerItem[] } }
  | { event: 'remove_from_cart'; ecommerce: { currency: string; value: number; items: DataLayerItem[] } }
  | { event: 'view_cart'; ecommerce: { currency: string; value: number; items: DataLayerItem[] } }
  | { event: 'begin_checkout'; ecommerce: { currency: string; value: number; items: DataLayerItem[] } }
  | { event: 'add_payment_info'; ecommerce: { currency: string; value: number; payment_type: string; items: DataLayerItem[] } }
  | { event: 'purchase'; ecommerce: { transaction_id: string; currency: string; value: number; items: DataLayerItem[] } }
  | { event: 'search'; search_term: string };

export const BDT = 'BDT';
