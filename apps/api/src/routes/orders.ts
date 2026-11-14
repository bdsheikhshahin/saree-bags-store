import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { CouponModel } from '../models/Coupon';
import { OrderModel } from '../models/Order';
import { isDbConnected } from '../config/db';
import { validateCouponCode } from '../services/coupons';
import { requireAuth, type AuthRequest } from '../middleware/auth';

// Cart + orders: validates input and creates an order record when MongoDB is
// connected. Gateway payment is NOT started here — the checkout calls
// POST /api/payments/:provider/init after the order exists, which redirects
// the shopper to the gateway. COD orders are complete at creation.
// Coupon codes are validated server-side; the discount is stored on the order
// and the coupon usageCount is incremented only for persisted orders.
export const cartRouter = Router();
export const ordersRouter = Router();

const orderSchema = z.object({
  items: z.array(z.object({
    productSlug: z.string(), name: z.string(), price: z.number().nonnegative(),
    quantity: z.number().int().positive(), variant: z.string().optional(), image: z.string().optional(),
  })).min(1),
  paymentMethod: z.enum(['sslcommerz', 'bkash', 'nagad', 'cod']),
  couponCode: z.string().optional(),
  customer: z.object({ name: z.string().min(2), phone: z.string().min(8), email: z.string().email().optional(), address: z.string().min(5) }),
});

cartRouter.get('/', (_req: Request, res: Response) => {
  // Deprecated stub — the real server cart lives in routes/cart.ts
  // (serverCartRouter, mounted at /api/cart). Kept so existing imports
  // compile until the mount is swapped; it must not be mounted anymore.
  res.json({ items: [], note: 'Client-side cart in Phase 1; server cart in routes/cart.ts.' });
});

ordersRouter.post('/', async (req: Request, res: Response) => {
  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const { items, paymentMethod, customer } = parsed.data;
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // Server-side coupon validation — never trust a discount from the client.
  let couponCode: string | undefined;
  let discountAmount = 0;
  if (parsed.data.couponCode?.trim() && isDbConnected()) {
    const check = await validateCouponCode(parsed.data.couponCode, subtotal);
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
  const paymentNote =
    paymentMethod === 'cod'
      ? `Cash on Delivery — no online payment. Collect ৳${total} on delivery for order ${orderId}.`
      : `Pay ৳${total} via ${paymentMethod} — the checkout redirects to the gateway (POST /api/payments/${paymentMethod}/init).`;
  if (isDbConnected()) {
    const order = await OrderModel.create({
      orderId, items, subtotal, deliveryFee, total, currency: 'BDT',
      paymentMethod, paymentStatus: 'pending',
      status: 'pending', customer, couponCode, discountAmount,
    });
    if (couponCode) {
      await CouponModel.updateOne({ code: couponCode }, { $inc: { usageCount: 1 } });
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

ordersRouter.get('/:orderId', async (req: AuthRequest, res: Response) => {
  if (!isDbConnected()) { res.status(503).json({ error: 'Database not available' }); return; }
  const order = await OrderModel.findOne({ orderId: req.params.orderId }).lean();
  if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
  res.json(order);
});

export { requireAuth };
