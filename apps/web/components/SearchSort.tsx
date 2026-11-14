'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { ChangeEvent } from 'react';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Highest rated' },
];

/** Sort dropdown for /search — updates the `sort` query param, keeping the other filters. */
export default function SearchSort({ value }: { value: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onChange(e: ChangeEvent<HTMLSelectElement>): void {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value && e.target.value !== 'relevance') params.set('sort', e.target.value);
    else params.delete('sort');
    router.push(`/search?${params.toString()}`);
  }

  return (
    <label style={{ fontWeight: 600 }}>
      Sort by{' '}
      <select value={value} onChange={onChange} style={{ padding: '6px 8px', fontWeight: 400 }}>
        {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
