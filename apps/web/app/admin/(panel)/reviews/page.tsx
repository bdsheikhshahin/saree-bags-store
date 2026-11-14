'use client';

import { useEffect, useState } from 'react';
import type { Product, Review } from '@ecommerce/shared';
import { AdminCard, Badge, ErrorBox, btnDangerStyle, btnGhostStyle } from '@/components/admin/ui';
import { adminJson } from '@/lib/admin';

export default function AdminReviewsPage() {
  const [items, setItems] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load(): Promise<void> {
    setLoading(true);
    try {
      const [reviews, prods] = await Promise.all([
        adminJson<Review[]>('/api/admin/reviews'),
        adminJson<Product[]>('/api/admin/products'),
      ]);
      setItems(reviews);
      setProducts(prods);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load reviews');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const productName = (slug: string): string => products.find((p) => p.slug === slug)?.name ?? slug;

  async function setApproved(review: Review, approved: boolean): Promise<void> {
    setBusyId(review._id ?? null);
    setError(null);
    try {
      await adminJson(`/api/admin/reviews/${review._id}`, { method: 'PATCH', body: JSON.stringify({ approved }) });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update review');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(review: Review): Promise<void> {
    if (!window.confirm(`Delete this review by ${review.name}?`)) return;
    setBusyId(review._id ?? null);
    setError(null);
    try {
      await adminJson(`/api/admin/reviews/${review._id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete review');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p>Loading reviews…</p>;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Reviews</h1>
      <p>New reviews start unapproved and only appear on the storefront once approved. Approving or deleting a review updates the product&apos;s rating automatically.</p>
      <ErrorBox message={error} />
      <AdminCard title={`All reviews (${items.length})`}>
        {items.length === 0 ? (
          <p>No reviews yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {items.map((r) => (
              <li key={r._id} style={{ borderTop: '1px solid #eee', padding: '12px 0' }}>
                <p style={{ margin: '0 0 4px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <strong>{productName(r.productSlug)}</strong>
                  <Badge tone={r.approved ? 'green' : 'amber'}>{r.approved ? 'Approved' : 'Pending'}</Badge>
                  <span style={{ color: '#f59e0b' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  {r.createdAt ? <span style={{ color: '#666', fontSize: 13 }}>{new Date(r.createdAt).toLocaleString('en-GB')}</span> : null}
                </p>
                <p style={{ margin: '0 0 4px' }}><strong>{r.name}</strong> — {r.comment}</p>
                <p style={{ margin: 0, display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => void setApproved(r, !r.approved)} disabled={busyId === r._id} style={btnGhostStyle}>
                    {r.approved ? 'Unapprove' : 'Approve'}
                  </button>
                  <button type="button" onClick={() => void remove(r)} disabled={busyId === r._id} style={btnDangerStyle}>
                    Delete
                  </button>
                </p>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}
