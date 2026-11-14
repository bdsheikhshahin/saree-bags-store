"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blogRouter = void 0;
const express_1 = require("express");
const db_1 = require("../config/db");
const seed_1 = require("../data/seed");
const BlogPost_1 = require("../models/BlogPost");
exports.blogRouter = (0, express_1.Router)();
exports.blogRouter.get('/', async (req, res) => {
    if ((0, db_1.isDbConnected)()) {
        const filter = { status: 'published' };
        if (typeof req.query.category === 'string' && req.query.category)
            filter.category = req.query.category;
        res.json(await BlogPost_1.BlogPostModel.find(filter).sort({ publishedAt: -1 }).lean());
        return;
    }
    res.json(seed_1.seedBlogPosts.filter((p) => p.status === 'published'));
});
exports.blogRouter.get('/:slug', async (req, res) => {
    if ((0, db_1.isDbConnected)()) {
        const item = await BlogPost_1.BlogPostModel.findOne({ slug: req.params.slug, status: 'published' }).lean();
        if (!item) {
            res.status(404).json({ error: 'Blog post not found' });
            return;
        }
        res.json(item);
        return;
    }
    const item = seed_1.seedBlogPosts.find((p) => p.slug === req.params.slug && p.status === 'published');
    if (!item) {
        res.status(404).json({ error: 'Blog post not found' });
        return;
    }
    res.json(item);
});
//# sourceMappingURL=blog.js.map