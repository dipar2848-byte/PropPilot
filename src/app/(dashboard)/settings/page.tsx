import type { Metadata } from 'next';
import { getMyProfile, isProfileComplete } from '@/lib/data/profile';
import { ProfileForm } from '@/components/settings/ProfileForm';
import { PageHeader } from '@/components/dashboard/PageHeader';

export const metadata: Metadata = { title: 'Settings' };
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const profile = await getMyProfile();
  const complete = isProfileComplete(profile);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        subtitle="Manage your agent profile. These details appear on your public landing pages."
      />

      {!complete && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your profile is incomplete. Add your name and a phone or WhatsApp number so buyers can
          contact you.
        </div>
      )}

      <section className="card max-w-2xl p-6">
        <h2 className="mb-4 text-lg font-bold text-ink-900">Agent profile</h2>
        <ProfileForm profile={profile} />
      </section>
    </div>
  );
}
