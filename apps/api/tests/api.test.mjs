// API test suite — runs against the LIVE API (default http://localhost:4000).
// Uses only Node's built-in test runner (node:test) and global fetch.
// No new dependencies, no build step.
//
// Run:  npm test --workspace=apps/api        (from repo root)
//   or: npm test                             (from apps/api)
//
// The suite creates exactly ONE real order (a COD test order, left in the DB
// and printed at the end) and one review + one server cart, both deleted
// again in their own tests. It never seeds, wipes, or edits other data.
//
// Env overrides:
//   API_BASE_URL  base URL of the running API (default http://localhost:4000)
//   ADMIN_EMAIL / ADMIN_PASSWORD  admin login (defaults match the seeded admin)
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.API_BASE_URL ?? 'http://localhost:4000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@shop.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Admin1234';

// Shared state between tests (tests in one file run sequentially).
let adminToken;
let redJamdani; // { slug, name, price } — taken from the live catalogue
let testOrderId;
let testReviewId;

async function req(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  return { status: res.status, data };
}

after(() => {
  if (testOrderId) {
    // The one intentional leftover: a COD test order. Printed so the
    // coordinator can find / remove it if ever needed.
    console.log(`\n[test-order] COD test order left in DB: ${testOrderId}`);
  }
});

describe('health', () => {
  it('GET /health returns 200 + ok:true', async () => {
    const { status, data } = await req('/health');
    assert.equal(status, 200);
    assert.equal(data.ok, true);
  });
});

describe('products', () => {
  it('GET /api/products returns 18 items (assert >= 18)', async () => {
    const { status, data } = await req('/api/products?limit=50');
    assert.equal(status, 200);
    assert.ok(Array.isArray(data.items), 'items should be an array');
    assert.ok(data.items.length >= 18, `expected >= 18 items, got ${data.items.length}`);
    assert.ok(data.total >= 18, `expected total >= 18, got ${data.total}`);
    redJamdani = data.items.find((p) => p.slug === 'red-jamdani-saree');
    assert.ok(redJamdani, 'Red Jamdani Saree should be in the catalogue');
    assert.equal(redJamdani.name, 'Red Jamdani Saree');
  });

  it('GET /api/products?search=jamdani returns results and total > 0', async () => {
    const { status, data } = await req('/api/products?search=jamdani');
    assert.equal(status, 200);
    assert.ok(data.total > 0, `expected total > 0, got ${data.total}`);
    assert.ok(data.items.length > 0);
    assert.ok(
      data.items.every(
        (p) =>
          /jamdani/i.test(p.name) ||
          /jamdani/i.test(p.description ?? '') ||
          (p.tags ?? []).some((t) => /jamdani/i.test(t)),
      ),
      'every search hit should match "jamdani" in name, description or tags',
    );
  });

  it('GET /api/products/:slug returns the single product', async () => {
    const { status, data } = await req('/api/products/red-jamdani-saree');
    assert.equal(status, 200);
    assert.equal(data.slug, 'red-jamdani-saree');
    assert.equal(data.name, 'Red Jamdani Saree');
    assert.equal(typeof data.price, 'number');
  });
});

describe('homepage sections', () => {
  it('GET /api/sections returns 4 sections', async () => {
    const { status, data } = await req('/api/sections');
    assert.equal(status, 200);
    assert.ok(Array.isArray(data), 'sections should be an array');
    assert.equal(data.length, 4, `expected 4 sections, got ${data.length}`);
    const titles = data.map((s) => s.title);
    for (const expected of ['Exclusive Offer', 'Trendy Products', 'Hot Sale', 'Best Selling']) {
      assert.ok(titles.includes(expected), `missing section "${expected}"`);
    }
  });
});

