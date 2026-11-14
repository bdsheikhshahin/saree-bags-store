"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../config/db");
const env_1 = require("../config/env");
const Order_1 = require("../models/Order");
const payments_1 = require("../services/payments");
// Payment gateway routes — mounts at /api/payments.
// Sandbox only: with no credentials configured, init returns
// { configured: false, message } and never calls a gateway.
// Callback verification failures mark the order payment_failed and log.
exports.paymentsRouter = (0, express_1.Router)();
const initSchema = zod_1.z.object({
    orderId: zod_1.z.string().min(1),
    items: zod_1.z.array(zod_1.z.object({
        productSlug: zod_1.z.string(), name: zod_1.z.string(), price: zod_1.z.number().nonnegative(),
        quantity: zod_1.z.number().int().positive(), variant: zod_1.z.string().optional(), image: zod_1.z.string().optional(),
    })).min(1).optional(),
    paymentMethod: zod_1.z.enum(['sslcommerz', 'bkash', 'nagad', 'cod']).optional(),
    customer: zod_1.z.object({ name: zod_1.z.string().min(2), phone: zod_1.z.string().min(8), email: zod_1.z.string().email().optional(), address: zod_1.z.string().min(5) }).optional(),
});
const PROVIDERS = ['sslcommerz', 'bkash', 'nagad', 'cod'];
function webUrl() {
    return env_1.env.webUrl.replace(/\/$/, '');
}
function failOrder(orderId, reason) {
    void Order_1.OrderModel.updateOne({ orderId }, { $set: { paymentStatus: 'failed' } }).exec().catch((err) => console.error(`[payments] failed to mark ${orderId} payment_failed:`, err));
    console.error(`[payments] payment verification failed for order ${orderId}: ${reason}`);
}
async function markPaid(orderId, transactionId, reference) {
    await Order_1.OrderModel.updateOne({ orderId }, { $set: { paymentStatus: 'paid', status: 'confirmed', ...(transactionId ? { paymentTransactionId: transactionId } : {}), ...(reference ? { paymentReference: reference } : {}) } });
}
function successRedirect(orderId, payment) {
    return `${webUrl()}/checkout/success?orderId=${encodeURIComponent(orderId)}&payment=${payment}`;
}
// ---------- Initiate a gateway payment for an existing (pending) order ----------
exports.paymentsRouter.post('/:provider/init', async (req, res) => {
    const provider = req.params.provider;
    if (!PROVIDERS.includes(provider)) {
        res.status(400).json({ error: `Unknown payment provider: ${provider}` });
        return;
    }
    const parsed = initSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }
    const { orderId, items, customer } = parsed.data;
    if (!(0, db_1.isDbConnected)()) {
        res.status(503).json({ error: 'Database not available — start MongoDB to pay' });
        return;
    }
    let order = await Order_1.OrderModel.findOne({ orderId });
    if (!order && (!items || !customer)) {
        res.status(404).json({ error: `Order ${orderId} not found — create the order at POST /api/orders first` });
        return;
    }
    // Never mutate an order for an unconfigured provider — report it and
    // leave the order exactly as it was (previously this rewrote a COD
    // order's paymentMethod to the probed provider).
    if (!(0, payments_1.isProviderConfigured)(provider)) {
        const total = order
            ? order.total
            : (items ?? []).reduce((sum, i) => sum + i.price * i.quantity, 0);
        res.json({
            configured: false,
            provider,
            orderId,
            total,
            message: `Sandbox credentials for ${provider} are not configured — set them in apps/api/.env to enable live gateway checkout. The order is saved as pending-payment; the customer can pay Cash on Delivery or retry once credentials are configured.`,
        });
        return;
    }
    if (!order) {
        // Create the pending-payment order from the supplied payload when the
        // checkout has not created one yet (e.g. direct gateway retry).
        const subtotal = (items ?? []).reduce((sum, i) => sum + i.price * i.quantity, 0);
        const deliveryFee = subtotal >= 2000 ? 0 : 60;
        order = await Order_1.OrderModel.create({
            orderId, items, subtotal, deliveryFee, total: subtotal + deliveryFee, currency: 'BDT',
            paymentMethod: provider, paymentStatus: 'pending', status: 'pending', customer,
        });
    }
    else {
        order.paymentMethod = provider;
        order.paymentStatus = 'pending';
        await order.save();
    }
    try {
        const result = await (0, payments_1.initiatePayment)(provider, order.orderId, order.total, {
            customer: order.customer,
        });
        if (!result.configured || !result.redirectUrl) {
            res.json({ configured: false, provider, orderId: order.orderId, total: order.total, message: result.note });
            return;
        }
        await Order_1.OrderModel.updateOne({ orderId: order.orderId }, { $set: { paymentReference: result.reference } });
        res.json({ configured: true, provider, orderId: order.orderId, total: order.total, redirectUrl: result.redirectUrl, reference: result.reference, note: result.note });
    }
    catch (err) {
        console.error(`[payments] ${provider} init failed for order ${order.orderId}:`, err);
        res.status(502).json({ configured: false, provider, orderId: order.orderId, total: order.total, message: `Gateway error: ${err instanceof Error ? err.message : 'init failed'}` });
    }
});
// ---------- Order payment status ----------
exports.paymentsRouter.get('/order/:orderId/status', async (req, res) => {
    if (!(0, db_1.isDbConnected)()) {
        res.status(503).json({ error: 'Database not available' });
        return;
    }
    const order = await Order_1.OrderModel.findOne({ orderId: req.params.orderId }).lean();
    if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
    }
    res.json({
        orderId: order.orderId,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        status: order.status,
        total: order.total,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        discountAmount: order.discountAmount ?? 0,
        couponCode: order.couponCode ?? null,
        paymentReference: order.paymentReference ?? null,
        paymentTransactionId: order.paymentTransactionId ?? null,
        customer: order.customer,
        items: order.items,
    });
});
// ---------- SSLCommerz callbacks ----------
// Gateway posts form-encoded fields: tran_id (= orderId), val_id, status, amount.
async function sslCommerzCallback(req, res, kind) {
    const tranId = String(req.body?.tran_id ?? req.query?.tran_id ?? '');
    const valId = String(req.body?.val_id ?? '');
    if (!tranId) {
        res.status(400).json({ error: 'Missing tran_id' });
        return;
    }
    if (kind === 'cancel') {
        failOrder(tranId, 'Shopper cancelled at the SSLCommerz gateway');
        res.redirect(successRedirect(tranId, 'cancelled'));
        return;
    }
    if (kind === 'fail') {
        failOrder(tranId, `Gateway reported failure (status=${String(req.body?.status ?? '')})`);
        res.redirect(successRedirect(tranId, 'failed'));
        return;
    }
    // success + ipn: verify val_id with the validation server before trusting it.
    try {
        if (!valId)
            throw new Error('Missing val_id in SSLCommerz callback');
        const check = await (0, payments_1.validateSslCommerz)(valId);
        if (!check.valid || check.tranId !== tranId) {
            failOrder(tranId, `Validation failed (status=${check.status}, val_id=${valId})`);
            if (kind === 'ipn') {
                res.json({ ok: false, error: 'validation failed' });
                return;
            }
            res.redirect(successRedirect(tranId, 'failed'));
            return;
        }
        const order = await Order_1.OrderModel.findOne({ orderId: tranId });
        if (order && check.amount != null && Math.abs(check.amount - order.total) > 0.01) {
            failOrder(tranId, `Amount mismatch: gateway ${check.amount} vs order ${order.total}`);
            if (kind === 'ipn') {
                res.json({ ok: false, error: 'amount mismatch' });
                return;
            }
            res.redirect(successRedirect(tranId, 'failed'));
            return;
        }
        await markPaid(tranId, check.tranId, valId);
        if (kind === 'ipn') {
            res.json({ ok: true });
            return;
        }
        res.redirect(successRedirect(tranId, 'paid'));
    }
    catch (err) {
        failOrder(tranId, err instanceof Error ? err.message : 'SSLCommerz verification error');
        if (kind === 'ipn') {
            res.status(502).json({ ok: false, error: 'verification failed' });
            return;
        }
        res.redirect(successRedirect(tranId, 'failed'));
    }
}
exports.paymentsRouter.post('/sslcommerz/success', (req, res) => void sslCommerzCallback(req, res, 'success'));
exports.paymentsRouter.post('/sslcommerz/fail', (req, res) => void sslCommerzCallback(req, res, 'fail'));
exports.paymentsRouter.post('/sslcommerz/cancel', (req, res) => void sslCommerzCallback(req, res, 'cancel'));
exports.paymentsRouter.post('/sslcommerz/ipn', (req, res) => void sslCommerzCallback(req, res, 'ipn'));
// ---------- bKash callback ----------
// bKash redirects to callbackURL with ?paymentID=...&status=success|cancel|failure.
exports.paymentsRouter.get('/bkash/callback', async (req, res) => {
    const paymentID = String(req.query.paymentID ?? '');
    const status = String(req.query.status ?? '');
    const orderId = String(req.query.merchantInvoiceNumber ?? '');
    if (!paymentID) {
        res.status(400).json({ error: 'Missing paymentID' });
        return;
    }
    if (status !== 'success') {
        if (orderId)
            failOrder(orderId, `bKash callback status=${status}`);
        res.redirect(successRedirect(orderId || paymentID, status === 'cancel' ? 'cancelled' : 'failed'));
        return;
    }
    try {
        const exec = await (0, payments_1.executeBkashPayment)(paymentID);
        // The order is found by the payment reference stored at init time.
        const order = await Order_1.OrderModel.findOne({ paymentReference: paymentID }) ?? (orderId ? await Order_1.OrderModel.findOne({ orderId }) : null);
        if (!exec.executed) {
            if (order)
                failOrder(order.orderId, `bKash execute: transactionStatus=${exec.transactionStatus ?? 'unknown'}`);
            res.redirect(successRedirect(order?.orderId ?? paymentID, 'failed'));
            return;
        }
        if (order && exec.amount != null && Math.abs(exec.amount - order.total) > 0.01) {
            failOrder(order.orderId, `Amount mismatch: bKash ${exec.amount} vs order ${order.total}`);
            res.redirect(successRedirect(order.orderId, 'failed'));
            return;
        }
        if (order)
            await markPaid(order.orderId, exec.trxID, paymentID);
        res.redirect(successRedirect(order?.orderId ?? paymentID, 'paid'));
    }
    catch (err) {
        if (orderId)
            failOrder(orderId, err instanceof Error ? err.message : 'bKash execute error');
        res.redirect(successRedirect(orderId || paymentID, 'failed'));
    }
});
// ---------- Nagad callback ----------
// Nagad redirects to merchantCallbackURL with paymentRefId (and orderId) in
// the query string; the payment is verified against Nagad before trusting it.
exports.paymentsRouter.get('/nagad/callback', async (req, res) => {
    const paymentRefId = String(req.query.paymentRefId ?? req.query.payment_ref_id ?? '');
    const orderId = String(req.query.orderId ?? req.query.order_id ?? '');
    if (!paymentRefId && !orderId) {
        res.status(400).json({ error: 'Missing paymentRefId' });
        return;
    }
    try {
        if (!paymentRefId)
            throw new Error('Missing paymentRefId in Nagad callback');
        const check = await (0, payments_1.verifyNagadPayment)(paymentRefId);
        const order = orderId ? await Order_1.OrderModel.findOne({ orderId }) : await Order_1.OrderModel.findOne({ paymentReference: paymentRefId });
        if (!check.verified) {
            if (order)
                failOrder(order.orderId, `Nagad verify: status=${check.status ?? 'unknown'}`);
            res.redirect(successRedirect(order?.orderId ?? orderId, 'failed'));
            return;
        }
        if (order && check.amount != null && Math.abs(check.amount - order.total) > 0.01) {
            failOrder(order.orderId, `Amount mismatch: Nagad ${check.amount} vs order ${order.total}`);
            res.redirect(successRedirect(order.orderId, 'failed'));
            return;
        }
        if (order)
            await markPaid(order.orderId, paymentRefId, paymentRefId);
        res.redirect(successRedirect(order?.orderId ?? orderId, 'paid'));
    }
    catch (err) {
        if (orderId)
            failOrder(orderId, err instanceof Error ? err.message : 'Nagad verify error');
        res.redirect(successRedirect(orderId, 'failed'));
    }
});
//# sourceMappingURL=payments.js.map