import { type Document } from 'mongoose';
import type { Order } from '@ecommerce/shared';
export interface OrderDoc extends Omit<Order, '_id' | 'createdAt'>, Document {
}
export declare const OrderModel: import("mongoose").Model<OrderDoc, {}, {}, {}, Document<unknown, {}, OrderDoc, {}, {}> & OrderDoc & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Order.d.ts.map