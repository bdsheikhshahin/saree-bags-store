"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoriesRouter = void 0;
const express_1 = require("express");
const db_1 = require("../config/db");
const seed_1 = require("../data/seed");
const Category_1 = require("../models/Category");
exports.categoriesRouter = (0, express_1.Router)();
exports.categoriesRouter.get('/', async (_req, res) => {
    if ((0, db_1.isDbConnected)()) {
        res.json(await Category_1.CategoryModel.find({ isPublished: true }).lean());
        return;
    }
    res.json(seed_1.seedCategories);
});
exports.categoriesRouter.get('/:slug', async (req, res) => {
    if ((0, db_1.isDbConnected)()) {
        const item = await Category_1.CategoryModel.findOne({ slug: req.params.slug }).lean();
        if (!item) {
            res.status(404).json({ error: 'Category not found' });
            return;
        }
        res.json(item);
        return;
    }
    const item = seed_1.seedCategories.find((c) => c.slug === req.params.slug);
    if (!item) {
        res.status(404).json({ error: 'Category not found' });
        return;
    }
    res.json(item);
});
//# sourceMappingURL=categories.js.map