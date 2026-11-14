"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireAdmin = requireAdmin;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
function requireAuth(req, res, next) {
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (!token) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.jwtSecret);
        req.user = payload;
        next();
    }
    catch {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}
function requireAdmin(req, res, next) {
    if (req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Admin access required' });
        return;
    }
    next();
}
//# sourceMappingURL=auth.js.map