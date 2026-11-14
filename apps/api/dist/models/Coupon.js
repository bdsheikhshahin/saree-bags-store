"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouponModel = void 0;
const mongoose_1 = require("mongoose");
const couponSchema = new mongoose_1.Schema({
    code: { required: true, type: String, unique: true, uppercase: true, trim: true, index: true },
    type: { enum: ['percent', 'fixed'], required: true, type: String },
    value: { min: 0, required: true, type: Number },
    minOrder: { default: 0, min: 0, type: Number },
    expiresAt: Date,
    usageLimit: { min: 1, type: Number },
    usageCount: { default: 0, min: 0, type: Number },
    active: { default: true, type: Boolean },
}, { timestamps: true });
exports.CouponModel = (0, mongoose_1.model)('Coupon', couponSchema);
//# sourceMappingURL=Coupon.js.map