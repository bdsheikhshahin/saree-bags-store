import { Schema, model, type Document, type Types } from 'mongoose';

export interface ReviewDoc extends Document {
  product: Types.ObjectId;
  productSlug: string; // denormalised so reviews can be looked up by slug
  name: string;
  rating: number; // 1–5
  comment: string;
  approved: boolean; // new submissions start unapproved; admin approves them
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<ReviewDoc>(
  {
    product: { index: true, ref: 'Product', required: true, type: Schema.Types.ObjectId },
    productSlug: { index: true, required: true, type: String },
    name: { maxlength: 100, required: true, trim: true, type: String },
    rating: { max: 5, min: 1, required: true, type: Number },
    comment: { maxlength: 2000, required: true, trim: true, type: String },
    approved: { default: false, type: Boolean },
  },
  { timestamps: true },
);

export const ReviewModel = model<ReviewDoc>('Review', reviewSchema);
