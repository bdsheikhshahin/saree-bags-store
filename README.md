# E-commerce Store — Phase 1 Scaffold + Phase 2 Admin Panel + Phase 3 (all remaining steps)

Admin panel: **http://localhost:3000/admin** — log in with the seeded admin account
(see below). Phase 3 completed all remaining implementable steps: sandbox
payment gateway flows, reviews, coupons, search UI, server-side cart, image
upload, password change, blog Markdown, tests and deployment prep. Going live
still needs the user's merchant keys, a hosting account and a GA4/GTM account
(see "What still needs the user" below).

SEO-friendly store + blog for Bangladesh. First categories: **saree and bags**,
built to expand to many categories like pickaboo.com (categories are generic —
add a new category in MongoDB / seed data, no code change needed).

## Stack

- **Storefront + blog:** Next.js 14 (App Router, TypeScript, server-rendered for SEO)
- **API:** Express + TypeScript + Mongoose (MongoDB)
- **Shared types:** `packages/shared` (`@ecommerce/shared`)
- **Analytics:** Google Analytics 4 **via Google Tag Manager only** — no direct gtag.
  GTM ID from `NEXT_PUBLIC_GTM_ID`. Typed `dataLayer` helper in
  `apps/web/lib/analytics.ts`.
- **Payments (Bangladesh):** SSLCommerz, bKash, Nagad, Cash on Delivery.
  Real gateway flows are implemented in sandbox mode (see "Payments" below) —
  no real merchant keys yet, no Stripe.

## Project layout

```
ecommerce/
  apps/web/      Next.js storefront + blog + admin panel
    app/(store)/ home, /products, /products/[slug], /category/[slug],
                 /blog, /blog/[slug], /cart, /checkout, /checkout/success,
                 sitemap.ts, robots.ts
    app/admin/   login + dashboard, products, categories, orders, blog,
                 sections (homepage), users, settings
    lib/         api.ts (API client + seed fallback), analytics.ts (GTM/dataLayer),
                 data.ts (seed fallback), cart.ts, seo.ts (JSON-LD)
    components/  Gtm, ConsentBanner, ProductCard, AddToCartButton, …
  apps/api/      Express API
    src/models/  Product, Category, BlogPost, User, Order, Cart, Coupon,
                 Review, HomepageSection
    src/routes/  products, categories, blog, auth, cart, orders, admin,
                 coupons, payments, reviews, sections, upload
    src/services/payments.ts   SSLCommerz / bKash / Nagad / COD (sandbox)
    src/services/coupons.ts    server-side coupon validation
    src/data/seed.ts           3 categories, 18 products, 2 blog posts,
                 admin user, 4 homepage sections, WELCOME10 coupon
  tests/ (apps/api/tests/)     node:test API suite — run `npm test` in apps/api
  Dockerfile, docker-compose.yml, DEPLOY.md, .env.production.example files
  packages/shared/  shared types + dataLayer event types + payment methods
```

## Quick start (local)

Prerequisites: Node.js 20+, npm, MongoDB running locally
(`mongodb://localhost:27017/ecommerce`) — the API also works without MongoDB,
serving seed data as a fallback, but auth/admin writes and seeding need it.

```bash
cd ecommerce

# 1. Install (npm workspaces)
npm install

# 2. Build shared types first (web + api import @ecommerce/shared)
npm run build --workspace=@ecommerce/shared

# 3. Env files (placeholders only — no real secrets)
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# Edit apps/web/.env.local and set NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
# (leave the placeholder and GTM simply does not load)

# 4. Seed the database (needs MongoDB running)
npm run seed

# 5. Run both apps (two terminals, or `npm run dev` at the root)
npm run dev:api    # http://localhost:4000  (GET /health)
npm run dev:web    # http://localhost:3000
```

## API (Phase 1)

