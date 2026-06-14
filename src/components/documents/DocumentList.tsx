'use client';

import { useState, useTransition } from 'react';
import {
  getDocumentSignedUrlAction,
  deleteDocumentAction,
} from '@/app/(dashboard)/properties/[id]/documents/actions';
import { useToast } from '@/components/ui/Toast';
import {
  DocumentIcon,
  EyeIcon,
  DownloadIcon,
  TrashIcon,
  SpinnerIcon,
} from '@/components/ui/Icons';
import { formatBytes, documentTypeLabel, relativeTime } from '@/lib/utils';
import type { PropertyDocument } from '@/lib/types';

export function DocumentList({
  documents,
  propertyId,
}: {
  documents: PropertyDocument[];
  propertyId: string;
}) {
  const { toast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function open(doc: PropertyDocument, action: 'preview' | 'download') {
    setBusyId(doc.id);
    const res = await getDocumentSignedUrlAction(doc.id, action);
    setBusyId(null);
    if (res.error || !res.url) {
      toast(res.error ?? 'Could not open document', 'error');
      return;
    }
    window.open(res.url, '_blank', 'noopener,noreferrer');
  }

  function remove(doc: PropertyDocument) {
    if (!confirm(`Delete "${doc.title || doc.file_name}"? This cannot be undone.`)) return;
    setBusyId(doc.id);
    startTransition(async () => {
      const res = await deleteDocumentAction(doc.id, propertyId);
      setBusyId(null);
      if (res.error) {
        toast(res.error, 'error');
        return;
      }
      toast('Document deleted', 'info');
      window.location.reload();
    });
  }

  if (documents.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center px-6 py-10 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-ink-100 text-ink-400">
          <DocumentIcon className="h-6 w-6" />
        </div>
        <p className="mt-3 text-sm font-medium text-ink-700">No documents yet</p>
        <p className="mt-1 text-xs text-ink-400">
          Upload agreements, floor plans or legal files — they stay private to you.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {documents.map((doc) => {
        const busy = busyId === doc.id;
        return (
          <li key={doc.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <DocumentIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink-900">
                  {doc.title || doc.file_name}
                </p>
                <p className="mt-0.5 truncate text-xs text-ink-400">
                  {documentTypeLabel(doc.document_type)} · {formatBytes(doc.file_size)} ·{' '}
                  {relativeTime(doc.uploaded_at)}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => open(doc, 'preview')}
                disabled={busy}
                className="btn-ghost px-2.5 py-1.5 text-xs"
                title="Preview"
              >
                {busy ? <SpinnerIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                Preview
              </button>
              <button
                type="button"
                onClick={() => open(doc, 'download')}
                disabled={busy}
                className="btn-ghost px-2.5 py-1.5 text-xs"
                title="Download"
              >
                <DownloadIcon className="h-4 w-4" />
                Download
              </button>
              <button
                type="button"
                onClick={() => remove(doc)}
                disabled={busy}
                className="btn-ghost px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50"
                title="Delete"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
