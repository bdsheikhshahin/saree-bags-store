'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ErrorBox, Field, btnStyle, cardStyle } from '@/components/admin/ui';
import { login } from '@/lib/admin';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@shop.local');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
      router.replace('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6f6f6', padding: 16 }}>
      <div style={{ ...cardStyle, width: '100%', maxWidth: 420 }}>
        <h1 style={{ marginTop: 0 }}>Admin Login</h1>
        <p style={{ color: '#666', marginTop: 0 }}>Saree &amp; Bags — store admin panel</p>
        <form onSubmit={onSubmit}>
          <ErrorBox message={error} />
          <Field label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </Field>
          <Field label="Password">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </Field>
          <button type="submit" style={{ ...btnStyle, width: '100%' }} disabled={busy}>
            {busy ? 'Logging in…' : 'Log in'}
          </button>
        </form>
        <p style={{ fontSize: 13, color: '#666', marginBottom: 0 }}>
          Demo admin: <code>admin@shop.local</code> / <code>Admin1234</code> — change the password after first login.
        </p>
        <p style={{ fontSize: 13 }}>
          <Link href="/">← Back to store</Link>
        </p>
      </div>
    </div>
  );
}
