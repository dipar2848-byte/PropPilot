import type { UsageItem } from '@/lib/data/subscription';

/**
 * A single usage row with a progress bar. Renders "Unlimited" when the plan
 * limit is null. Turns amber/rose as the user approaches / hits the limit.
 */
export function UsageMeter({ item }: { item: UsageItem }) {
  const { label, current, limit, atLimit } = item;
  const unlimited = limit === null;
  const pct = unlimited ? 0 : Math.min(100, Math.round((current / Math.max(limit, 1)) * 100));
  const near = !unlimited && limit > 0 && current / limit >= 0.8;

  const barColor = atLimit ? 'bg-rose-500' : near ? 'bg-amber-500' : 'bg-brand-500';

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-ink-700">{label}</span>
        <span className={`tabular-nums ${atLimit ? 'font-semibold text-rose-600' : 'text-ink-500'}`}>
          {current}
          {unlimited ? ' · Unlimited' : ` / ${limit}`}
        </span>
      </div>
      {!unlimited && (
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-ink-100">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}
