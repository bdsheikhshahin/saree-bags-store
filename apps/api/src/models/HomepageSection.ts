import { Schema, model, type Document } from 'mongoose';
import type { HomepageSection } from '@ecommerce/shared';

export interface HomepageSectionDoc extends Omit<HomepageSection, '_id' | 'createdAt'>, Document {}

const sectionSchema = new Schema<HomepageSectionDoc>(
  {
    title: { required: true, type: String },
    description: String,
    type: {
      enum: ['exclusive-offer', 'trendy', 'hot-sale', 'best-selling', 'custom'],
      required: true,
      type: String,
    },
    mode: { default: 'auto', enum: ['auto', 'manual'], type: String },
    productSlugs: { default: [], type: [String] },
    autoRule: {
      enum: ['highest-discount', 'best-rating', 'newest', 'best-selling', 'trending'],
      type: String,
    },
    order: { default: 0, type: Number },
    enabled: { default: true, type: Boolean },
  },
  { timestamps: true },
);

export const HomepageSectionModel = model<HomepageSectionDoc>('HomepageSection', sectionSchema);
