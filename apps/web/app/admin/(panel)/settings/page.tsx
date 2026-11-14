'use client';

import { useState, type FormEvent } from 'react';
import { PAYMENT_METHODS } from '@ecommerce/shared';
import { AdminCard, Badge, ErrorBox, Field, btnStyle } from '@/components/admin/ui';
import { adminJson, getAdminUser } from '@/lib/admin';

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? '';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function AdminSettingsPage() {
  const user = typeof window !== 'undefined' ? getAdminUser() : null;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

  async function changePassword(e: FormEvent): Promise<void> {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);
    if (newPassword.length < 8) { setPwError('New password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { setPwError('New passwords do not match'); return; }
    setPwBusy(true);
    try {
      await adminJson('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setPwSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Password change failed');
    } finally {
      setPwBusy(false);
    }
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Settings</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        <AdminCard title="Store info">
          <table>
            <tbody>
              <tr><td>Store name</td><td><strong>Saree &amp; Bags</strong></td></tr>
              <tr><td>Store URL</td><td>{SITE_URL}</td></tr>
              <tr><td>API URL</td><td>{API_URL}</td></tr>
              <tr><td>Currency</td><td>৳ BDT (Bangladeshi Taka)</td></tr>
              <tr><td>Market</td><td>Bangladesh</td></tr>
              <tr><td>Free delivery over</td><td>৳2,000 (60 ৳ below that)</td></tr>
            </tbody>
          </table>
          <p style={{ color: '#666', fontSize: 13 }}>
            Store details are read from the app configuration. Editing them from the panel is a later phase.
          </p>
        </AdminCard>

        <AdminCard title="Your admin account">
          <p style={{ marginTop: 0 }}>
            <strong>{user?.name ?? 'Admin'}</strong><br />
            {user?.email ?? '—'}<br />
            Role: <Badge tone="blue">Admin</Badge>
          </p>
          <p style={{ color: '#666', fontSize: 13, marginBottom: 0 }}>
            Change your password in the “Change password” section below.
          </p>
        </AdminCard>

        <AdminCard title="Change password">
          <form onSubmit={changePassword}>
            <Field label="Current password">
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required autoComplete="current-password" />
            </Field>
            <Field label="New password" hint="At least 8 characters">
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required autoComplete="new-password" />
            </Field>
            <Field label="Confirm new password">
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
            </Field>
            {pwError ? <ErrorBox message={pwError} /> : null}
            {pwSuccess ? <p style={{ color: '#15803d', margin: '0 0 12px' }}>{pwSuccess}</p> : null}
            <button type="submit" style={btnStyle} disabled={pwBusy}>{pwBusy ? 'Changing…' : 'Change password'}</button>
          </form>
        </AdminCard>

        <AdminCard title="Payment methods">
          <p style={{ marginTop: 0, color: '#666', fontSize: 13 }}>
            Shown at checkout. These are stubs in Phase 2 — no real gateway calls are made yet.
          </p>
          <table>
            <thead><tr><th>Method</th><th>Note</th><th>Status</th></tr></thead>
            <tbody>
              {PAYMENT_METHODS.map((m) => (
                <tr key={m.id}>
                  <td><strong>{m.label}</strong></td>
                  <td>{m.note}</td>
                  <td><Badge tone="amber">Stub — keys via .env</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ color: '#666', fontSize: 13, marginBottom: 0 }}>
            Real SSLCommerz / bKash / Nagad integration is the next Phase 2 step after the admin panel.
          </p>
        </AdminCard>

        <AdminCard title="Analytics — GTM / GA4">
          <p style={{ marginTop: 0 }}>
            GTM container: <code>{GTM_ID || 'not set'}</code>{' '}
            {GTM_ID && GTM_ID !== 'GTM-XXXXXXX' ? <Badge tone="green">Configured</Badge> : <Badge tone="amber">Placeholder — set NEXT_PUBLIC_GTM_ID</Badge>}
          </p>
          <p style={{ color: '#666', fontSize: 13 }}>
            Analytics runs only through Google Tag Manager (no direct gtag). Consent Mode defaults to denied until the visitor accepts.
            The dataLayer fires view_item_list, view_item, add_to_cart, view_cart, begin_checkout, add_payment_info and purchase (once, server-confirmed).
          </p>
        </AdminCard>
      </div>
    </div>
  );
}
