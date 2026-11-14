'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { adminJson, clearAuth, getAdminUser, getToken } from '@/lib/admin';

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/coupons', label: 'Coupons' },
  { href: '/admin/blog', label: 'Blog' },
  { href: '/admin/reviews', label: 'Reviews' },
  { href: '/admin/sections', label: 'Homepage Sections' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/settings', label: 'Settings' },
];

export default function AdminPanelLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!getToken()) {
      router.replace('/admin/login');
      return;
    }
    setEmail(getAdminUser()?.email ?? '');
    // Verify the token is still valid (and the user is an admin).
    adminJson<{ products: number }>('/api/admin/stats')
      .then(() => setReady(true))
      .catch(() => {
        clearAuth();
        router.replace('/admin/login');
      });
  }, [router]);

  function logout(): void {
    clearAuth();
    router.replace('/admin/login');
  }

  if (!ready) {
    return <p style={{ padding: 32 }}>Checking admin session…</p>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f6f6f6' }}>
      <aside style={{ width: 220, flexShrink: 0, background: '#111', color: '#fff', padding: '20px 0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 20px 16px', borderBottom: '1px solid #333' }}>
          <Link href="/admin" style={{ color: '#fff', fontWeight: 700, fontSize: 18, textDecoration: 'none' }}>
            Saree &amp; Bags
          </Link>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#aaa' }}>Admin Panel</p>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', padding: '12px 0', flex: 1 }}>
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  color: active ? '#fff' : '#bbb',
                  background: active ? '#222' : 'transparent',
                  textDecoration: 'none',
                  padding: '10px 20px',
                  fontWeight: active ? 700 : 400,
                  borderLeft: active ? '3px solid #fff' : '3px solid transparent',
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: '12px 20px', borderTop: '1px solid #333', fontSize: 13 }}>
          <p style={{ margin: '0 0 8px', color: '#aaa', overflowWrap: 'anywhere' }}>{email}</p>
          <button type="button" onClick={logout} style={{ background: 'transparent', color: '#fff', border: '1px solid #555', width: '100%' }}>
            Log out
          </button>
          <p style={{ margin: '12px 0 0' }}>
            <Link href="/" style={{ color: '#aaa', fontSize: 13 }}>View store →</Link>
          </p>
        </div>
      </aside>
      <main style={{ flex: 1, padding: 24, minWidth: 0 }}>{children}</main>
    </div>
  );
}
