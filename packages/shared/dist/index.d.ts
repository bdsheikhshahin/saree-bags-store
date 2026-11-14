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
    parent?: string | null;
    image?: string;
    seo?: SeoFields;
    isPublished?: boolean;
}
export type ProductVariant = {
    name: string;
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
    price: number;
    compareAtPrice?: number;
    currency?: string;
    images: string[];
    category: string;
    stock: number;
    variants?: ProductVariant[];
    tags?: string[];
    badges?: ProductBadges;
    rating?: number;
    baseRating?: number;
    reviewCount?: number;
    salesCount?: number;
    seo?: SeoFields;
    isPublished?: boolean;
    createdAt?: string;
}
export type SectionType = 'exclusive-offer' | 'trendy' | 'hot-sale' | 'best-selling' | 'custom';
export declare const SECTION_TYPES: {
    id: SectionType;
    label: string;
}[];
export type SectionAutoRule = 'highest-discount' | 'best-rating' | 'newest' | 'best-selling' | 'trending';
export declare const SECTION_AUTO_RULES: {
    id: SectionAutoRule;
    label: string;
}[];
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
    content: string;
    coverImage?: string;
    category: string;
    tags?: string[];
    author: string;
    seo?: SeoFields;
    relatedProducts?: string[];
    status: 'draft' | 'published';
    publishedAt?: string;
}
export interface Review {
    _id?: string;
    productSlug: string;
    name: string;
    rating: number;
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
    value: number;
    minOrder: number;
    expiresAt?: string;
    usageLimit?: number;
    usageCount: number;
    active: boolean;
    createdAt?: string;
}
export declare const PAYMENT_METHODS: {
    id: PaymentMethod;
    label: string;
    note: string;
}[];
export interface Order {
    _id?: string;
    orderId: string;
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
    customer: {
        name: string;
        phone: string;
        email?: string;
        address: string;
    };
    createdAt?: string;
}
export interface User {
    _id?: string;
    name: string;
    email: string;
    role: 'customer' | 'admin';
}
export interface DataLayerItem {
    item_id: string;
    item_name: string;
    price: number;
    quantity: number;
    item_category?: string;
    item_variant?: string;
}
export type DataLayerEvent = {
    event: 'view_item_list';
    ecommerce: {
        items: DataLayerItem[];
        item_list_name?: string;
    };
} | {
    event: 'view_item';
    ecommerce: {
        currency: string;
        value: number;
        items: DataLayerItem[];
    };
} | {
    event: 'add_to_cart';
    ecommerce: {
        currency: string;
        value: number;
        items: DataLayerItem[];
    };
} | {
    event: 'remove_from_cart';
    ecommerce: {
        currency: string;
        value: number;
        items: DataLayerItem[];
    };
} | {
    event: 'view_cart';
    ecommerce: {
        currency: string;
        value: number;
        items: DataLayerItem[];
    };
} | {
    event: 'begin_checkout';
    ecommerce: {
        currency: string;
        value: number;
        items: DataLayerItem[];
    };
} | {
    event: 'add_payment_info';
    ecommerce: {
        currency: string;
        value: number;
        payment_type: string;
        items: DataLayerItem[];
    };
} | {
    event: 'purchase';
    ecommerce: {
        transaction_id: string;
        currency: string;
        value: number;
        items: DataLayerItem[];
    };
} | {
    event: 'search';
    search_term: string;
};
export declare const BDT = "BDT";
//# sourceMappingURL=index.d.ts.map