import Link from 'next/link';
import { ChevronLeftIcon } from '@/components/ui/Icons';

export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel,
  actions,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      {backHref && (
        <Link
          href={backHref}
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-800"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          {backLabel ?? 'Back'}
        </Link>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
