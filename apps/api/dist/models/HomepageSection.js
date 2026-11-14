"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomepageSectionModel = void 0;
const mongoose_1 = require("mongoose");
const sectionSchema = new mongoose_1.Schema({
    title: { required: true, type: String },
    description: String,
    type: {
        enum: ['exclusive-offer', 'trendy', 'hot-sale', 'best-selling', 'custom'],
        required: true,
        type: String,
    },
    mode: { default: 'auto', enum: ['auto', 'manual'], type: String },
    productSlugs: { default: [], type: [String] },
    autoRule: {
        enum: ['highest-discount', 'best-rating', 'newest', 'best-selling', 'trending'],
        type: String,
    },
    order: { default: 0, type: Number },
    enabled: { default: true, type: Boolean },
}, { timestamps: true });
exports.HomepageSectionModel = (0, mongoose_1.model)('HomepageSection', sectionSchema);
//# sourceMappingURL=HomepageSection.js.map