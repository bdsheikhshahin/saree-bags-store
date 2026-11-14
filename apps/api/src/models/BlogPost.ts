import { Schema, model, type Document } from 'mongoose';
import type { BlogPost } from '@ecommerce/shared';

export interface BlogPostDoc extends Omit<BlogPost, '_id'>, Document {}

const seoSchema = new Schema(
  { title: String, description: String, canonicalUrl: String, ogImage: String },
  { _id: false },
);

const blogPostSchema = new Schema<BlogPostDoc>(
  {
    title: { required: true, type: String },
    slug: { index: true, required: true, type: String, unique: true },
    excerpt: { required: true, type: String },
    content: { required: true, type: String },
    coverImage: String,
    category: { index: true, required: true, type: String },
    tags: { default: [], type: [String] },
    author: { default: 'Editor', type: String },
    seo: seoSchema,
    relatedProducts: { default: [], type: [String] },
    status: { default: 'draft', enum: ['draft', 'published'], type: String },
    publishedAt: Date,
  },
  { timestamps: true },
);

export const BlogPostModel = model<BlogPostDoc>('BlogPost', blogPostSchema);
