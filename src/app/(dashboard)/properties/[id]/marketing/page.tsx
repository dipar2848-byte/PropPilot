import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProperty } from '@/lib/data/properties';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { MarketingPanel } from '@/components/marketing/MarketingPanel';

export const metadata: Metadata = { title: 'Marketing kit' };
export const dynamic = 'force-dynamic';

export default async function PropertyMarketingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();

  return (
    <div>
      <PageHeader
        title="Marketing kit"
        subtitle={property.title}
        backHref={`/properties/${id}`}
        backLabel="Back to property"
      />
      <MarketingPanel propertyId={id} marketing={property.marketing} />
    </div>
  );
}
