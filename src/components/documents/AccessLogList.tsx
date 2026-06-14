import { relativeTime } from '@/lib/utils';
import type { DocumentAccessLog, DocumentAccessAction } from '@/lib/types';

const ACTION_LABEL: Record<DocumentAccessAction, string> = {
  upload: 'Uploaded',
  preview: 'Previewed',
  download: 'Downloaded',
  delete: 'Deleted',
};

const ACTION_CLASS: Record<DocumentAccessAction, string> = {
  upload: 'bg-emerald-100 text-emerald-700',
  preview: 'bg-brand-100 text-brand-700',
  download: 'bg-amber-100 text-amber-700',
  delete: 'bg-rose-100 text-rose-700',
};

export function AccessLogList({ entries }: { entries: DocumentAccessLog[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-ink-400">No document activity yet.</p>;
  }
  return (
    <ul className="divide-y divide-ink-100">
      {entries.map((e) => (
        <li key={e.id} className="flex items-center justify-between gap-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${ACTION_CLASS[e.action]}`}
            >
              {ACTION_LABEL[e.action]}
            </span>
            <span className="truncate text-sm text-ink-700">{e.file_name || 'Document'}</span>
          </div>
          <time className="shrink-0 text-xs text-ink-400">{relativeTime(e.created_at)}</time>
        </li>
      ))}
    </ul>
  );
}
