'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { Order } from '@ecommerce/shared';
import { AdminCard, Badge, ErrorBox } from '@/components/admin/ui';
import { formatBdt } from '@/components/ProductCard';
import { adminJson } from '@/lib/admin';

const STATUS_TONES: Record<string, 'grey' | 'green' | 'amber' | 'red' | 'blue'> = {
  pending: 'amber', confirmed: 'blue', shipped: 'blue', delivered: 'green', cancelled: 'red',
};

export default function AdminOrdersPage() {
  const [items, setItems] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    adminJson<Order[]>('/api/admin/orders')
      .then(setItems)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load orders'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => (filter === 'all' ? items : items.filter((o) => o.status === filter)),
    [items, filter],
  );

  if (loading) return <p>Loading orders…</p>;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Orders ({items.length})</h1>
      <ErrorBox message={error} />
      <div style={{ margin: '16px 0' }}>
        <select style={{ maxWidth: 220 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All statuses</option>
          {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <AdminCard>
        {filtered.length === 0 ? (
          <p style={{ color: '#666' }}>No orders yet. Orders placed from the storefront checkout will appear here.</p>
        ) : (
          <table>
            <thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.orderId}>
                  <td><Link href={`/admin/orders/${o.orderId}`}>{o.orderId}</Link></td>
                  <td>{o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-GB') : '—'}</td>
                  <td>{o.customer.name}<br /><span style={{ color: '#666', fontSize: 12 }}>{o.customer.phone}</span></td>
                  <td>{o.items.reduce((n, i) => n + i.quantity, 0)}</td>
                  <td>{formatBdt(o.total)}</td>
                  <td>{o.paymentMethod} ({o.paymentStatus})</td>
                  <td><Badge tone={STATUS_TONES[o.status] ?? 'grey'}>{o.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AdminCard>
    </div>
  );
}
