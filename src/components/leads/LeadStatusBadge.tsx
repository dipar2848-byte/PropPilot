import type { LeadStatus } from '@/lib/types';

const STYLES: Record<LeadStatus, string> = {
  new: 'bg-brand-100 text-brand-700',
  contacted: 'bg-amber-100 text-amber-700',
  closed: 'bg-emerald-100 text-emerald-700',
};

const LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  closed: 'Closed',
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
