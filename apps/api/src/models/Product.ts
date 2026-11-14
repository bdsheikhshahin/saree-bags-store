import { Schema, model, type Document } from 'mongoose';
import type { Product } from '@ecommerce/shared';

export interface ProductDoc extends Omit<Product, '_id' | 'createdAt'>, Document {}

const seoSchema = new Schema(
  { title: String, description: String, canonicalUrl: String, ogImage: String },
  { _id: false },
);

const productSchema = new Schema<ProductDoc>(
  {
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
  },
  { timestamps: true },
);

export const ProductModel = model<ProductDoc>('Product', productSchema);
