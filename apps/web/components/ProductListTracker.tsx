'use client';

import { useEffect } from 'react';
import type { Product } from '@ecommerce/shared';
import { trackViewItemList } from '@/lib/analytics';

// Fires view_item_list once per list render.
export default function ProductListTracker({ products }: { products: Product[] }) {
  useEffect(() => {
    if (products.length > 0) trackViewItemList(products);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
