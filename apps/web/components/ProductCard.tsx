import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@ecommerce/shared';

export function formatBdt(n: number): string {
  return `৳${n.toLocaleString('en-IN')}`;
}

export default function ProductCard({ product }: { product: Product }) {
  return (
    <article style={{ border: '1px solid #e5e5e5', borderRadius: 8, overflow: 'hidden' }}>
      <Link href={`/products/${product.slug}`}>
        <Image src={product.images[0] ?? '/images/placeholder.jpg'} alt={product.name} width={600} height={600} style={{ width: '100%', height: 'auto' }} />
      </Link>
      <div style={{ padding: 12 }}>
        <h3><Link href={`/products/${product.slug}`}>{product.name}</Link></h3>
        <p>
          <strong>{formatBdt(product.price)}</strong>{' '}
          {product.compareAtPrice ? <s>{formatBdt(product.compareAtPrice)}</s> : null}
        </p>
        <p>{product.stock > 0 ? 'In stock' : 'Out of stock'}</p>
      </div>
    </article>
  );
}
