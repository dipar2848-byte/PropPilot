import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProperty } from '@/lib/data/properties';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { PropertyForm } from '@/components/properties/PropertyForm';
import { updatePropertyAction, type PropertyActionState } from '@/app/(dashboard)/properties/actions';

export const metadata: Metadata = { title: 'Edit property' };
export const dynamic = 'force-dynamic';

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();

  async function action(prev: PropertyActionState, formData: FormData) {
    'use server';
    return updatePropertyAction(id, prev, formData);
  }

  return (
    <div>
      <PageHeader
        title="Edit property"
        subtitle={property.title}
        backHref={`/properties/${id}`}
        backLabel="Back to property"
      />
      <PropertyForm action={action} property={property} submitLabel="Save changes" />
    </div>
  );
}