describe('auth', () => {
  it('POST /api/auth/login with wrong password fails (401)', async () => {
    const { status, data } = await req('/api/auth/login', {
      method: 'POST',
      body: { email: ADMIN_EMAIL, password: 'WrongPass123' },
    });
    assert.equal(status, 401);
    assert.ok(!data.token, 'no token should be issued for a wrong password');
  });

  it('POST /api/auth/login with admin credentials succeeds and returns a token', async () => {
    const { status, data } = await req('/api/auth/login', {
      method: 'POST',
      body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    assert.equal(status, 200);
    assert.equal(typeof data.token, 'string');
    assert.ok(data.token.length > 0);
    assert.equal(data.user?.email, ADMIN_EMAIL);
    assert.equal(data.user?.role, 'admin');
    adminToken = data.token;
  });
});

describe('coupons', () => {
  it('POST /api/coupons/validate WELCOME10 + subtotal 600 returns valid + discount 60', async () => {
    const { status, data } = await req('/api/coupons/validate', {
      method: 'POST',
      body: { code: 'WELCOME10', subtotal: 600 },
    });
    assert.equal(status, 200);
    assert.equal(data.valid, true);
    assert.equal(data.discount, 60);
  });

  it('POST /api/coupons/validate WELCOME10 + subtotal 400 returns invalid (below min order 500)', async () => {
    const { status, data } = await req('/api/coupons/validate', {
      method: 'POST',
      body: { code: 'WELCOME10', subtotal: 400 },
    });
    assert.equal(status, 200);
    assert.equal(data.valid, false);
    assert.equal(data.discount, 0);
  });

  it('POST /api/coupons/validate with code NOPE returns invalid', async () => {
    const { status, data } = await req('/api/coupons/validate', {
      method: 'POST',
      body: { code: 'NOPE', subtotal: 600 },
    });
    assert.equal(status, 200);
    assert.equal(data.valid, false);
    assert.equal(data.discount, 0);
  });
});

describe('orders', () => {
  it('POST /api/orders creates a COD order and returns an order id/total', async () => {
    assert.ok(redJamdani, 'products test must run first to pick the test product');
    const { status, data } = await req('/api/orders', {
      method: 'POST',
      body: {
        items: [
          {
            productSlug: redJamdani.slug,
            name: redJamdani.name,
            price: redJamdani.price,
            quantity: 1,
          },
        ],
        paymentMethod: 'cod',
        customer: {
          name: 'API Test Customer',
          phone: '01700000000',
          email: 'apitest@example.com',
          address: 'Test Address, Dhaka, Bangladesh',
        },
      },
    });
    assert.equal(status, 201);
    assert.ok(data.orderId, 'order id should be returned');
    assert.equal(typeof data.total, 'number');
    // Red Jamdani ৳8500, qty 1: subtotal 8500, free delivery (>= ৳2000), total 8500.
    assert.equal(data.subtotal, redJamdani.price);
    assert.equal(data.deliveryFee, 0);
    assert.equal(data.total, redJamdani.price);
    testOrderId = data.orderId;
  });

  it('GET /api/orders/:orderId returns the created order', async () => {
    assert.ok(testOrderId, 'order creation test must run first');
    const { status, data } = await req(`/api/orders/${testOrderId}`);
    assert.equal(status, 200);
    assert.equal(data.orderId, testOrderId);
    assert.equal(data.paymentMethod, 'cod');
    assert.equal(data.total, redJamdani.price);
    assert.equal(data.items?.[0]?.productSlug, redJamdani.slug);
  });
});

describe('payments', () => {
  it('GET /api/payments/order/:orderId/status works for the created order', async () => {
    assert.ok(testOrderId, 'order creation test must run first');
    const { status, data } = await req(`/api/payments/order/${testOrderId}/status`);
    assert.equal(status, 200);
    assert.equal(data.orderId, testOrderId);
    assert.equal(data.paymentMethod, 'cod');
    assert.equal(data.paymentStatus, 'pending');
    assert.equal(data.total, redJamdani.price);
  });

  it('POST /api/payments/sslcommerz/init returns configured:false (no sandbox keys) without crashing', async () => {
    assert.ok(testOrderId, 'order creation test must run first');
    const { status, data } = await req('/api/payments/sslcommerz/init', {
      method: 'POST',
      body: { orderId: testOrderId },
    });
    assert.equal(status, 200);
    assert.equal(data.configured, false);
    assert.equal(data.provider, 'sslcommerz');
    assert.equal(data.orderId, testOrderId);
    assert.equal(typeof data.message, 'string');
  });
});

describe('reviews', () => {
  const reviewBody = {
    name: 'API Test Reviewer',
    rating: 5,
    comment: 'Automated API test review — please ignore. Submitted by the node:test suite.',
  };

  it('POST /api/products/:slug/reviews submits a review (201, approved=false)', async () => {
    const { status, data } = await req(`/api/products/${redJamdani.slug}/reviews`, {
      method: 'POST',
      body: reviewBody,
    });
    assert.equal(status, 201);
    assert.equal(data.approved, false);
    assert.equal(data.rating, 5);
    assert.equal(data.name, reviewBody.name);
    assert.ok(data._id, 'review id should be returned');
    testReviewId = data._id;
  });

  it('unapproved review does NOT appear in public GET /api/products/:slug/reviews', async () => {
    const { status, data } = await req(`/api/products/${redJamdani.slug}/reviews`);
    assert.equal(status, 200);
    assert.ok(
      !data.reviews.some((r) => r._id === testReviewId),
      'unapproved review must not be public',
    );
  });

  it('PATCH /api/admin/reviews/:id approves it (admin JWT)', async () => {
    const { status, data } = await req(`/api/admin/reviews/${testReviewId}`, {
      method: 'PATCH',
      body: { approved: true },
      token: adminToken,
    });
    assert.equal(status, 200);
    assert.equal(data.approved, true);
  });

  it('approved review appears in GET /api/products/:slug/reviews', async () => {
    const { status, data } = await req(`/api/products/${redJamdani.slug}/reviews`);
    assert.equal(status, 200);
    assert.ok(data.count >= 1, `expected count >= 1, got ${data.count}`);
    const found = data.reviews.find((r) => r._id === testReviewId);
    assert.ok(found, 'approved review should be public');
    assert.equal(found.rating, 5);
  });

  it('DELETE /api/admin/reviews/:id removes the test review (cleanup)', async () => {
    const { status, data } = await req(`/api/admin/reviews/${testReviewId}`, {
      method: 'DELETE',
      token: adminToken,
    });
    assert.equal(status, 200);
    assert.equal(data.deleted, true);
    testReviewId = null;
    // Confirm it is gone from the public list.
    const after = await req(`/api/products/${redJamdani.slug}/reviews`);
    assert.equal(after.status, 200);
    assert.equal(after.data.count, 0);
  });
});

describe('server cart', () => {
  it('POST /api/cart/sync with the admin JWT stores a cart', async () => {
    const { status, data } = await req('/api/cart/sync', {
      method: 'POST',
      body: { items: [{ productSlug: redJamdani.slug, quantity: 1 }] },
      token: adminToken,
    });
    assert.equal(status, 200);
    assert.equal(data.source, 'server');
    assert.ok(Array.isArray(data.items));
    assert.equal(data.items.length, 1);
    assert.equal(data.items[0].productSlug, redJamdani.slug);
    assert.equal(data.items[0].quantity, 1);
    // Server re-prices from the catalogue.
    assert.equal(data.items[0].price, redJamdani.price);
  });

  it('GET /api/cart returns the stored cart', async () => {
    const { status, data } = await req('/api/cart', { token: adminToken });
    assert.equal(status, 200);
    assert.equal(data.source, 'server');
    assert.equal(data.items.length, 1);
    assert.equal(data.items[0].productSlug, redJamdani.slug);
  });

  it('DELETE /api/cart clears the test cart (cleanup)', async () => {
    const { status, data } = await req('/api/cart', { method: 'DELETE', token: adminToken });
    assert.equal(status, 200);
    assert.deepEqual(data.items, []);
    const after = await req('/api/cart', { token: adminToken });
    assert.equal(after.status, 200);
    assert.deepEqual(after.data.items, []);
  });
});
