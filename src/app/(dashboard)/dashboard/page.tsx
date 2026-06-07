import type { Metadata } from 'next';
import Link from 'next/link';
import { getDashboardStats, listProperties } from '@/lib/data/properties';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import {
  BuildingIcon,
  GlobeIcon,
  SparklesIcon,
  PlusIcon,
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
  const [stats, recent] = await Promise.all([
    getDashboardStats(),
    listProperties({}, 6),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-500">
          Welcome back — here&apos;s an overview of your workspace.
        </p>
      </div>

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
