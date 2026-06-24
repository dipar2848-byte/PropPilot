import type { Metadata } from 'next';
import Link from 'next/link';
import { getPlatformStats } from '@/lib/data/admin';
import { PageHeader } from '@/components/dashboard/PageHeader';
import {
  UsersIcon,
  BuildingIcon,
  GlobeIcon,
  ChartIcon,
  CreditCardIcon,
  DocumentIcon,
} from '@/components/ui/Icons';

export const metadata: Metadata = { title: 'Admin · Overview' };
export const dynamic = 'force-dynamic';

function StatCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string | number;
  icon: (p: { className?: string }) => React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</p>
        <Icon className="h-5 w-5 text-brand-500" />
      </div>
      <p className="mt-2 text-2xl font-bold text-ink-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </div>
  );
}

export default async function AdminOverviewPage() {
  const stats = await getPlatformStats();

  return (
    <div>
      <PageHeader
        title="Admin overview"
        subtitle="Platform-wide metrics across all tenants."
        actions={
          <div className="flex gap-2">
            <Link href="/admin/users" className="btn-secondary">
              Manage users
            </Link>
            <Link href="/admin/transactions" className="btn-secondary">
              Transactions
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total users" value={stats.total_users} icon={UsersIcon} hint={`${stats.admin_users} admin${stats.admin_users === 1 ? '' : 's'}`} />
        <StatCard label="Properties" value={stats.total_properties} icon={BuildingIcon} />
        <StatCard label="Published landing pages" value={stats.published_landing} icon={GlobeIcon} />
        <StatCard label="Leads captured" value={stats.total_leads} icon={ChartIcon} />
        <StatCard label="Documents stored" value={stats.total_documents} icon={DocumentIcon} />
        <StatCard
          label="Pro subscribers"
          value={stats.subs_pro}
          icon={CreditCardIcon}
          hint={`${stats.subs_trialing} trialing · ${stats.subs_active} active`}
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-400">Revenue</h3>
          <p className="mt-2 text-3xl font-bold text-ink-900">
            ₹{stats.revenue_total.toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-xs text-ink-400">
            Total from {stats.paid_orders} paid order{stats.paid_orders === 1 ? '' : 's'}.
          </p>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
            Subscription mix
          </h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-ink-600">Trialing</dt>
              <dd className="font-semibold text-ink-900">{stats.subs_trialing}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-ink-600">Active</dt>
              <dd className="font-semibold text-ink-900">{stats.subs_active}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-ink-600">On Pro plan</dt>
              <dd className="font-semibold text-ink-900">{stats.subs_pro}</dd>
            </div>
          </dl>
        </div>
      </div>

      <p className="mt-6 text-xs text-ink-400">
        These figures are aggregated server-side via an admin-only RPC. Only platform
        administrators (profiles.is_admin) can view this page.
      </p>
    </div>
  );
}
