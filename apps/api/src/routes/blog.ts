import { Router, type Request, type Response } from 'express';
import { isDbConnected } from '../config/db';
import { seedBlogPosts } from '../data/seed';
import { BlogPostModel } from '../models/BlogPost';

export const blogRouter = Router();

blogRouter.get('/', async (req: Request, res: Response) => {
  if (isDbConnected()) {
    const filter: Record<string, unknown> = { status: 'published' };
    if (typeof req.query.category === 'string' && req.query.category) filter.category = req.query.category;
    res.json(await BlogPostModel.find(filter).sort({ publishedAt: -1 }).lean());
    return;
  }
  res.json(seedBlogPosts.filter((p) => p.status === 'published'));
});

blogRouter.get('/:slug', async (req: Request, res: Response) => {
  if (isDbConnected()) {
    const item = await BlogPostModel.findOne({ slug: req.params.slug, status: 'published' }).lean();
    if (!item) { res.status(404).json({ error: 'Blog post not found' }); return; }
    res.json(item);
    return;
  }
  const item = seedBlogPosts.find((p) => p.slug === req.params.slug && p.status === 'published');
  if (!item) { res.status(404).json({ error: 'Blog post not found' }); return; }
  res.json(item);
});
