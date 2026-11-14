'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { Coupon, CouponType } from '@ecommerce/shared';
import { AdminCard, Badge, ErrorBox, Field, btnDangerStyle, btnGhostStyle, btnStyle } from '@/components/admin/ui';
import { adminJson } from '@/lib/admin';

type FormState = {
  code: string; type: CouponType; value: string; minOrder: string;
  expiresAt: string; usageLimit: string; active: boolean;
};

const emptyForm: FormState = {
  code: '', type: 'percent', value: '10', minOrder: '500',
  expiresAt: '', usageLimit: '', active: true,
};

function toInputValue(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 16);
}

export default function AdminCouponsPage() {
  const [items, setItems] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Coupon | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load(): Promise<void> {
    setLoading(true);
    try {
      setItems(await adminJson<Coupon[]>('/api/admin/coupons'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load coupons');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  function startNew(): void { setForm(emptyForm); setEditing('new'); }
  function startEdit(c: Coupon): void {
    setForm({
      code: c.code, type: c.type, value: String(c.value), minOrder: String(c.minOrder),
      expiresAt: toInputValue(c.expiresAt), usageLimit: c.usageLimit ? String(c.usageLimit) : '', active: c.active,
    });
    setEditing(c);
  }

  async function save(e: FormEvent): Promise<void> {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: Number(form.value),
        minOrder: Number(form.minOrder) || 0,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        active: form.active,
      };
      if (editing === 'new') {
        await adminJson('/api/admin/coupons', { method: 'POST', body: JSON.stringify(body) });
      } else if (editing) {
        await adminJson(`/api/admin/coupons/${editing._id}`, { method: 'PUT', body: JSON.stringify(body) });
      }
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function remove(c: Coupon): Promise<void> {
    if (!window.confirm(`Delete coupon “${c.code}”? Orders already placed with it keep their discount.`)) return;
    try {
      await adminJson(`/api/admin/coupons/${c._id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  async function toggleActive(c: Coupon): Promise<void> {
    try {
      await adminJson(`/api/admin/coupons/${c._id}`, { method: 'PUT', body: JSON.stringify({ active: !c.active }) });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  }

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));
  const expired = (c: Coupon): boolean => Boolean(c.expiresAt && new Date(c.expiresAt).getTime() < Date.now());
  const exhausted = (c: Coupon): boolean => c.usageLimit != null && c.usageCount >= c.usageLimit;

  if (loading) return <p>Loading coupons…</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ marginTop: 0 }}>Coupons ({items.length})</h1>
        <button type="button" style={btnStyle} onClick={startNew}>+ Add coupon</button>
      </div>
      <p style={{ color: '#666', marginTop: 0 }}>
        Discount codes shoppers can apply at checkout. Validation happens server-side — the discount shown at checkout is always re-checked when the order is created.
      </p>
      <ErrorBox message={error} />

      {editing ? (
        <AdminCard title={editing === 'new' ? 'Add coupon' : `Edit: ${editing.code}`}>
          <form onSubmit={save}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Field label="Code" hint="Uppercase letters/numbers, e.g. WELCOME10.">
                <input value={form.code} onChange={(e) => set({ code: e.target.value.toUpperCase() })} placeholder="WELCOME10" required disabled={editing !== 'new'} />
              </Field>
              <Field label="Discount type">
                <select value={form.type} onChange={(e) => set({ type: e.target.value as CouponType })}>
                  <option value="percent">Percent (%) off</option>
                  <option value="fixed">Fixed amount (৳) off</option>
                </select>
              </Field>
              <Field label={form.type === 'percent' ? 'Discount (%)' : 'Discount (৳)'}>
                <input type="number" min={1} value={form.value} onChange={(e) => set({ value: e.target.value })} required />
              </Field>
              <Field label="Minimum order (৳)" hint="0 = no minimum.">
                <input type="number" min={0} value={form.minOrder} onChange={(e) => set({ minOrder: e.target.value })} />
              </Field>
              <Field label="Expires at (optional)">
                <input type="datetime-local" value={form.expiresAt} onChange={(e) => set({ expiresAt: e.target.value })} />
              </Field>
              <Field label="Usage limit (optional)" hint="Blank = unlimited.">
                <input type="number" min={1} value={form.usageLimit} onChange={(e) => set({ usageLimit: e.target.value })} />
              </Field>
            </div>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 16 }}>
              <input type="checkbox" checked={form.active} onChange={(e) => set({ active: e.target.checked })} />
              Active
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" style={btnStyle} disabled={saving}>{saving ? 'Saving…' : 'Save coupon'}</button>
              <button type="button" style={btnGhostStyle} onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </form>
        </AdminCard>
      ) : null}

      <AdminCard>
        <table>
          <thead><tr><th>Code</th><th>Discount</th><th>Min order</th><th>Expires</th><th>Used</th><th>Status</th><th /></tr></thead>
          <tbody>
            {items.map((c) => (
              <tr key={c._id}>
                <td><strong>{c.code}</strong></td>
                <td>{c.type === 'percent' ? `${c.value}%` : `৳${c.value.toLocaleString('en-IN')}`}</td>
                <td>৳{c.minOrder.toLocaleString('en-IN')}</td>
                <td style={{ fontSize: 13 }}>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-GB') : '—'}</td>
                <td style={{ fontSize: 13 }}>{c.usageCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
                <td>
                  <button type="button" style={btnGhostStyle} onClick={() => void toggleActive(c)}>
                    {!c.active ? <Badge tone="grey">Disabled</Badge>
                      : expired(c) ? <Badge tone="red">Expired</Badge>
                      : exhausted(c) ? <Badge tone="amber">Limit reached</Badge>
                      : <Badge tone="green">Active</Badge>}
                  </button>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button type="button" style={btnGhostStyle} onClick={() => startEdit(c)}>Edit</button>{' '}
                  <button type="button" style={btnDangerStyle} onClick={() => void remove(c)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 ? <p style={{ color: '#666' }}>No coupons yet — add one, e.g. WELCOME10 for 10% off orders over ৳500.</p> : null}
      </AdminCard>
    </div>
  );
}
