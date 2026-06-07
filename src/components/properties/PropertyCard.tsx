import Link from 'next/link';
import Image from 'next/image';
import type { PropertyListItem } from '@/lib/data/properties';
import { StatusBadge } from '@/components/ui/Badge';
import { BuildingIcon, BedIcon, BathIcon, PinIcon, SparklesIcon, GlobeIcon } from '@/components/ui/Icons';
import { formatPrice, propertyTypeLabel, truncate } from '@/lib/utils';

export function PropertyCard({ property }: { property: PropertyListItem }) {
  return (
    <Link
      href={`/properties/${property.id}`}
      className="card group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-soft"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-ink-100">
        {property.cover_url ? (
          <Image
            src={property.cover_url}
            alt={property.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-300">
            <BuildingIcon className="h-10 w-10" />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <StatusBadge status={property.status} />
        </div>
        {property.image_count > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-ink-900/70 px-2 py-0.5 text-xs font-medium text-white">
            {property.image_count} photos
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-ink-900 line-clamp-1">{property.title}</h3>
        </div>
        <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-brand-600">
          {propertyTypeLabel(property.property_type)}
        </p>

        {property.location && (
          <p className="mt-2 flex items-center gap-1 text-sm text-ink-500">
            <PinIcon className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1">{truncate(property.location, 40)}</span>
          </p>
        )}

        <div className="mt-3 flex items-center gap-4 text-sm text-ink-600">
          <span className="inline-flex items-center gap-1">
            <BedIcon className="h-4 w-4" /> {property.bedrooms}
          </span>
          <span className="inline-flex items-center gap-1">
            <BathIcon className="h-4 w-4" /> {property.bathrooms}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-3">
          <span className="text-lg font-bold text-ink-900">{formatPrice(property.price)}</span>
          <div className="flex items-center gap-1.5 text-ink-400">
            {property.has_marketing && (
              <span title="Marketing kit ready" className="text-brand-500">
                <SparklesIcon className="h-4 w-4" />
              </span>
            )}
            {property.has_landing && (
              <span title="Landing page published" className="text-emerald-500">
                <GlobeIcon className="h-4 w-4" />
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