| Method | Route | Notes |
|---|---|---|
| GET | `/health` | ok check |
| GET | `/api/products?category=&search=&page=` | list, filter, paginate |
| GET | `/api/products/:slug` | product detail |
| GET | `/api/categories`, `/api/categories/:slug` | categories |
| GET | `/api/blog`, `/api/blog/:slug` | published posts only |
| POST | `/api/auth/register`, `/api/auth/login` | JWT; needs MongoDB (503 without it) |
| GET | `/api/cart` | Phase 1: client-side cart note |
| POST | `/api/orders` | creates order; payment stub; COD works end-to-end |
| GET | `/api/orders/:orderId` | needs MongoDB |
| POST/PUT/DELETE | `/api/admin/products`, `/api/admin/blog` | admin JWT required |

## SEO (built in)

- Clean slug URLs: `/products/<slug>`, `/category/<slug>`, `/blog/<slug>`
- Per-page title / meta description / Open Graph + canonical via `generateMetadata`
- JSON-LD: Product + Offer, BreadcrumbList, Article
- Auto `sitemap.xml` (`/sitemap.xml`) and `robots.txt` (`/robots.txt`)
- Blog posts link internally to related products (`relatedProducts`)
- Next.js `Image` optimisation; server-rendered pages (no client-only SPA)

## GA4 via GTM (no gtag)

- `apps/web/components/Gtm.tsx` loads `gtm.js` only when `NEXT_PUBLIC_GTM_ID`
  is set to a real ID. Consent Mode defaults to `denied`
  (`NEXT_PUBLIC_GA_CONSENT_DEFAULT`); `ConsentBanner` flips it to `granted`.
- `apps/web/lib/analytics.ts` — typed `pushDataLayer` + helpers:
  `view_item_list`, `view_item`, `add_to_cart`, `remove_from_cart`,
  `view_cart`, `begin_checkout`, `add_payment_info`, `purchase`.
- `purchase` fires **once**, only on `/checkout/success` after the API
  confirms the order, deduped by `transaction_id` in `sessionStorage`.
- Verify in GA4 DebugView + Realtime before launch (Phase 4 checklist).
  No GA4 property, GTM container or domain has been created here.

## Seed data

- Categories: Saree, Bags, Accessories (3)
- Products (18): the original 6 plus 12 demo products added from online price
  bands — Half Silk Mina Kari Jamdani ৳1,250, Sky Blue Cotton Jamdani ৳1,950,
  Tangail Tat Maroon ৳1,150, Half Silk Chumki Pink ৳1,350, Katan Silk ৳7,500,
  Batik Orange ৳1,850, Muslin Jamdani ৳12,500, Green Cotton Jamdani ৳2,200,
  White PU Tote ৳1,099, Crossbody Black ৳644, Brown PU Shoulder 2-piece ৳999,
  Quilted Faux Leather Tote ৳1,118. Each has a demo rating + units-sold value
  (used by the homepage auto-rules) and some carry Best Seller / Trending /
  Hot Sale / Offer badges.
- Blog posts (2): “How to Choose a Saree for a Wedding” (links to 2 sarees),
  “How to Care for Leather Bags” (links to the tote bag)
- Product/blog images are placeholder paths under `/images/…` — add real
  images to `apps/web/public/images/` in Phase 2.

## Phase 2 — Admin panel (done)

Routes under `/admin` (JWT-protected; unauthenticated visits redirect to `/admin/login`):

