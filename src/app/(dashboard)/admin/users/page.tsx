import type { Metadata } from 'next';
import { listUsers } from '@/lib/data/admin';
import { requireUser } from '@/lib/data/properties';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { UserPlanControls } from '@/components/admin/UserPlanControls';
import { ShieldIcon } from '@/components/ui/Icons';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Admin · Users' };
export const dynamic = 'force-dynamic';

function PlanPill({ plan }: { plan: string }) {
  const isPro = plan === 'pro';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        isPro ? 'bg-emerald-100 text-emerald-700' : 'bg-ink-100 text-ink-600'
      }`}
    >
      {isPro ? 'Pro' : 'Free'}
    </span>
  );
}

export default async function AdminUsersPage() {
  const [users, { user: me }] = await Promise.all([listUsers(), requireUser()]);

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle={`${users.length} user${users.length === 1 ? '' : 's'} on the platform.`}
        backHref="/admin"
        backLabel="Admin overview"
      />

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink-900">
                      {u.full_name?.trim() || u.email || 'Unnamed user'}
                    </span>
                    {u.is_admin && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                        <ShieldIcon className="h-3 w-3" /> Admin
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-ink-400">
                    {u.email}
                    {u.agency_name ? ` · ${u.agency_name}` : ''}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <PlanPill plan={u.plan} />
                </td>
                <td className="px-4 py-3 capitalize text-ink-600">{u.status}</td>
                <td className="px-4 py-3 text-ink-600">{formatDate(u.created_at)}</td>
                <td className="px-4 py-3">
                  <UserPlanControls userId={u.id} isPro={u.plan === 'pro'} isSelf={u.id === me.id} />
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-ink-400">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-ink-400">
        Granting/revoking Pro is applied via an admin-only RPC and recorded in the billing
        ledger as an adjustment. The change takes effect immediately.
      </p>
    </div>
  );
}
