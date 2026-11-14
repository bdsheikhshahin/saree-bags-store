"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const db_1 = require("./config/db");
const env_1 = require("./config/env");
const asyncHandler_1 = require("./middleware/asyncHandler");
const errorHandler_1 = require("./middleware/errorHandler");
const admin_1 = require("./routes/admin");
const auth_1 = require("./routes/auth");
const blog_1 = require("./routes/blog");
const cart_1 = require("./routes/cart");
const categories_1 = require("./routes/categories");
const coupons_1 = require("./routes/coupons");
const orders_1 = require("./routes/orders");
const payments_1 = require("./routes/payments");
const products_1 = require("./routes/products");
const reviews_1 = require("./routes/reviews");
const sections_1 = require("./routes/sections");
const upload_1 = require("./routes/upload");
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: env_1.env.corsOrigin }));
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev'));
app.get('/health', (_req, res) => res.json({ ok: true, service: 'ecommerce-api' }));
// wrapAsyncRoutes: forward async rejections to the error middleware instead
// of crashing the process (see middleware/asyncHandler.ts).
app.use('/api/products', (0, asyncHandler_1.wrapAsyncRoutes)(reviews_1.reviewsRouter));
app.use('/api/products', (0, asyncHandler_1.wrapAsyncRoutes)(products_1.productsRouter));
app.use('/api/sections', (0, asyncHandler_1.wrapAsyncRoutes)(sections_1.sectionsRouter));
app.use('/api/categories', (0, asyncHandler_1.wrapAsyncRoutes)(categories_1.categoriesRouter));
app.use('/api/blog', (0, asyncHandler_1.wrapAsyncRoutes)(blog_1.blogRouter));
app.use('/api/auth', (0, asyncHandler_1.wrapAsyncRoutes)(auth_1.authRouter));
app.use('/api/cart', (0, asyncHandler_1.wrapAsyncRoutes)(cart_1.serverCartRouter));
app.use('/api/orders', (0, asyncHandler_1.wrapAsyncRoutes)(orders_1.ordersRouter));
app.use('/api/coupons', (0, asyncHandler_1.wrapAsyncRoutes)(coupons_1.couponsRouter));
app.use('/api/admin/coupons', (0, asyncHandler_1.wrapAsyncRoutes)(coupons_1.adminCouponsRouter));
app.use('/api/admin/reviews', (0, asyncHandler_1.wrapAsyncRoutes)(reviews_1.adminReviewsRouter));
app.use('/api/admin/upload', (0, asyncHandler_1.wrapAsyncRoutes)(upload_1.uploadRouter));
app.use('/api/payments', (0, asyncHandler_1.wrapAsyncRoutes)(payments_1.paymentsRouter));
app.use('/api/admin', (0, asyncHandler_1.wrapAsyncRoutes)(admin_1.adminRouter));
app.use(errorHandler_1.notFound);
app.use(errorHandler_1.errorHandler);
async function main() {
    await (0, db_1.connectDb)();
    app.listen(env_1.env.port, () => console.log(`API listening on http://localhost:${env_1.env.port}`));
}
void main();
//# sourceMappingURL=index.js.map