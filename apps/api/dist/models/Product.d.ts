import { type Document } from 'mongoose';
import type { Product } from '@ecommerce/shared';
export interface ProductDoc extends Omit<Product, '_id' | 'createdAt'>, Document {
}
export declare const ProductModel: import("mongoose").Model<ProductDoc, {}, {}, {}, Document<unknown, {}, ProductDoc, {}, {}> & ProductDoc & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Product.d.ts.map