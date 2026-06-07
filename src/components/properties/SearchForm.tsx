'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PROPERTY_TYPES, PROPERTY_STATUSES } from '@/lib/types';
import { propertyTypeLabel, statusLabel } from '@/lib/utils';
import { SearchIcon, XIcon } from '@/components/ui/Icons';

export interface SearchValues {
  q: string;
  type: string;
  bedrooms: string;
  minPrice: string;
  maxPrice: string;
  status: string;
}

export function SearchForm({ initial }: { initial: SearchValues }) {
  const router = useRouter();
  const [values, setValues] = useState<SearchValues>(initial);

  function update<K extends keyof SearchValues>(key: K, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    Object.entries(values).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    router.push(`/search${params.toString() ? `?${params.toString()}` : ''}`);
  }

  function clear() {
    const empty: SearchValues = {
      q: '',
      type: '',
      bedrooms: '',
      minPrice: '',
      maxPrice: '',
      status: '',
    };
    setValues(empty);
    router.push('/search');
  }

  const hasFilters = Object.values(values).some((v) => v);

  return (
    <form onSubmit={submit} className="card p-4 sm:p-5">
      <div className="flex flex-col gap-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            value={values.q}
            onChange={(e) => update('q', e.target.value)}
            placeholder="Search by title or location…"
            className="input pl-10"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <select value={values.type} onChange={(e) => update('type', e.target.value)} className="input">
            <option value="">Any type</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>
                {propertyTypeLabel(t)}
              </option>
            ))}
          </select>

          <select
            value={values.bedrooms}
            onChange={(e) => update('bedrooms', e.target.value)}
            className="input"
          >
            <option value="">Any beds</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={String(n)}>
                {n}+ beds
              </option>
            ))}
          </select>

          <input
            type="number"
            min="0"
            value={values.minPrice}
            onChange={(e) => update('minPrice', e.target.value)}
            placeholder="Min price"
            className="input"
          />
          <input
            type="number"
            min="0"
            value={values.maxPrice}
            onChange={(e) => update('maxPrice', e.target.value)}
            placeholder="Max price"
            className="input"
          />

          <select
            value={values.status}
            onChange={(e) => update('status', e.target.value)}
            className="input"
          >
            <option value="">Any status</option>
            {PROPERTY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button type="submit" className="btn-primary">
            <SearchIcon className="h-4 w-4" /> Search
          </button>
          {hasFilters && (
            <button type="button" onClick={clear} className="btn-ghost">
              <XIcon className="h-4 w-4" /> Clear
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
