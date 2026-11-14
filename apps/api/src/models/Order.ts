import { Schema, model, type Document } from 'mongoose';
import type { Order } from '@ecommerce/shared';

export interface OrderDoc extends Omit<Order, '_id' | 'createdAt'>, Document {}

const orderSchema = new Schema<OrderDoc>(
  {
    orderId: { required: true, type: String, unique: true },
    items: [
      {
        productSlug: String,
        name: String,
        price: Number,
        quantity: Number,
        variant: String,
        image: String,
      },
    ],
    subtotal: { required: true, type: Number },
    deliveryFee: { default: 0, type: Number },
    total: { required: true, type: Number },
    currency: { default: 'BDT', type: String },
    paymentMethod: { enum: ['sslcommerz', 'bkash', 'nagad', 'cod'], required: true, type: String },
    paymentStatus: { default: 'pending', enum: ['pending', 'paid', 'failed', 'refunded'], type: String },
    paymentReference: String,
    paymentTransactionId: String,
    couponCode: String,
    discountAmount: { default: 0, min: 0, type: Number },
    status: { default: 'pending', enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], type: String },
    customer: { name: String, phone: String, email: String, address: String },
  },
  { timestamps: true },
);

export const OrderModel = model<OrderDoc>('Order', orderSchema);
