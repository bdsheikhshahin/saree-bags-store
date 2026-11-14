'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { Category } from '@ecommerce/shared';
import { AdminCard, Badge, ErrorBox, Field, btnDangerStyle, btnGhostStyle, btnStyle } from '@/components/admin/ui';
import MarkdownEditor from '@/components/MarkdownEditor';
import { adminJson, slugify } from '@/lib/admin';
import { stripMarkdown } from '@/lib/markdown';

type FormState = {
  name: string; slug: string; description: string; parent: string;
  image: string; seoTitle: string; seoDescription: string; isPublished: boolean;
};

const emptyForm: FormState = {
  name: '', slug: '', description: '', parent: '', image: '', seoTitle: '', seoDescription: '', isPublished: true,
};

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Category | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load(): Promise<void> {
    setLoading(true);
    try {
      setItems(await adminJson<Category[]>('/api/admin/categories'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load categories');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  function startNew(): void { setForm(emptyForm); setEditing('new'); }
  function startEdit(c: Category): void {
    setForm({
      name: c.name, slug: c.slug, description: c.description ?? '', parent: c.parent ?? '',
      image: c.image ?? '', seoTitle: c.seo?.title ?? '', seoDescription: c.seo?.description ?? '',
      isPublished: c.isPublished ?? true,
    });
    setEditing(c);
  }

  async function save(e: FormEvent): Promise<void> {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = {
        name: form.name.trim(), slug: form.slug.trim(), description: form.description || undefined,
        parent: form.parent || null, image: form.image || undefined,
        seo: { title: form.seoTitle || undefined, description: form.seoDescription || undefined },
        isPublished: form.isPublished,
      };
      if (editing === 'new') {
        await adminJson('/api/admin/categories', { method: 'POST', body: JSON.stringify(body) });
      } else if (editing) {
        await adminJson(`/api/admin/categories/${editing.slug}`, { method: 'PUT', body: JSON.stringify(body) });
      }
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function remove(c: Category): Promise<void> {
    if (!window.confirm(`Delete category “${c.name}”? Products in this category will keep the old category slug.`)) return;
    try {
      await adminJson(`/api/admin/categories/${c.slug}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));
  if (loading) return <p>Loading categories…</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ marginTop: 0 }}>Categories ({items.length})</h1>
        <button type="button" style={btnStyle} onClick={startNew}>+ Add category</button>
      </div>
      <p style={{ color: '#666', marginTop: 0 }}>Categories are generic — add any category (electronics, home, etc.) without code changes.</p>
      <ErrorBox message={error} />

      {editing ? (
        <AdminCard title={editing === 'new' ? 'Add category' : `Edit: ${editing.name}`}>
          <form onSubmit={save}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Field label="Name">
                <input value={form.name} onChange={(e) => { const name = e.target.value; set({ name, slug: editing === 'new' ? slugify(name) : form.slug }); }} required />
              </Field>
              <Field label="Slug">
                <input value={form.slug} onChange={(e) => set({ slug: slugify(e.target.value) })} required />
              </Field>
              <Field label="Parent category (optional)">
                <select value={form.parent} onChange={(e) => set({ parent: e.target.value })}>
                  <option value="">— Top level —</option>
                  {items.filter((c) => editing === 'new' || c.slug !== (editing as Category).slug).map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Image path (optional)">
                <input value={form.image} onChange={(e) => set({ image: e.target.value })} placeholder="/images/category.jpg" />
              </Field>
            </div>
            <Field label="Description" hint="Markdown — use the toolbar to format, or Preview to see how it will look on the category page.">
              <MarkdownEditor value={form.description} onChange={(description) => set({ description })} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Field label="SEO title"><input value={form.seoTitle} onChange={(e) => set({ seoTitle: e.target.value })} /></Field>
              <Field label="SEO description"><input value={form.seoDescription} onChange={(e) => set({ seoDescription: e.target.value })} /></Field>
            </div>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 16 }}>
              <input type="checkbox" checked={form.isPublished} onChange={(e) => set({ isPublished: e.target.checked })} />
              Published (visible in the store)
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" style={btnStyle} disabled={saving}>{saving ? 'Saving…' : 'Save category'}</button>
              <button type="button" style={btnGhostStyle} onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </form>
        </AdminCard>
      ) : null}

      <AdminCard>
        <table>
          <thead><tr><th>Name</th><th>Slug</th><th>Parent</th><th>Status</th><th /></tr></thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.slug}>
                <td><strong>{c.name}</strong><br /><span style={{ color: '#666', fontSize: 12 }}>{stripMarkdown(c.description ?? '')}</span></td>
                <td>/{c.slug}</td>
                <td>{c.parent ?? '—'}</td>
                <td>{c.isPublished === false ? <Badge tone="grey">Hidden</Badge> : <Badge tone="green">Live</Badge>}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button type="button" style={btnGhostStyle} onClick={() => startEdit(c)}>Edit</button>{' '}
                  <button type="button" style={btnDangerStyle} onClick={() => void remove(c)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminCard>
    </div>
  );
}
