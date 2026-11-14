import { type Document } from 'mongoose';
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
export declare const CouponModel: import("mongoose").Model<CouponDoc, {}, {}, {}, Document<unknown, {}, CouponDoc, {}, {}> & CouponDoc & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Coupon.d.ts.map