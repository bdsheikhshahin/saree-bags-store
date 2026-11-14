"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewModel = void 0;
const mongoose_1 = require("mongoose");
const reviewSchema = new mongoose_1.Schema({
    product: { index: true, ref: 'Product', required: true, type: mongoose_1.Schema.Types.ObjectId },
    productSlug: { index: true, required: true, type: String },
    name: { maxlength: 100, required: true, trim: true, type: String },
    rating: { max: 5, min: 1, required: true, type: Number },
    comment: { maxlength: 2000, required: true, trim: true, type: String },
    approved: { default: false, type: Boolean },
}, { timestamps: true });
exports.ReviewModel = (0, mongoose_1.model)('Review', reviewSchema);
//# sourceMappingURL=Review.js.map