import type { Metadata } from 'next';
import { getDashboardStats } from '@/lib/data/properties';
import { getWorkspaceLeadCounts } from '@/lib/data/leads';
import { ExportCard } from '@/components/export/ExportCard';
import { BuildingIcon, UsersIcon } from '@/components/ui/Icons';

export const metadata: Metadata = {
  title: 'Export data',
};

// Always reflect the latest counts.
export const dynamic = 'force-dynamic';

export default async function ExportPage() {
  const [stats, leadCounts] = await Promise.all([
    getDashboardStats(),
    getWorkspaceLeadCounts(),
  ]);

  return (
    <div className="animate-fade-in space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-ink-900">Export data</h1>
        <p className="mt-1 text-sm text-ink-500">
          Download your workspace data as CSV — open it in Excel, Google Sheets
          or Numbers. Exports include only your own records and never contain
          private documents or internal notes.
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2">
        <ExportCard
          title="Leads"
          description="All enquiries captured from your landing pages, with status, source and the property they came from."
          count={leadCounts.total}
          href="/api/export/leads"
          icon={<UsersIcon className="h-5 w-5" />}
        />
        <ExportCard
          title="Properties"
          description="Your full property catalogue including type, price, location, size and amenities."
          count={stats.totalProperties}
          href="/api/export/properties"
          icon={<BuildingIcon className="h-5 w-5" />}
        />
      </div>

      <p className="text-xs text-ink-400">
        CSV files use UTF-8 with a byte-order mark so non-English text displays
        correctly, and fields are escaped per RFC 4180.
      </p>
    </div>
  );
}
