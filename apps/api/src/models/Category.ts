import { Schema, model, type Document } from 'mongoose';
import type { Category } from '@ecommerce/shared';

export interface CategoryDoc extends Omit<Category, '_id'>, Document {}

const seoSchema = new Schema(
  { title: String, description: String, canonicalUrl: String, ogImage: String },
  { _id: false },
);

const categorySchema = new Schema<CategoryDoc>(
  {
    name: { required: true, type: String },
    slug: { index: true, required: true, type: String, unique: true },
    description: String,
    parent: { default: null, type: String },
    image: String,
    seo: seoSchema,
    isPublished: { default: true, type: Boolean },
  },
  { timestamps: true },
);

export const CategoryModel = model<CategoryDoc>('Category', categorySchema);
