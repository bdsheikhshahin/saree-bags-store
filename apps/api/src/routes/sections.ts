import type { HomepageSection, Product } from '@ecommerce/shared';
import { Router, type Request, type Response } from 'express';
import { isDbConnected } from '../config/db';
import { seedProducts } from '../data/seed';
import { HomepageSectionModel } from '../models/HomepageSection';
import { ProductModel } from '../models/Product';
import { fallbackSections, withProducts } from '../services/sections';

// Public homepage sections — enabled ones, in order, with resolved products.
export const sectionsRouter = Router();

sectionsRouter.get('/', async (_req: Request, res: Response) => {
  if (isDbConnected()) {
    const [sections, products] = await Promise.all([
      HomepageSectionModel.find({}).sort({ order: 1 }).lean(),
      ProductModel.find({ isPublished: true }).lean(),
    ]);
    // lean() docs carry ObjectId _id / Date createdAt; JSON handles them, the cast only satisfies the shared types.
    res.json(withProducts(sections as unknown as HomepageSection[], products as unknown as Product[]));
    return;
  }
  res.json(fallbackSections());
});
