import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProperty } from '@/lib/data/properties';
import { getPropertyLeadCounts } from '@/lib/data/leads';
import { getPropertyDocumentCount } from '@/lib/data/documents';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { PropertyGallery } from '@/components/properties/PropertyGallery';
import { PropertyActions } from '@/components/properties/PropertyActions';
import { StatusBadge } from '@/components/ui/Badge';
import {
  PencilIcon,
  BedIcon,
  BathIcon,
  AreaIcon,
  PinIcon,
  SparklesIcon,
  GlobeIcon,
  UserIcon,
  DocumentIcon,
  LockIcon,
} from '@/components/ui/Icons';
import {
  formatPrice,
  formatArea,
  propertyTypeLabel,
} from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const property = await getProperty(id);
  return { title: property?.title ?? 'Property' };
}

function Spec({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-ink-50/60 p-3">
      <div className="flex items-center gap-1.5 text-ink-400">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-1 text-sm font-semibold text-ink-900">{value}</p>
    </div>
  );
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();

  const [leadCounts, documentCount] = await Promise.all([
    getPropertyLeadCounts(id),
    getPropertyDocumentCount(id),
  ]);

  return (
    <div>
      <PageHeader
        title={property.title}
        backHref="/properties"
        backLabel="Back to properties"
        actions={
          <>
            <Link href={`/properties/${id}/edit`} className="btn-secondary">
              <PencilIcon className="h-4 w-4" /> Edit
            </Link>
            <PropertyActions propertyId={id} />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <PropertyGallery images={property.images} title={property.title} />

          <div className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <StatusBadge status={property.status} />
                <span className="text-xs font-medium uppercase tracking-wide text-brand-600">
                  {propertyTypeLabel(property.property_type)}
                </span>
              </div>
              <span className="text-2xl font-bold text-ink-900">
                {formatPrice(property.price)}
              </span>
            </div>

            {property.location && (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-ink-600">
                <PinIcon className="h-4 w-4" /> {property.location}
              </p>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Spec icon={<BedIcon className="h-4 w-4" />} label="Bedrooms" value={String(property.bedrooms)} />
              <Spec icon={<BathIcon className="h-4 w-4" />} label="Bathrooms" value={String(property.bathrooms)} />
              <Spec icon={<AreaIcon className="h-4 w-4" />} label="Carpet" value={formatArea(property.carpet_area)} />
              <Spec icon={<AreaIcon className="h-4 w-4" />} label="Built-up" value={formatArea(property.built_up_area)} />
            </div>

            {property.description && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
                  Description
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
                  {property.description}
                </p>
              </div>
            )}

            {property.amenities.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
                  Amenities
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {property.amenities.map((a) => (
                    <span
                      key={a}
                      className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: marketing + landing shortcuts */}
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600">
                <SparklesIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-900">Marketing kit</p>
                <p className="text-xs text-ink-400">
                  {property.marketing ? 'Generated' : 'Not generated yet'}
                </p>
              </div>
            </div>
            <Link href={`/properties/${id}/marketing`} className="btn-primary mt-4 w-full">
              {property.marketing ? 'View / regenerate' : 'Generate marketing kit'}
            </Link>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                <GlobeIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-900">Landing page</p>
                <p className="text-xs text-ink-400">
                  {property.landing?.is_published
                    ? 'Published & live'
                    : property.landing
                      ? 'Unpublished'
                      : 'Not created yet'}
                </p>
              </div>
            </div>
            <Link href={`/properties/${id}/landing`} className="btn-secondary mt-4 w-full">
              Manage landing page
            </Link>
            {property.landing?.is_published && property.landing.slug && (
              <a
                href={`/p/${property.landing.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block text-center text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                View public page ↗
              </a>
            )}
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <UserIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-900">Leads</p>
                <p className="text-xs text-ink-400">
                  {leadCounts.total === 0
                    ? 'No leads yet'
                    : `${leadCounts.total} total · ${leadCounts.new} new`}
                </p>
              </div>
            </div>
            <Link href={`/properties/${id}/leads`} className="btn-secondary mt-4 w-full">
              View leads
            </Link>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-sky-50 text-sky-600">
                <DocumentIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-900">Documents</p>
                <p className="text-xs text-ink-400">
                  {documentCount === 0
                    ? 'No documents yet'
                    : `${documentCount} of 5 stored`}
                </p>
              </div>
            </div>
            <Link href={`/properties/${id}/documents`} className="btn-secondary mt-4 w-full">
              Manage documents
            </Link>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600">
                <LockIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-900">Private details</p>
                <p className="text-xs text-ink-400">Owner, commission &amp; notes — private</p>
              </div>
            </div>
            <Link href={`/properties/${id}/private`} className="btn-secondary mt-4 w-full">
              Edit private details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
