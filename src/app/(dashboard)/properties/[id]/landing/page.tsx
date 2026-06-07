import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProperty } from '@/lib/data/properties';
import { publicEnv } from '@/lib/env';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { LandingControls } from '@/components/landing/LandingControls';

export const metadata: Metadata = { title: 'Landing page' };
export const dynamic = 'force-dynamic';

export default async function PropertyLandingPage({
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
        title="Landing page"
        subtitle={property.title}
        backHref={`/properties/${id}`}
        backLabel="Back to property"
      />
      <LandingControls
        propertyId={id}
        landing={property.landing}
        siteUrl={publicEnv.siteUrl}
      />
    </div>
  );
}
