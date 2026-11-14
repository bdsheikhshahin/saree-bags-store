'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import type { Order } from '@ecommerce/shared';
import { AdminCard, Badge, ErrorBox, Field, btnStyle } from '@/components/admin/ui';
import { formatBdt } from '@/components/ProductCard';
import { adminJson } from '@/lib/admin';

export default function AdminOrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Order['status']>('pending');
  const [paymentStatus, setPaymentStatus] = useState<Order['paymentStatus']>('pending');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminJson<Order>(`/api/admin/orders/${orderId}`)
      .then((o) => {
        setOrder(o);
        setStatus(o.status);
        setPaymentStatus(o.paymentStatus);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load order'));
  }, [orderId]);

  async function save(): Promise<void> {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const updated = await adminJson<Order>(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, paymentStatus }),
      });
      setOrder(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  if (error) return <ErrorBox message={error} />;
  if (!order) return <p>Loading order…</p>;

  return (
    <div>
      <p><Link href="/admin/orders">← All orders</Link></p>
      <h1 style={{ marginTop: 0 }}>Order {order.orderId}</h1>
      <ErrorBox message={error} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        <AdminCard title="Items">
          <table>
            <thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={i}>
                  <td>{item.name}{item.variant ? <><br /><span style={{ color: '#666', fontSize: 12 }}>{item.variant}</span></> : null}</td>
                  <td>{item.quantity}</td>
                  <td>{formatBdt(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>Subtotal: {formatBdt(order.subtotal)}<br />Delivery: {order.deliveryFee === 0 ? 'Free' : formatBdt(order.deliveryFee)}<br /><strong>Total: {formatBdt(order.total)}</strong></p>
        </AdminCard>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <AdminCard title="Customer">
            <p style={{ marginTop: 0 }}>
              <strong>{order.customer.name}</strong><br />
              {order.customer.phone}<br />
              {order.customer.email ? <>{order.customer.email}<br /></> : null}
              {order.customer.address}
            </p>
            <p style={{ marginBottom: 0 }}>
              Payment: {order.paymentMethod} · <Badge tone={order.paymentStatus === 'paid' ? 'green' : 'amber'}>{order.paymentStatus}</Badge><br />
              Placed: {order.createdAt ? new Date(order.createdAt).toLocaleString('en-GB') : '—'}
            </p>
          </AdminCard>

          <AdminCard title="Update status">
            <Field label="Order status">
              <select value={status} onChange={(e) => setStatus(e.target.value as Order['status'])}>
                {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Payment status">
              <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as Order['paymentStatus'])}>
                {['pending', 'paid', 'failed', 'refunded'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <button type="button" style={btnStyle} onClick={() => void save()} disabled={saving}>
              {saving ? 'Saving…' : 'Save status'}
            </button>
            {saved ? <p style={{ color: '#166534' }}>Status updated.</p> : null}
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
