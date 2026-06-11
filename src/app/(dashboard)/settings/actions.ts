'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/data/properties';
import { profileSchema } from '@/lib/validation';
import { rateLimit } from '@/lib/rate-limit';

export interface ProfileActionState {
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
}

function flattenZod(error: import('zod').ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString() ?? 'form';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/**
 * Updates the authenticated user's profile. All writes are scoped to
 * auth.uid() and protected by RLS. Optionally redirects (used by onboarding).
 */
export async function updateProfileAction(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const { supabase, user } = await requireUser();

  // Light rate limit to deter abuse.
  const rl = rateLimit(`profile:${user.id}`, 20, 60_000);
  if (!rl.success) {
    return { error: 'Too many updates. Please wait a moment and try again.' };
  }

  const parsed = profileSchema.safeParse({
    full_name: formData.get('full_name'),
    phone: formData.get('phone'),
    whatsapp_number: formData.get('whatsapp_number'),
    email: formData.get('email'),
    agency_name: formData.get('agency_name'),
    profile_photo_url: formData.get('profile_photo_url'),
  });

  if (!parsed.success) {
    return { fieldErrors: flattenZod(parsed.error) };
  }

  // Never allow is_admin to be set from the client — it is intentionally
  // excluded from the schema and from this update payload.
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone,
      whatsapp_number: parsed.data.whatsapp_number,
      email: parsed.data.email,
      agency_name: parsed.data.agency_name || null,
      profile_photo_url: parsed.data.profile_photo_url || null,
    })
    .eq('id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/settings');
  revalidatePath('/dashboard');

  const redirectTo = (formData.get('redirect') as string) || '';
  if (redirectTo.startsWith('/')) {
    redirect(redirectTo);
  }

  return { message: 'Profile saved.' };
}
