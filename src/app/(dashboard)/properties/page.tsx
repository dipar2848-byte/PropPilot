import type { Metadata } from 'next';
import { listProperties } from '@/lib/data/properties';
import { checkPropertyLimit } from '@/lib/data/subscription';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { UpgradePrompt } from '@/components/billing/UpgradePrompt';
import { BuildingIcon, PlusIcon, LockIcon } from '@/components/ui/Icons';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Properties' };
export const dynamic = 'force-dynamic';

export default async function PropertiesPage() {
  const [properties, limit] = await Promise.all([listProperties(), checkPropertyLimit()]);
  const atLimit = !limit.allowed;

  return (
    <div>
      <PageHeader
        title="Properties"
        subtitle={`${properties.length} ${properties.length === 1 ? 'listing' : 'listings'} in your workspace`}
        actions={
          atLimit ? (
            <span
              className="btn-secondary cursor-not-allowed opacity-60"
              title={limit.reason}
              aria-disabled
            >
              <LockIcon className="h-4 w-4" /> Add property
            </span>
          ) : (
            <Link href="/properties/new" className="btn-primary">
              <PlusIcon className="h-4 w-4" /> Add property
            </Link>
          )
        }
      />

      {atLimit && (
        <UpgradePrompt
          tone="rose"
          title="Property limit reached"
          message={limit.reason ?? 'Upgrade to Pro to add more properties.'}
          className="mb-6"
        />
      )}

      {properties.length === 0 ? (
        <EmptyState
          icon={<BuildingIcon className="h-7 w-7" />}
          title="No properties yet"
          description="Add your first property to start building marketing kits and landing pages."
          actionHref="/properties/new"
          actionLabel="Add your first property"
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </div>
  );
}
