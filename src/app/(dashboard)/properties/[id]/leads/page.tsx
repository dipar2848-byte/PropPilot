import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProperty } from '@/lib/data/properties';
import { listPropertyLeads, getPropertyLeadCounts } from '@/lib/data/leads';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { LeadCard } from '@/components/leads/LeadCard';
import { LeadFilters } from '@/components/leads/LeadFilters';
import { UserIcon } from '@/components/ui/Icons';

export const metadata: Metadata = { title: 'Leads' };
export const dynamic = 'force-dynamic';

function CountTile({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="card p-4 text-center">
      <p className={`text-2xl font-bold ${accent}`}>{value}</p>
      <p className="text-xs text-ink-400">{label}</p>
    </div>
  );
}

export default async function PropertyLeadsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const property = await getProperty(id);
  if (!property) notFound();

  const [counts, leads] = await Promise.all([
    getPropertyLeadCounts(id),
    listPropertyLeads(id, { q: sp.q, status: sp.status }),
  ]);

  const hasFilters = Boolean((sp.q ?? '').trim() || (sp.status ?? '').trim());

  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle={property.title}
        backHref={`/properties/${id}`}
        backLabel="Back to property"
      />

      {/* Summary */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <CountTile label="Total" value={counts.total} accent="text-ink-900" />
        <CountTile label="New" value={counts.new} accent="text-brand-600" />
        <CountTile label="Contacted" value={counts.contacted} accent="text-amber-600" />
        <CountTile label="Closed" value={counts.closed} accent="text-emerald-600" />
      </div>

      {/* Show filters whenever there is at least one lead or an active filter */}
      {(counts.total > 0 || hasFilters) && (
        <div className="mb-5">
          <LeadFilters
            propertyId={id}
            initialQ={sp.q ?? ''}
            initialStatus={sp.status ?? ''}
          />
        </div>
      )}

      {leads.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon={<UserIcon className="h-7 w-7" />}
            title="No matching leads"
            description="Try adjusting your search or status filter."
          />
        ) : (
          <EmptyState
            icon={<UserIcon className="h-7 w-7" />}
            title="No leads yet"
            description="When visitors submit the inquiry form on your landing page, their details will appear here."
          />
        )
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      )}
    </div>
  );
}
