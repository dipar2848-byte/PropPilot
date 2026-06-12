'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SearchIcon, XIcon } from '@/components/ui/Icons';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'closed', label: 'Closed' },
];

export function LeadFilters({
  propertyId,
  initialQ,
  initialStatus,
}: {
  propertyId: string;
  initialQ: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const [status, setStatus] = useState(initialStatus);

  function buildUrl(nextQ: string, nextStatus: string) {
    const params = new URLSearchParams();
    if (nextQ) params.set('q', nextQ);
    if (nextStatus) params.set('status', nextStatus);
    const qs = params.toString();
    return `/properties/${propertyId}/leads${qs ? `?${qs}` : ''}`;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    router.push(buildUrl(q, status));
  }

  function onStatusChange(value: string) {
    setStatus(value);
    router.push(buildUrl(q, value));
  }

  function clear() {
    setQ('');
    setStatus('');
    router.push(`/properties/${propertyId}/leads`);
  }

  const hasFilters = Boolean(q || status);

  return (
    <form onSubmit={submit} className="card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or phone…"
            className="input pl-10"
          />
        </div>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="input sm:w-44"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
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
