import { Router, type Request, type Response } from 'express';
import { isDbConnected } from '../config/db';
import { seedProducts } from '../data/seed';
import { ProductModel } from '../models/Product';

export const productsRouter = Router();

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Finite number from a query param, or undefined when absent/invalid. */
function numParam(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

type SortKey = 'relevance' | 'price-asc' | 'price-desc' | 'newest' | 'rating';

// DB sort orders. 'relevance' has no explicit order — it falls back to newest.
const DB_SORTS: Record<Exclude<SortKey, 'relevance'>, Record<string, 1 | -1>> = {
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  newest: { createdAt: -1 },
  rating: { rating: -1 },
};

function filterSeed(req: Request) {
  const { category, search } = req.query;
  let list = [...seedProducts];
  if (typeof category === 'string' && category) list = list.filter((p) => p.category === category);
  if (typeof search === 'string' && search) {
    const q = search.toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || (p.tags ?? []).some((t) => t.toLowerCase().includes(q)));
  }
  const minPrice = numParam(req.query.minPrice);
  const maxPrice = numParam(req.query.maxPrice);
  const minRating = numParam(req.query.minRating);
  if (minPrice !== undefined) list = list.filter((p) => p.price >= minPrice);
  if (maxPrice !== undefined) list = list.filter((p) => p.price <= maxPrice);
  if (minRating !== undefined) list = list.filter((p) => (p.rating ?? 0) >= minRating);
  switch (req.query.sort) {
    case 'price-asc': list.sort((a, b) => a.price - b.price); break;
    case 'price-desc': list.sort((a, b) => b.price - a.price); break;
    case 'newest': list.reverse(); break; // seed order is oldest-first
    case 'rating': list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)); break;
    default: break; // relevance: keep seed order
  }
  return list;
}

productsRouter.get('/', async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page ?? 1) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20) || 20));
  const minPrice = numParam(req.query.minPrice);
  const maxPrice = numParam(req.query.maxPrice);
  const minRating = numParam(req.query.minRating);
  const sortKey = typeof req.query.sort === 'string' ? req.query.sort : 'relevance';
  if (isDbConnected()) {
    const filter: Record<string, unknown> = { isPublished: true };
    if (typeof req.query.category === 'string' && req.query.category) filter.category = req.query.category;
    if (typeof req.query.search === 'string' && req.query.search) {
      // Case-insensitive regex match on name, description and tags (no text index needed).
      const rx = new RegExp(escapeRegExp(req.query.search), 'i');
      filter.$or = [{ name: rx }, { description: rx }, { tags: rx }];
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = { ...(minPrice !== undefined ? { $gte: minPrice } : {}), ...(maxPrice !== undefined ? { $lte: maxPrice } : {}) };
    }
    if (minRating !== undefined) filter.rating = { $gte: minRating };
    const sort = (DB_SORTS as Record<string, Record<string, 1 | -1>>)[sortKey] ?? { createdAt: -1 };
    const [items, total] = await Promise.all([
      ProductModel.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
      ProductModel.countDocuments(filter),
    ]);
    res.json({ items, page, total, totalPages: Math.ceil(total / limit) });
    return;
  }
  const list = filterSeed(req);
  res.json({ items: list.slice((page - 1) * limit, page * limit), page, total: list.length, totalPages: Math.ceil(list.length / limit) });
});

productsRouter.get('/:slug', async (req: Request, res: Response) => {
  if (isDbConnected()) {
    const item = await ProductModel.findOne({ slug: req.params.slug, isPublished: true }).lean();
    if (!item) { res.status(404).json({ error: 'Product not found' }); return; }
    res.json(item);
    return;
  }
  const item = seedProducts.find((p) => p.slug === req.params.slug);
  if (!item) { res.status(404).json({ error: 'Product not found' }); return; }
  res.json(item);
});
