"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogPostModel = void 0;
const mongoose_1 = require("mongoose");
const seoSchema = new mongoose_1.Schema({ title: String, description: String, canonicalUrl: String, ogImage: String }, { _id: false });
const blogPostSchema = new mongoose_1.Schema({
    title: { required: true, type: String },
    slug: { index: true, required: true, type: String, unique: true },
    excerpt: { required: true, type: String },
    content: { required: true, type: String },
    coverImage: String,
    category: { index: true, required: true, type: String },
    tags: { default: [], type: [String] },
    author: { default: 'Editor', type: String },
    seo: seoSchema,
    relatedProducts: { default: [], type: [String] },
    status: { default: 'draft', enum: ['draft', 'published'], type: String },
    publishedAt: Date,
}, { timestamps: true });
exports.BlogPostModel = (0, mongoose_1.model)('BlogPost', blogPostSchema);
//# sourceMappingURL=BlogPost.js.map