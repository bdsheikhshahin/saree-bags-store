'use client';

import { useEffect } from 'react';
import type { Product } from '@ecommerce/shared';
import { trackViewItem } from '@/lib/analytics';

export default function ViewItemTracker({ product }: { product: Product }) {
  useEffect(() => {
    trackViewItem(product);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
