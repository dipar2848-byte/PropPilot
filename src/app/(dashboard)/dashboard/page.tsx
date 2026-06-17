import type { Metadata } from 'next';
import Link from 'next/link';
import { getDashboardStats, listProperties } from '@/lib/data/properties';
import { getSubscriptionState } from '@/lib/data/subscription';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import {
  BuildingIcon,
  GlobeIcon,
  SparklesIcon,
  PlusIcon,
  CreditCardIcon,
} from '@/components/ui/Icons';

export const metadata: Metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

const quickActions = [
  {
    href: '/properties/new',
    title: 'Add property',
    body: 'Create a new listing with photos and details.',
    icon: PlusIcon,
  },
  {
    href: '/marketing',
    title: 'Generate marketing kit',
    body: 'Produce social-ready copy with AI in one click.',
    icon: SparklesIcon,
  },
  {
    href: '/landing-pages',
    title: 'Create landing page',
    body: 'Publish a public, SEO-ready property page.',
    icon: GlobeIcon,
  },
];

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink-500">{label}</span>
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${accent}`}>{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-ink-900">{value}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const [stats, recent, subscription] = await Promise.all([
    getDashboardStats(),
    listProperties({}, 6),
    getSubscriptionState(),
  ]);

  const showTrialBanner = subscription.isTrialing || subscription.trialExpired;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-500">
          Welcome back — here&apos;s an overview of your workspace.
        </p>
      </div>

      {/* Trial / plan banner */}
      {showTrialBanner && (
        <Link
          href="/billing"
          className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 transition hover:shadow-soft ${
            subscription.trialExpired
              ? 'border-ink-200 bg-ink-50'
              : 'border-amber-200 bg-amber-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                subscription.trialExpired ? 'bg-ink-200 text-ink-600' : 'bg-amber-100 text-amber-600'
              }`}
            >
              <CreditCardIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-ink-900">
                {subscription.trialExpired
                  ? 'Your free trial has ended'
                  : `You're on a free trial — ${subscription.trialDaysLeft} day${
                      subscription.trialDaysLeft === 1 ? '' : 's'
                    } left`}
              </p>
              <p className="text-sm text-ink-500">
                {subscription.trialExpired
                  ? 'You are now on the Free plan. Upgrade to Pro to lift your limits.'
                  : 'Enjoy full Pro access during your trial. Manage your plan anytime.'}
              </p>
            </div>
          </div>
          <span className="text-sm font-semibold text-brand-600">View plans →</span>
        </Link>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Properties"
          value={stats.totalProperties}
          icon={<BuildingIcon className="h-5 w-5" />}
          accent="bg-brand-50 text-brand-600"
        />
        <StatCard
          label="Marketing Kits"
          value={stats.totalMarketingKits}
          icon={<SparklesIcon className="h-5 w-5" />}
          accent="bg-amber-50 text-amber-600"
        />
        <StatCard
          label="Landing Pages"
          value={stats.totalLandingPages}
          icon={<GlobeIcon className="h-5 w-5" />}
          accent="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">
          Quick actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {quickActions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="card group flex items-start gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-soft"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
                <a.icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-semibold text-ink-900">{a.title}</span>
                <span className="mt-0.5 block text-sm text-ink-500">{a.body}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent properties */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
            Recent properties
          </h2>
          {recent.length > 0 && (
            <Link
              href="/properties"
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              View all
            </Link>
          )}
        </div>

        {recent.length === 0 ? (
          <EmptyState
            icon={<BuildingIcon className="h-7 w-7" />}
            title="No properties yet"
            description="Add your first property to start building marketing kits and landing pages."
            actionHref="/properties/new"
            actionLabel="Add your first property"
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
