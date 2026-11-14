import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDb } from './config/db';
import { env } from './config/env';
import { wrapAsyncRoutes } from './middleware/asyncHandler';
import { errorHandler, notFound } from './middleware/errorHandler';
import { adminRouter } from './routes/admin';
import { authRouter } from './routes/auth';
import { blogRouter } from './routes/blog';
import { serverCartRouter } from './routes/cart';
import { categoriesRouter } from './routes/categories';
import { adminCouponsRouter, couponsRouter } from './routes/coupons';
import { ordersRouter } from './routes/orders';
import { paymentsRouter } from './routes/payments';
import { productsRouter } from './routes/products';
import { adminReviewsRouter, reviewsRouter } from './routes/reviews';
import { sectionsRouter } from './routes/sections';
import { uploadRouter } from './routes/upload';

const app = express();
app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => res.json({ ok: true, service: 'ecommerce-api' }));
// wrapAsyncRoutes: forward async rejections to the error middleware instead
// of crashing the process (see middleware/asyncHandler.ts).
app.use('/api/products', wrapAsyncRoutes(reviewsRouter));
app.use('/api/products', wrapAsyncRoutes(productsRouter));
app.use('/api/sections', wrapAsyncRoutes(sectionsRouter));
app.use('/api/categories', wrapAsyncRoutes(categoriesRouter));
app.use('/api/blog', wrapAsyncRoutes(blogRouter));
app.use('/api/auth', wrapAsyncRoutes(authRouter));
app.use('/api/cart', wrapAsyncRoutes(serverCartRouter));
app.use('/api/orders', wrapAsyncRoutes(ordersRouter));
app.use('/api/coupons', wrapAsyncRoutes(couponsRouter));
app.use('/api/admin/coupons', wrapAsyncRoutes(adminCouponsRouter));
app.use('/api/admin/reviews', wrapAsyncRoutes(adminReviewsRouter));
app.use('/api/admin/upload', wrapAsyncRoutes(uploadRouter));
app.use('/api/payments', wrapAsyncRoutes(paymentsRouter));
app.use('/api/admin', wrapAsyncRoutes(adminRouter));

app.use(notFound);
app.use(errorHandler);

async function main(): Promise<void> {
  await connectDb();
  app.listen(env.port, () => console.log(`API listening on http://localhost:${env.port}`));
}

void main();
