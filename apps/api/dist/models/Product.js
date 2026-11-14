"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductModel = void 0;
const mongoose_1 = require("mongoose");
const seoSchema = new mongoose_1.Schema({ title: String, description: String, canonicalUrl: String, ogImage: String }, { _id: false });
const productSchema = new mongoose_1.Schema({
    name: { required: true, type: String },
    slug: { index: true, required: true, type: String, unique: true },
    sku: { required: true, type: String, unique: true },
    description: { required: true, type: String },
    price: { min: 0, required: true, type: Number },
    compareAtPrice: Number,
    currency: { default: 'BDT', type: String },
    images: { default: [], type: [String] },
    category: { index: true, required: true, type: String },
    stock: { default: 0, type: Number },
    variants: [{ name: String, priceDelta: Number, stock: Number }],
    tags: { default: [], type: [String] },
    badges: {
        bestSeller: { default: false, type: Boolean },
        trending: { default: false, type: Boolean },
        hotSale: { default: false, type: Boolean },
        offer: { default: false, type: Boolean },
    },
    rating: { default: 0, max: 5, min: 0, type: Number },
    baseRating: { default: 0, max: 5, min: 0, type: Number }, // seed/demo rating; restored when the last approved review is deleted
    reviewCount: { default: 0, min: 0, type: Number }, // approved reviews; kept in sync by reviews.ts
    salesCount: { default: 0, min: 0, type: Number },
    seo: seoSchema,
    isPublished: { default: true, type: Boolean },
}, { timestamps: true });
exports.ProductModel = (0, mongoose_1.model)('Product', productSchema);
//# sourceMappingURL=Product.js.map