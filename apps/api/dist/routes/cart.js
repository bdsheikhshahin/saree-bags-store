"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverCartRouter = void 0;
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const db_1 = require("../config/db");
const env_1 = require("../config/env");
const Cart_1 = require("../models/Cart");
const Product_1 = require("../models/Product");
const auth_1 = require("../middleware/auth");
// Server-side cart — mounts at /api/cart (replaces the Phase 1 stub that lived
// in routes/orders.ts; that stub export is kept only so index.ts still compiles
// until the mount is swapped — see the mount lines in the handoff).
// GET is optional-auth (a logged-in user gets their DB cart); sync/merge/clear
// require a JWT. Guests keep using localStorage on the web side.
exports.serverCartRouter = (0, express_1.Router)();
const itemsSchema = zod_1.z.object({
    items: zod_1.z.array(zod_1.z.object({
        productSlug: zod_1.z.string(), name: zod_1.z.string().optional(), price: zod_1.z.number().nonnegative().optional(),
        quantity: zod_1.z.number().int().positive(), variant: zod_1.z.string().optional(), image: zod_1.z.string().optional(),
    })).default([]),
});
/** Attach req.user when a valid Bearer token is present; never rejects. */
function optionalAuth(req, _res, next) {
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (token) {
        try {
            req.user = jsonwebtoken_1.default.verify(token, env_1.env.jwtSecret);
        }
        catch {
            // Invalid token on a public read: treat as guest, do not fail.
        }
    }
    next();
}
function dbGuard(res) {
    if (!(0, db_1.isDbConnected)()) {
        res.status(503).json({ error: 'Database not available — start MongoDB for server cart' });
        return false;
    }
    return true;
}
/** Re-price/re-name items from the catalogue when possible; drop unknown slugs. */
async function enrichItems(items) {
    const slugs = [...new Set(items.map((i) => i.productSlug))];
    const products = await Product_1.ProductModel.find({ slug: { $in: slugs }, isPublished: true }).lean();
    const bySlug = new Map(products.map((p) => [p.slug, p]));
    const out = [];
    for (const item of items) {
        const product = bySlug.get(item.productSlug);
        if (!product)
            continue;
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
function mergeItems(existing, incoming) {
    const merged = [...existing];
    for (const item of incoming) {
        const found = merged.find((i) => i.productSlug === item.productSlug && i.variant === item.variant);
        if (found)
            found.quantity += item.quantity;
        else
            merged.push({ ...item });
    }
    return merged;
}
exports.serverCartRouter.get('/', optionalAuth, async (req, res) => {
    if (!dbGuard(res))
        return;
    if (req.user) {
        const cart = await Cart_1.CartModel.findOne({ userId: req.user.id }).lean();
        res.json({ items: cart?.items ?? [], source: 'server' });
        return;
    }
    const sessionId = typeof req.query.sessionId === 'string' ? req.query.sessionId : undefined;
    if (sessionId) {
        const cart = await Cart_1.CartModel.findOne({ sessionId }).lean();
        res.json({ items: cart?.items ?? [], source: 'server' });
        return;
    }
    // Guest with no session: the web app keeps the cart in localStorage.
    res.json({ items: [], source: 'local', note: 'Guest cart lives in localStorage; log in to sync it to the server.' });
});
exports.serverCartRouter.post('/sync', auth_1.requireAuth, async (req, res) => {
    if (!dbGuard(res))
        return;
    const parsed = itemsSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }
    const items = await enrichItems(parsed.data.items);
    const cart = await Cart_1.CartModel.findOneAndUpdate({ userId: req.user?.id }, { $set: { items, userId: req.user?.id } }, { new: true, upsert: true });
    res.json({ items: cart.items, source: 'server' });
});
exports.serverCartRouter.post('/merge', auth_1.requireAuth, async (req, res) => {
    if (!dbGuard(res))
        return;
    const parsed = itemsSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }
    const incoming = await enrichItems(parsed.data.items);
    const existing = await Cart_1.CartModel.findOne({ userId: req.user?.id });
    const merged = mergeItems(existing?.items ?? [], incoming);
    const cart = await Cart_1.CartModel.findOneAndUpdate({ userId: req.user?.id }, { $set: { items: merged, userId: req.user?.id } }, { new: true, upsert: true });
    res.json({ items: cart.items, source: 'server' });
});
exports.serverCartRouter.delete('/', auth_1.requireAuth, async (req, res) => {
    if (!dbGuard(res))
        return;
    await Cart_1.CartModel.deleteOne({ userId: req.user?.id });
    res.json({ items: [], source: 'server' });
});
//# sourceMappingURL=cart.js.map