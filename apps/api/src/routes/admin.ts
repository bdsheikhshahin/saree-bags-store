import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { BlogPostModel } from '../models/BlogPost';
import { CategoryModel } from '../models/Category';
import { HomepageSectionModel } from '../models/HomepageSection';
import { OrderModel } from '../models/Order';
import { ProductModel } from '../models/Product';
import { UserModel } from '../models/User';
import { isDbConnected } from '../config/db';
import { requireAdmin, requireAuth } from '../middleware/auth';

// Admin API — all routes require a JWT with role=admin.
// Full validation + DB writes when MongoDB is connected.
export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);

const seoSchema = z.object({
  title: z.string().optional(), description: z.string().optional(),
  canonicalUrl: z.string().optional(), ogImage: z.string().optional(),
}).optional();

const badgesSchema = z.object({
  bestSeller: z.boolean().optional(), trending: z.boolean().optional(),
  hotSale: z.boolean().optional(), offer: z.boolean().optional(),
}).optional();

const productSchema = z.object({
  name: z.string().min(2), slug: z.string().min(2), sku: z.string().min(2),
  description: z.string().min(10), price: z.number().nonnegative(),
  compareAtPrice: z.number().optional(), images: z.array(z.string()).default([]),
  category: z.string(), stock: z.number().int().nonnegative().default(0),
  variants: z.array(z.object({ name: z.string(), priceDelta: z.number().optional(), stock: z.number().optional() })).default([]),
  tags: z.array(z.string()).default([]),
  badges: badgesSchema,
  rating: z.number().min(0).max(5).optional(),
  salesCount: z.number().int().nonnegative().optional(),
  seo: seoSchema,
  isPublished: z.boolean().default(true),
});

const categorySchema = z.object({
  name: z.string().min(2), slug: z.string().min(2), description: z.string().optional(),
  parent: z.string().nullable().optional(), image: z.string().optional(),
  seo: seoSchema, isPublished: z.boolean().default(true),
});

const blogSchema = z.object({
  title: z.string().min(2), slug: z.string().min(2), excerpt: z.string().min(10),
  content: z.string().min(10), coverImage: z.string().optional(), category: z.string(),
  tags: z.array(z.string()).default([]), author: z.string().default('Editor'),
  relatedProducts: z.array(z.string()).default([]),
  status: z.enum(['draft', 'published']).default('draft'),
  seo: z.object({ title: z.string().optional(), description: z.string().optional(), ogImage: z.string().optional() }).optional(),
});

const sectionSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  type: z.enum(['exclusive-offer', 'trendy', 'hot-sale', 'best-selling', 'custom']),
  mode: z.enum(['auto', 'manual']).default('auto'),
  productSlugs: z.array(z.string()).default([]),
  autoRule: z.enum(['highest-discount', 'best-rating', 'newest', 'best-selling', 'trending']).optional(),
  order: z.number().int().default(0),
  enabled: z.boolean().default(true),
});

const orderPatchSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
});

function dbGuard(res: Response): boolean {
  if (!isDbConnected()) { res.status(503).json({ error: 'Database not available — start MongoDB for admin writes' }); return false; }
  return true;
}

function parseError(res: Response, err: z.ZodError): void {
  res.status(400).json({ error: err.flatten() });
}

