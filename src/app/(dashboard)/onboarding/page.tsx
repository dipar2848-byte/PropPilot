import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getMyProfile, isProfileComplete } from '@/lib/data/profile';
import { ProfileForm } from '@/components/settings/ProfileForm';
import { APP_CONFIG } from '@/lib/config';

export const metadata: Metadata = { title: 'Welcome' };
export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const profile = await getMyProfile();

  // If the profile is already complete, no need to onboard again.
  if (isProfileComplete(profile)) {
    redirect('/dashboard');
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
          Step 1 of 2
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink-900">
          Welcome to {APP_CONFIG.name}
        </h1>
        <p className="mt-2 text-ink-500">
          {APP_CONFIG.tagline}. Let&apos;s set up your agent profile — these details appear on the
          public landing pages buyers will see.
        </p>
      </div>

      <section className="card p-6">
        <h2 className="mb-4 text-lg font-bold text-ink-900">Your contact details</h2>
        <ProfileForm
          profile={profile}
          redirectTo="/dashboard"
          submitLabel="Continue to dashboard"
        />
        <div className="mt-4 text-center">
          <Link href="/dashboard" className="text-sm font-medium text-ink-400 hover:text-ink-700">
            Skip for now
          </Link>
        </div>
      </section>
    </div>
  );
}