| Route | What it does |
|---|---|
| `/admin/login` | Email + password login against `/api/auth/login` |
| `/admin` | Dashboard: product / order / revenue / blog counts, recent orders, low-stock (≤ 5) |
| `/admin/products` | Searchable/filterable table; add / edit / delete with price, MRP, stock, images, variants, tags, SEO fields, and badges (Best Seller / Trending / Hot Sale / Offer) |
| `/admin/categories` | Add / edit / delete categories (generic — any category, no code change) |
| `/admin/orders` | Order list + detail; update order status and payment status |
| `/admin/blog` | Add / edit / delete posts with SEO fields and related products |
| `/admin/sections` | Homepage Sections: add / edit / delete / reorder (↑↓) / enable-disable. Each section has a title, type (Exclusive Offer / Trendy / Hot Sale / Best Selling / Custom), and manual product picker OR auto-rule (highest discount % / best rating / newest / best selling / trending) |
| `/admin/users` | Read-only list of customers/admins |
| `/admin/settings` | Store info, payment methods (stubs — keys via .env), GTM ID status |

**Admin login (seeded by `npm run seed`):** email `admin@shop.local`, password `Admin1234`.
Change it after first login — re-seed with `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars,
or update the user in MongoDB. The seed also creates 4 default homepage sections
(Exclusive Offer, Trendy Products, Hot Sale, Best Selling) and the homepage
renders them in order from `GET /api/sections`, falling back to the old
Featured-products block when the API is unavailable.

**MongoDB:** the admin panel needs MongoDB (auth + all admin writes return 503
without it). This VM has no system MongoDB; a local MongoDB 7.0.14 binary was
downloaded to `/tmp/mongo/` and runs with data in `ecommerce/.data/mongodb`
(`mongod --dbpath ecommerce/.data/mongodb --bind_ip 127.0.0.1 --port 27017 --fork`).
On a fresh machine, install MongoDB normally and point `MONGO_URI` at it.

**New API routes (Phase 2):** `GET /api/sections` (public, enabled sections in
order with resolved products); admin `GET /api/admin/stats`, `GET /api/admin/products[/:slug]`,
`GET|POST|PUT|DELETE /api/admin/categories[/:slug]`, `GET /api/admin/orders[/:orderId]`,
`PATCH /api/admin/orders/:orderId`, `GET|DELETE /api/admin/blog[/:slug]`,
`GET|POST|PUT|DELETE /api/admin/sections[/:id]`, `POST /api/admin/sections/reorder`,
`GET /api/admin/users`. Product model gained `badges`, `rating` and `salesCount`
(demo values seeded for all 18 products); new `HomepageSection` model.

## Phase 3 — all remaining steps (done)

- **Next.js security upgrade:** 14.2.28 → 14.2.35 (latest patched 14.x). Note:
  `npm audit` is blocked in this VM by registry policy (403 on the audit
  endpoint), so `npm audit fix` could not run here — re-run it on the
  developer's machine / CI.
- **Payments (sandbox):** `apps/api/src/services/payments.ts` implements real
  flows — SSLCommerz init + success/fail/cancel/IPN with `val_id` validation,
  bKash token-grant → create → execute, Nagad RSA init + verify — all
  env-driven, sandbox by default. Checkout creates a pending-payment order,
  then `POST /api/payments/:provider/init` returns the gateway URL; callbacks
  verify with the gateway and update order + payment status, redirecting to
  `/checkout/success?orderId=…&payment=paid|failed|cancelled`. With no
  credentials configured every provider returns `{configured: false}` and
  never calls a gateway; COD works end-to-end.
- **Reviews:** `Review` model (rating 1–5, comment, approved flag);
  `GET /api/products/:slug/reviews` (approved only + average), `POST` a
  review (starts unapproved), admin approve/delete at `/admin/reviews`;
  product pages show average rating, approved reviews and a review form.
- **Coupons:** `Coupon` model (code, % or fixed, value, min order, expiry,
  usage limit, active); `POST /api/coupons/validate`; admin CRUD at
  `/admin/coupons`; checkout applies the code server-side and stores
  `couponCode` + `discountAmount` on the order. Test coupon: **WELCOME10**
  (10% off, min order ৳500, seeded).
- **Search UI:** header search box → `/search?q=…` with category / price /
  rating filters, sort, results count; API `GET /api/products?search=&
  category=&minPrice=&maxPrice=&minRating=&sort=` (case-insensitive).
- **Server-side cart:** `GET/POST /api/cart` (sync/merge/clear, JWT);
  logged-in carts sync to MongoDB, guest carts stay in localStorage and
  merge on login; localStorage remains the fallback when the API is down.
  Note: there is no customer login UI in the storefront yet (only
  `/admin/login`) — the cart sync is token-driven via `customer_token` in
  localStorage; add a customer login page to use it fully.
- **Image upload:** `POST /api/admin/upload` (admin JWT, images only,
  max 5 MB) stores under `apps/web/public/images/` and returns the URL;
  the admin product form has a file input with preview (manual path kept
  as fallback). Seed products keep placeholder paths.
- **Password change:** `POST /api/auth/change-password` (JWT, current +
  new ≥ 8 chars, bcrypt) with a Change Password card in `/admin/settings`.
- **Blog Markdown:** `/blog/[slug]` renders bodies with `react-markdown`
  (headings, lists, links, bold/italic, code). `remark-gfm` is not
  installed, so GitHub-flavoured tables/task-lists are not rendered.
- **Tests:** `apps/api/tests/` — Node `node:test` suite against the live
  API (health, products, search, sections, auth, orders, coupons, reviews,
  cart, payment status). Run: `cd apps/api && npm test`.
- **Deployment prep:** `Dockerfile`, `docker-compose.yml` (web + api +
  mongo), `apps/web/.env.production.example`,
  `apps/api/.env.production.example`, `DEPLOY.md` (Vercel / VPS Docker /
  Render / MongoDB Atlas). Nothing has been deployed; Docker is not
  installed in this VM, so the Dockerfile/compose file were never
  build-tested — validate with `docker compose config` on the VPS first.

## Payments — env vars you must obtain to go live

All in `apps/api/.env.example` (placeholders only — never commit real keys).
Keep sandbox mode on until you have tested with the merchant's test
credentials, then flip the `*_SANDBOX` / `*_IS_LIVE` flags and the URLs.

| Provider | What to obtain | Env vars |
|---|---|---|
| SSLCommerz | Store ID + Store Password from your SSLCommerz merchant panel (sandbox first at developer.sslcommerz.com, then live) | `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`, `SSLCOMMERZ_SANDBOX=true` (set `false` for live), `SSLCOMMERZ_INIT_URL`, `SSLCOMMERZ_VALIDATION_URL` |
| bKash | App Key, App Secret, Username, Password from bKash merchant / developer portal (sandbox, then production) | `BKASH_APP_KEY`, `BKASH_APP_SECRET`, `BKASH_USERNAME`, `BKASH_PASSWORD`, `BKASH_SANDBOX=true`, `BKASH_BASE_URL` |
| Nagad | Merchant ID, Merchant Public Key, Merchant Private Key from Nagad merchant panel (sandbox, then production) | `NAGAD_MERCHANT_ID`, `NAGAD_PUBLIC_KEY`, `NAGAD_PRIVATE_KEY`, `NAGAD_SANDBOX=true`, `NAGAD_BASE_URL` |

## What still needs the user

- **Merchant keys:** SSLCommerz / bKash / Nagad sandbox (then live) keys —
  without them online payments return "not configured" and only COD works.
- **Hosting account + choice:** Vercel (web) + Render/VPS (API) + MongoDB
  Atlas, or a VPS with Docker Compose — see `DEPLOY.md`. No account has
  been created and nothing has been deployed.
- **Google account for GTM/GA4:** set `NEXT_PUBLIC_GTM_ID` to a real GTM
  container ID and verify in GA4 DebugView; no GA4 property exists yet.
- **Customer login UI:** the storefront has no customer sign-in page yet,
  so server-side cart sync is token-driven only.
- **Real product images:** seed products still use placeholder paths.
- Nothing has been bought, deployed or connected to a real payment/GA4 account.
