'use client';

import { useActionState } from 'react';
import { updateProfileAction, type ProfileActionState } from '@/app/(dashboard)/settings/actions';
import { SubmitButton } from '@/components/ui/SubmitButton';
import type { Profile } from '@/lib/types';

const initial: ProfileActionState = {};

export function ProfileForm({
  profile,
  redirectTo,
  submitLabel = 'Save profile',
}: {
  profile: Profile;
  redirectTo?: string;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(updateProfileAction, initial);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}

      {state.error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </div>
      )}
      {state.message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.message}
        </div>
      )}

      <div>
        <label htmlFor="full_name" className="label">
          Full name <span className="text-rose-500">*</span>
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          defaultValue={profile.full_name}
          className="input"
          placeholder="Jane Doe"
        />
        {state.fieldErrors?.full_name && (
          <p className="field-error">{state.fieldErrors.full_name}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="label">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            defaultValue={profile.phone}
            className="input"
            placeholder="+91 98765 43210"
          />
          {state.fieldErrors?.phone && <p className="field-error">{state.fieldErrors.phone}</p>}
        </div>

        <div>
          <label htmlFor="whatsapp_number" className="label">
            WhatsApp number
          </label>
          <input
            id="whatsapp_number"
            name="whatsapp_number"
            type="tel"
            inputMode="tel"
            defaultValue={profile.whatsapp_number}
            className="input"
            placeholder="919876543210"
          />
          {state.fieldErrors?.whatsapp_number && (
            <p className="field-error">{state.fieldErrors.whatsapp_number}</p>
          )}
        </div>
      </div>

      <p className="-mt-2 text-xs text-ink-400">
        Add at least a phone or WhatsApp number so buyers can reach you from your landing pages.
      </p>

      <div>
        <label htmlFor="email" className="label">
          Contact email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={profile.email}
          className="input"
          placeholder="you@agency.com"
        />
        {state.fieldErrors?.email && <p className="field-error">{state.fieldErrors.email}</p>}
      </div>

      <div>
        <label htmlFor="agency_name" className="label">
          Agency name <span className="text-ink-300">(optional)</span>
        </label>
        <input
          id="agency_name"
          name="agency_name"
          type="text"
          defaultValue={profile.agency_name ?? ''}
          className="input"
          placeholder="Acme Realty"
        />
        {state.fieldErrors?.agency_name && (
          <p className="field-error">{state.fieldErrors.agency_name}</p>
        )}
      </div>

      <div>
        <label htmlFor="profile_photo_url" className="label">
          Profile photo URL <span className="text-ink-300">(optional)</span>
        </label>
        <input
          id="profile_photo_url"
          name="profile_photo_url"
          type="url"
          defaultValue={profile.profile_photo_url ?? ''}
          className="input"
          placeholder="https://…"
        />
        {state.fieldErrors?.profile_photo_url && (
          <p className="field-error">{state.fieldErrors.profile_photo_url}</p>
        )}
      </div>

      <SubmitButton className="w-full sm:w-auto" pendingText="Saving…">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
