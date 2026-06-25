'use server';

// ============================================================================
// PropPilot — Admin server actions (Phase 7)
// ============================================================================
// Admin-only mutations: manually grant or revoke a user's Pro plan. Every action
// is gated SERVER-SIDE twice — once here via requireAdmin(), and again inside the
// admin_set_user_plan RPC (which re-checks is_platform_admin()). The frontend is
// never trusted. Inputs are validated with Zod.
// ============================================================================

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/data/admin';

const setPlanSchema = z.object({
  userId: z.string().uuid('Invalid user id.'),
  action: z.enum(['grant', 'revoke']),
  months: z.coerce.number().int().min(1).max(36).default(1),
});

export interface AdminActionResult {
  ok: boolean;
  message: string;
}

/**
 * Grant or revoke a user's Pro subscription. Validates input, re-verifies the
 * caller is an admin, then applies the change through the SECURITY DEFINER RPC.
 */
export async function setUserPlanAction(
  _prev: AdminActionResult | undefined,
  formData: FormData,
): Promise<AdminActionResult> {
  const parsed = setPlanSchema.safeParse({
    userId: formData.get('userId'),
    action: formData.get('action'),
    months: formData.get('months') ?? 1,
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? 'Invalid input.';
    return { ok: false, message: first };
  }

  // Server-side admin gate (redirects non-admins; throws if unauthenticated).
  const { supabase, user } = await requireAdmin();

  // Defence in depth: an admin cannot revoke their own access by mistake here —
  // allow it, but guard the destructive self-case with a clearer message.
  const { userId, action, months } = parsed.data;

  const { data, error } = await supabase.rpc('admin_set_user_plan', {
    p_user_id: userId,
    p_action: action,
    p_period_months: months,
  });

  if (error) {
    // 42501 = the RPC's own admin re-check failed (shouldn't happen post-guard).
    const msg =
      error.code === '42501'
        ? 'You are not authorized to perform this action.'
        : error.message || 'Could not update the plan.';
    return { ok: false, message: msg };
  }

  if (data !== true) {
    return { ok: false, message: 'No change was applied.' };
  }

  revalidatePath('/admin');
  revalidatePath('/admin/users');

  const who = userId === user.id ? 'your account' : 'the user';
  return {
    ok: true,
    message:
      action === 'grant'
        ? `Pro plan granted to ${who} for ${months} month${months === 1 ? '' : 's'}.`
        : `Pro plan revoked from ${who}.`,
  };
}
