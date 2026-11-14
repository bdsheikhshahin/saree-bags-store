// Seed data — first categories are saree + bags; the category model is
// generic so new categories (electronics, home, etc.) can be added later
// exactly like pickaboo.com, without code changes.
import type { BlogPost, Category, Product } from '@ecommerce/shared';

export const seedCategories: Category[] = [
  {
    name: 'Saree',
    slug: 'saree',
    description: 'Handloom and silk sarees from Bangladesh — Jamdani, Tangail cotton, silk and more.',
    parent: null,
    seo: { title: 'Saree Online in Bangladesh | Shop Jamdani, Silk & Cotton Saree', description: 'Buy saree online in Bangladesh. Jamdani, Tangail cotton and silk sarees with cash on delivery, bKash and Nagad.' },
  },
  {
    name: 'Bags',
    slug: 'bags',
    description: 'Leather tote bags, handbags, jute bags and clutches for everyday use and occasions.',
    parent: null,
    seo: { title: 'Bags Online in Bangladesh | Tote, Handbag & Clutch', description: 'Buy bags online in Bangladesh — leather totes, jute handbags and embroidered clutches.' },
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    description: 'Accessories to go with your saree and bag — ready for future expansion.',
    parent: null,
    seo: { title: 'Accessories Online in Bangladesh', description: 'Accessories online in Bangladesh.' },
  },
];

