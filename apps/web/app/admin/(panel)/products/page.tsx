'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { Category, Product, ProductBadges } from '@ecommerce/shared';
import { AdminCard, Badge, ErrorBox, Field, btnDangerStyle, btnGhostStyle, btnStyle } from '@/components/admin/ui';
import MarkdownEditor from '@/components/MarkdownEditor';
import { formatBdt } from '@/components/ProductCard';
import { API_URL, adminJson, getToken, slugify } from '@/lib/admin';

type FormState = {
  name: string; slug: string; sku: string; description: string;
  price: string; compareAtPrice: string; category: string; stock: string;
  images: string; variants: string; tags: string;
  badges: ProductBadges; rating: string; salesCount: string;
  seoTitle: string; seoDescription: string; isPublished: boolean;
};

const emptyForm: FormState = {
  name: '', slug: '', sku: '', description: '', price: '', compareAtPrice: '',
  category: 'saree', stock: '0', images: '', variants: '', tags: '',
  badges: {}, rating: '', salesCount: '',
  seoTitle: '', seoDescription: '', isPublished: true,
};

function discountPct(p: Product): number | null {
  if (!p.compareAtPrice || p.compareAtPrice <= p.price) return null;
  return Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100);
}

function toForm(p: Product): FormState {
  return {
    name: p.name, slug: p.slug, sku: p.sku, description: p.description,
    price: String(p.price), compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : '',
    category: p.category, stock: String(p.stock),
    images: (p.images ?? []).join('\n'),
    variants: (p.variants ?? []).map((v) => `${v.name}|${v.priceDelta ?? ''}|${v.stock ?? ''}`).join('\n'),
    tags: (p.tags ?? []).join(', '),
    badges: p.badges ?? {}, rating: p.rating ? String(p.rating) : '', salesCount: p.salesCount ? String(p.salesCount) : '',
    seoTitle: p.seo?.title ?? '', seoDescription: p.seo?.description ?? '',
    isPublished: p.isPublished ?? true,
  };
}

function fromForm(f: FormState): Record<string, unknown> {
  return {
    name: f.name.trim(), slug: f.slug.trim(), sku: f.sku.trim(), description: f.description.trim(),
    price: Number(f.price), compareAtPrice: f.compareAtPrice ? Number(f.compareAtPrice) : undefined,
    category: f.category, stock: Number(f.stock) || 0,
    images: f.images.split('\n').map((s) => s.trim()).filter(Boolean),
    variants: f.variants.split('\n').map((s) => s.trim()).filter(Boolean).map((line) => {
      const [name, delta, stock] = line.split('|').map((s) => s.trim());
      return { name, priceDelta: delta ? Number(delta) : undefined, stock: stock ? Number(stock) : undefined };
    }),
    tags: f.tags.split(',').map((s) => s.trim()).filter(Boolean),
    badges: f.badges,
    rating: f.rating ? Number(f.rating) : undefined,
    salesCount: f.salesCount ? Number(f.salesCount) : undefined,
    seo: { title: f.seoTitle || undefined, description: f.seoDescription || undefined },
    isPublished: f.isPublished,
  };
}

