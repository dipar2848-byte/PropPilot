import { cn } from '@/lib/utils';

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white shadow-sm">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 10 12 3l9 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 9v11h14V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="m9 20 3-7 3 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {showText && (
        <span className="text-lg font-bold tracking-tight text-ink-900">
          Prop<span className="text-brand-600">Pilot</span>
        </span>
      )}
    </span>
  );
}
