'use client';

import { useState } from 'react';
import { DownloadIcon, SpinnerIcon } from '@/components/ui/Icons';

/**
 * A single export card. Triggers a CSV download from the given route handler
 * via fetch → blob, so we can surface a pending state and error feedback
 * instead of a bare anchor navigation.
 */
export function ExportCard({
  title,
  description,
  count,
  href,
  icon,
}: {
  title: string;
  description: string;
  count: number;
  href: string;
  icon: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = busy || count === 0;

  async function download() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(href, { method: 'GET' });
      if (!res.ok) {
        throw new Error(`Export failed (${res.status})`);
      }

      // Derive filename from Content-Disposition, falling back to a default.
      const cd = res.headers.get('Content-Disposition') ?? '';
      const match = /filename="?([^"]+)"?/.exec(cd);
      const filename = match?.[1] ?? 'export.csv';

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card flex flex-col p-6">
      <div className="flex items-start gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-ink-900">{title}</h3>
          <p className="mt-1 text-sm text-ink-500">{description}</p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-sm text-ink-500">
          <span className="font-semibold text-ink-900">{count}</span>{' '}
          {count === 1 ? 'record' : 'records'}
        </span>
        <button
          type="button"
          onClick={download}
          disabled={disabled}
          className="btn-primary"
          aria-label={`Download ${title} CSV`}
        >
          {busy ? (
            <>
              <SpinnerIcon className="h-4 w-4" /> Preparing…
            </>
          ) : (
            <>
              <DownloadIcon className="h-4 w-4" /> Download CSV
            </>
          )}
        </button>
      </div>

      {count === 0 && (
        <p className="mt-3 text-xs text-ink-400">Nothing to export yet.</p>
      )}
      {error && <p className="field-error mt-3">{error}</p>}
    </div>
  );
}
