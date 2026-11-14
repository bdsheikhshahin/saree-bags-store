'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Order, Product } from '@ecommerce/shared';
import { AdminCard, ErrorBox, cardStyle } from '@/components/admin/ui';
import { adminJson } from '@/lib/admin';
import { formatBdt } from '@/components/ProductCard';

interface Stats {
  products: number;
  orders: number;
  blogPosts: number;
  revenue: number;
  lowStock: Product[];
  recentOrders: Order[];
}

function Stat({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={cardStyle}>
        <p style={{ margin: 0, fontSize: 13, color: '#666' }}>{label}</p>
        <p style={{ margin: '6px 0 0', fontSize: 28, fontWeight: 700 }}>{value}</p>
      </div>
    </Link>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminJson<Stats>('/api/admin/stats')
      .then(setStats)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load stats'));
  }, []);

  if (error) return <ErrorBox message={error} />;
  if (!stats) return <p>Loading dashboard…</p>;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <Stat label="Products" value={String(stats.products)} href="/admin/products" />
        <Stat label="Orders" value={String(stats.orders)} href="/admin/orders" />
        <Stat label="Total revenue" value={formatBdt(stats.revenue)} href="/admin/orders" />
        <Stat label="Blog posts" value={String(stats.blogPosts)} href="/admin/blog" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        <AdminCard title="Recent orders" action={<Link href="/admin/orders">View all →</Link>}>
          {stats.recentOrders.length === 0 ? (
            <p style={{ color: '#666' }}>No orders yet. Orders placed from the storefront checkout will appear here.</p>
          ) : (
            <table>
              <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                {stats.recentOrders.map((o) => (
                  <tr key={o.orderId}>
                    <td><Link href={`/admin/orders/${o.orderId}`}>{o.orderId}</Link></td>
                    <td>{o.customer.name}</td>
                    <td>{formatBdt(o.total)}</td>
                    <td>{o.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </AdminCard>

        <AdminCard title="Low stock (≤ 5)" action={<Link href="/admin/products">Manage products →</Link>}>
          {stats.lowStock.length === 0 ? (
            <p style={{ color: '#666' }}>Nothing low on stock.</p>
          ) : (
            <table>
              <thead><tr><th>Product</th><th>Stock</th><th>Price</th></tr></thead>
              <tbody>
                {stats.lowStock.map((p) => (
                  <tr key={p.slug}>
                    <td>{p.name}</td>
                    <td style={{ color: p.stock === 0 ? '#b91c1c' : '#92400e', fontWeight: 700 }}>{p.stock}</td>
                    <td>{formatBdt(p.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </AdminCard>
      </div>
    </div>
  );
}
