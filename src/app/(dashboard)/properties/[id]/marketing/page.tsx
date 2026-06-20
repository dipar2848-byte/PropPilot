import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProperty } from '@/lib/data/properties';
import { checkAiGenerationLimit } from '@/lib/data/subscription';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { MarketingPanel } from '@/components/marketing/MarketingPanel';
import { UpgradePrompt } from '@/components/billing/UpgradePrompt';

export const metadata: Metadata = { title: 'Marketing kit' };
export const dynamic = 'force-dynamic';

export default async function PropertyMarketingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [property, aiLimit] = await Promise.all([getProperty(id), checkAiGenerationLimit()]);
  if (!property) notFound();

  const aiUsageLabel =
    aiLimit.limit === null ? 'Unlimited generations' : `${aiLimit.current} / ${aiLimit.limit} used this month`;

  return (
    <div>
      <PageHeader
        title="Marketing kit"
        subtitle={property.title}
        backHref={`/properties/${id}`}
        backLabel="Back to property"
      />

      {!aiLimit.allowed && (
        <UpgradePrompt
          tone="rose"
          title="Monthly AI generation limit reached"
          message={aiLimit.reason ?? 'Upgrade to Pro for unlimited AI generations.'}
          className="mb-6"
        />
      )}

      <MarketingPanel
        propertyId={id}
        marketing={property.marketing}
        aiDisabled={!aiLimit.allowed}
        aiUsageLabel={aiUsageLabel}
      />
    </div>
  );
}
