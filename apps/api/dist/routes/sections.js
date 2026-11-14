"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sectionsRouter = void 0;
const express_1 = require("express");
const db_1 = require("../config/db");
const HomepageSection_1 = require("../models/HomepageSection");
const Product_1 = require("../models/Product");
const sections_1 = require("../services/sections");
// Public homepage sections — enabled ones, in order, with resolved products.
exports.sectionsRouter = (0, express_1.Router)();
exports.sectionsRouter.get('/', async (_req, res) => {
    if ((0, db_1.isDbConnected)()) {
        const [sections, products] = await Promise.all([
            HomepageSection_1.HomepageSectionModel.find({}).sort({ order: 1 }).lean(),
            Product_1.ProductModel.find({ isPublished: true }).lean(),
        ]);
        // lean() docs carry ObjectId _id / Date createdAt; JSON handles them, the cast only satisfies the shared types.
        res.json((0, sections_1.withProducts)(sections, products));
        return;
    }
    res.json((0, sections_1.fallbackSections)());
});
//# sourceMappingURL=sections.js.map