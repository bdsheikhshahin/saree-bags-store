import { Router, type Request, type Response } from 'express';
import type { Types } from 'mongoose';
import { z } from 'zod';
import { isDbConnected } from '../config/db';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { ProductModel } from '../models/Product';
import { ReviewModel } from '../models/Review';

// Reviews — public read/submit under /api/products/:slug/reviews,
// moderation under /api/admin/reviews (admin JWT required).
// Reviews are never seeded; new submissions start unapproved.

export const reviewsRouter = Router();
export const adminReviewsRouter = Router();
adminReviewsRouter.use(requireAuth, requireAdmin);

const reviewBodySchema = z.object({
  name: z.string().trim().min(1).max(100),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1).max(2000),
});

const approveSchema = z.object({ approved: z.boolean() });

function dbGuard(res: Response): boolean {
  if (!isDbConnected()) { res.status(503).json({ error: 'Database not available — start MongoDB for reviews' }); return false; }
  return true;
}

/**
 * Recompute a product's display rating + reviewCount from its approved reviews.
 * reviewCount is always updated; rating is only overwritten while at least one
 * approved review exists, so a product with no approved reviews keeps its
 * existing (e.g. seed demo) rating instead of dropping to 0.
 */
async function syncProductRating(productId: Types.ObjectId): Promise<void> {
  const agg = (await ReviewModel.aggregate([
    { $match: { product: productId, approved: true } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ])) as Array<{ avg: number; count: number }>;
  const count = agg[0]?.count ?? 0;
  const update: { reviewCount: number; rating?: number } = { reviewCount: count };
  if (count > 0) {
    update.rating = Math.round(agg[0].avg * 10) / 10;
  } else {
    // No approved reviews left: restore the seed/demo rating instead of
    // leaving whatever the last approved review computed.
    const product = await ProductModel.findById(productId).lean();
    if (product?.baseRating) update.rating = product.baseRating;
  }
  await ProductModel.findByIdAndUpdate(productId, update);
}

// ---------- Public: approved reviews for one product ----------
reviewsRouter.get('/:slug/reviews', async (req: Request, res: Response) => {
  if (!isDbConnected()) { res.json({ reviews: [], averageRating: 0, count: 0 }); return; }
  const product = await ProductModel.findOne({ slug: req.params.slug }).lean();
  if (!product) { res.status(404).json({ error: 'Product not found' }); return; }
  const reviews = await ReviewModel.find({ product: product._id, approved: true }).sort({ createdAt: -1 }).lean();
  const count = reviews.length;
  const averageRating = count > 0
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10
    : (product.rating ?? 0);
  res.json({ reviews, averageRating, count });
});

// ---------- Public: submit a review (starts unapproved) ----------
reviewsRouter.post('/:slug/reviews', async (req: Request, res: Response) => {
  if (!dbGuard(res)) return;
  const parsed = reviewBodySchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const product = await ProductModel.findOne({ slug: req.params.slug });
  if (!product) { res.status(404).json({ error: 'Product not found' }); return; }
  const review = await ReviewModel.create({
    ...parsed.data,
    product: product._id,
    productSlug: product.slug,
    approved: false,
  });
  res.status(201).json(review);
});

// ---------- Admin: list all reviews ----------
adminReviewsRouter.get('/', async (_req: Request, res: Response) => {
  if (!dbGuard(res)) return;
  res.json(await ReviewModel.find({}).sort({ createdAt: -1 }).lean());
});

// ---------- Admin: approve / unapprove ----------
adminReviewsRouter.patch('/:id', async (req: Request, res: Response) => {
  if (!dbGuard(res)) return;
  const parsed = approveSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const review = await ReviewModel.findByIdAndUpdate(req.params.id, { approved: parsed.data.approved }, { new: true });
  if (!review) { res.status(404).json({ error: 'Review not found' }); return; }
  await syncProductRating(review.product);
  res.json(review);
});

// ---------- Admin: delete ----------
adminReviewsRouter.delete('/:id', async (req: Request, res: Response) => {
  if (!dbGuard(res)) return;
  const review = await ReviewModel.findByIdAndDelete(req.params.id);
  if (!review) { res.status(404).json({ error: 'Review not found' }); return; }
  await syncProductRating(review.product);
  res.json({ deleted: true });
});