export const seedProducts: Product[] = [
  {
    name: 'Red Jamdani Saree',
    slug: 'red-jamdani-saree',
    sku: 'SAR-001',
    description: 'Handwoven red Jamdani saree with traditional floral motifs. Lightweight, soft and perfect for weddings and festivals.',
    price: 8500, compareAtPrice: 10500, currency: 'BDT',
    images: ['/images/red-jamdani-saree.jpg'],
    category: 'saree', stock: 12, rating: 4.8, salesCount: 214,
    variants: [{ name: 'Blouse piece: Included', stock: 12 }],
    tags: ['jamdani', 'wedding', 'handloom'], badges: { bestSeller: true, trending: true },
    seo: { title: 'Red Jamdani Saree — Handwoven | Buy Online in Bangladesh', description: 'Handwoven red Jamdani saree for weddings and festivals. Cash on delivery available across Bangladesh.' },
  },
  {
    name: 'Tangail Cotton Saree — Blue',
    slug: 'tangail-cotton-saree-blue',
    sku: 'SAR-002',
    description: 'Soft Tangail cotton saree in blue, comfortable for daily wear and summer days.',
    price: 2450, currency: 'BDT',
    images: ['/images/tangail-cotton-saree-blue.jpg'],
    category: 'saree', stock: 25, rating: 4.5, salesCount: 168,
    tags: ['cotton', 'daily-wear', 'tangail'],
    seo: { title: 'Tangail Cotton Saree Blue — Buy Online in Bangladesh', description: 'Soft Tangail cotton saree in blue, ideal for daily wear.' },
  },
  {
    name: 'Teal Silk Saree',
    slug: 'teal-silk-saree',
    sku: 'SAR-003',
    description: 'Elegant teal silk saree with a subtle sheen. A timeless choice for parties and formal occasions.',
    price: 6800, compareAtPrice: 7900, currency: 'BDT',
    images: ['/images/teal-silk-saree.jpg'],
    category: 'saree', stock: 8, rating: 4.6, salesCount: 142,
    tags: ['silk', 'party', 'formal'],
    seo: { title: 'Teal Silk Saree — Buy Online in Bangladesh', description: 'Elegant teal silk saree for parties and formal occasions.' },
  },
  {
    name: 'Tan Leather Tote Bag',
    slug: 'tan-leather-tote-bag',
    sku: 'BAG-001',
    description: 'Spacious tan leather tote bag with an inner pocket and sturdy handles. Fits a laptop, books and daily essentials.',
    price: 3250, currency: 'BDT',
    images: ['/images/tan-leather-tote-bag.jpg'],
    category: 'bags', stock: 15, rating: 4.7, salesCount: 187,
    variants: [{ name: 'Colour: Tan', stock: 15 }],
    tags: ['leather', 'tote', 'office'],
    seo: { title: 'Tan Leather Tote Bag — Buy Online in Bangladesh', description: 'Spacious tan leather tote bag for office and everyday use.' },
  },
  {
    name: 'Handcrafted Jute Handbag',
    slug: 'handcrafted-jute-handbag',
    sku: 'BAG-002',
    description: 'Handcrafted jute handbag made by local artisans. Eco-friendly, lightweight and stylish.',
    price: 1850, compareAtPrice: 2200, currency: 'BDT',
    images: ['/images/handcrafted-jute-handbag.jpg'],
    category: 'bags', stock: 20, rating: 4.4, salesCount: 96,
    tags: ['jute', 'handmade', 'eco-friendly'],
    seo: { title: 'Handcrafted Jute Handbag — Buy Online in Bangladesh', description: 'Eco-friendly handcrafted jute handbag made by local artisans.' },
  },
  {
    name: 'Embroidered Clutch Bag',
    slug: 'embroidered-clutch-bag',
    sku: 'BAG-003',
    description: 'Embroidered clutch bag for weddings and evening occasions. Compact, with a detachable chain strap.',
    price: 1450, currency: 'BDT',
    images: ['/images/embroidered-clutch-bag.jpg'],
    category: 'bags', stock: 18, rating: 4.3, salesCount: 88,
    tags: ['clutch', 'embroidered', 'wedding'],
    seo: { title: 'Embroidered Clutch Bag — Buy Online in Bangladesh', description: 'Embroidered clutch bag for weddings and evening occasions.' },
  },
  {
    name: 'Multicolor Half Silk Mina Kari Jamdani Saree',
    slug: 'multicolor-half-silk-mina-kari-jamdani-saree',
    sku: 'SAR-004',
    description: 'Multicolor half silk Jamdani saree with fine Mina Kari floral work woven into the body and border. Light and soft to drape, with a 5.5 m saree and a matching blouse piece. A bright choice for festivals and wedding guests. Dry clean only.',
    price: 1250, compareAtPrice: 1550, currency: 'BDT',
    images: ['/images/multicolor-half-silk-mina-kari-jamdani-saree.jpg'],
    category: 'saree', stock: 22, rating: 4.7, salesCount: 203,
    variants: [{ name: 'Blouse piece: Included', stock: 22 }],
    tags: ['jamdani', 'half-silk', 'mina-kari', 'festival'], badges: { trending: true },
    seo: { title: 'Multicolor Half Silk Mina Kari Jamdani Saree — Buy Online in Bangladesh', description: 'Multicolor half silk Mina Kari Jamdani saree with floral woven work. Light, festive and easy to drape.' },
  },
  {
    name: 'Sky Blue Cotton Jamdani Saree',
    slug: 'sky-blue-cotton-jamdani-saree',
    sku: 'SAR-005',
    description: 'Sky blue cotton Jamdani saree with delicate woven motifs on a soft, breathable cotton base. Includes a blouse piece; 5.5 m long, comfortable for day-long wear at festivals and family gatherings. Hand wash separately.',
    price: 1950, compareAtPrice: 2500, currency: 'BDT',
    images: ['/images/sky-blue-cotton-jamdani-saree.jpg'],
    category: 'saree', stock: 16, rating: 4.5, salesCount: 121,
    variants: [{ name: 'Blouse piece: Included', stock: 16 }],
    tags: ['jamdani', 'cotton', 'blue', 'festival'],
    seo: { title: 'Sky Blue Cotton Jamdani Saree — Buy Online in Bangladesh', description: 'Soft sky blue cotton Jamdani saree with woven motifs, ideal for festivals and day-long wear.' },
  },
  {
    name: 'Tangail Tat Cotton Saree — Maroon',
    slug: 'tangail-tat-cotton-saree-maroon',
    sku: 'SAR-006',
    description: 'Deep maroon Tangail tat cotton saree with a contrasting woven border. Soft, breathable cotton that keeps its shape through the day. Includes a blouse piece; a practical pick for daily wear and office days. Hand wash separately.',
    price: 1150, compareAtPrice: 1500, currency: 'BDT',
    images: ['/images/tangail-tat-cotton-saree-maroon.jpg'],
    category: 'saree', stock: 30, rating: 4.6, salesCount: 176,
    variants: [{ name: 'Blouse piece: Included', stock: 30 }],
    tags: ['cotton', 'tangail', 'daily-wear', 'maroon'], badges: { hotSale: true },
    seo: { title: 'Tangail Tat Cotton Saree Maroon — Buy Online in Bangladesh', description: 'Deep maroon Tangail tat cotton saree with a contrast border, soft and comfortable for daily wear.' },
  },
  {
    name: 'Tangail Half Silk Chumki Saree — Pink',
    slug: 'tangail-half-silk-chumki-saree-pink',
    sku: 'SAR-007',
    description: 'Pink Tangail half silk saree scattered with small chumki (sequin) work that catches the light. Lightweight half silk with a blouse piece included; a cheerful choice for parties and evening outings. Dry clean recommended.',
    price: 1350, compareAtPrice: 1750, currency: 'BDT',
    images: ['/images/tangail-half-silk-chumki-saree-pink.jpg'],
    category: 'saree', stock: 19, rating: 4.4, salesCount: 134,
    variants: [{ name: 'Blouse piece: Included', stock: 19 }],
    tags: ['half-silk', 'tangail', 'chumki', 'party'],
    seo: { title: 'Tangail Half Silk Chumki Saree Pink — Buy Online in Bangladesh', description: 'Pink Tangail half silk Chumki saree with light sequin work, perfect for parties and evenings.' },
  },
  {
    name: 'Purple Katan Silk Saree',
    slug: 'purple-katan-silk-saree',
    sku: 'SAR-008',
    description: 'Rich purple Katan silk saree with golden zari work on the border and pallu. Smooth, structured silk with a gentle sheen, plus a matching blouse piece. Made for weddings and formal evenings. Dry clean only.',
    price: 7500, compareAtPrice: 8900, currency: 'BDT',
    images: ['/images/purple-katan-silk-saree.jpg'],
    category: 'saree', stock: 9, rating: 4.9, salesCount: 158,
    variants: [{ name: 'Blouse piece: Included', stock: 9 }],
    tags: ['silk', 'katan', 'zari', 'wedding'], badges: { bestSeller: true },
    seo: { title: 'Purple Katan Silk Saree — Buy Online in Bangladesh', description: 'Rich purple Katan silk saree with golden zari work, made for weddings and formal evenings.' },
  },
  {
    name: 'Batik Cotton Saree — Orange',
    slug: 'batik-cotton-saree-orange',
    sku: 'SAR-009',
    description: 'Bright orange batik-print cotton saree with hand-dyed style patterns in yellow and brown. Soft, airy cotton with a blouse piece included; an easy everyday saree for warm days and casual outings. Hand wash separately.',
    price: 1850, compareAtPrice: 2300, currency: 'BDT',
    images: ['/images/batik-cotton-saree-orange.jpg'],
    category: 'saree', stock: 24, rating: 4.3, salesCount: 92,
    variants: [{ name: 'Blouse piece: Included', stock: 24 }],
    tags: ['cotton', 'batik', 'daily-wear', 'orange'],
    seo: { title: 'Batik Cotton Saree Orange — Buy Online in Bangladesh', description: 'Bright orange batik-print cotton saree, soft and airy for everyday wear.' },
  },
  {
    name: 'Off-White Muslin Jamdani Saree',
    slug: 'off-white-muslin-jamdani-saree',
    sku: 'SAR-010',
    description: 'Fine off-white muslin Jamdani saree with delicate gold woven motifs. Feather-light and sheer, with a matching blouse piece. A premium handloom piece for weddings and special occasions. Dry clean only.',
    price: 12500, compareAtPrice: 15000, currency: 'BDT',
    images: ['/images/off-white-muslin-jamdani-saree.jpg'],
    category: 'saree', stock: 5, rating: 4.9, salesCount: 87,
    variants: [{ name: 'Blouse piece: Included', stock: 5 }],
    tags: ['jamdani', 'muslin', 'premium', 'wedding'], badges: { bestSeller: true },
    seo: { title: 'Off-White Muslin Jamdani Saree — Buy Online in Bangladesh', description: 'Fine off-white muslin Jamdani saree with gold woven motifs, a premium handloom piece for weddings.' },
  },
  {
    name: 'Green Cotton Jamdani Saree',
    slug: 'green-cotton-jamdani-saree',
    sku: 'SAR-011',
    description: 'Leaf-green cotton Jamdani saree with small woven motifs and a contrasting border. Light, breathable cotton with a blouse piece included; comfortable for festivals, office wear and day-long use. Hand wash separately.',
    price: 2200, compareAtPrice: 2750, currency: 'BDT',
    images: ['/images/green-cotton-jamdani-saree.jpg'],
    category: 'saree', stock: 14, rating: 4.6, salesCount: 149,
    variants: [{ name: 'Blouse piece: Included', stock: 14 }],
    tags: ['jamdani', 'cotton', 'green', 'festival'],
    seo: { title: 'Green Cotton Jamdani Saree — Buy Online in Bangladesh', description: 'Leaf-green cotton Jamdani saree with woven motifs, light and comfortable for festivals and daily wear.' },
  },
  {
    name: 'White PU Leather Tote Bag',
    slug: 'white-pu-leather-tote-bag',
    sku: 'BAG-004',
    description: 'Clean white PU leather tote bag with a roomy main compartment, inner zip pocket and sturdy handles. Fits a laptop, notebook and daily essentials. Wipe clean with a damp cloth; a smart everyday and office bag.',
    price: 1099, compareAtPrice: 1450, currency: 'BDT',
    images: ['/images/white-pu-leather-tote-bag.jpg'],
    category: 'bags', stock: 21, rating: 4.5, salesCount: 163,
    variants: [{ name: 'Colour: White', stock: 21 }],
    tags: ['pu-leather', 'tote', 'office', 'white'],
    seo: { title: 'White PU Leather Tote Bag — Buy Online in Bangladesh', description: 'White PU leather tote bag with a roomy compartment and inner zip pocket, for office and everyday use.' },
  },
  {
    name: "Women's Crossbody Bag — Black",
    slug: 'womens-crossbody-bag-black',
    sku: 'BAG-005',
    description: 'Compact black crossbody bag with an adjustable shoulder strap, one main compartment and a front zip pocket. Light and hands-free — good for shopping trips, outings and travel. Wipe clean with a damp cloth.',
    price: 644, compareAtPrice: 899, currency: 'BDT',
    images: ['/images/womens-crossbody-bag-black.jpg'],
    category: 'bags', stock: 28, rating: 4.7, salesCount: 241,
    variants: [{ name: 'Colour: Black', stock: 28 }],
    tags: ['crossbody', 'black', 'daily-wear', 'travel'], badges: { hotSale: true, offer: true },
    seo: { title: "Women's Crossbody Bag Black — Buy Online in Bangladesh", description: 'Compact black crossbody bag with an adjustable strap, light and hands-free for outings and travel.' },
  },
  {
    name: 'Brown PU Shoulder Tote Bag — 2-Piece Set',
    slug: 'brown-pu-shoulder-tote-bag-2-piece',
    sku: 'BAG-006',
    description: 'Brown PU shoulder tote bag sold as a 2-piece set: a roomy tote plus a matching small pouch. Soft PU with a smooth finish, inner pocket and adjustable strap. A practical everyday set for work and outings. Wipe clean with a damp cloth.',
    price: 999, compareAtPrice: 1350, currency: 'BDT',
    images: ['/images/brown-pu-shoulder-tote-bag-2-piece.jpg'],
    category: 'bags', stock: 26, rating: 4.4, salesCount: 129,
    variants: [{ name: 'Colour: Brown', stock: 26 }],
    tags: ['pu-leather', 'tote', 'shoulder-bag', '2-piece'], badges: { offer: true },
    seo: { title: 'Brown PU Shoulder Tote Bag 2-Piece Set — Buy Online in Bangladesh', description: 'Brown PU shoulder tote bag with a matching pouch, a practical 2-piece everyday set.' },
  },
  {
    name: 'Black Quilted Faux Leather Tote Bag',
    slug: 'black-quilted-faux-leather-tote-bag',
    sku: 'BAG-007',
    description: 'Black quilted faux leather tote bag with a chain shoulder strap and a roomy, lined interior. The padded diamond quilting gives it a dressy look for office days and evening outings. Wipe clean with a damp cloth.',
    price: 1118, compareAtPrice: 1500, currency: 'BDT',
    images: ['/images/black-quilted-faux-leather-tote-bag.jpg'],
    category: 'bags', stock: 17, rating: 4.6, salesCount: 117,
    variants: [{ name: 'Colour: Black', stock: 17 }],
    tags: ['faux-leather', 'tote', 'quilted', 'office'],
    seo: { title: 'Black Quilted Faux Leather Tote Bag — Buy Online in Bangladesh', description: 'Black quilted faux leather tote bag with a chain strap, dressy enough for office and evenings.' },
  },
];

