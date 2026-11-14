export interface CouponValidation {
    valid: boolean;
    code: string;
    type?: 'percent' | 'fixed';
    value?: number;
    /** Discount in BDT for the given subtotal (0 when invalid). */
    discount: number;
    message: string;
}
export declare function computeDiscount(type: 'percent' | 'fixed', value: number, subtotal: number): number;
export declare function validateCouponCode(code: string, subtotal: number): Promise<CouponValidation>;
//# sourceMappingURL=coupons.d.ts.map