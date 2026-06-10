import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/data/properties';
import type { Profile } from '@/lib/types';

/**
 * Returns the authenticated user's profile, creating a default row if one does
 * not yet exist (defensive — the auth trigger normally creates it on signup).
 */
export async function getMyProfile(): Promise<Profile> {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (data) return data as Profile;

  // Defensive self-heal: insert a minimal profile if the trigger missed it.
  const { data: inserted, error: insertError } = await supabase
    .from('profiles')
    .insert({ id: user.id, email: user.email ?? '' })
    .select('*')
    .single();

  if (insertError) throw new Error(insertError.message);
  return inserted as Profile;
}

/** True when the agent has the minimum contact details needed for landing pages. */
export function isProfileComplete(profile: Pick<Profile, 'full_name' | 'phone' | 'whatsapp_number'>): boolean {
  return (
    profile.full_name.trim().length > 0 &&
    (profile.phone.trim().length > 0 || profile.whatsapp_number.trim().length > 0)
  );
}

/** Returns whether the current user is a platform admin (server-side check). */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();

  return Boolean(data?.is_admin);
}
