import { Router, type Request, type Response } from 'express';
import { isDbConnected } from '../config/db';
import { seedCategories } from '../data/seed';
import { CategoryModel } from '../models/Category';

export const categoriesRouter = Router();

categoriesRouter.get('/', async (_req: Request, res: Response) => {
  if (isDbConnected()) {
    res.json(await CategoryModel.find({ isPublished: true }).lean());
    return;
  }
  res.json(seedCategories);
});

categoriesRouter.get('/:slug', async (req: Request, res: Response) => {
  if (isDbConnected()) {
    const item = await CategoryModel.findOne({ slug: req.params.slug }).lean();
    if (!item) { res.status(404).json({ error: 'Category not found' }); return; }
    res.json(item);
    return;
  }
  const item = seedCategories.find((c) => c.slug === req.params.slug);
  if (!item) { res.status(404).json({ error: 'Category not found' }); return; }
  res.json(item);
});
