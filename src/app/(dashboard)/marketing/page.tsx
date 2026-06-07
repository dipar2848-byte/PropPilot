import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { listMarketing } from '@/lib/data/marketing';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { SparklesIcon, BuildingIcon } from '@/components/ui/Icons';
import { formatPrice, propertyTypeLabel, relativeTime } from '@/lib/utils';

export const metadata: Metadata = { title: 'Marketing Kits' };
export const dynamic = 'force-dynamic';

export default async function MarketingPage() {
  const items = await listMarketing();
  const generated = items.filter((i) => i.has_marketing).length;

  return (
    <div>
      <PageHeader
        title="Marketing Kits"
        subtitle={`${generated} of ${items.length} ${items.length === 1 ? 'property has' : 'properties have'} a marketing kit`}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={<SparklesIcon className="h-7 w-7" />}
          title="No properties to market yet"
          description="Add a property first, then generate a complete AI marketing kit for it."
          actionHref="/properties/new"
          actionLabel="Add a property"
        />
      ) : (
        <div className="card divide-y divide-ink-100">
          {items.map(({ property, cover_url, has_marketing, provider, updated_at }) => (
            <div key={property.id} className="flex items-center gap-4 p-4">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-ink-100">
                {cover_url ? (
                  <Image src={cover_url} alt={property.title} fill sizes="56px" className="object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-ink-300">
                    <BuildingIcon className="h-6 w-6" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink-900">{property.title}</p>
                <p className="text-xs text-ink-400">
                  {propertyTypeLabel(property.property_type)} · {formatPrice(property.price)}
                  {has_marketing && updated_at && (
                    <>
                      {' '}· Updated {relativeTime(updated_at)}
                      {provider && provider !== 'template' ? ` · ${provider}` : ''}
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {has_marketing ? (
                  <span className="hidden rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 sm:inline">
                    Ready
                  </span>
                ) : (
                  <span className="hidden rounded-full bg-ink-100 px-2.5 py-0.5 text-xs font-semibold text-ink-500 sm:inline">
                    Not generated
                  </span>
                )}
                <Link
                  href={`/properties/${property.id}/marketing`}
                  className="btn-secondary px-3 py-2 text-xs"
                >
                  <SparklesIcon className="h-4 w-4" />
                  {has_marketing ? 'View' : 'Generate'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
