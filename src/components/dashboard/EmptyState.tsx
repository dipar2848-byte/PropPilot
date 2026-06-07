import Link from 'next/link';
import type { ReactNode } from 'react';

export function EmptyState({
  icon,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
        {icon}
      </div>
      <h3 className="mt-5 text-lg font-semibold text-ink-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-500">{description}</p>
      {actionHref && actionLabel && (
        <Link href={actionHref} className="btn-primary mt-6">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
