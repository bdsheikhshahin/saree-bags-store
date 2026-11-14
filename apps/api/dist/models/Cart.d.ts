import { type Document } from 'mongoose';
import type { CartItem } from '@ecommerce/shared';
export interface CartDoc extends Document {
    sessionId?: string;
    userId?: string;
    items: CartItem[];
}
export declare const CartModel: import("mongoose").Model<CartDoc, {}, {}, {}, Document<unknown, {}, CartDoc, {}, {}> & CartDoc & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Cart.d.ts.map