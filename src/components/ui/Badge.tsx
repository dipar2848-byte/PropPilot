import type { PropertyStatus } from '@/lib/types';
import { statusLabel, statusBadgeClass, cn } from '@/lib/utils';

export function StatusBadge({ status, className }: { status: PropertyStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        statusBadgeClass(status),
        className,
      )}
    >
      {statusLabel(status)}
    </span>
  );
}
