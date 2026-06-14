import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicLanding } from '@/lib/data/landing';
import { publicEnv } from '@/lib/env';
import { APP_CONFIG } from '@/lib/config';
import { PublicGallery } from '@/components/landing/PublicGallery';
import { LeadForm } from '@/components/landing/LeadForm';
import { Logo } from '@/components/ui/Logo';
import {
  BedIcon,
  BathIcon,
  AreaIcon,
  PinIcon,
  PhoneIcon,
  MailIcon,
  WhatsAppIcon,
} from '@/components/ui/Icons';
import {
  formatPrice,
  formatArea,
  propertyTypeLabel,
  truncate,
} from '@/lib/utils';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicLanding(slug);
  if (!data) {
    return { title: 'Property not found', robots: { index: false } };
  }

  const { property } = data;
  const description =
    data.marketing?.short_description ||
    truncate(property.description, 160) ||
    `${propertyTypeLabel(property.property_type)} for sale${
      property.location ? ` in ${property.location}` : ''
    }.`;
  const cover = data.images[0]?.image_url;
  const url = `${publicEnv.siteUrl}/p/${slug}`;

  return {
    title: property.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      title: property.title,
      description,
      url,
      images: cover ? [{ url: cover, width: 1200, height: 630, alt: property.title }] : undefined,
    },
    twitter: {
      card: cover ? 'summary_large_image' : 'summary',
      title: property.title,
      description,
      images: cover ? [cover] : undefined,
    },
  };
}

function Spec({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-4 text-center shadow-card">
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
        {icon}
      </div>
      <p className="mt-2 text-lg font-bold text-ink-900">{value}</p>
      <p className="text-xs text-ink-400">{label}</p>
    </div>
  );
}

export default async function PublicLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPublicLanding(slug);
  if (!data) notFound();

  const { property, images, marketing, agent } = data;
  const phone = agent?.phone ?? '';
  const email = agent?.email ?? '';
  const whatsapp = agent?.whatsapp_number ?? '';
  const agentName = agent?.full_name ?? '';
  const description = marketing?.long_description || property.description;
  // Lead capture is disabled for listings that are no longer available.
  const leadCaptureDisabled = ['archived', 'sold', 'rented'].includes(property.status);

  // JSON-LD structured data for SEO.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: description || undefined,
    url: `${publicEnv.siteUrl}/p/${slug}`,
    image: images.map((i) => i.image_url),
    datePosted: property.created_at,
    offers: {
      '@type': 'Offer',
      price: property.price,
      priceCurrency: 'USD',
    },
  };

  return (
    <div className="min-h-screen bg-ink-50">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <Logo />
          {whatsapp && !leadCaptureDisabled && (
            <a
              href="#enquire"
              className="btn inline-flex bg-[#25D366] px-3 py-2 text-sm text-white hover:bg-[#1ebe5d]"
            >
              <WhatsAppIcon className="h-4 w-4" /> Enquire
            </a>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">
        {/* Hero */}
        <section className="mb-8">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                {propertyTypeLabel(property.property_type)}
              </span>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
                {property.title}
              </h1>
              {property.location && (
                <p className="mt-2 flex items-center gap-1.5 text-ink-500">
                  <PinIcon className="h-4 w-4" /> {property.location}
                </p>
              )}
            </div>
            <p className="text-3xl font-bold text-brand-700">{formatPrice(property.price)}</p>
          </div>

          <PublicGallery images={images} title={property.title} />
        </section>

        {/* Key specs */}
        <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Spec icon={<BedIcon className="h-5 w-5" />} label="Bedrooms" value={String(property.bedrooms)} />
          <Spec icon={<BathIcon className="h-5 w-5" />} label="Bathrooms" value={String(property.bathrooms)} />
          <Spec icon={<AreaIcon className="h-5 w-5" />} label="Carpet area" value={formatArea(property.carpet_area)} />
          <Spec icon={<AreaIcon className="h-5 w-5" />} label="Built-up area" value={formatArea(property.built_up_area)} />
        </section>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            {/* Description */}
            {description && (
              <section>
                <h2 className="text-xl font-bold text-ink-900">About this property</h2>
                <p className="mt-3 whitespace-pre-wrap leading-relaxed text-ink-700">
                  {description}
                </p>
              </section>
            )}

            {/* Amenities */}
            {property.amenities.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-ink-900">Features &amp; amenities</h2>
                <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {property.amenities.map((a) => (
                    <li
                      key={a}
                      className="flex items-center gap-2 rounded-xl border border-ink-100 bg-white px-3 py-2.5 text-sm text-ink-700 shadow-card"
                    >
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-100 text-brand-700">
                        ✓
                      </span>
                      {a}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Contact CTA */}
          <aside id="enquire" className="lg:sticky lg:top-20 lg:self-start">
            <div className="card p-6">
              {leadCaptureDisabled && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs font-medium text-amber-800">
                  This property is no longer available.
                </div>
              )}
              <h2 className="text-lg font-bold text-ink-900">Interested?</h2>
              <p className="mt-1 text-sm text-ink-500">
                Get in touch to schedule a viewing or ask a question.
              </p>
              {agentName && (
                <p className="mt-3 text-sm font-semibold text-ink-700">
                  {agentName}
                  {agent?.agency_name ? (
                    <span className="block text-xs font-normal text-ink-400">
                      {agent.agency_name}
                    </span>
                  ) : null}
                </p>
              )}

              <div className="mt-5">
                <LeadForm
                  slug={slug}
                  propertyTitle={property.title}
                  whatsappNumber={whatsapp}
                  disabled={leadCaptureDisabled}
                />
              </div>

              {(phone || email) && (
                <div className="mt-4 space-y-2.5 border-t border-ink-100 pt-4">
                  {phone && (
                    <a href={`tel:${phone}`} className="btn-secondary w-full">
                      <PhoneIcon className="h-5 w-5" /> Call {phone}
                    </a>
                  )}
                  {email && (
                    <a
                      href={`mailto:${email}?subject=${encodeURIComponent(`Enquiry: ${property.title}`)}`}
                      className="btn-secondary w-full"
                    >
                      <MailIcon className="h-5 w-5" /> Email us
                    </a>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      <footer className="border-t border-ink-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-5 py-6 sm:flex-row">
          <Logo />
          <p className="text-xs text-ink-400">
            Powered by {APP_CONFIG.name} · © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
