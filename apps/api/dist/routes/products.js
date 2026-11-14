"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productsRouter = void 0;
const express_1 = require("express");
const db_1 = require("../config/db");
const seed_1 = require("../data/seed");
const Product_1 = require("../models/Product");
exports.productsRouter = (0, express_1.Router)();
function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
/** Finite number from a query param, or undefined when absent/invalid. */
function numParam(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
}
// DB sort orders. 'relevance' has no explicit order — it falls back to newest.
const DB_SORTS = {
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    newest: { createdAt: -1 },
    rating: { rating: -1 },
};
function filterSeed(req) {
    const { category, search } = req.query;
    let list = [...seed_1.seedProducts];
    if (typeof category === 'string' && category)
        list = list.filter((p) => p.category === category);
    if (typeof search === 'string' && search) {
        const q = search.toLowerCase();
        list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || (p.tags ?? []).some((t) => t.toLowerCase().includes(q)));
    }
    const minPrice = numParam(req.query.minPrice);
    const maxPrice = numParam(req.query.maxPrice);
    const minRating = numParam(req.query.minRating);
    if (minPrice !== undefined)
        list = list.filter((p) => p.price >= minPrice);
    if (maxPrice !== undefined)
        list = list.filter((p) => p.price <= maxPrice);
    if (minRating !== undefined)
        list = list.filter((p) => (p.rating ?? 0) >= minRating);
    switch (req.query.sort) {
        case 'price-asc':
            list.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            list.sort((a, b) => b.price - a.price);
            break;
        case 'newest':
            list.reverse();
            break; // seed order is oldest-first
        case 'rating':
            list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
            break;
        default: break; // relevance: keep seed order
    }
    return list;
}
exports.productsRouter.get('/', async (req, res) => {
    const page = Math.max(1, Number(req.query.page ?? 1) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20) || 20));
    const minPrice = numParam(req.query.minPrice);
    const maxPrice = numParam(req.query.maxPrice);
    const minRating = numParam(req.query.minRating);
    const sortKey = typeof req.query.sort === 'string' ? req.query.sort : 'relevance';
    if ((0, db_1.isDbConnected)()) {
        const filter = { isPublished: true };
        if (typeof req.query.category === 'string' && req.query.category)
            filter.category = req.query.category;
        if (typeof req.query.search === 'string' && req.query.search) {
            // Case-insensitive regex match on name, description and tags (no text index needed).
            const rx = new RegExp(escapeRegExp(req.query.search), 'i');
            filter.$or = [{ name: rx }, { description: rx }, { tags: rx }];
        }
        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = { ...(minPrice !== undefined ? { $gte: minPrice } : {}), ...(maxPrice !== undefined ? { $lte: maxPrice } : {}) };
        }
        if (minRating !== undefined)
            filter.rating = { $gte: minRating };
        const sort = DB_SORTS[sortKey] ?? { createdAt: -1 };
        const [items, total] = await Promise.all([
            Product_1.ProductModel.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
            Product_1.ProductModel.countDocuments(filter),
        ]);
        res.json({ items, page, total, totalPages: Math.ceil(total / limit) });
        return;
    }
    const list = filterSeed(req);
    res.json({ items: list.slice((page - 1) * limit, page * limit), page, total: list.length, totalPages: Math.ceil(list.length / limit) });
});
exports.productsRouter.get('/:slug', async (req, res) => {
    if ((0, db_1.isDbConnected)()) {
        const item = await Product_1.ProductModel.findOne({ slug: req.params.slug, isPublished: true }).lean();
        if (!item) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }
        res.json(item);
        return;
    }
    const item = seed_1.seedProducts.find((p) => p.slug === req.params.slug);
    if (!item) {
        res.status(404).json({ error: 'Product not found' });
        return;
    }
    res.json(item);
});
//# sourceMappingURL=products.js.map