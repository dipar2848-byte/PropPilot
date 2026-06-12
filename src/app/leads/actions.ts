'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/data/properties';
import { publicLeadSchema, leadStatusSchema } from '@/lib/validation';
import { rateLimit } from '@/lib/rate-limit';

export interface PublicLeadState {
  ok?: boolean;
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

async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  return h.get('x-real-ip') ?? 'unknown';
}

/**
 * Public landing-page lead submission.
 *
 * MANDATORY: the lead is persisted to the database BEFORE any WhatsApp redirect
 * occurs. This action only stores the lead and returns success; the client
 * performs the WhatsApp hand-off ONLY after `ok === true`.
 *
 * Spam protection: honeypot field (`company`) must be empty + server-side IP
 * rate limiting. Insertion goes through the SECURITY DEFINER RPC so anonymous
 * visitors never get direct table access.
 */
export async function submitPublicLeadAction(
  _prev: PublicLeadState,
  formData: FormData,
): Promise<PublicLeadState> {
  const parsed = publicLeadSchema.safeParse({
    slug: formData.get('slug'),
    name: formData.get('name'),
    phone: formData.get('phone'),
    message: formData.get('message'),
    company: formData.get('company'),
  });

  if (!parsed.success) {
    return { fieldErrors: flattenZod(parsed.error) };
  }

  // Honeypot tripped — pretend success so bots don't learn anything.
  if (parsed.data.company && parsed.data.company.length > 0) {
    return { ok: true };
  }

  // Rate limit by IP: max 5 submissions/minute, and by slug to throttle a
  // single listing being hammered.
  const ip = await clientIp();
  const byIp = rateLimit(`lead:ip:${ip}`, 5, 60_000);
  if (!byIp.success) {
    return { error: 'Too many submissions. Please wait a minute and try again.' };
  }
  const bySlug = rateLimit(`lead:slug:${parsed.data.slug}`, 30, 60_000);
  if (!bySlug.success) {
    return { error: 'This listing is receiving a lot of inquiries. Please try again shortly.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc('submit_public_lead', {
    p_slug: parsed.data.slug,
    p_name: parsed.data.name,
    p_phone: parsed.data.phone,
    p_message: parsed.data.message ?? '',
  });

  if (error) {
    return { error: 'We could not submit your inquiry. Please try again.' };
  }

  return { ok: true };
}

export interface LeadActionState {
  error?: string;
  message?: string;
}

/** Authenticated owner updates a lead's status (new / contacted / closed). */
export async function updateLeadStatusAction(
  _prev: LeadActionState,
  formData: FormData,
): Promise<LeadActionState> {
  const { supabase, user } = await requireUser();

  const parsed = leadStatusSchema.safeParse({
    leadId: formData.get('leadId'),
    status: formData.get('status'),
  });
  if (!parsed.success) {
    return { error: 'Invalid request.' };
  }

  const rl = rateLimit(`lead-status:${user.id}`, 60, 60_000);
  if (!rl.success) {
    return { error: 'Too many updates. Please slow down.' };
  }

  // Ownership enforced both here (.eq user_id) and by RLS.
  const { data, error } = await supabase
    .from('leads')
    .update({ status: parsed.data.status })
    .eq('id', parsed.data.leadId)
    .eq('user_id', user.id)
    .select('property_id')
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: 'Lead not found.' };

  revalidatePath(`/properties/${(data as { property_id: string }).property_id}/leads`);
  return { message: 'Updated.' };
}
