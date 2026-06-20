import type { Metadata } from 'next';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { PropertyForm } from '@/components/properties/PropertyForm';
import { UpgradePrompt } from '@/components/billing/UpgradePrompt';
import { createPropertyAction } from '@/app/(dashboard)/properties/actions';
import { checkPropertyLimit } from '@/lib/data/subscription';

export const metadata: Metadata = { title: 'Add property' };
export const dynamic = 'force-dynamic';

export default async function NewPropertyPage() {
  const limit = await checkPropertyLimit();

  return (
    <div>
      <PageHeader
        title="Add a new property"
        subtitle="Fill in the details and upload photos to create your listing."
        backHref="/properties"
        backLabel="Back to properties"
      />

      {!limit.allowed ? (
        <UpgradePrompt
          tone="rose"
          title="Property limit reached"
          message={limit.reason ?? 'Upgrade to Pro to add more properties.'}
        />
      ) : (
        <PropertyForm action={createPropertyAction} submitLabel="Create property" />
      )}
    </div>
  );
}
