import Link from 'next/link';

export default function SiteHeader() {
  return (
    <header style={{ borderBottom: '1px solid #e5e5e5', padding: '12px 16px', display: 'flex', gap: 16, alignItems: 'center' }}>
      <Link href="/" style={{ fontWeight: 700, fontSize: 20 }}>Saree &amp; Bags</Link>
      <nav style={{ display: 'flex', gap: 12 }}>
        <Link href="/products">Shop</Link>
        <Link href="/category/saree">Saree</Link>
        <Link href="/category/bags">Bags</Link>
        <Link href="/blog">Blog</Link>
        <Link href="/cart">Cart</Link>
      </nav>
      <form action="/search" method="get" role="search" style={{ display: 'flex', gap: 8, flex: 1, maxWidth: 420, marginLeft: 'auto' }}>
        <input type="search" name="q" placeholder="Search saree, bags…" aria-label="Search products" style={{ flex: 1, padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14 }} />
        <button type="submit" style={{ background: '#111', color: '#fff', border: '1px solid #111', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 14 }}>Search</button>
      </form>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer style={{ borderTop: '1px solid #e5e5e5', padding: 16, marginTop: 32 }}>
      <p>Cash on Delivery, bKash, Nagad and SSLCommerz accepted across Bangladesh.</p>
      <p><Link href="/blog">Blog</Link> · <Link href="/products">Shop all</Link></p>
    </footer>
  );
}
