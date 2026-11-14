import { Schema, model, type Document } from 'mongoose';

export type CouponType = 'percent' | 'fixed';

export interface CouponDoc extends Document {
  code: string;
  type: CouponType;
  value: number;
  minOrder: number;
  expiresAt?: Date;
  usageLimit?: number;
  usageCount: number;
  active: boolean;
}

const couponSchema = new Schema<CouponDoc>(
  {
    code: { required: true, type: String, unique: true, uppercase: true, trim: true, index: true },
    type: { enum: ['percent', 'fixed'], required: true, type: String },
    value: { min: 0, required: true, type: Number },
    minOrder: { default: 0, min: 0, type: Number },
    expiresAt: Date,
    usageLimit: { min: 1, type: Number },
    usageCount: { default: 0, min: 0, type: Number },
    active: { default: true, type: Boolean },
  },
  { timestamps: true },
);

export const CouponModel = model<CouponDoc>('Coupon', couponSchema);
