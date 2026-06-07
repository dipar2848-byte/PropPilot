import type { Metadata } from 'next';
import { listProperties } from '@/lib/data/properties';
import { searchSchema } from '@/lib/validation';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { SearchForm } from '@/components/properties/SearchForm';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { SearchIcon } from '@/components/ui/Icons';

export const metadata: Metadata = { title: 'Search' };
export const dynamic = 'force-dynamic';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const parsed = searchSchema.parse({
    q: raw.q,
    type: raw.type,
    bedrooms: raw.bedrooms,
    minPrice: raw.minPrice,
    maxPrice: raw.maxPrice,
    status: raw.status,
  });

  const hasQuery = Object.values(parsed).some((v) => v);
  const results = await listProperties(parsed);

  return (
    <div>
      <PageHeader
        title="Search properties"
        subtitle="Find any listing by title, location, type, budget or bedrooms."
      />

      <SearchForm initial={parsed} />

      <div className="mt-6">
        {hasQuery && (
          <p className="mb-4 text-sm text-ink-500">
            {results.length} {results.length === 1 ? 'result' : 'results'} found
          </p>
        )}

        {results.length === 0 ? (
          <EmptyState
            icon={<SearchIcon className="h-7 w-7" />}
            title={hasQuery ? 'No matches found' : 'Start searching'}
            description={
              hasQuery
                ? 'Try adjusting your filters or search terms.'
                : 'Use the filters above to search your property inventory.'
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
