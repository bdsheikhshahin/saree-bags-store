'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { HomepageSection, Product, SectionAutoRule, SectionType } from '@ecommerce/shared';
import { SECTION_AUTO_RULES, SECTION_TYPES } from '@ecommerce/shared';
import { AdminCard, Badge, ErrorBox, Field, btnDangerStyle, btnGhostStyle, btnStyle } from '@/components/admin/ui';
import MarkdownEditor from '@/components/MarkdownEditor';
import { adminJson } from '@/lib/admin';

type FormState = {
  title: string; description: string; type: SectionType; mode: 'auto' | 'manual';
  productSlugs: string[]; autoRule: SectionAutoRule; enabled: boolean;
};

const emptyForm: FormState = {
  title: '', description: '', type: 'exclusive-offer', mode: 'auto', productSlugs: [], autoRule: 'highest-discount', enabled: true,
};

const TYPE_LABELS: Record<SectionType, string> = Object.fromEntries(
  SECTION_TYPES.map((t) => [t.id, t.label]),
) as Record<SectionType, string>;

export default function AdminSectionsPage() {
  const [items, setItems] = useState<HomepageSection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<HomepageSection | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load(): Promise<void> {
    setLoading(true);
    try {
      const [sections, prods] = await Promise.all([
        adminJson<HomepageSection[]>('/api/admin/sections'),
        adminJson<Product[]>('/api/admin/products'),
      ]);
      setItems(sections);
      setProducts(prods);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load sections');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  function startNew(): void { setForm(emptyForm); setEditing('new'); }
  function startEdit(s: HomepageSection): void {
    setForm({
      title: s.title, description: s.description ?? '', type: s.type, mode: s.mode,
      productSlugs: s.productSlugs ?? [], autoRule: s.autoRule ?? 'highest-discount',
      enabled: s.enabled,
    });
    setEditing(s);
  }

  async function save(e: FormEvent): Promise<void> {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = {
        title: form.title.trim(), description: form.description.trim() || undefined, type: form.type, mode: form.mode,
        productSlugs: form.mode === 'manual' ? form.productSlugs : [],
        autoRule: form.mode === 'auto' ? form.autoRule : undefined,
        order: editing === 'new' ? (items.length ? Math.max(...items.map((s) => s.order)) + 1 : 1) : (editing as HomepageSection).order,
        enabled: form.enabled,
      };
      if (editing === 'new') {
        await adminJson('/api/admin/sections', { method: 'POST', body: JSON.stringify(body) });
      } else if (editing) {
        await adminJson(`/api/admin/sections/${editing._id}`, { method: 'PUT', body: JSON.stringify(body) });
      }
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function toggleEnabled(s: HomepageSection): Promise<void> {
    try {
      await adminJson(`/api/admin/sections/${s._id}`, { method: 'PUT', body: JSON.stringify({ enabled: !s.enabled }) });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  }

  async function move(s: HomepageSection, dir: -1 | 1): Promise<void> {
    const sorted = [...items].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((x) => x._id === s._id);
    const swapWith = sorted[idx + dir];
    if (!swapWith) return;
    const ids = sorted.map((x) => x._id as string);
    [ids[idx], ids[idx + dir]] = [ids[idx + dir], ids[idx]];
    try {
      setItems(await adminJson<HomepageSection[]>('/api/admin/sections/reorder', { method: 'POST', body: JSON.stringify({ ids }) }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reorder failed');
    }
  }

  async function remove(s: HomepageSection): Promise<void> {
    if (!window.confirm(`Delete section “${s.title}”? The homepage will no longer show it.`)) return;
    try {
      await adminJson(`/api/admin/sections/${s._id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));
  const toggleProduct = (slug: string) =>
    setForm((f) => ({
      ...f,
      productSlugs: f.productSlugs.includes(slug)
        ? f.productSlugs.filter((s) => s !== slug)
        : [...f.productSlugs, slug],
    }));

  if (loading) return <p>Loading homepage sections…</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ marginTop: 0 }}>Homepage Sections ({items.length})</h1>
        <button type="button" style={btnStyle} onClick={startNew}>+ Add section</button>
      </div>
      <p style={{ color: '#666', marginTop: 0 }}>
        Sections appear on the store homepage in this order. Pick products manually, or let an auto-rule fill the section — no code changes needed.
      </p>
      <ErrorBox message={error} />

      {editing ? (
        <AdminCard title={editing === 'new' ? 'Add section' : `Edit: ${editing.title}`}>
          <form onSubmit={save}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Field label="Section title">
                <input value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="Exclusive Offer" required />
              </Field>
              <Field label="Section type">
                <select value={form.type} onChange={(e) => set({ type: e.target.value as SectionType })}>
                  {SECTION_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Description (optional)" hint="Short text shown under the section title on the homepage. Markdown is supported.">
              <MarkdownEditor value={form.description} onChange={(description) => set({ description })} rows={4} minHeight={120} placeholder="e.g. Our biggest discounts this week…" />
            </Field>
            <Field label="How are products chosen?">
              <div style={{ display: 'flex', gap: 16 }}>
                <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontWeight: 400 }}>
                  <input type="radio" checked={form.mode === 'auto'} onChange={() => set({ mode: 'auto' })} /> Auto-rule
                </label>
                <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontWeight: 400 }}>
                  <input type="radio" checked={form.mode === 'manual'} onChange={() => set({ mode: 'manual' })} /> Pick products manually
                </label>
              </div>
            </Field>
            {form.mode === 'auto' ? (
              <Field label="Auto-rule">
                <select value={form.autoRule} onChange={(e) => set({ autoRule: e.target.value as SectionAutoRule })}>
                  {SECTION_AUTO_RULES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </Field>
            ) : (
              <Field label="Products in this section (in the order you tick them)">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflow: 'auto', border: '1px solid #eee', borderRadius: 6, padding: 10 }}>
                  {products.map((p) => (
                    <label key={p.slug} style={{ display: 'flex', gap: 6, alignItems: 'center', fontWeight: 400 }}>
                      <input type="checkbox" checked={form.productSlugs.includes(p.slug)} onChange={() => toggleProduct(p.slug)} />
                      {p.name} — ৳{p.price.toLocaleString('en-IN')}
                    </label>
                  ))}
                </div>
              </Field>
            )}
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 16 }}>
              <input type="checkbox" checked={form.enabled} onChange={(e) => set({ enabled: e.target.checked })} />
              Enabled (visible on the homepage)
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" style={btnStyle} disabled={saving}>{saving ? 'Saving…' : 'Save section'}</button>
              <button type="button" style={btnGhostStyle} onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </form>
        </AdminCard>
      ) : null}

      <AdminCard>
        <table>
          <thead><tr><th>Order</th><th>Section</th><th>Type</th><th>Products</th><th>Status</th><th /></tr></thead>
          <tbody>
            {[...items].sort((a, b) => a.order - b.order).map((s, i, arr) => (
              <tr key={s._id}>
                <td>
                  <button type="button" style={btnGhostStyle} disabled={i === 0} onClick={() => void move(s, -1)} title="Move up">↑</button>{' '}
                  <button type="button" style={btnGhostStyle} disabled={i === arr.length - 1} onClick={() => void move(s, 1)} title="Move down">↓</button>
                </td>
                <td><strong>{s.title}</strong></td>
                <td>{TYPE_LABELS[s.type]}</td>
                <td style={{ fontSize: 13, color: '#555' }}>
                  {s.mode === 'manual'
                    ? `Manual · ${(s.productSlugs ?? []).length} picked`
                    : `Auto · ${SECTION_AUTO_RULES.find((r) => r.id === s.autoRule)?.label ?? s.autoRule}`}
                </td>
                <td>
                  <button type="button" style={btnGhostStyle} onClick={() => void toggleEnabled(s)}>
                    {s.enabled ? <Badge tone="green">Enabled</Badge> : <Badge tone="grey">Disabled</Badge>}
                  </button>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button type="button" style={btnGhostStyle} onClick={() => startEdit(s)}>Edit</button>{' '}
                  <button type="button" style={btnDangerStyle} onClick={() => void remove(s)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 ? <p style={{ color: '#666' }}>No sections yet — add one to show it on the homepage.</p> : null}
      </AdminCard>
    </div>
  );
}
