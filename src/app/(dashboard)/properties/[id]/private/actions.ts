'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/data/properties';
import { privateDetailsSchema } from '@/lib/validation';
import { rateLimit } from '@/lib/rate-limit';

export interface PrivateDetailsActionState {
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
 * Upserts the private (internal-only) details for a property. Owner-scoped and
 * protected by RLS. This data is NEVER exposed publicly.
 */
export async function savePrivateDetailsAction(
  _prev: PrivateDetailsActionState,
  formData: FormData,
): Promise<PrivateDetailsActionState> {
  const { supabase, user } = await requireUser();

  const rl = rateLimit(`private:${user.id}`, 30, 60_000);
  if (!rl.success) {
    return { error: 'Too many updates. Please wait a moment and try again.' };
  }

  const parsed = privateDetailsSchema.safeParse({
    propertyId: formData.get('propertyId'),
    owner_name: formData.get('owner_name'),
    owner_phone: formData.get('owner_phone'),
    owner_email: formData.get('owner_email'),
    alternate_contact: formData.get('alternate_contact'),
    commission_type: formData.get('commission_type'),
    commission_percentage: formData.get('commission_percentage'),
    commission_amount: formData.get('commission_amount'),
    expected_commission: formData.get('expected_commission'),
    deal_stage: formData.get('deal_stage'),
    internal_notes: formData.get('internal_notes'),
  });
  if (!parsed.success) {
    return { fieldErrors: flattenZod(parsed.error) };
  }
  const d = parsed.data;

  // Verify ownership of the property (never trust the client).
  const { data: property } = await supabase
    .from('properties')
    .select('id')
    .eq('id', d.propertyId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!property) return { error: 'Property not found.' };

  const { error } = await supabase
    .from('property_private_details')
    .upsert(
      {
        property_id: d.propertyId,
        user_id: user.id,
        owner_name: d.owner_name,
        owner_phone: d.owner_phone,
        owner_email: d.owner_email,
        alternate_contact: d.alternate_contact,
        commission_type: d.commission_type,
        commission_percentage: d.commission_percentage,
        commission_amount: d.commission_amount,
        expected_commission: d.expected_commission,
        deal_stage: d.deal_stage,
        internal_notes: d.internal_notes,
      },
      { onConflict: 'property_id' },
    );
  if (error) return { error: error.message };

  revalidatePath(`/properties/${d.propertyId}/private`);
  revalidatePath(`/properties/${d.propertyId}`);
  return { message: 'Private details saved.' };
}
