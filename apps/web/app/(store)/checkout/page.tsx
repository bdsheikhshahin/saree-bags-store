'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { CartItem, PaymentMethod } from '@ecommerce/shared';
import { PAYMENT_METHODS } from '@ecommerce/shared';
import { cartTotal, clearCart, loadCart } from '@/lib/cart';
import { formatBdt } from '@/components/ProductCard';
import { trackAddPaymentInfo, trackBeginCheckout } from '@/lib/analytics';
import CouponBox, { type AppliedCoupon } from '@/components/CouponBox';

// Checkout: collects customer + payment choice, creates the order via the API
// (coupon validated server-side), then:
// - COD: straight to /checkout/success.
// - SSLCommerz / bKash / Nagad: POST /api/payments/:provider/init and redirect
//   to the returned gateway URL. When sandbox credentials are not configured
//   the API says so in plain JSON — the order stays pending-payment and the
//   shopper is shown the message instead of a broken redirect.
// The `purchase` event fires ONLY on the success page, after server confirmation.
export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('cod');
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [placedOrderId, setPlacedOrderId] = useState('');
  const [busy, setBusy] = useState(false);

  const subtotal = cartTotal(items);
  const discount = coupon?.discount ?? 0;
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const deliveryFee = discountedSubtotal >= 2000 || discountedSubtotal === 0 ? 0 : 60;
  const total = discountedSubtotal + deliveryFee;

  useEffect(() => {
    let cancelled = false;
    void loadCart().then((list) => {
      if (cancelled) return;
      setItems(list);
      if (list.length > 0) {
        trackBeginCheckout(list.map((i) => ({ item_id: i.productSlug, item_name: i.name, price: i.price, quantity: i.quantity })), cartTotal(list));
      }
    });
    return () => { cancelled = true; };
  }, []);

  // A coupon applied against an old subtotal must be re-validated when the
  // cart changes; simplest correct behaviour is to drop it.
  useEffect(() => {
    setCoupon(null);
  }, [items.length]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    try {
      const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
      trackAddPaymentInfo(items.map((i) => ({ item_id: i.productSlug, item_name: i.name, price: i.price, quantity: i.quantity })), total, payment);
      const res = await fetch(`${api}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          paymentMethod: payment,
          ...(coupon ? { couponCode: coupon.code } : {}),
          customer: { name, phone, address },
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { orderId?: string; total?: number; error?: unknown };
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Order failed');
      const orderId = data.orderId as string;
      setPlacedOrderId(orderId);

      if (payment === 'cod') {
        clearCart();
        router.push(`/checkout/success?orderId=${encodeURIComponent(orderId)}&total=${data.total ?? total}&payment=cod`);
        return;
      }

      // Online payment: ask the API to start a gateway session for this order.
      const payRes = await fetch(`${api}/api/payments/${payment}/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const pay = (await payRes.json().catch(() => ({}))) as { configured?: boolean; redirectUrl?: string; message?: string };
      if (payRes.ok && pay.configured && pay.redirectUrl) {
        clearCart();
        window.location.href = pay.redirectUrl;
        return;
      }
      // Gateway not configured (or gateway error): order is saved as
      // pending-payment — show the message, don't lose the order.
      setNotice(
        pay.message ??
          'Online payment could not be started. Your order is saved as pending-payment — please pay Cash on Delivery or try again later.',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Order failed');
    } finally {
      setBusy(false);
    }
  }

  if (items.length === 0) return <><h1>Checkout</h1><p>Your cart is empty.</p></>;
  return (
    <>
      <h1>Checkout</h1>
      <p>Subtotal: {formatBdt(subtotal)}</p>
      {discount > 0 ? <p>Coupon discount: −{formatBdt(discount)}</p> : null}
      <p>Delivery: {deliveryFee === 0 ? 'Free' : formatBdt(deliveryFee)} (free delivery over ৳2,000, otherwise ৳60)</p>
      <p>Total: <strong>{formatBdt(total)}</strong></p>
      <form onSubmit={submit}>
        <p><label>Name<br /><input required value={name} onChange={(e) => setName(e.target.value)} /></label></p>
        <p><label>Phone<br /><input required value={phone} onChange={(e) => setPhone(e.target.value)} /></label></p>
        <p><label>Delivery address<br /><textarea required value={address} onChange={(e) => setAddress(e.target.value)} /></label></p>
        <CouponBox subtotal={subtotal} onApplied={setCoupon} />
        <fieldset>
          <legend>Payment method</legend>
          {PAYMENT_METHODS.map((m) => (
            <label key={m.id} style={{ display: 'block' }}>
              <input type="radio" name="payment" checked={payment === m.id} onChange={() => setPayment(m.id)} /> {m.label} — {m.note}
            </label>
          ))}
        </fieldset>
        {error ? <p style={{ color: 'red' }}>{error}</p> : null}
        {notice ? (
          <p style={{ background: '#fef3c7', border: '1px solid #fcd34d', padding: '10px 12px', borderRadius: 6 }}>
            {notice}{' '}
            {placedOrderId ? (
              <Link href={`/checkout/success?orderId=${encodeURIComponent(placedOrderId)}&total=${total}&payment=pending`}>
                View order {placedOrderId} →
              </Link>
            ) : null}
          </p>
        ) : null}
        <button type="submit" disabled={busy}>{busy ? 'Placing order…' : 'Place order'}</button>
      </form>
      <p>SSLCommerz / bKash / Nagad run in sandbox mode — they redirect to the gateway once sandbox credentials are configured in the API. Cash on Delivery works end-to-end now.</p>
    </>
  );
}
