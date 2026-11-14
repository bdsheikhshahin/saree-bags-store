'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { CartItem } from '@ecommerce/shared';
import { cartTotal, loadCart, removeFromCart, setQuantity } from '@/lib/cart';
import { formatBdt } from '@/components/ProductCard';
import { pushDataLayer } from '@/lib/analytics';

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    void loadCart().then((list) => {
      if (cancelled) return;
      setItems(list);
      setLoading(false);
      if (list.length > 0) {
        pushDataLayer({
          event: 'view_cart',
          ecommerce: { currency: 'BDT', value: cartTotal(list), items: list.map((i) => ({ item_id: i.productSlug, item_name: i.name, price: i.price, quantity: i.quantity })) },
        });
      }
    });
    return () => { cancelled = true; };
  }, []);

  function changeQty(slug: string, delta: number): void {
    const current = items.find((i) => i.productSlug === slug);
    if (!current) return;
    setItems(setQuantity(slug, current.quantity + delta));
  }

  function remove(slug: string): void {
    setItems(removeFromCart(slug));
  }

  if (loading) return <><h1>Cart</h1><p>Loading cart…</p></>;
  return (
    <>
      <h1>Cart</h1>
      {items.length === 0 ? (
        <p>Your cart is empty. <Link href="/products">Continue shopping →</Link></p>
      ) : (
        <>
          <ul>
            {items.map((i) => (
              <li key={i.productSlug}>
                {i.name} — {formatBdt(i.price)} ×{' '}
                <button type="button" onClick={() => changeQty(i.productSlug, -1)} aria-label={`Decrease quantity of ${i.name}`}>−</button>{' '}
                {i.quantity}{' '}
                <button type="button" onClick={() => changeQty(i.productSlug, 1)} aria-label={`Increase quantity of ${i.name}`}>+</button>{' '}
                = {formatBdt(i.price * i.quantity)}{' '}
                <button type="button" onClick={() => remove(i.productSlug)}>Remove</button>
              </li>
            ))}
          </ul>
          <p><strong>Total: {formatBdt(cartTotal(items))}</strong></p>
          <Link href="/checkout">Go to checkout →</Link>
        </>
      )}
    </>
  );
}
