import type { Metadata } from 'next';
import {
  getSubscriptionState,
  getUsage,
  listTransactions,
} from '@/lib/data/subscription';
import { PLAN_ORDER, getPlan } from '@/lib/plans';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { CheckIcon } from '@/components/ui/Icons';
import { UpgradeButton } from '@/components/billing/UpgradeButton';
import { CheckoutReturn } from '@/components/billing/CheckoutReturn';
import { isCashfreeConfigured } from '@/lib/payments/cashfree';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Billing & Plan' };
export const dynamic = 'force-dynamic';

function StatusPill({ children, tone }: { children: React.ReactNode; tone: 'green' | 'amber' | 'ink' }) {
  const cls =
    tone === 'green'
      ? 'bg-emerald-100 text-emerald-700'
      : tone === 'amber'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-ink-100 text-ink-600';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const [{ order_id: orderId }, state, aiUsed, transactions] = await Promise.all([
    searchParams,
    getSubscriptionState(),
    getUsage('ai_generation'),
    listTransactions(),
  ]);
  const { subscription, effectivePlan, limits, isTrialing, trialDaysLeft, trialExpired, isPaidActive } =
    state;
  const aiLimit = limits.maxAiGenerationsPerMonth;
  const paymentsEnabled = isCashfreeConfigured();

  return (
    <div>
      <PageHeader title="Billing & Plan" subtitle="Manage your subscription and usage limits." />

      {orderId && <CheckoutReturn orderId={orderId} />}

      {/* Current status */}
      <div className="card mb-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Current plan</p>
            <p className="mt-1 text-xl font-bold text-ink-900">{getPlan(effectivePlan).name}</p>
          </div>
          <div>
            {isPaidActive ? (
              <StatusPill tone="green">Active</StatusPill>
            ) : isTrialing ? (
              <StatusPill tone="amber">
                Trial · {trialDaysLeft} day{trialDaysLeft === 1 ? '' : 's'} left
              </StatusPill>
            ) : trialExpired ? (
              <StatusPill tone="ink">Trial ended · on Free</StatusPill>
            ) : (
              <StatusPill tone="ink">Free</StatusPill>
            )}
          </div>
        </div>

        {subscription && (
          <p className="mt-3 text-xs text-ink-400">
            {isTrialing
              ? `Your free trial ends on ${formatDate(subscription.trial_ends_at)}.`
              : isPaidActive && subscription.current_period_end
                ? `Renews on ${formatDate(subscription.current_period_end)}.`
                : trialExpired
                  ? 'Your trial has ended — upgrade to Pro to lift your limits.'
                  : 'You are on the Free plan.'}
          </p>
        )}
      </div>

      {/* Plan comparison */}
      <div className="grid gap-5 sm:grid-cols-2">
        {PLAN_ORDER.map((id) => {
          const plan = getPlan(id);
          const isCurrent = effectivePlan === id;
          return (
            <div
              key={id}
              className={`card p-6 ${isCurrent ? 'ring-2 ring-brand-500' : ''}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-ink-900">{plan.name}</h3>
                {isCurrent && <StatusPill tone="green">Current</StatusPill>}
              </div>
              <p className="mt-1 text-sm text-ink-500">{plan.tagline}</p>
              <p className="mt-4 text-2xl font-bold text-ink-900">
                {plan.priceMonthly === 0 ? 'Free' : `₹${plan.priceMonthly}`}
                {plan.priceMonthly > 0 && (
                  <span className="text-sm font-medium text-ink-400"> /month</span>
                )}
              </p>

              <ul className="mt-5 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-ink-700">
                    <CheckIcon className="h-4 w-4 text-emerald-500" /> {f}
                  </li>
                ))}
              </ul>

              {id === 'pro' && !isPaidActive && (
                paymentsEnabled ? (
                  <UpgradeButton className="mt-6" />
                ) : (
                  <p className="mt-6 rounded-xl bg-ink-50 px-3 py-2 text-center text-xs text-ink-500">
                    Online payments aren’t enabled on this server yet. Your trial gives you full Pro
                    access in the meantime.
                  </p>
                )
              )}
              {isCurrent && (
                <p className="mt-6 text-center text-xs text-ink-400">This is your current plan.</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Usage this month */}
      <div className="card mt-6 p-5 sm:p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
          Usage this month
        </h3>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-ink-900">AI marketing generations</p>
            <p className="text-sm text-ink-500">
              {aiUsed} used
              {aiLimit === null ? ' · Unlimited' : ` of ${aiLimit}`}
            </p>
          </div>
          {aiLimit !== null && (
            <div className="w-32">
              <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
                <div
                  className="h-full rounded-full bg-brand-500"
                  style={{ width: `${Math.min(100, Math.round((aiUsed / aiLimit) * 100))}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transaction history */}
      <div className="card mt-6 p-5 sm:p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
          Billing history
        </h3>
        {transactions.length === 0 ? (
          <p className="mt-4 text-sm text-ink-500">
            No transactions yet. Your billing history will appear here once payments are enabled.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-ink-400">
                <tr>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Description</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2 pr-4 text-ink-600">{formatDate(t.created_at)}</td>
                    <td className="py-2 pr-4 text-ink-700">{t.description || t.type}</td>
                    <td className="py-2 pr-4 capitalize text-ink-600">{t.status}</td>
                    <td className="py-2 text-right font-medium text-ink-900">
                      {t.amount === 0 ? '—' : `₹${t.amount}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-ink-400">
        {paymentsEnabled
          ? 'Payments are processed securely by Cashfree. Your Pro plan activates automatically once payment is confirmed.'
          : 'Online payments (Cashfree) are not configured on this server. Your trial gives you full Pro access in the meantime.'}
      </p>
    </div>
  );
}
