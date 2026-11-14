'use client';

import { useState } from 'react';
import type { Product } from '@ecommerce/shared';
import { trackAddToCart } from '@/lib/analytics';
import { addProductToCart } from '@/lib/cart';

export default function AddToCartButton({ product }: { product: Product }) {
  const [added, setAdded] = useState(false);
  return (
    <button
      disabled={product.stock <= 0}
      onClick={() => {
        addProductToCart(product, 1);
        trackAddToCart(product, 1);
        setAdded(true);
      }}
    >
      {product.stock <= 0 ? 'Out of stock' : added ? 'Added to cart ✓' : 'Add to cart'}
    </button>
  );
}
