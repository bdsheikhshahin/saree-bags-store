"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const env_1 = require("../config/env");
const db_1 = require("../config/db");
const auth_1 = require("../middleware/auth");
const User_1 = require("../models/User");
// Phase 1: register/login stubs that work against MongoDB when connected.
// Without a DB they return a clear 503 instead of silently succeeding.
exports.authRouter = (0, express_1.Router)();
const authSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
exports.authRouter.post('/register', async (req, res) => {
    const parsed = authSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }
    if (!(0, db_1.isDbConnected)()) {
        res.status(503).json({ error: 'Database not available — start MongoDB to register users' });
        return;
    }
    const { name, email, password } = parsed.data;
    const existing = await User_1.UserModel.findOne({ email });
    if (existing) {
        res.status(409).json({ error: 'Email already registered' });
        return;
    }
    const passwordHash = await bcryptjs_1.default.hash(password, 10);
    const user = await User_1.UserModel.create({ name: name ?? email.split('@')[0], email, passwordHash, role: 'customer' });
    const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, env_1.env.jwtSecret, { expiresIn: env_1.env.jwtExpiresIn });
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});
exports.authRouter.post('/login', async (req, res) => {
    const parsed = authSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }
    if (!(0, db_1.isDbConnected)()) {
        res.status(503).json({ error: 'Database not available — start MongoDB to log in' });
        return;
    }
    const { email, password } = parsed.data;
    const user = await User_1.UserModel.findOne({ email });
    if (!user || !(await bcryptjs_1.default.compare(password, user.passwordHash))) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
    }
    const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, env_1.env.jwtSecret, { expiresIn: env_1.env.jwtExpiresIn });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});
const changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1),
    newPassword: zod_1.z.string().min(8, 'New password must be at least 8 characters'),
});
// Any logged-in user changes their OWN password (id comes from their JWT).
exports.authRouter.post('/change-password', auth_1.requireAuth, async (req, res) => {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }
    if (!(0, db_1.isDbConnected)()) {
        res.status(503).json({ error: 'Database not available — start MongoDB to change password' });
        return;
    }
    const user = await User_1.UserModel.findById(req.user?.id);
    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    const { currentPassword, newPassword } = parsed.data;
    if (!(await bcryptjs_1.default.compare(currentPassword, user.passwordHash))) {
        // 400, not 401: the admin client treats 401 as "session expired" and logs out.
        res.status(400).json({ error: 'Current password is incorrect' });
        return;
    }
    user.passwordHash = await bcryptjs_1.default.hash(newPassword, 10);
    await user.save();
    res.json({ ok: true });
});
//# sourceMappingURL=auth.js.map