'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/data/properties';
import {
  checkPropertyLimit,
  checkAiGenerationLimit,
  checkLandingPageLimit,
  recordUsage,
} from '@/lib/data/subscription';
import { propertySchema, parseAmenities } from '@/lib/validation';
import { sanitiseFileName, buildSlug } from '@/lib/utils';
import { generateMarketingKit } from '@/lib/ai/service';
import { rateLimit } from '@/lib/rate-limit';
import { publicEnv } from '@/lib/env';

const BUCKET = 'property-images';
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

export interface PropertyActionState {
  error?: string;
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

function parseForm(formData: FormData) {
  return propertySchema.safeParse({
    title: formData.get('title'),
    property_type: formData.get('property_type'),
    location: formData.get('location'),
    price: formData.get('price'),
    carpet_area: formData.get('carpet_area'),
    built_up_area: formData.get('built_up_area'),
    bedrooms: formData.get('bedrooms'),
    bathrooms: formData.get('bathrooms'),
    amenities: parseAmenities((formData.get('amenities') as string) ?? ''),
    description: formData.get('description'),
    status: formData.get('status'),
  });
}

/** Uploads pending image files for a property and inserts image rows. */
async function uploadImages(
  propertyId: string,
  userId: string,
  files: File[],
  startPosition: number,
  makeFirstCover: boolean,
): Promise<void> {
  if (files.length === 0) return;
  const supabase = await createClient();

  let position = startPosition;
  for (const file of files) {
    if (!file || file.size === 0) continue;
    if (file.size > MAX_FILE_BYTES) {
      throw new Error(`"${file.name}" exceeds the 5MB size limit.`);
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`"${file.name}" is not a supported image type.`);
    }

    const path = `${userId}/${propertyId}/${sanitiseFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: '31536000', upsert: false, contentType: file.type });
    if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path);

    const { error: rowError } = await supabase.from('property_images').insert({
      property_id: propertyId,
      user_id: userId,
      image_url: publicUrl,
      storage_path: path,
      position,
      is_cover: makeFirstCover && position === startPosition,
    });
    if (rowError) throw new Error(`Could not save image: ${rowError.message}`);
    position += 1;
  }
}

export async function createPropertyAction(
  _prev: PropertyActionState,
  formData: FormData,
): Promise<PropertyActionState> {
  const parsed = parseForm(formData);
  if (!parsed.success) return { fieldErrors: flattenZod(parsed.error) };

  let user;
  let supabase;
  try {
    ({ supabase, user } = await requireUser());
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  // Server-side plan-limit enforcement. NEVER trust the client: the count and
  // the effective plan are both read from the database.
  try {
    const limitCheck = await checkPropertyLimit();
    if (!limitCheck.allowed) {
      return { error: limitCheck.reason ?? 'You have reached your property limit.' };
    }
  } catch {
    // If the limit check itself errors (e.g. transient), do not hard-block
    // creation — but log via the returned error path only when insert fails.
  }

  // The property row is the primary entity — insert it first and fail hard if
  // this does not succeed (schema / RLS / connectivity issues surface clearly).
  const { data, error } = await supabase
    .from('properties')
    .insert({ ...parsed.data, user_id: user.id })
    .select('id')
    .single();

  if (error || !data?.id) {
    return {
      error: error?.message
        ? `Could not create property: ${error.message}`
        : 'Could not create property. Please try again.',
    };
  }

  // Image uploads are secondary. If they fail we keep the created property and
  // surface a clear, non-fatal message rather than stranding the user on a
  // generic error while the property silently exists.
  const files = formData.getAll('images').filter((f): f is File => f instanceof File && f.size > 0);
  let imageWarning: string | undefined;
  if (files.length > 0) {
    try {
      await uploadImages(data.id, user.id, files, 0, true);
    } catch (e) {
      imageWarning = e instanceof Error ? e.message : 'Some images could not be uploaded.';
    }
  }

  revalidatePath('/dashboard');
  revalidatePath('/properties');

  // If images failed, stay on the form context by reporting the warning; the
  // property already exists, so the user can open it and add photos there.
  if (imageWarning) {
    return {
      error: `Property created, but image upload failed: ${imageWarning} You can add photos from the property page.`,
    };
  }

  redirect(`/properties/${data.id}`);
}

export async function updatePropertyAction(
  propertyId: string,
  _prev: PropertyActionState,
  formData: FormData,
): Promise<PropertyActionState> {
  const parsed = parseForm(formData);
  if (!parsed.success) return { fieldErrors: flattenZod(parsed.error) };

  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from('properties')
    .update(parsed.data)
    .eq('id', propertyId)
    .eq('user_id', user.id);
  if (error) return { error: error.message };

  // Determine current image count for positioning + cover.
  const { count } = await supabase
    .from('property_images')
    .select('id', { count: 'exact', head: true })
    .eq('property_id', propertyId);

  const files = formData.getAll('images').filter((f): f is File => f instanceof File);
  try {
    await uploadImages(propertyId, user.id, files, count ?? 0, (count ?? 0) === 0);
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Image upload failed.' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/properties');
  revalidatePath(`/properties/${propertyId}`);
  redirect(`/properties/${propertyId}`);
}

export async function deletePropertyAction(propertyId: string): Promise<void> {
  const { supabase, user } = await requireUser();

  // Collect storage paths to clean up.
  const { data: images } = await supabase
    .from('property_images')
    .select('storage_path')
    .eq('property_id', propertyId)
    .eq('user_id', user.id);

  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', propertyId)
    .eq('user_id', user.id);
  if (error) throw new Error(error.message);

  const paths = (images ?? [])
    .map((i) => i.storage_path)
    .filter((p): p is string => !!p);
  if (paths.length > 0) {
    try {
      const admin = createAdminClient();
      await admin.storage.from(BUCKET).remove(paths);
    } catch (e) {
      console.error('Storage cleanup failed:', e);
    }
  }

  revalidatePath('/dashboard');
  revalidatePath('/properties');
  redirect('/properties');
}

export async function duplicatePropertyAction(propertyId: string): Promise<void> {
  const { supabase, user } = await requireUser();

  const { data: original, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .eq('user_id', user.id)
    .single();
  if (error || !original) throw new Error('Property not found.');

  const { data: copy, error: insertError } = await supabase
    .from('properties')
    .insert({
      user_id: user.id,
      title: `${original.title} (Copy)`,
      property_type: original.property_type,
      location: original.location,
      price: original.price,
      carpet_area: original.carpet_area,
      built_up_area: original.built_up_area,
      bedrooms: original.bedrooms,
      bathrooms: original.bathrooms,
      amenities: original.amenities,
      description: original.description,
      status: 'draft',
    })
    .select('id')
    .single();
  if (insertError || !copy) throw new Error(insertError?.message ?? 'Duplication failed.');

  revalidatePath('/dashboard');
  revalidatePath('/properties');
  redirect(`/properties/${copy.id}/edit`);
}

export async function deleteImageAction(imageId: string, propertyId: string): Promise<void> {
  const { supabase, user } = await requireUser();

  const { data: image } = await supabase
    .from('property_images')
    .select('storage_path, is_cover')
    .eq('id', imageId)
    .eq('user_id', user.id)
    .single();

  const { error } = await supabase
    .from('property_images')
    .delete()
    .eq('id', imageId)
    .eq('user_id', user.id);
  if (error) throw new Error(error.message);

  if (image?.storage_path) {
    try {
      const admin = createAdminClient();
      await admin.storage.from(BUCKET).remove([image.storage_path]);
    } catch (e) {
      console.error('Storage cleanup failed:', e);
    }
  }

  // If we deleted the cover, promote the next image.
  if (image?.is_cover) {
    const { data: next } = await supabase
      .from('property_images')
      .select('id')
      .eq('property_id', propertyId)
      .order('position', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (next) {
      await supabase.from('property_images').update({ is_cover: true }).eq('id', next.id);
    }
  }

  revalidatePath(`/properties/${propertyId}`);
  revalidatePath(`/properties/${propertyId}/edit`);
}

export async function setCoverImageAction(imageId: string, propertyId: string): Promise<void> {
  const { supabase, user } = await requireUser();
  await supabase
    .from('property_images')
    .update({ is_cover: false })
    .eq('property_id', propertyId)
    .eq('user_id', user.id);
  await supabase
    .from('property_images')
    .update({ is_cover: true })
    .eq('id', imageId)
    .eq('user_id', user.id);
  revalidatePath(`/properties/${propertyId}`);
  revalidatePath(`/properties/${propertyId}/edit`);
}

// ---------------------------------------------------------------------------
// Marketing kit
// ---------------------------------------------------------------------------
export interface MarketingActionState {
  error?: string;
  success?: boolean;
}

export async function generateMarketingAction(
  propertyId: string,
): Promise<MarketingActionState> {
  const { supabase, user } = await requireUser();

  const limited = rateLimit(`ai:${user.id}`, 15, 60_000);
  if (!limited.success) {
    return { error: 'Too many generations. Please wait a minute and try again.' };
  }

  // Server-side monthly AI-generation limit enforcement (plan-based, DB-backed).
  try {
    const aiCheck = await checkAiGenerationLimit();
    if (!aiCheck.allowed) {
      return { error: aiCheck.reason ?? 'You have reached your monthly AI generation limit.' };
    }
  } catch {
    // Non-fatal: fall through; the generation itself can still surface errors.
  }

  const { data: property, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .eq('user_id', user.id)
    .single();
  if (error || !property) return { error: 'Property not found.' };

  const kit = await generateMarketingKit(property);

  const { error: upsertError } = await supabase.from('marketing_assets').upsert(
    {
      property_id: propertyId,
      user_id: user.id,
      long_description: kit.long_description,
      short_description: kit.short_description,
      instagram_caption: kit.instagram_caption,
      facebook_post: kit.facebook_post,
      linkedin_post: kit.linkedin_post,
      whatsapp_message: kit.whatsapp_message,
      provider: kit.provider,
    },
    { onConflict: 'property_id' },
  );
  if (upsertError) return { error: upsertError.message };

  // Credit deduction: record one AI generation against this month's quota.
  // Tamper-proof (SECURITY DEFINER RPC). Non-fatal if it fails.
  try {
    await recordUsage('ai_generation', 1);
  } catch (e) {
    console.error('usage tracking failed:', e);
  }

  revalidatePath('/dashboard');
  revalidatePath('/marketing');
  revalidatePath(`/properties/${propertyId}`);
  revalidatePath(`/properties/${propertyId}/marketing`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Landing page
// ---------------------------------------------------------------------------
export interface LandingActionState {
  error?: string;
  slug?: string;
  isPublished?: boolean;
}

/** Revalidate every surface that reads landing-page publication state so the
 * dashboard, the per-property landing manager and the public page never
 * disagree about whether a page is live. */
function revalidateLanding(propertyId: string) {
  revalidatePath('/dashboard');
  revalidatePath('/landing-pages');
  revalidatePath(`/properties/${propertyId}`);
  revalidatePath(`/properties/${propertyId}/landing`);
}

/** Builds a guaranteed-non-empty, normalized public URL for a slug. */
function publicUrlFor(slug: string): string {
  const base = publicEnv.siteUrl.replace(/\/+$/, ''); // no trailing slash -> no "//p/"
  return `${base}/p/${slug}`;
}

export async function publishLandingAction(propertyId: string): Promise<LandingActionState> {
  let supabase;
  let user;
  try {
    ({ supabase, user } = await requireUser());
  } catch {
    return { error: 'Your session has expired. Please sign in again.' };
  }

  const { data: property } = await supabase
    .from('properties')
    .select('id, title')
    .eq('id', propertyId)
    .eq('user_id', user.id)
    .single();
  if (!property) return { error: 'Property not found.' };

  // Server-side published-landing-page limit enforcement. Excludes this
  // property so re-publishing an already-counted page is always allowed.
  try {
    const landingCheck = await checkLandingPageLimit(propertyId);
    if (!landingCheck.allowed) {
      return { error: landingCheck.reason ?? 'You have reached your landing page limit.' };
    }
  } catch {
    // Non-fatal: fall through (the publish itself can still surface errors).
  }

  const { data: existing } = await supabase
    .from('landing_pages')
    .select('id, slug')
    .eq('property_id', propertyId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    // Guard: a legacy row could be missing its slug. Backfill before publishing
    // so we never expose a "/p/undefined" link. buildSlug always returns a
    // non-empty value (with a random suffix to avoid unique collisions).
    let slug = (existing.slug ?? '').trim();
    if (slug === '') {
      slug = buildSlug(property.title);
    }
    const { data: updated, error: updErr } = await supabase
      .from('landing_pages')
      .update({
        is_published: true,
        slug,
        public_url: publicUrlFor(slug),
      })
      .eq('id', existing.id)
      .eq('user_id', user.id)
      .select('slug, is_published')
      .single();
    // Hard-verify the persisted slug is valid before reporting success.
    if (updErr || !updated?.slug || updated.slug.trim() === '') {
      return { error: updErr?.message ?? 'Could not publish landing page. Please try again.' };
    }
    revalidateLanding(propertyId);
    return { slug: updated.slug, isPublished: !!updated.is_published };
  }

  const slug = buildSlug(property.title);

  const { data: inserted, error } = await supabase
    .from('landing_pages')
    .insert({
      property_id: propertyId,
      user_id: user.id,
      slug,
      public_url: publicUrlFor(slug),
      is_published: true,
    })
    .select('slug, is_published')
    .single();
  if (error || !inserted?.slug || inserted.slug.trim() === '') {
    return { error: error?.message ?? 'Could not create landing page. Please try again.' };
  }

  revalidateLanding(propertyId);
  return { slug: inserted.slug, isPublished: !!inserted.is_published };
}

export async function unpublishLandingAction(
  propertyId: string,
): Promise<LandingActionState> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from('landing_pages')
    .update({ is_published: false })
    .eq('property_id', propertyId)
    .eq('user_id', user.id)
    .select('slug, is_published')
    .maybeSingle();
  if (error) return { error: error.message };
  revalidateLanding(propertyId);
  return { slug: data?.slug, isPublished: data?.is_published ?? false };
}
