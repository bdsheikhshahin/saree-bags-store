'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { BlogPost, Product } from '@ecommerce/shared';
import { AdminCard, Badge, ErrorBox, Field, btnDangerStyle, btnGhostStyle, btnStyle } from '@/components/admin/ui';
import MarkdownEditor from '@/components/MarkdownEditor';
import { adminJson, slugify } from '@/lib/admin';

type FormState = {
  title: string; slug: string; excerpt: string; content: string;
  coverImage: string; category: string; tags: string; author: string;
  status: 'draft' | 'published'; relatedProducts: string[];
  seoTitle: string; seoDescription: string;
};

const emptyForm: FormState = {
  title: '', slug: '', excerpt: '', content: '', coverImage: '', category: 'guides',
  tags: '', author: 'Editor', status: 'draft', relatedProducts: [], seoTitle: '', seoDescription: '',
};

export default function AdminBlogPage() {
  const [items, setItems] = useState<BlogPost[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<BlogPost | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load(): Promise<void> {
    setLoading(true);
    try {
      const [posts, prods] = await Promise.all([
        adminJson<BlogPost[]>('/api/admin/blog'),
        adminJson<Product[]>('/api/admin/products'),
      ]);
      setItems(posts);
      setProducts(prods);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load blog posts');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  function startNew(): void { setForm(emptyForm); setEditing('new'); }
  function startEdit(p: BlogPost): void {
    setForm({
      title: p.title, slug: p.slug, excerpt: p.excerpt, content: p.content,
      coverImage: p.coverImage ?? '', category: p.category, tags: (p.tags ?? []).join(', '),
      author: p.author, status: p.status, relatedProducts: p.relatedProducts ?? [],
      seoTitle: p.seo?.title ?? '', seoDescription: p.seo?.description ?? '',
    });
    setEditing(p);
  }

  async function save(e: FormEvent): Promise<void> {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = {
        title: form.title.trim(), slug: form.slug.trim(), excerpt: form.excerpt.trim(),
        content: form.content, coverImage: form.coverImage || undefined, category: form.category,
        tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean), author: form.author || 'Editor',
        status: form.status, relatedProducts: form.relatedProducts,
        seo: { title: form.seoTitle || undefined, description: form.seoDescription || undefined },
      };
      if (editing === 'new') {
        await adminJson('/api/admin/blog', { method: 'POST', body: JSON.stringify(body) });
      } else if (editing) {
        await adminJson(`/api/admin/blog/${editing.slug}`, { method: 'PUT', body: JSON.stringify(body) });
      }
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function remove(p: BlogPost): Promise<void> {
    if (!window.confirm(`Delete “${p.title}”?`)) return;
    try {
      await adminJson(`/api/admin/blog/${p.slug}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));
  const toggleRelated = (slug: string) =>
    setForm((f) => ({
      ...f,
      relatedProducts: f.relatedProducts.includes(slug)
        ? f.relatedProducts.filter((s) => s !== slug)
        : [...f.relatedProducts, slug],
    }));

  if (loading) return <p>Loading blog posts…</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ marginTop: 0 }}>Blog ({items.length})</h1>
        <button type="button" style={btnStyle} onClick={startNew}>+ New post</button>
      </div>
      <ErrorBox message={error} />

      {editing ? (
        <AdminCard title={editing === 'new' ? 'New blog post' : `Edit: ${editing.title}`}>
          <form onSubmit={save}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Field label="Title">
                <input value={form.title} onChange={(e) => { const title = e.target.value; set({ title, slug: editing === 'new' ? slugify(title) : form.slug }); }} required />
              </Field>
              <Field label="Slug">
                <input value={form.slug} onChange={(e) => set({ slug: slugify(e.target.value) })} required />
              </Field>
              <Field label="Category">
                <input value={form.category} onChange={(e) => set({ category: e.target.value })} required />
              </Field>
              <Field label="Author">
                <input value={form.author} onChange={(e) => set({ author: e.target.value })} />
              </Field>
              <Field label="Cover image path">
                <input value={form.coverImage} onChange={(e) => set({ coverImage: e.target.value })} placeholder="/images/blog-cover.jpg" />
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={(e) => set({ status: e.target.value as FormState['status'] })}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </Field>
            </div>
            <Field label="Excerpt / summary" hint="Short summary shown on the blog list. Markdown is supported — keep it to one or two sentences.">
              <MarkdownEditor value={form.excerpt} onChange={(excerpt) => set({ excerpt })} rows={4} minHeight={120} required />
            </Field>
            <Field label="Content (Markdown)" hint="Use the toolbar to format, or switch to Preview / Split to see how the post will look when published.">
              <MarkdownEditor value={form.content} onChange={(content) => set({ content })} title={form.title} required />
            </Field>
            <Field label="Tags (comma separated)">
              <input value={form.tags} onChange={(e) => set({ tags: e.target.value })} />
            </Field>
            <Field label="Related products">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflow: 'auto', border: '1px solid #eee', borderRadius: 6, padding: 10 }}>
                {products.map((p) => (
                  <label key={p.slug} style={{ display: 'flex', gap: 6, alignItems: 'center', fontWeight: 400 }}>
                    <input type="checkbox" checked={form.relatedProducts.includes(p.slug)} onChange={() => toggleRelated(p.slug)} />
                    {p.name}
                  </label>
                ))}
              </div>
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Field label="SEO title"><input value={form.seoTitle} onChange={(e) => set({ seoTitle: e.target.value })} /></Field>
              <Field label="SEO description"><input value={form.seoDescription} onChange={(e) => set({ seoDescription: e.target.value })} /></Field>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" style={btnStyle} disabled={saving}>{saving ? 'Saving…' : 'Save post'}</button>
              <button type="button" style={btnGhostStyle} onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </form>
        </AdminCard>
      ) : null}

      <AdminCard>
        <table>
          <thead><tr><th>Title</th><th>Category</th><th>Status</th><th>Published</th><th /></tr></thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.slug}>
                <td><strong>{p.title}</strong><br /><span style={{ color: '#666', fontSize: 12 }}>/{p.slug}</span></td>
                <td>{p.category}</td>
                <td>{p.status === 'published' ? <Badge tone="green">Published</Badge> : <Badge tone="grey">Draft</Badge>}</td>
                <td>{p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('en-GB') : '—'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button type="button" style={btnGhostStyle} onClick={() => startEdit(p)}>Edit</button>{' '}
                  <button type="button" style={btnDangerStyle} onClick={() => void remove(p)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 ? <p style={{ color: '#666' }}>No blog posts yet.</p> : null}
      </AdminCard>
    </div>
  );
}
