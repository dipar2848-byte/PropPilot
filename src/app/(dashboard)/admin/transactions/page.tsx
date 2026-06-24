import type { Metadata } from 'next';
import { listAllTransactions } from '@/lib/data/admin';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Admin · Transactions' };
export const dynamic = 'force-dynamic';

function StatusPill({ status }: { status: string }) {
  const tone =
    status === 'succeeded'
      ? 'bg-emerald-100 text-emerald-700'
      : status === 'failed'
        ? 'bg-red-100 text-red-700'
        : status === 'refunded'
          ? 'bg-amber-100 text-amber-700'
          : 'bg-ink-100 text-ink-600';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${tone}`}>
      {status}
    </span>
  );
}

export default async function AdminTransactionsPage() {
  const txns = await listAllTransactions();

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle={`${txns.length} most recent transaction${txns.length === 1 ? '' : 's'} across all users.`}
        backHref="/admin"
        backLabel="Admin overview"
      />

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {txns.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-3 text-ink-600">{formatDate(t.created_at)}</td>
                <td className="px-4 py-3 text-ink-700">{t.email}</td>
                <td className="px-4 py-3 text-ink-700">{t.description || t.type}</td>
                <td className="px-4 py-3 capitalize text-ink-600">{t.type}</td>
                <td className="px-4 py-3">
                  <StatusPill status={t.status} />
                </td>
                <td className="px-4 py-3 text-right font-medium text-ink-900">
                  {t.amount === 0 ? '—' : `₹${t.amount.toLocaleString('en-IN')}`}
                </td>
              </tr>
            ))}
            {txns.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-ink-400">
                  No transactions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
