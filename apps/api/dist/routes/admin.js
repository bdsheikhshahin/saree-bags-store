"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const BlogPost_1 = require("../models/BlogPost");
const Category_1 = require("../models/Category");
const HomepageSection_1 = require("../models/HomepageSection");
const Order_1 = require("../models/Order");
const Product_1 = require("../models/Product");
const User_1 = require("../models/User");
const db_1 = require("../config/db");
const auth_1 = require("../middleware/auth");
// Admin API — all routes require a JWT with role=admin.
// Full validation + DB writes when MongoDB is connected.
exports.adminRouter = (0, express_1.Router)();
exports.adminRouter.use(auth_1.requireAuth, auth_1.requireAdmin);
const seoSchema = zod_1.z.object({
    title: zod_1.z.string().optional(), description: zod_1.z.string().optional(),
    canonicalUrl: zod_1.z.string().optional(), ogImage: zod_1.z.string().optional(),
}).optional();
const badgesSchema = zod_1.z.object({
    bestSeller: zod_1.z.boolean().optional(), trending: zod_1.z.boolean().optional(),
    hotSale: zod_1.z.boolean().optional(), offer: zod_1.z.boolean().optional(),
}).optional();
const productSchema = zod_1.z.object({
    name: zod_1.z.string().min(2), slug: zod_1.z.string().min(2), sku: zod_1.z.string().min(2),
    description: zod_1.z.string().min(10), price: zod_1.z.number().nonnegative(),
    compareAtPrice: zod_1.z.number().optional(), images: zod_1.z.array(zod_1.z.string()).default([]),
    category: zod_1.z.string(), stock: zod_1.z.number().int().nonnegative().default(0),
    variants: zod_1.z.array(zod_1.z.object({ name: zod_1.z.string(), priceDelta: zod_1.z.number().optional(), stock: zod_1.z.number().optional() })).default([]),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
    badges: badgesSchema,
    rating: zod_1.z.number().min(0).max(5).optional(),
    salesCount: zod_1.z.number().int().nonnegative().optional(),
    seo: seoSchema,
    isPublished: zod_1.z.boolean().default(true),
});
const categorySchema = zod_1.z.object({
    name: zod_1.z.string().min(2), slug: zod_1.z.string().min(2), description: zod_1.z.string().optional(),
    parent: zod_1.z.string().nullable().optional(), image: zod_1.z.string().optional(),
    seo: seoSchema, isPublished: zod_1.z.boolean().default(true),
});
const blogSchema = zod_1.z.object({
    title: zod_1.z.string().min(2), slug: zod_1.z.string().min(2), excerpt: zod_1.z.string().min(10),
    content: zod_1.z.string().min(10), coverImage: zod_1.z.string().optional(), category: zod_1.z.string(),
    tags: zod_1.z.array(zod_1.z.string()).default([]), author: zod_1.z.string().default('Editor'),
    relatedProducts: zod_1.z.array(zod_1.z.string()).default([]),
    status: zod_1.z.enum(['draft', 'published']).default('draft'),
    seo: zod_1.z.object({ title: zod_1.z.string().optional(), description: zod_1.z.string().optional(), ogImage: zod_1.z.string().optional() }).optional(),
});
const sectionSchema = zod_1.z.object({
    title: zod_1.z.string().min(2),
    description: zod_1.z.string().optional(),
    type: zod_1.z.enum(['exclusive-offer', 'trendy', 'hot-sale', 'best-selling', 'custom']),
    mode: zod_1.z.enum(['auto', 'manual']).default('auto'),
    productSlugs: zod_1.z.array(zod_1.z.string()).default([]),
    autoRule: zod_1.z.enum(['highest-discount', 'best-rating', 'newest', 'best-selling', 'trending']).optional(),
    order: zod_1.z.number().int().default(0),
    enabled: zod_1.z.boolean().default(true),
});
const orderPatchSchema = zod_1.z.object({
    status: zod_1.z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']).optional(),
    paymentStatus: zod_1.z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
});
function dbGuard(res) {
    if (!(0, db_1.isDbConnected)()) {
        res.status(503).json({ error: 'Database not available — start MongoDB for admin writes' });
        return false;
    }
    return true;
}
function parseError(res, err) {
    res.status(400).json({ error: err.flatten() });
}
// ---------- Dashboard stats ----------
exports.adminRouter.get('/stats', async (_req, res) => {
    if (!dbGuard(res))
        return;
    const [productCount, orderCount, blogCount, revenueAgg, lowStock, recentOrders] = await Promise.all([
        Product_1.ProductModel.countDocuments({}),
        Order_1.OrderModel.countDocuments({}),
        BlogPost_1.BlogPostModel.countDocuments({}),
        Order_1.OrderModel.aggregate([
            { $match: { status: { $ne: 'cancelled' } } },
            { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
        Product_1.ProductModel.find({ stock: { $lte: 5 } }).sort({ stock: 1 }).limit(10).lean(),
        Order_1.OrderModel.find({}).sort({ createdAt: -1 }).limit(5).lean(),
    ]);
    res.json({
        products: productCount,
        orders: orderCount,
        blogPosts: blogCount,
        revenue: revenueAgg[0]?.total ?? 0,
        lowStock,
        recentOrders,
    });
});
// ---------- Products ----------
exports.adminRouter.get('/products', async (_req, res) => {
    if (!dbGuard(res))
        return;
    res.json(await Product_1.ProductModel.find({}).sort({ createdAt: -1 }).lean());
});
exports.adminRouter.get('/products/:slug', async (req, res) => {
    if (!dbGuard(res))
        return;
    const item = await Product_1.ProductModel.findOne({ slug: req.params.slug }).lean();
    if (!item) {
        res.status(404).json({ error: 'Product not found' });
        return;
    }
    res.json(item);
});
exports.adminRouter.post('/products', async (req, res) => {
    if (!dbGuard(res))
        return;
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) {
        parseError(res, parsed.error);
        return;
    }
    const item = await Product_1.ProductModel.create(parsed.data);
    res.status(201).json(item);
});
exports.adminRouter.put('/products/:slug', async (req, res) => {
    if (!dbGuard(res))
        return;
    const parsed = productSchema.partial().safeParse(req.body);
    if (!parsed.success) {
        parseError(res, parsed.error);
        return;
    }
    const item = await Product_1.ProductModel.findOneAndUpdate({ slug: req.params.slug }, parsed.data, { new: true });
    if (!item) {
        res.status(404).json({ error: 'Product not found' });
        return;
    }
    res.json(item);
});
exports.adminRouter.delete('/products/:slug', async (req, res) => {
    if (!dbGuard(res))
        return;
    const item = await Product_1.ProductModel.findOneAndDelete({ slug: req.params.slug });
    if (!item) {
        res.status(404).json({ error: 'Product not found' });
        return;
    }
    res.json({ deleted: true });
});
// ---------- Categories ----------
exports.adminRouter.get('/categories', async (_req, res) => {
    if (!dbGuard(res))
        return;
    res.json(await Category_1.CategoryModel.find({}).sort({ name: 1 }).lean());
});
exports.adminRouter.post('/categories', async (req, res) => {
    if (!dbGuard(res))
        return;
    const parsed = categorySchema.safeParse(req.body);
    if (!parsed.success) {
        parseError(res, parsed.error);
        return;
    }
    const item = await Category_1.CategoryModel.create(parsed.data);
    res.status(201).json(item);
});
exports.adminRouter.put('/categories/:slug', async (req, res) => {
    if (!dbGuard(res))
        return;
    const parsed = categorySchema.partial().safeParse(req.body);
    if (!parsed.success) {
        parseError(res, parsed.error);
        return;
    }
    const item = await Category_1.CategoryModel.findOneAndUpdate({ slug: req.params.slug }, parsed.data, { new: true });
    if (!item) {
        res.status(404).json({ error: 'Category not found' });
        return;
    }
    res.json(item);
});
exports.adminRouter.delete('/categories/:slug', async (req, res) => {
    if (!dbGuard(res))
        return;
    const item = await Category_1.CategoryModel.findOneAndDelete({ slug: req.params.slug });
    if (!item) {
        res.status(404).json({ error: 'Category not found' });
        return;
    }
    res.json({ deleted: true });
});
// ---------- Orders ----------
exports.adminRouter.get('/orders', async (_req, res) => {
    if (!dbGuard(res))
        return;
    res.json(await Order_1.OrderModel.find({}).sort({ createdAt: -1 }).lean());
});
exports.adminRouter.get('/orders/:orderId', async (req, res) => {
    if (!dbGuard(res))
        return;
    const item = await Order_1.OrderModel.findOne({ orderId: req.params.orderId }).lean();
    if (!item) {
        res.status(404).json({ error: 'Order not found' });
        return;
    }
    res.json(item);
});
exports.adminRouter.patch('/orders/:orderId', async (req, res) => {
    if (!dbGuard(res))
        return;
    const parsed = orderPatchSchema.safeParse(req.body);
    if (!parsed.success) {
        parseError(res, parsed.error);
        return;
    }
    const item = await Order_1.OrderModel.findOneAndUpdate({ orderId: req.params.orderId }, parsed.data, { new: true });
    if (!item) {
        res.status(404).json({ error: 'Order not found' });
        return;
    }
    res.json(item);
});
// ---------- Blog ----------
exports.adminRouter.get('/blog', async (_req, res) => {
    if (!dbGuard(res))
        return;
    res.json(await BlogPost_1.BlogPostModel.find({}).sort({ createdAt: -1 }).lean());
});
exports.adminRouter.get('/blog/:slug', async (req, res) => {
    if (!dbGuard(res))
        return;
    const item = await BlogPost_1.BlogPostModel.findOne({ slug: req.params.slug }).lean();
    if (!item) {
        res.status(404).json({ error: 'Blog post not found' });
        return;
    }
    res.json(item);
});
exports.adminRouter.post('/blog', async (req, res) => {
    if (!dbGuard(res))
        return;
    const parsed = blogSchema.safeParse(req.body);
    if (!parsed.success) {
        parseError(res, parsed.error);
        return;
    }
    const item = await BlogPost_1.BlogPostModel.create({ ...parsed.data, publishedAt: parsed.data.status === 'published' ? new Date() : undefined });
    res.status(201).json(item);
});
exports.adminRouter.put('/blog/:slug', async (req, res) => {
    if (!dbGuard(res))
        return;
    const parsed = blogSchema.partial().safeParse(req.body);
    if (!parsed.success) {
        parseError(res, parsed.error);
        return;
    }
    const item = await BlogPost_1.BlogPostModel.findOneAndUpdate({ slug: req.params.slug }, parsed.data, { new: true });
    if (!item) {
        res.status(404).json({ error: 'Blog post not found' });
        return;
    }
    res.json(item);
});
exports.adminRouter.delete('/blog/:slug', async (req, res) => {
    if (!dbGuard(res))
        return;
    const item = await BlogPost_1.BlogPostModel.findOneAndDelete({ slug: req.params.slug });
    if (!item) {
        res.status(404).json({ error: 'Blog post not found' });
        return;
    }
    res.json({ deleted: true });
});
// ---------- Homepage sections ----------
exports.adminRouter.get('/sections', async (_req, res) => {
    if (!dbGuard(res))
        return;
    res.json(await HomepageSection_1.HomepageSectionModel.find({}).sort({ order: 1 }).lean());
});
exports.adminRouter.post('/sections', async (req, res) => {
    if (!dbGuard(res))
        return;
    const parsed = sectionSchema.safeParse(req.body);
    if (!parsed.success) {
        parseError(res, parsed.error);
        return;
    }
    const item = await HomepageSection_1.HomepageSectionModel.create(parsed.data);
    res.status(201).json(item);
});
exports.adminRouter.put('/sections/:id', async (req, res) => {
    if (!dbGuard(res))
        return;
    const parsed = sectionSchema.partial().safeParse(req.body);
    if (!parsed.success) {
        parseError(res, parsed.error);
        return;
    }
    const item = await HomepageSection_1.HomepageSectionModel.findByIdAndUpdate(req.params.id, parsed.data, { new: true });
    if (!item) {
        res.status(404).json({ error: 'Section not found' });
        return;
    }
    res.json(item);
});
// Reorder: body { ids: string[] } — sets order = position in the array.
exports.adminRouter.post('/sections/reorder', async (req, res) => {
    if (!dbGuard(res))
        return;
    const parsed = zod_1.z.object({ ids: zod_1.z.array(zod_1.z.string()) }).safeParse(req.body);
    if (!parsed.success) {
        parseError(res, parsed.error);
        return;
    }
    await Promise.all(parsed.data.ids.map((id, i) => HomepageSection_1.HomepageSectionModel.findByIdAndUpdate(id, { order: i + 1 })));
    res.json(await HomepageSection_1.HomepageSectionModel.find({}).sort({ order: 1 }).lean());
});
exports.adminRouter.delete('/sections/:id', async (req, res) => {
    if (!dbGuard(res))
        return;
    const item = await HomepageSection_1.HomepageSectionModel.findByIdAndDelete(req.params.id);
    if (!item) {
        res.status(404).json({ error: 'Section not found' });
        return;
    }
    res.json({ deleted: true });
});
// ---------- Users (read-only) ----------
exports.adminRouter.get('/users', async (_req, res) => {
    if (!dbGuard(res))
        return;
    res.json(await User_1.UserModel.find({}).select('-passwordHash').sort({ createdAt: -1 }).lean());
});
//# sourceMappingURL=admin.js.map