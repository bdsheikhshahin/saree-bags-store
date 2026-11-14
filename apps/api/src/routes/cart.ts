import { Router, type NextFunction, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { isDbConnected } from '../config/db';
import { env } from '../config/env';
import { CartModel } from '../models/Cart';
import { ProductModel } from '../models/Product';
import { requireAuth, type AuthRequest } from '../middleware/auth';
import type { CartItem } from '@ecommerce/shared';

// Server-side cart — mounts at /api/cart (replaces the Phase 1 stub that lived
// in routes/orders.ts; that stub export is kept only so index.ts still compiles
// until the mount is swapped — see the mount lines in the handoff).
// GET is optional-auth (a logged-in user gets their DB cart); sync/merge/clear
// require a JWT. Guests keep using localStorage on the web side.
export const serverCartRouter = Router();

const itemsSchema = z.object({
  items: z.array(z.object({
    productSlug: z.string(), name: z.string().optional(), price: z.number().nonnegative().optional(),
    quantity: z.number().int().positive(), variant: z.string().optional(), image: z.string().optional(),
  })).default([]),
});

/** Attach req.user when a valid Bearer token is present; never rejects. */
function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (token) {
    try {
      req.user = jwt.verify(token, env.jwtSecret) as AuthRequest['user'];
    } catch {
      // Invalid token on a public read: treat as guest, do not fail.
    }
  }
  next();
}

function dbGuard(res: Response): boolean {
  if (!isDbConnected()) { res.status(503).json({ error: 'Database not available — start MongoDB for server cart' }); return false; }
  return true;
}

/** Re-price/re-name items from the catalogue when possible; drop unknown slugs. */
async function enrichItems(items: Array<{ productSlug: string; name?: string; price?: number; quantity: number; variant?: string; image?: string }>): Promise<CartItem[]> {
  const slugs = [...new Set(items.map((i) => i.productSlug))];
  const products = await ProductModel.find({ slug: { $in: slugs }, isPublished: true }).lean();
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const out: CartItem[] = [];
  for (const item of items) {
    const product = bySlug.get(item.productSlug);
    if (!product) continue;
    out.push({
      productSlug: item.productSlug,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      variant: item.variant,
      image: product.images?.[0] ?? item.image,
    });
  }
  return out;
}

function mergeItems(existing: CartItem[], incoming: CartItem[]): CartItem[] {
  const merged = [...existing];
  for (const item of incoming) {
    const found = merged.find((i) => i.productSlug === item.productSlug && i.variant === item.variant);
    if (found) found.quantity += item.quantity;
    else merged.push({ ...item });
  }
  return merged;
}

serverCartRouter.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  if (!dbGuard(res)) return;
  if (req.user) {
    const cart = await CartModel.findOne({ userId: req.user.id }).lean();
    res.json({ items: cart?.items ?? [], source: 'server' });
    return;
  }
  const sessionId = typeof req.query.sessionId === 'string' ? req.query.sessionId : undefined;
  if (sessionId) {
    const cart = await CartModel.findOne({ sessionId }).lean();
    res.json({ items: cart?.items ?? [], source: 'server' });
    return;
  }
  // Guest with no session: the web app keeps the cart in localStorage.
  res.json({ items: [], source: 'local', note: 'Guest cart lives in localStorage; log in to sync it to the server.' });
});

serverCartRouter.post('/sync', requireAuth, async (req: AuthRequest, res: Response) => {
  if (!dbGuard(res)) return;
  const parsed = itemsSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const items = await enrichItems(parsed.data.items);
  const cart = await CartModel.findOneAndUpdate(
    { userId: req.user?.id },
    { $set: { items, userId: req.user?.id } },
    { new: true, upsert: true },
  );
  res.json({ items: cart.items, source: 'server' });
});

serverCartRouter.post('/merge', requireAuth, async (req: AuthRequest, res: Response) => {
  if (!dbGuard(res)) return;
  const parsed = itemsSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const incoming = await enrichItems(parsed.data.items);
  const existing = await CartModel.findOne({ userId: req.user?.id });
  const merged = mergeItems(existing?.items ?? [], incoming);
  const cart = await CartModel.findOneAndUpdate(
    { userId: req.user?.id },
    { $set: { items: merged, userId: req.user?.id } },
    { new: true, upsert: true },
  );
  res.json({ items: cart.items, source: 'server' });
});

serverCartRouter.delete('/', requireAuth, async (req: AuthRequest, res: Response) => {
  if (!dbGuard(res)) return;
  await CartModel.deleteOne({ userId: req.user?.id });
  res.json({ items: [], source: 'server' });
});