export const seedBlogPosts: BlogPost[] = [
  {
    title: 'How to Choose a Saree for a Wedding',
    slug: 'how-to-choose-a-saree-for-wedding',
    excerpt: 'Jamdani or silk? Red or teal? A simple guide to picking the right saree for a wedding — fabric, colour, fit and budget.',
    content: `# How to Choose a Saree for a Wedding

A wedding saree should feel special and be comfortable for a long day. Start with the fabric.

## Jamdani for the main event
Handwoven Jamdani is the classic choice for weddings in Bangladesh. It is light, breathable and instantly festive.

Shop the look: [Red Jamdani Saree](/products/red-jamdani-saree)

## Silk for the evening
Silk adds sheen and structure, and works well for receptions and formal dinners.

Shop the look: [Teal Silk Saree](/products/teal-silk-saree)

## A few quick tips
- Match the blouse to the saree border, not the body colour.
- Try the drape before the day — comfort matters.
- Keep jewellery simple if the saree is heavily worked.
`,
    coverImage: '/images/blog-wedding-saree.jpg',
    category: 'guides',
    tags: ['saree', 'wedding', 'jamdani', 'silk'],
    author: 'Editor',
    seo: { title: 'How to Choose a Saree for a Wedding | Buying Guide', description: 'Jamdani or silk? A simple guide to choosing the right saree for a wedding — fabric, colour, fit and budget.' },
    relatedProducts: ['red-jamdani-saree', 'teal-silk-saree'],
    status: 'published',
    publishedAt: '2026-11-10T00:00:00.000Z',
  },
  {
    title: 'How to Care for Leather Bags (So They Last for Years)',
    slug: 'how-to-care-for-leather-bags',
    excerpt: 'Leather bags age beautifully — if you care for them. Cleaning, storing and protecting your tote the right way.',
    content: `# How to Care for Leather Bags

A good leather bag can last for years. Most damage comes from water, sun and bad storage — all avoidable.

## Clean gently
Wipe with a soft, dry cloth after use. For stains, use a damp cloth and let the bag air-dry — never use a heater.

## Store it right
Keep the bag stuffed with soft cloth so it holds its shape, and store it in a dust bag away from direct sunlight.

Shop the look: [Tan Leather Tote Bag](/products/tan-leather-tote-bag)

## What to avoid
- Do not hang a heavy tote by one handle for months.
- Keep it away from perfume and water.
- Condition the leather every few months.
`,
    coverImage: '/images/blog-leather-bag-care.jpg',
    category: 'guides',
    tags: ['bags', 'leather', 'care'],
    author: 'Editor',
    seo: { title: 'How to Care for Leather Bags | Care Guide', description: 'Cleaning, storing and protecting your leather bag so it lasts for years.' },
    relatedProducts: ['tan-leather-tote-bag'],
    status: 'published',
    publishedAt: '2026-11-12T00:00:00.000Z',
  },
];
