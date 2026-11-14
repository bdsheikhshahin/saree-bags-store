import { type Document, type Types } from 'mongoose';
export interface ReviewDoc extends Document {
    product: Types.ObjectId;
    productSlug: string;
    name: string;
    rating: number;
    comment: string;
    approved: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ReviewModel: import("mongoose").Model<ReviewDoc, {}, {}, {}, Document<unknown, {}, ReviewDoc, {}, {}> & ReviewDoc & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Review.d.ts.map