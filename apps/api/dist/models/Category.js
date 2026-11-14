"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryModel = void 0;
const mongoose_1 = require("mongoose");
const seoSchema = new mongoose_1.Schema({ title: String, description: String, canonicalUrl: String, ogImage: String }, { _id: false });
const categorySchema = new mongoose_1.Schema({
    name: { required: true, type: String },
    slug: { index: true, required: true, type: String, unique: true },
    description: String,
    parent: { default: null, type: String },
    image: String,
    seo: seoSchema,
    isPublished: { default: true, type: Boolean },
}, { timestamps: true });
exports.CategoryModel = (0, mongoose_1.model)('Category', categorySchema);
//# sourceMappingURL=Category.js.map