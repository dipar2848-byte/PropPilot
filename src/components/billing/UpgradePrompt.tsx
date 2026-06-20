import Link from 'next/link';
import { SparklesIcon } from '@/components/ui/Icons';

/**
 * A compact, reusable call-to-action shown when a user hits (or nears) a plan
 * limit. Links to the billing page rather than performing any client-side
 * privilege change — all real enforcement stays server-side.
 */
export function UpgradePrompt({
  title = 'You’ve reached a plan limit',
  message,
  tone = 'amber',
  className = '',
}: {
  title?: string;
  message: string;
  tone?: 'amber' | 'rose';
  className?: string;
}) {
  const styles =
    tone === 'rose'
      ? { box: 'border-rose-200 bg-rose-50', icon: 'bg-rose-100 text-rose-600', text: 'text-rose-700' }
      : { box: 'border-amber-200 bg-amber-50', icon: 'bg-amber-100 text-amber-600', text: 'text-amber-700' };

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 ${styles.box} ${className}`}>
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${styles.icon}`}>
          <SparklesIcon className="h-5 w-5" />
        </span>
        <div>
          <p className="font-semibold text-ink-900">{title}</p>
          <p className={`text-sm ${styles.text}`}>{message}</p>
        </div>
      </div>
      <Link href="/billing" className="btn-primary shrink-0 px-4 py-2 text-sm">
        <SparklesIcon className="h-4 w-4" /> Upgrade to Pro
      </Link>
    </div>
  );
}
