'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { trackPurchase } from '@/lib/analytics';
import { formatBdt } from '@/components/ProductCard';

// Purchase fires once, server-confirmed, deduped by transaction_id in
// trackPurchase — and only when the order is actually paid (or COD, where
// the order itself is the commitment). Failed/cancelled payments never fire it.
interface OrderStatus {
  orderId: string;
  paymentMethod?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  status?: string;
  total?: number;
  discountAmount?: number;
  couponCode?: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function SuccessContent() {
  const params = useSearchParams();
  const orderId = params.get('orderId') ?? '';
  const totalParam = Number(params.get('total') ?? 0);
  const paymentParam = params.get('payment') ?? '';
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [fired, setFired] = useState(false);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    let cancelled = false;
    async function load(): Promise<void> {
      // Prefer the payments status endpoint; fall back to the order endpoint,
      // then to the query params if the API is unreachable.
      try {
        const res = await fetch(`${API_URL}/api/payments/order/${encodeURIComponent(orderId)}/status`);
        if (res.ok) {
          const data = (await res.json()) as OrderStatus;
          if (!cancelled) setOrder(data);
          return;
        }
      } catch { /* fall through to the order endpoint */ }
      try {
        const res = await fetch(`${API_URL}/api/orders/${encodeURIComponent(orderId)}`);
        if (res.ok) {
          const data = (await res.json()) as OrderStatus;
          if (!cancelled) setOrder(data);
          return;
        }
      } catch { /* fall through to query params */ }
      if (!cancelled) setLoading(false);
    }
    void load().finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [orderId]);

  const paymentStatus = order?.paymentStatus ?? (paymentParam === 'paid' ? 'paid' : paymentParam === 'failed' || paymentParam === 'cancelled' ? 'failed' : 'pending');
  const total = order?.total ?? totalParam;
  const isPaid = paymentStatus === 'paid';
  const isFailed = paymentStatus === 'failed';
  const isCod = order?.paymentMethod === 'cod' || paymentParam === 'cod';

  useEffect(() => {
    if (!orderId || total <= 0 || loading) return;
    if (isPaid || (isCod && !isFailed)) {
      setFired(trackPurchase(orderId, total, []));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, total, loading, isPaid, isCod, isFailed]);

  if (!orderId) return <><h1>Order not found</h1><p>No order ID was provided.</p></>;

  return (
    <>
      <h1>
        {isFailed ? 'Payment failed' : isPaid ? 'Thank you — payment received!' : 'Thank you — order placed!'}
      </h1>
      <p>Order ID: <strong>{orderId}</strong></p>
      <p>Total: <strong>{formatBdt(total)}</strong></p>
      {order?.discountAmount ? (
        <p>Coupon {order.couponCode ? <strong>{order.couponCode}</strong> : null} discount: −{formatBdt(order.discountAmount)}</p>
      ) : null}
      {loading ? (
        <p>Checking payment status…</p>
      ) : (
        <>
          <p>
            Payment status: <strong>{paymentStatus}</strong>
            {order?.paymentMethod ? ` (${order.paymentMethod})` : null}
          </p>
          <p>
            Order status: <strong>{order?.status ?? 'pending'}</strong>
          </p>
          {isFailed ? (
            <p style={{ color: '#b91c1c' }}>
              The payment did not go through. Your order is saved as payment-failed — please try again or choose Cash on Delivery.
            </p>
          ) : isPaid ? (
            <p>Your payment was verified with the gateway.</p>
          ) : isCod ? (
            <p>Please keep ৳{total.toLocaleString('en-IN')} ready — you will pay in cash when the order arrives.</p>
          ) : (
            <p>Your payment is pending — we will confirm the order once the gateway verifies it.</p>
          )}
          {fired ? <p>Purchase tracked.</p> : null}
        </>
      )}
      <p><Link href="/products">Continue shopping →</Link></p>
    </>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<p>Loading order…</p>}>
      <SuccessContent />
    </Suspense>
  );
}
