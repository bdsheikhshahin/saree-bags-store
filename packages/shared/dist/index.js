"use strict";
// Shared types for the e-commerce monorepo.
// Categories are generic/scalable: the store starts with saree + bags
// and can grow to many categories (like pickaboo.com) without code changes.
Object.defineProperty(exports, "__esModule", { value: true });
exports.BDT = exports.PAYMENT_METHODS = exports.SECTION_AUTO_RULES = exports.SECTION_TYPES = void 0;
exports.SECTION_TYPES = [
    { id: 'exclusive-offer', label: 'Exclusive Offer' },
    { id: 'trendy', label: 'Trendy Products' },
    { id: 'hot-sale', label: 'Hot Sale' },
    { id: 'best-selling', label: 'Best Selling' },
    { id: 'custom', label: 'Custom' },
];
exports.SECTION_AUTO_RULES = [
    { id: 'highest-discount', label: 'Highest discount %' },
    { id: 'best-rating', label: 'Best rating' },
    { id: 'newest', label: 'Newest products' },
    { id: 'best-selling', label: 'Best selling' },
    { id: 'trending', label: 'Trending badge' },
];
exports.PAYMENT_METHODS = [
    { id: 'sslcommerz', label: 'SSLCommerz (Card / Mobile Banking)', note: 'Cards, bKash, Nagad and more via SSLCommerz gateway' },
    { id: 'bkash', label: 'bKash', note: 'Pay with bKash' },
    { id: 'nagad', label: 'Nagad', note: 'Pay with Nagad' },
    { id: 'cod', label: 'Cash on Delivery', note: 'Pay in cash when the order arrives' },
];
exports.BDT = 'BDT';
//# sourceMappingURL=index.js.map