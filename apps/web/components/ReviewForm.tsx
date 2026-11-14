'use client';

import { useState, type FormEvent } from 'react';
import { submitReview } from '@/lib/api';

export default function ReviewForm({ slug }: { slug: string }) {
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await submitReview(slug, { name: name.trim(), rating, comment: comment.trim() });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your review');
    } finally {
      setSaving(false);
    }
  }

  if (submitted) {
    return <p>Thank you — your review is awaiting approval and will appear here once approved.</p>;
  }

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 560 }}>
      <h3>Write a review</h3>
      <p>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Your name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} style={{ width: '100%', padding: 8 }} />
      </p>
      <p>
        <span style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Rating</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, color: n <= rating ? '#f59e0b' : '#ccc', padding: '0 2px' }}
          >
            ★
          </button>
        ))}
      </p>
      <p>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Your review</label>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} required maxLength={2000} rows={4} style={{ width: '100%', padding: 8 }} />
      </p>
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
      <button type="submit" disabled={saving} style={{ background: '#111', color: '#fff', border: '1px solid #111', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>
        {saving ? 'Submitting…' : 'Submit review'}
      </button>
    </form>
  );
}
