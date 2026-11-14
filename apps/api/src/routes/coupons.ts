import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { isDbConnected } from '../config/db';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { CouponModel } from '../models/Coupon';
import { validateCouponCode } from '../services/coupons';

// Public coupon validation + admin CRUD.
// Public router mounts at /api/coupons; admin router mounts at /api/admin/coupons.
export const couponsRouter = Router();
export const adminCouponsRouter = Router();
adminCouponsRouter.use(requireAuth, requireAdmin);

const validateSchema = z.object({
  code: z.string().min(1),
  subtotal: z.number().nonnegative(),
});

const couponSchema = z.object({
  code: z.string().min(2),
  type: z.enum(['percent', 'fixed']),
  value: z.number().positive(),
  minOrder: z.number().nonnegative().default(0),
  expiresAt: z.string().datetime({ offset: true }).optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  active: z.boolean().default(true),
});

const couponPatchSchema = couponSchema.partial().omit({ code: true }).extend({
  code: z.string().min(2).optional(),
});

function dbGuard(res: Response): boolean {
  if (!isDbConnected()) { res.status(503).json({ error: 'Database not available — start MongoDB for coupons' }); return false; }
  return true;
}

// ---------- Public: validate a code against a subtotal ----------
couponsRouter.post('/validate', async (req: Request, res: Response) => {
  const parsed = validateSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ valid: false, discount: 0, message: 'Provide a coupon code and subtotal.' }); return; }
  if (!dbGuard(res)) return;
  res.json(await validateCouponCode(parsed.data.code, parsed.data.subtotal));
});

// ---------- Admin CRUD ----------
adminCouponsRouter.get('/', async (_req: Request, res: Response) => {
  if (!dbGuard(res)) return;
  res.json(await CouponModel.find({}).sort({ createdAt: -1 }).lean());
});

adminCouponsRouter.post('/', async (req: Request, res: Response) => {
  if (!dbGuard(res)) return;
  const parsed = couponSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  try {
    const coupon = await CouponModel.create({
      ...parsed.data,
      code: parsed.data.code.toUpperCase(),
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
      usageLimit: parsed.data.usageLimit ?? undefined,
    });
    res.status(201).json(coupon);
  } catch (err) {
    if ((err as { code?: number }).code === 11000) { res.status(409).json({ error: 'A coupon with this code already exists' }); return; }
    throw err;
  }
});

adminCouponsRouter.put('/:id', async (req: Request, res: Response) => {
  if (!dbGuard(res)) return;
  const parsed = couponPatchSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const patch: Record<string, unknown> = { ...parsed.data };
  if (typeof patch.code === 'string') patch.code = (patch.code as string).toUpperCase();
  if ('expiresAt' in patch) patch.expiresAt = patch.expiresAt ? new Date(patch.expiresAt as string) : undefined;
  const coupon = await CouponModel.findByIdAndUpdate(req.params.id, { $set: patch }, { new: true });
  if (!coupon) { res.status(404).json({ error: 'Coupon not found' }); return; }
  res.json(coupon);
});

adminCouponsRouter.delete('/:id', async (req: Request, res: Response) => {
  if (!dbGuard(res)) return;
  const coupon = await CouponModel.findByIdAndDelete(req.params.id);
  if (!coupon) { res.status(404).json({ error: 'Coupon not found' }); return; }
  res.json({ deleted: true, code: coupon.code });
});
