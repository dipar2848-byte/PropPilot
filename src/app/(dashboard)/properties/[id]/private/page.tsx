import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProperty } from '@/lib/data/properties';
import { getPrivateDetails } from '@/lib/data/documents';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { PrivateDetailsForm } from '@/components/private/PrivateDetailsForm';
import { LockIcon } from '@/components/ui/Icons';

export const metadata: Metadata = { title: 'Private details' };
export const dynamic = 'force-dynamic';

export default async function PropertyPrivatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();

  const details = await getPrivateDetails(id);

  return (
    <div>
      <PageHeader
        title="Private details"
        subtitle={property.title}
        backHref={`/properties/${id}`}
        backLabel="Back to property"
      />

      <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <LockIcon className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          This information is <span className="font-semibold">strictly internal</span>. It is never
          shown on public landing pages, never used by the AI marketing kit, and never returned by
          any public API.
        </p>
      </div>

      <div className="card max-w-3xl p-5 sm:p-6">
        <PrivateDetailsForm propertyId={id} details={details} />
      </div>
    </div>
  );
}
