'use client';

import { useState } from 'react';
import { formatBdt } from '@/components/ProductCard';

export interface AppliedCoupon {
  code: string;
  discount: number;
}

interface ValidateResponse {
  valid: boolean;
  code?: string;
  discount?: number;
  message?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/** Coupon input for checkout: validates against /api/coupons/validate and reports the discount (or null when removed/invalid). */
export default function CouponBox({ subtotal, onApplied }: { subtotal: number; onApplied: (result: AppliedCoupon | null) => void }) {
  const [code, setCode] = useState('');
  const [applied, setApplied] = useState<AppliedCoupon | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function apply(): Promise<void> {
    const trimmed = code.trim();
    if (!trimmed) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`${API_URL}/api/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed, subtotal }),
      });
      const data = (await res.json().catch(() => ({}))) as ValidateResponse;
      if (!res.ok || !data.valid) {
        setApplied(null);
        onApplied(null);
        setError(data.message ?? 'Coupon could not be applied.');
        return;
      }
      const result = { code: data.code ?? trimmed.toUpperCase(), discount: data.discount ?? 0 };
      setApplied(result);
      onApplied(result);
      setMessage(data.message ?? `Coupon applied — you save ${formatBdt(result.discount)}.`);
    } catch {
      setError('Could not reach the server — please try again.');
    } finally {
      setBusy(false);
    }
  }

  function remove(): void {
    setApplied(null);
    setCode('');
    setMessage('');
    setError('');
    onApplied(null);
  }

  if (applied) {
    return (
      <div style={{ border: '1px solid #bbf7d0', background: '#f0fdf4', borderRadius: 6, padding: '10px 12px', marginBottom: 12 }}>
        <p style={{ margin: 0 }}>
          Coupon <strong>{applied.code}</strong> applied — you save <strong>{formatBdt(applied.discount)}</strong>.{' '}
          <button type="button" onClick={remove} style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', textDecoration: 'underline' }}>
            Remove
          </button>
        </p>
        {message ? <p style={{ margin: '4px 0 0', fontSize: 13, color: '#166534' }}>{message}</p> : null}
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Coupon code</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. WELCOME10"
          style={{ textTransform: 'uppercase' }}
          aria-label="Coupon code"
        />
        <button type="button" onClick={() => void apply()} disabled={busy || !code.trim()}>
          {busy ? 'Checking…' : 'Apply'}
        </button>
      </div>
      {error ? <p style={{ margin: '6px 0 0', color: '#b91c1c', fontSize: 13 }}>{error}</p> : null}
      {message ? <p style={{ margin: '6px 0 0', color: '#166534', fontSize: 13 }}>{message}</p> : null}
    </div>
  );
}
