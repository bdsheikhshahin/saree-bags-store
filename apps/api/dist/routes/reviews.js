"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminReviewsRouter = exports.reviewsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../config/db");
const auth_1 = require("../middleware/auth");
const Product_1 = require("../models/Product");
const Review_1 = require("../models/Review");
// Reviews — public read/submit under /api/products/:slug/reviews,
// moderation under /api/admin/reviews (admin JWT required).
// Reviews are never seeded; new submissions start unapproved.
exports.reviewsRouter = (0, express_1.Router)();
exports.adminReviewsRouter = (0, express_1.Router)();
exports.adminReviewsRouter.use(auth_1.requireAuth, auth_1.requireAdmin);
const reviewBodySchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).max(100),
    rating: zod_1.z.number().int().min(1).max(5),
    comment: zod_1.z.string().trim().min(1).max(2000),
});
const approveSchema = zod_1.z.object({ approved: zod_1.z.boolean() });
function dbGuard(res) {
    if (!(0, db_1.isDbConnected)()) {
        res.status(503).json({ error: 'Database not available — start MongoDB for reviews' });
        return false;
    }
    return true;
}
/**
 * Recompute a product's display rating + reviewCount from its approved reviews.
 * reviewCount is always updated; rating is only overwritten while at least one
 * approved review exists, so a product with no approved reviews keeps its
 * existing (e.g. seed demo) rating instead of dropping to 0.
 */
async function syncProductRating(productId) {
    const agg = (await Review_1.ReviewModel.aggregate([
        { $match: { product: productId, approved: true } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]));
    const count = agg[0]?.count ?? 0;
    const update = { reviewCount: count };
    if (count > 0) {
        update.rating = Math.round(agg[0].avg * 10) / 10;
    }
    else {
        // No approved reviews left: restore the seed/demo rating instead of
        // leaving whatever the last approved review computed.
        const product = await Product_1.ProductModel.findById(productId).lean();
        if (product?.baseRating)
            update.rating = product.baseRating;
    }
    await Product_1.ProductModel.findByIdAndUpdate(productId, update);
}
// ---------- Public: approved reviews for one product ----------
exports.reviewsRouter.get('/:slug/reviews', async (req, res) => {
    if (!(0, db_1.isDbConnected)()) {
        res.json({ reviews: [], averageRating: 0, count: 0 });
        return;
    }
    const product = await Product_1.ProductModel.findOne({ slug: req.params.slug }).lean();
    if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
    }
    const reviews = await Review_1.ReviewModel.find({ product: product._id, approved: true }).sort({ createdAt: -1 }).lean();
    const count = reviews.length;
    const averageRating = count > 0
        ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10
        : (product.rating ?? 0);
    res.json({ reviews, averageRating, count });
});
// ---------- Public: submit a review (starts unapproved) ----------
exports.reviewsRouter.post('/:slug/reviews', async (req, res) => {
    if (!dbGuard(res))
        return;
    const parsed = reviewBodySchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }
    const product = await Product_1.ProductModel.findOne({ slug: req.params.slug });
    if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
    }
    const review = await Review_1.ReviewModel.create({
        ...parsed.data,
        product: product._id,
        productSlug: product.slug,
        approved: false,
    });
    res.status(201).json(review);
});
// ---------- Admin: list all reviews ----------
exports.adminReviewsRouter.get('/', async (_req, res) => {
    if (!dbGuard(res))
        return;
    res.json(await Review_1.ReviewModel.find({}).sort({ createdAt: -1 }).lean());
});
// ---------- Admin: approve / unapprove ----------
exports.adminReviewsRouter.patch('/:id', async (req, res) => {
    if (!dbGuard(res))
        return;
    const parsed = approveSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }
    const review = await Review_1.ReviewModel.findByIdAndUpdate(req.params.id, { approved: parsed.data.approved }, { new: true });
    if (!review) {
        res.status(404).json({ error: 'Review not found' });
        return;
    }
    await syncProductRating(review.product);
    res.json(review);
});
// ---------- Admin: delete ----------
exports.adminReviewsRouter.delete('/:id', async (req, res) => {
    if (!dbGuard(res))
        return;
    const review = await Review_1.ReviewModel.findByIdAndDelete(req.params.id);
    if (!review) {
        res.status(404).json({ error: 'Review not found' });
        return;
    }
    await syncProductRating(review.product);
    res.json({ deleted: true });
});
//# sourceMappingURL=reviews.js.map