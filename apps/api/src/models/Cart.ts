import { Schema, model, type Document } from 'mongoose';
import type { CartItem } from '@ecommerce/shared';

export interface CartDoc extends Document {
  sessionId?: string;
  userId?: string;
  items: CartItem[];
}

const cartSchema = new Schema<CartDoc>(
  {
    sessionId: String,
    userId: String,
    items: [
      { productSlug: String, name: String, price: Number, quantity: Number, variant: String, image: String },
    ],
  },
  { timestamps: true },
);

export const CartModel = model<CartDoc>('Cart', cartSchema);
