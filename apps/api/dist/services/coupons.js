"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeDiscount = computeDiscount;
exports.validateCouponCode = validateCouponCode;
// Server-side coupon validation — the single source of truth for discounts.
// Both the public /api/coupons/validate endpoint and order creation use this,
// so a discount can never be applied that the server would not honour.
const Coupon_1 = require("../models/Coupon");
function computeDiscount(type, value, subtotal) {
    if (type === 'percent')
        return Math.min(subtotal, Math.floor((subtotal * value) / 100));
    return Math.min(subtotal, value);
}
async function validateCouponCode(code, subtotal) {
    const normalized = code.trim().toUpperCase();
    if (!normalized)
        return { valid: false, code: normalized, discount: 0, message: 'Enter a coupon code.' };
    const coupon = await Coupon_1.CouponModel.findOne({ code: normalized });
    if (!coupon)
        return { valid: false, code: normalized, discount: 0, message: 'Coupon code not found.' };
    if (!coupon.active)
        return { valid: false, code: normalized, type: coupon.type, value: coupon.value, discount: 0, message: 'This coupon is no longer active.' };
    if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
        return { valid: false, code: normalized, type: coupon.type, value: coupon.value, discount: 0, message: 'This coupon has expired.' };
    }
    if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) {
        return { valid: false, code: normalized, type: coupon.type, value: coupon.value, discount: 0, message: 'This coupon has reached its usage limit.' };
    }
    if (subtotal < coupon.minOrder) {
        return { valid: false, code: normalized, type: coupon.type, value: coupon.value, discount: 0, message: `Minimum order for this coupon is ৳${coupon.minOrder.toLocaleString('en-IN')}.` };
    }
    const discount = computeDiscount(coupon.type, coupon.value, subtotal);
    const label = coupon.type === 'percent' ? `${coupon.value}% off` : `৳${coupon.value.toLocaleString('en-IN')} off`;
    return { valid: true, code: normalized, type: coupon.type, value: coupon.value, discount, message: `Coupon applied: ${label} (you save ৳${discount.toLocaleString('en-IN')}).` };
}
//# sourceMappingURL=coupons.js.map