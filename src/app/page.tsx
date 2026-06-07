import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Logo } from '@/components/ui/Logo';
import { BuildingIcon, SparklesIcon, GlobeIcon, SearchIcon } from '@/components/ui/Icons';

const features = [
  {
    icon: BuildingIcon,
    title: 'Property management',
    body: 'Add unlimited listings with photos, pricing, amenities and rich detail. Full CRUD with search and duplication.',
  },
  {
    icon: SparklesIcon,
    title: 'AI marketing kits',
    body: 'Generate listing descriptions, Instagram, Facebook, LinkedIn and WhatsApp copy in a single click.',
  },
  {
    icon: GlobeIcon,
    title: 'Landing pages',
    body: 'Publish SEO-ready, mobile-first property pages with galleries and instant WhatsApp contact.',
  },
  {
    icon: SearchIcon,
    title: 'Instant search',
    body: 'Find any property by title, location, type, budget or bedrooms with real database-powered search.',
  },
];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo />
          <nav className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost">
              Sign in
            </Link>
            <Link href="/signup" className="btn-primary">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0 -z-10"
            style={{
              background:
                'radial-gradient(60% 60% at 50% 0%, rgba(53,99,255,0.12) 0%, rgba(248,250,252,0) 70%)',
            }}
          />
          <div className="mx-auto max-w-4xl px-6 py-20 text-center sm:py-28">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              <SparklesIcon className="h-3.5 w-3.5" /> AI-powered real estate marketing
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-ink-900 sm:text-6xl">
              List, market and sell properties{' '}
              <span className="text-brand-600">in record time.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-600">
              PropPilot is the focused platform for real estate agents to manage listings,
              generate complete AI marketing kits and publish beautiful landing pages — all from
              one private dashboard.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/signup" className="btn-primary px-6 py-3 text-base">
                Start free
              </Link>
              <Link href="/login" className="btn-secondary px-6 py-3 text-base">
                Sign in
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="card p-6">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-ink-900">{f.title}</h3>
                <p className="mt-2 text-sm text-ink-500">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="overflow-hidden rounded-2xl bg-brand-700 px-8 py-14 text-center text-white sm:px-16">
            <h2 className="text-3xl font-bold">Ready to pilot your property marketing?</h2>
            <p className="mx-auto mt-3 max-w-xl text-brand-100">
              Create your free workspace and add your first property in under two minutes.
            </p>
            <Link
              href="/signup"
              className="btn mt-8 bg-white px-6 py-3 text-base text-brand-700 hover:bg-brand-50"
            >
              Create your account
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-ink-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 sm:flex-row">
          <Logo />
          <p className="text-sm text-ink-400">
            © {new Date().getFullYear()} PropPilot. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
