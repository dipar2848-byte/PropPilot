import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { listLandingPages } from '@/lib/data/landing';
import { checkLandingPageLimit } from '@/lib/data/subscription';
import { publicEnv } from '@/lib/env';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { UpgradePrompt } from '@/components/billing/UpgradePrompt';
import { CopyButton } from '@/components/ui/CopyButton';
import { GlobeIcon, BuildingIcon, ExternalLinkIcon } from '@/components/ui/Icons';
import { formatPrice, propertyTypeLabel } from '@/lib/utils';

export const metadata: Metadata = { title: 'Landing Pages' };
export const dynamic = 'force-dynamic';

export default async function LandingPagesPage() {
  const [items, limit] = await Promise.all([listLandingPages(), checkLandingPageLimit()]);
  const live = items.filter((i) => i.landing.is_published).length;
  const atLimit = !limit.allowed;
  const subtitle =
    limit.limit === null
      ? `${live} live · ${items.length} total`
      : `${live} live · ${items.length} total · ${live}/${limit.limit} published on your plan`;

  return (
    <div>
      <PageHeader title="Landing Pages" subtitle={subtitle} />

      {atLimit && (
        <UpgradePrompt
          tone="rose"
          className="mb-6"
          title="Published landing page limit reached"
          message={
            limit.reason ??
            `You've reached your plan limit of ${limit.limit} published landing page${
              limit.limit === 1 ? '' : 's'
            }. Unpublish one or upgrade to Pro to publish more.`
          }
        />
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={<GlobeIcon className="h-7 w-7" />}
          title="No landing pages yet"
          description="Open any property and publish a public, SEO-ready landing page in one click."
          actionHref="/properties"
          actionLabel="Go to properties"
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ landing, property, cover_url }) => {
            const hasValidSlug = !!landing.slug && landing.slug.trim() !== '';
            const url = hasValidSlug ? `${publicEnv.siteUrl}/p/${landing.slug}` : '';
            return (
              <div key={landing.id} className="card overflow-hidden">
                <div className="relative aspect-[16/10] bg-ink-100">
                  {cover_url ? (
                    <Image src={cover_url} alt={property.title} fill sizes="33vw" className="object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-ink-300">
                      <BuildingIcon className="h-10 w-10" />
                    </div>
                  )}
                  <span
                    className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      landing.is_published
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-ink-100 text-ink-600'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        landing.is_published ? 'bg-emerald-500' : 'bg-ink-400'
                      }`}
                    />
                    {landing.is_published ? 'Live' : 'Unpublished'}
                  </span>
                </div>

                <div className="p-4">
                  <Link
                    href={`/properties/${property.id}`}
                    className="font-semibold text-ink-900 hover:text-brand-700 line-clamp-1"
                  >
                    {property.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-ink-400">
                    {propertyTypeLabel(property.property_type)} · {formatPrice(property.price)}
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    <code className="flex-1 truncate rounded-lg bg-ink-50 px-2 py-1.5 text-xs text-ink-600">
                      {hasValidSlug ? `/p/${landing.slug}` : 'No public address — re-publish'}
                    </code>
                    {hasValidSlug && <CopyButton text={url} label="" />}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Link
                      href={`/properties/${property.id}/landing`}
                      className="btn-secondary flex-1 px-3 py-2 text-xs"
                    >
                      Manage
                    </Link>
                    {landing.is_published && hasValidSlug && (
                      <a
                        href={`/p/${landing.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary px-3 py-2 text-xs"
                      >
                        <ExternalLinkIcon className="h-4 w-4" /> Open
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