// ---------- Dashboard stats ----------
adminRouter.get('/stats', async (_req: Request, res: Response) => {
  if (!dbGuard(res)) return;
  const [productCount, orderCount, blogCount, revenueAgg, lowStock, recentOrders] = await Promise.all([
    ProductModel.countDocuments({}),
    OrderModel.countDocuments({}),
    BlogPostModel.countDocuments({}),
    OrderModel.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    ProductModel.find({ stock: { $lte: 5 } }).sort({ stock: 1 }).limit(10).lean(),
    OrderModel.find({}).sort({ createdAt: -1 }).limit(5).lean(),
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
adminRouter.get('/products', async (_req: Request, res: Response) => {
  if (!dbGuard(res)) return;
  res.json(await ProductModel.find({}).sort({ createdAt: -1 }).lean());
});

adminRouter.get('/products/:slug', async (req: Request, res: Response) => {
  if (!dbGuard(res)) return;
  const item = await ProductModel.findOne({ slug: req.params.slug }).lean();
  if (!item) { res.status(404).json({ error: 'Product not found' }); return; }
  res.json(item);
});

adminRouter.post('/products', async (req: Request, res: Response) => {
  if (!dbGuard(res)) return;
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) { parseError(res, parsed.error); return; }
  const item = await ProductModel.create(parsed.data);
  res.status(201).json(item);
});

adminRouter.put('/products/:slug', async (req: Request, res: Response) => {
  if (!dbGuard(res)) return;
  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success) { parseError(res, parsed.error); return; }
  const item = await ProductModel.findOneAndUpdate({ slug: req.params.slug }, parsed.data, { new: true });
  if (!item) { res.status(404).json({ error: 'Product not found' }); return; }
  res.json(item);
});

adminRouter.delete('/products/:slug', async (req: Request, res: Response) => {
  if (!dbGuard(res)) return;
  const item = await ProductModel.findOneAndDelete({ slug: req.params.slug });
  if (!item) { res.status(404).json({ error: 'Product not found' }); return; }
  res.json({ deleted: true });
});

// ---------- Categories ----------
adminRouter.get('/categories', async (_req: Request, res: Response) => {
  if (!dbGuard(res)) return;
  res.json(await CategoryModel.find({}).sort({ name: 1 }).lean());
});

adminRouter.post('/categories', async (req: Request, res: Response) => {
  if (!dbGuard(res)) return;
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) { parseError(res, parsed.error); return; }
  const item = await CategoryModel.create(parsed.data);
  res.status(201).json(item);
});

adminRouter.put('/categories/:slug', async (req: Request, res: Response) => {
  if (!dbGuard(res)) return;
  const parsed = categorySchema.partial().safeParse(req.body);
  if (!parsed.success) { parseError(res, parsed.error); return; }
  const item = await CategoryModel.findOneAndUpdate({ slug: req.params.slug }, parsed.data, { new: true });
  if (!item) { res.status(404).json({ error: 'Category not found' }); return; }
  res.json(item);
});

adminRouter.delete('/categories/:slug', async (req: Request, res: Response) => {
  if (!dbGuard(res)) return;
  const item = await CategoryModel.findOneAndDelete({ slug: req.params.slug });
  if (!item) { res.status(404).json({ error: 'Category not found' }); return; }
  res.json({ deleted: true });
});

// ---------- Orders ----------
adminRouter.get('/orders', async (_req: Request, res: Response) => {
  if (!dbGuard(res)) return;
  res.json(await OrderModel.find({}).sort({ createdAt: -1 }).lean());
});

adminRouter.get('/orders/:orderId', async (req: Request, res: Response) => {
  if (!dbGuard(res)) return;
  const item = await OrderModel.findOne({ orderId: req.params.orderId }).lean();
  if (!item) { res.status(404).json({ error: 'Order not found' }); return; }
  res.json(item);
});

adminRouter.patch('/orders/:orderId', async (req: Request, res: Response) => {
  if (!dbGuard(res)) return;
  const parsed = orderPatchSchema.safeParse(req.body);
  if (!parsed.success) { parseError(res, parsed.error); return; }
  const item = await OrderModel.findOneAndUpdate({ orderId: req.params.orderId }, parsed.data, { new: true });
  if (!item) { res.status(404).json({ error: 'Order not found' }); return; }
  res.json(item);
});

// ---------- Blog ----------
adminRouter.get('/blog', async (_req: Request, res: Response) => {
  if (!dbGuard(res)) return;
  res.json(await BlogPostModel.find({}).sort({ createdAt: -1 }).lean());
});

adminRouter.get('/blog/:slug', async (req: Request, res: Response) => {
  if (!dbGuard(res)) return;
  const item = await BlogPostModel.findOne({ slug: req.params.slug }).lean();
  if (!item) { res.status(404).json({ error: 'Blog post not found' }); return; }
  res.json(item);
});

adminRouter.post('/blog', async (req: Request, res: Response) => {
  if (!dbGuard(res)) return;
  const parsed = blogSchema.safeParse(req.body);
  if (!parsed.success) { parseError(res, parsed.error); return; }
  const item = await BlogPostModel.create({ ...parsed.data, publishedAt: parsed.data.status === 'published' ? new Date() : undefined });
  res.status(201).json(item);
});

adminRouter.put('/blog/:slug', async (req: Request, res: Response) => {
  if (!dbGuard(res)) return;
  const parsed = blogSchema.partial().safeParse(req.body);
  if (!parsed.success) { parseError(res, parsed.error); return; }
  const item = await BlogPostModel.findOneAndUpdate({ slug: req.params.slug }, parsed.data, { new: true });
  if (!item) { res.status(404).json({ error: 'Blog post not found' }); return; }
  res.json(item);
});

adminRouter.delete('/blog/:slug', async (req: Request, res: Response) => {
  if (!dbGuard(res)) return;
  const item = await BlogPostModel.findOneAndDelete({ slug: req.params.slug });
  if (!item) { res.status(404).json({ error: 'Blog post not found' }); return; }
  res.json({ deleted: true });
});

// ---------- Homepage sections ----------
adminRouter.get('/sections', async (_req: Request, res: Response) => {
  if (!dbGuard(res)) return;
  res.json(await HomepageSectionModel.find({}).sort({ order: 1 }).lean());
});

adminRouter.post('/sections', async (req: Request, res: Response) => {
  if (!dbGuard(res)) return;
  const parsed = sectionSchema.safeParse(req.body);
  if (!parsed.success) { parseError(res, parsed.error); return; }
  const item = await HomepageSectionModel.create(parsed.data);
  res.status(201).json(item);
});

adminRouter.put('/sections/:id', async (req: Request, res: Response) => {
  if (!dbGuard(res)) return;
  const parsed = sectionSchema.partial().safeParse(req.body);
  if (!parsed.success) { parseError(res, parsed.error); return; }
  const item = await HomepageSectionModel.findByIdAndUpdate(req.params.id, parsed.data, { new: true });
  if (!item) { res.status(404).json({ error: 'Section not found' }); return; }
  res.json(item);
});

// Reorder: body { ids: string[] } — sets order = position in the array.
adminRouter.post('/sections/reorder', async (req: Request, res: Response) => {
  if (!dbGuard(res)) return;
  const parsed = z.object({ ids: z.array(z.string()) }).safeParse(req.body);
  if (!parsed.success) { parseError(res, parsed.error); return; }
  await Promise.all(parsed.data.ids.map((id, i) => HomepageSectionModel.findByIdAndUpdate(id, { order: i + 1 })));
  res.json(await HomepageSectionModel.find({}).sort({ order: 1 }).lean());
});

adminRouter.delete('/sections/:id', async (req: Request, res: Response) => {
  if (!dbGuard(res)) return;
  const item = await HomepageSectionModel.findByIdAndDelete(req.params.id);
  if (!item) { res.status(404).json({ error: 'Section not found' }); return; }
  res.json({ deleted: true });
});

// ---------- Users (read-only) ----------
adminRouter.get('/users', async (_req: Request, res: Response) => {
  if (!dbGuard(res)) return;
  res.json(await UserModel.find({}).select('-passwordHash').sort({ createdAt: -1 }).lean());
});
