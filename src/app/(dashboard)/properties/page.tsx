import type { Metadata } from 'next';
import { listProperties } from '@/lib/data/properties';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { BuildingIcon, PlusIcon } from '@/components/ui/Icons';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Properties' };
export const dynamic = 'force-dynamic';

export default async function PropertiesPage() {
  const properties = await listProperties();

  return (
    <div>
      <PageHeader
        title="Properties"
        subtitle={`${properties.length} ${properties.length === 1 ? 'listing' : 'listings'} in your workspace`}
        actions={
          <Link href="/properties/new" className="btn-primary">
            <PlusIcon className="h-4 w-4" /> Add property
          </Link>
        }
      />

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
