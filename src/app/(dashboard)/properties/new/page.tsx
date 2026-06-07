import type { Metadata } from 'next';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { PropertyForm } from '@/components/properties/PropertyForm';
import { createPropertyAction } from '@/app/(dashboard)/properties/actions';

export const metadata: Metadata = { title: 'Add property' };

export default function NewPropertyPage() {
  return (
    <div>
      <PageHeader
        title="Add a new property"
        subtitle="Fill in the details and upload photos to create your listing."
        backHref="/properties"
        backLabel="Back to properties"
      />
      <PropertyForm action={createPropertyAction} submitLabel="Create property" />
    </div>
  );
}
