// npm run seed — wipes and re-seeds categories, products and blog posts,
// and upserts the admin account + default homepage sections.
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDb } from './config/db';
import { seedBlogPosts, seedCategories, seedProducts } from './data/seed';
import { BlogPostModel } from './models/BlogPost';
import { CategoryModel } from './models/Category';
import { CouponModel } from './models/Coupon';
import { HomepageSectionModel } from './models/HomepageSection';
import { ProductModel } from './models/Product';
import { UserModel } from './models/User';
import { defaultSections } from './services/sections';

// Default admin login for the /admin panel. Change the password after first login
// (or set ADMIN_EMAIL / ADMIN_PASSWORD env vars before seeding).
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@shop.local';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Admin1234';

async function main(): Promise<void> {
  const ok = await connectDb();
  if (!ok) {
    console.error('Cannot seed: MongoDB is not reachable. Start MongoDB first.');
    process.exit(1);
  }
  await Promise.all([CategoryModel.deleteMany({}), ProductModel.deleteMany({}), BlogPostModel.deleteMany({})]);
  await CategoryModel.insertMany(seedCategories);
  await ProductModel.insertMany(seedProducts.map((p) => ({ ...p, baseRating: p.rating ?? 0 })));
  await BlogPostModel.insertMany(seedBlogPosts);

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await UserModel.updateOne(
    { email: ADMIN_EMAIL },
    { $set: { name: 'Admin', email: ADMIN_EMAIL, passwordHash, role: 'admin' } },
    { upsert: true },
  );

  const sectionCount = await HomepageSectionModel.countDocuments({});
  if (sectionCount === 0) {
    await HomepageSectionModel.insertMany(defaultSections);
  }

  // Test coupon for checkout (upsert — safe to re-run the seed).
  await CouponModel.updateOne(
    { code: 'WELCOME10' },
    { $set: { code: 'WELCOME10', type: 'percent', value: 10, minOrder: 500, active: true } },
    { upsert: true },
  );

  console.log(`Seeded ${seedCategories.length} categories, ${seedProducts.length} products, ${seedBlogPosts.length} blog posts.`);
  console.log(`Admin account ready: ${ADMIN_EMAIL}`);
  await mongoose.disconnect();
}

void main().catch((err) => { console.error(err); process.exit(1); });
