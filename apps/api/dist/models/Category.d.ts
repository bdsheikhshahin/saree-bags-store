import { type Document } from 'mongoose';
import type { Category } from '@ecommerce/shared';
export interface CategoryDoc extends Omit<Category, '_id'>, Document {
}
export declare const CategoryModel: import("mongoose").Model<CategoryDoc, {}, {}, {}, Document<unknown, {}, CategoryDoc, {}, {}> & CategoryDoc & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Category.d.ts.map