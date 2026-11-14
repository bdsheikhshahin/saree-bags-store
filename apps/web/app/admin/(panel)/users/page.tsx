'use client';

import { useEffect, useState } from 'react';
import type { User } from '@ecommerce/shared';
import { AdminCard, Badge, ErrorBox } from '@/components/admin/ui';
import { adminJson } from '@/lib/admin';

interface UserRow extends User {
  createdAt?: string;
}

export default function AdminUsersPage() {
  const [items, setItems] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminJson<UserRow[]>('/api/admin/users')
      .then(setItems)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load users'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading users…</p>;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Users ({items.length})</h1>
      <p style={{ color: '#666', marginTop: 0 }}>Read-only — accounts are created when customers register or check out. Admins are created from the seed script.</p>
      <ErrorBox message={error} />
      <AdminCard>
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
          <tbody>
            {items.map((u) => (
              <tr key={u._id ?? u.email}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role === 'admin' ? <Badge tone="blue">Admin</Badge> : <Badge tone="grey">Customer</Badge>}</td>
                <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 ? <p style={{ color: '#666' }}>No users yet.</p> : null}
      </AdminCard>
    </div>
  );
}
