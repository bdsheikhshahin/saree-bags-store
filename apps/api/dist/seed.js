"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_PASSWORD = exports.ADMIN_EMAIL = void 0;
// npm run seed — wipes and re-seeds categories, products and blog posts,
// and upserts the admin account + default homepage sections.
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mongoose_1 = __importDefault(require("mongoose"));
const db_1 = require("./config/db");
const seed_1 = require("./data/seed");
const BlogPost_1 = require("./models/BlogPost");
const Category_1 = require("./models/Category");
const Coupon_1 = require("./models/Coupon");
const HomepageSection_1 = require("./models/HomepageSection");
const Product_1 = require("./models/Product");
const User_1 = require("./models/User");
const sections_1 = require("./services/sections");
// Default admin login for the /admin panel. Change the password after first login
// (or set ADMIN_EMAIL / ADMIN_PASSWORD env vars before seeding).
exports.ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@shop.local';
exports.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Admin1234';
async function main() {
    const ok = await (0, db_1.connectDb)();
    if (!ok) {
        console.error('Cannot seed: MongoDB is not reachable. Start MongoDB first.');
        process.exit(1);
    }
    await Promise.all([Category_1.CategoryModel.deleteMany({}), Product_1.ProductModel.deleteMany({}), BlogPost_1.BlogPostModel.deleteMany({})]);
    await Category_1.CategoryModel.insertMany(seed_1.seedCategories);
    await Product_1.ProductModel.insertMany(seed_1.seedProducts.map((p) => ({ ...p, baseRating: p.rating ?? 0 })));
    await BlogPost_1.BlogPostModel.insertMany(seed_1.seedBlogPosts);
    const passwordHash = await bcryptjs_1.default.hash(exports.ADMIN_PASSWORD, 10);
    await User_1.UserModel.updateOne({ email: exports.ADMIN_EMAIL }, { $set: { name: 'Admin', email: exports.ADMIN_EMAIL, passwordHash, role: 'admin' } }, { upsert: true });
    const sectionCount = await HomepageSection_1.HomepageSectionModel.countDocuments({});
    if (sectionCount === 0) {
        await HomepageSection_1.HomepageSectionModel.insertMany(sections_1.defaultSections);
    }
    // Test coupon for checkout (upsert — safe to re-run the seed).
    await Coupon_1.CouponModel.updateOne({ code: 'WELCOME10' }, { $set: { code: 'WELCOME10', type: 'percent', value: 10, minOrder: 500, active: true } }, { upsert: true });
    console.log(`Seeded ${seed_1.seedCategories.length} categories, ${seed_1.seedProducts.length} products, ${seed_1.seedBlogPosts.length} blog posts.`);
    console.log(`Admin account ready: ${exports.ADMIN_EMAIL}`);
    await mongoose_1.default.disconnect();
}
void main().catch((err) => { console.error(err); process.exit(1); });
//# sourceMappingURL=seed.js.map