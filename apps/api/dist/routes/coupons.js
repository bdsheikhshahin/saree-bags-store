"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminCouponsRouter = exports.couponsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../config/db");
const auth_1 = require("../middleware/auth");
const Coupon_1 = require("../models/Coupon");
const coupons_1 = require("../services/coupons");
// Public coupon validation + admin CRUD.
// Public router mounts at /api/coupons; admin router mounts at /api/admin/coupons.
exports.couponsRouter = (0, express_1.Router)();
exports.adminCouponsRouter = (0, express_1.Router)();
exports.adminCouponsRouter.use(auth_1.requireAuth, auth_1.requireAdmin);
const validateSchema = zod_1.z.object({
    code: zod_1.z.string().min(1),
    subtotal: zod_1.z.number().nonnegative(),
});
const couponSchema = zod_1.z.object({
    code: zod_1.z.string().min(2),
    type: zod_1.z.enum(['percent', 'fixed']),
    value: zod_1.z.number().positive(),
    minOrder: zod_1.z.number().nonnegative().default(0),
    expiresAt: zod_1.z.string().datetime({ offset: true }).optional().nullable(),
    usageLimit: zod_1.z.number().int().positive().optional().nullable(),
    active: zod_1.z.boolean().default(true),
});
const couponPatchSchema = couponSchema.partial().omit({ code: true }).extend({
    code: zod_1.z.string().min(2).optional(),
});
function dbGuard(res) {
    if (!(0, db_1.isDbConnected)()) {
        res.status(503).json({ error: 'Database not available — start MongoDB for coupons' });
        return false;
    }
    return true;
}
// ---------- Public: validate a code against a subtotal ----------
exports.couponsRouter.post('/validate', async (req, res) => {
    const parsed = validateSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ valid: false, discount: 0, message: 'Provide a coupon code and subtotal.' });
        return;
    }
    if (!dbGuard(res))
        return;
    res.json(await (0, coupons_1.validateCouponCode)(parsed.data.code, parsed.data.subtotal));
});
// ---------- Admin CRUD ----------
exports.adminCouponsRouter.get('/', async (_req, res) => {
    if (!dbGuard(res))
        return;
    res.json(await Coupon_1.CouponModel.find({}).sort({ createdAt: -1 }).lean());
});
exports.adminCouponsRouter.post('/', async (req, res) => {
    if (!dbGuard(res))
        return;
    const parsed = couponSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }
    try {
        const coupon = await Coupon_1.CouponModel.create({
            ...parsed.data,
            code: parsed.data.code.toUpperCase(),
            expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
            usageLimit: parsed.data.usageLimit ?? undefined,
        });
        res.status(201).json(coupon);
    }
    catch (err) {
        if (err.code === 11000) {
            res.status(409).json({ error: 'A coupon with this code already exists' });
            return;
        }
        throw err;
    }
});
exports.adminCouponsRouter.put('/:id', async (req, res) => {
    if (!dbGuard(res))
        return;
    const parsed = couponPatchSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }
    const patch = { ...parsed.data };
    if (typeof patch.code === 'string')
        patch.code = patch.code.toUpperCase();
    if ('expiresAt' in patch)
        patch.expiresAt = patch.expiresAt ? new Date(patch.expiresAt) : undefined;
    const coupon = await Coupon_1.CouponModel.findByIdAndUpdate(req.params.id, { $set: patch }, { new: true });
    if (!coupon) {
        res.status(404).json({ error: 'Coupon not found' });
        return;
    }
    res.json(coupon);
});
exports.adminCouponsRouter.delete('/:id', async (req, res) => {
    if (!dbGuard(res))
        return;
    const coupon = await Coupon_1.CouponModel.findByIdAndDelete(req.params.id);
    if (!coupon) {
        res.status(404).json({ error: 'Coupon not found' });
        return;
    }
    res.json({ deleted: true, code: coupon.code });
});
//# sourceMappingURL=coupons.js.map