export default function AdminProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editing, setEditing] = useState<Product | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // First image in the form, for the upload preview thumbnail.
  const firstImage = form.images.split('\n').map((s) => s.trim()).find(Boolean) ?? '';

  async function uploadImage(file: File): Promise<void> {
    setUploading(true);
    setUploadError(null);
    try {
      const token = getToken();
      const data = new FormData();
      data.append('image', file);
      // Raw fetch, not adminFetch/adminJson: FormData needs no JSON Content-Type.
      const res = await fetch(`${API_URL}/api/admin/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: data,
      });
      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: unknown };
      if (!res.ok || !json.url) {
        throw new Error(typeof json.error === 'string' ? json.error : 'Upload failed');
      }
      set({ images: [json.url, form.images].filter(Boolean).join('\n') });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const [products, cats] = await Promise.all([
        adminJson<Product[]>('/api/admin/products'),
        adminJson<Category[]>('/api/admin/categories'),
      ]);
      setItems(products);
      setCategories(cats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load products');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.tags ?? []).some((t) => t.toLowerCase().includes(q));
    });
  }, [items, search, categoryFilter]);

  function startNew(): void {
    setForm(emptyForm);
    setEditing('new');
  }

  function startEdit(p: Product): void {
    setForm(toForm(p));
    setEditing(p);
  }

  async function save(e: FormEvent): Promise<void> {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = fromForm(form);
      if (editing === 'new') {
        await adminJson('/api/admin/products', { method: 'POST', body: JSON.stringify(body) });
      } else if (editing) {
        await adminJson(`/api/admin/products/${editing.slug}`, { method: 'PUT', body: JSON.stringify(body) });
      }
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function remove(p: Product): Promise<void> {
    if (!window.confirm(`Delete “${p.name}”? This cannot be undone.`)) return;
    try {
      await adminJson(`/api/admin/products/${p.slug}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));
  const setBadge = (key: keyof ProductBadges, value: boolean) =>
    setForm((f) => ({ ...f, badges: { ...f.badges, [key]: value } }));

  if (loading) return <p>Loading products…</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ marginTop: 0 }}>Products ({items.length})</h1>
        <button type="button" style={btnStyle} onClick={startNew}>+ Add product</button>
      </div>
      <ErrorBox message={error} />

      {editing ? (
        <AdminCard title={editing === 'new' ? 'Add product' : `Edit: ${editing.name}`}>
          <form onSubmit={save}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Field label="Name">
                <input value={form.name} onChange={(e) => { const name = e.target.value; set({ name, slug: editing === 'new' ? slugify(name) : form.slug }); }} required />
              </Field>
              <Field label="Slug">
                <input value={form.slug} onChange={(e) => set({ slug: slugify(e.target.value) })} required />
              </Field>
              <Field label="SKU">
                <input value={form.sku} onChange={(e) => set({ sku: e.target.value })} required />
              </Field>
              <Field label="Category">
                <select value={form.category} onChange={(e) => set({ category: e.target.value })}>
                  {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Price (৳)">
                <input type="number" min="0" value={form.price} onChange={(e) => set({ price: e.target.value })} required />
              </Field>
              <Field label="Compare-at price / MRP (৳)">
                <input type="number" min="0" value={form.compareAtPrice} onChange={(e) => set({ compareAtPrice: e.target.value })} />
              </Field>
              <Field label="Stock">
                <input type="number" min="0" value={form.stock} onChange={(e) => set({ stock: e.target.value })} />
              </Field>
              <Field label="Rating (0–5)">
                <input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(e) => set({ rating: e.target.value })} />
              </Field>
              <Field label="Units sold">
                <input type="number" min="0" value={form.salesCount} onChange={(e) => set({ salesCount: e.target.value })} />
              </Field>
              <Field label="Tags (comma separated)">
                <input value={form.tags} onChange={(e) => set({ tags: e.target.value })} placeholder="jamdani, wedding, handloom" />
              </Field>
            </div>
            <Field label="Description" hint="Markdown — use the toolbar to format, or Preview to see how it will look on the product page.">
              <MarkdownEditor value={form.description} onChange={(description) => set({ description })} required />
            </Field>
            <Field label="Upload image" hint="JPG, PNG, WebP or GIF, max 5 MB. The uploaded file is saved under /images/ and its URL is added to the image list below.">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadImage(file);
                  e.target.value = '';
                }}
              />
              {uploading ? <p style={{ color: '#666', fontSize: 13, margin: '6px 0 0' }}>Uploading…</p> : null}
              {uploadError ? <p style={{ color: '#b91c1c', fontSize: 13, margin: '6px 0 0' }}>{uploadError}</p> : null}
              {firstImage ? (
                <img
                  src={firstImage}
                  alt="Product preview"
                  style={{ display: 'block', marginTop: 8, maxWidth: 160, maxHeight: 160, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd' }}
                />
              ) : null}
            </Field>
            <Field label="Images (one path per line)" hint="Uploaded images are added here automatically — or paste a path manually, e.g. /images/red-jamdani-saree.jpg. The first line is the main image.">
              <textarea rows={2} value={form.images} onChange={(e) => set({ images: e.target.value })} />
            </Field>
            <Field label="Variants (one per line: Name | price delta | stock)" hint="Example: Blouse piece: Included | 0 | 12">
              <textarea rows={2} value={form.variants} onChange={(e) => set({ variants: e.target.value })} />
            </Field>
            <Field label="Homepage badges">
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {(['bestSeller', 'trending', 'hotSale', 'offer'] as const).map((key) => (
                  <label key={key} style={{ display: 'flex', gap: 6, alignItems: 'center', fontWeight: 400 }}>
                    <input type="checkbox" checked={Boolean(form.badges[key])} onChange={(e) => setBadge(key, e.target.checked)} />
                    {key === 'bestSeller' ? 'Best Seller' : key === 'trending' ? 'Trending' : key === 'hotSale' ? 'Hot Sale' : 'Offer'}
                  </label>
                ))}
              </div>
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Field label="SEO title">
                <input value={form.seoTitle} onChange={(e) => set({ seoTitle: e.target.value })} />
              </Field>
              <Field label="SEO description">
                <input value={form.seoDescription} onChange={(e) => set({ seoDescription: e.target.value })} />
              </Field>
            </div>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 16 }}>
              <input type="checkbox" checked={form.isPublished} onChange={(e) => set({ isPublished: e.target.checked })} />
              Published (visible in the store)
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" style={btnStyle} disabled={saving}>{saving ? 'Saving…' : 'Save product'}</button>
              <button type="button" style={btnGhostStyle} onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </form>
        </AdminCard>
      ) : null}

      <div style={{ display: 'flex', gap: 12, margin: '16px 0' }}>
        <input style={{ maxWidth: 320 }} placeholder="Search name, SKU or tag…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select style={{ maxWidth: 200 }} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
      </div>

      <AdminCard>
        <table>
          <thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Category</th><th>Badges</th><th>Status</th><th /></tr></thead>
          <tbody>
            {filtered.map((p) => {
              const pct = discountPct(p);
              return (
                <tr key={p.slug}>
                  <td><strong>{p.name}</strong><br /><span style={{ color: '#666', fontSize: 12 }}>{p.sku} · /{p.slug}</span></td>
                  <td>
                    {formatBdt(p.price)}{' '}
                    {p.compareAtPrice ? <s style={{ color: '#666' }}>{formatBdt(p.compareAtPrice)}</s> : null}
                    {pct !== null ? <span style={{ color: '#92400e', fontWeight: 700 }}> −{pct}%</span> : null}
                  </td>
                  <td style={{ color: p.stock <= 5 ? '#b91c1c' : 'inherit', fontWeight: p.stock <= 5 ? 700 : 400 }}>{p.stock}</td>
                  <td>{p.category}</td>
                  <td>
                    {p.badges?.bestSeller ? <Badge tone="green">Best Seller</Badge> : null}{' '}
                    {p.badges?.trending ? <Badge tone="blue">Trending</Badge> : null}{' '}
                    {p.badges?.hotSale ? <Badge tone="red">Hot Sale</Badge> : null}{' '}
                    {p.badges?.offer ? <Badge tone="amber">Offer</Badge> : null}
                  </td>
                  <td>{p.isPublished === false ? <Badge tone="grey">Hidden</Badge> : <Badge tone="green">Live</Badge>}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button type="button" style={btnGhostStyle} onClick={() => startEdit(p)}>Edit</button>{' '}
                    <button type="button" style={btnDangerStyle} onClick={() => void remove(p)}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 ? <p style={{ color: '#666' }}>No products match the filter.</p> : null}
      </AdminCard>
    </div>
  );
}
