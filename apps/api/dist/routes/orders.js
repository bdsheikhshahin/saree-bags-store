"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = exports.ordersRouter = exports.cartRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const Coupon_1 = require("../models/Coupon");
const Order_1 = require("../models/Order");
const db_1 = require("../config/db");
const coupons_1 = require("../services/coupons");
const auth_1 = require("../middleware/auth");
Object.defineProperty(exports, "requireAuth", { enumerable: true, get: function () { return auth_1.requireAuth; } });
// Cart + orders: validates input and creates an order record when MongoDB is
// connected. Gateway payment is NOT started here — the checkout calls
// POST /api/payments/:provider/init after the order exists, which redirects
// the shopper to the gateway. COD orders are complete at creation.
// Coupon codes are validated server-side; the discount is stored on the order
// and the coupon usageCount is incremented only for persisted orders.
exports.cartRouter = (0, express_1.Router)();
exports.ordersRouter = (0, express_1.Router)();
const orderSchema = zod_1.z.object({
    items: zod_1.z.array(zod_1.z.object({
        productSlug: zod_1.z.string(), name: zod_1.z.string(), price: zod_1.z.number().nonnegative(),
        quantity: zod_1.z.number().int().positive(), variant: zod_1.z.string().optional(), image: zod_1.z.string().optional(),
    })).min(1),
    paymentMethod: zod_1.z.enum(['sslcommerz', 'bkash', 'nagad', 'cod']),
    couponCode: zod_1.z.string().optional(),
    customer: zod_1.z.object({ name: zod_1.z.string().min(2), phone: zod_1.z.string().min(8), email: zod_1.z.string().email().optional(), address: zod_1.z.string().min(5) }),
});
exports.cartRouter.get('/', (_req, res) => {
    // Deprecated stub — the real server cart lives in routes/cart.ts
    // (serverCartRouter, mounted at /api/cart). Kept so existing imports
    // compile until the mount is swapped; it must not be mounted anymore.
    res.json({ items: [], note: 'Client-side cart in Phase 1; server cart in routes/cart.ts.' });
});
exports.ordersRouter.post('/', async (req, res) => {
    const parsed = orderSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }
    const { items, paymentMethod, customer } = parsed.data;
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    // Server-side coupon validation — never trust a discount from the client.
    let couponCode;
    let discountAmount = 0;
    if (parsed.data.couponCode?.trim() && (0, db_1.isDbConnected)()) {
        const check = await (0, coupons_1.validateCouponCode)(parsed.data.couponCode, subtotal);
        if (!check.valid) {
            res.status(400).json({ error: `Coupon invalid: ${check.message}` });
            return;
        }
        couponCode = check.code;
        discountAmount = check.discount;
    }
    const discountedSubtotal = subtotal - discountAmount;
    const deliveryFee = discountedSubtotal >= 2000 ? 0 : 60;
    const total = discountedSubtotal + deliveryFee;
    const orderId = `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const paymentNote = paymentMethod === 'cod'
        ? `Cash on Delivery — no online payment. Collect ৳${total} on delivery for order ${orderId}.`
        : `Pay ৳${total} via ${paymentMethod} — the checkout redirects to the gateway (POST /api/payments/${paymentMethod}/init).`;
    if ((0, db_1.isDbConnected)()) {
        const order = await Order_1.OrderModel.create({
            orderId, items, subtotal, deliveryFee, total, currency: 'BDT',
            paymentMethod, paymentStatus: 'pending',
            status: 'pending', customer, couponCode, discountAmount,
        });
        if (couponCode) {
            await Coupon_1.CouponModel.updateOne({ code: couponCode }, { $inc: { usageCount: 1 } });
        }
        res.status(201).json({
            orderId: order.orderId, subtotal, discountAmount, couponCode: couponCode ?? null,
            deliveryFee, total, currency: 'BDT',
            payment: { provider: paymentMethod, configured: paymentMethod === 'cod', note: paymentNote },
        });
        return;
    }
    // No DB: still return a server-confirmed order shape so the checkout
    // success page can fire the `purchase` dataLayer event exactly once.
    res.status(201).json({
        orderId, subtotal, discountAmount, couponCode: couponCode ?? null,
        deliveryFee, total, currency: 'BDT',
        payment: { provider: paymentMethod, configured: paymentMethod === 'cod', note: paymentNote },
        note: 'Order not persisted — MongoDB not connected.',
    });
});
exports.ordersRouter.get('/:orderId', async (req, res) => {
    if (!(0, db_1.isDbConnected)()) {
        res.status(503).json({ error: 'Database not available' });
        return;
    }
    const order = await Order_1.OrderModel.findOne({ orderId: req.params.orderId }).lean();
    if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
    }
    res.json(order);
});
//# sourceMappingURL=orders.js.map