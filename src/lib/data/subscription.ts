import { requireUser } from '@/lib/data/properties';
import { getPlan, type PlanDefinition, type PlanLimits } from '@/lib/plans';
import type { Subscription, SubscriptionPlan, Transaction } from '@/lib/types';

export interface SubscriptionState {
  subscription: Subscription | null;
  /** Effective plan after evaluating trial expiry. */
  effectivePlan: SubscriptionPlan;
  plan: PlanDefinition;
  limits: PlanLimits;
  isTrialing: boolean;
  trialDaysLeft: number;
  /** True when a trial has lapsed without an active paid plan. */
  trialExpired: boolean;
  isPaidActive: boolean;
}

function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

/**
 * Resolves the authenticated user's subscription into an effective plan +
 * limits, accounting for trial expiry. This is the single source of truth that
 * Phase 5 limit checks read from.
 *
 * Effective plan rules:
 *   - status 'active'                 -> the stored paid plan (pro)
 *   - status 'trialing' & not expired -> treated as 'pro' (full trial access)
 *   - trial expired / past_due / canceled -> 'free' limits
 */
export async function getSubscriptionState(): Promise<SubscriptionState> {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw new Error(error.message);

  const subscription = (data as Subscription | null) ?? null;
  const now = new Date();

  // No row yet (e.g. trigger hasn't run): treat as a fresh free user.
  if (!subscription) {
    return {
      subscription: null,
      effectivePlan: 'free',
      plan: getPlan('free'),
      limits: getPlan('free').limits,
      isTrialing: false,
      trialDaysLeft: 0,
      trialExpired: false,
      isPaidActive: false,
    };
  }

  const trialEnds = new Date(subscription.trial_ends_at);
  const isPaidActive = subscription.status === 'active' && subscription.plan === 'pro';
  const isTrialing = subscription.status === 'trialing' && trialEnds.getTime() > now.getTime();
  const trialExpired = subscription.status === 'trialing' && trialEnds.getTime() <= now.getTime();

  // Trial grants full Pro-level access until it ends.
  const effectivePlan: SubscriptionPlan = isPaidActive || isTrialing ? 'pro' : 'free';
  const plan = getPlan(effectivePlan);

  return {
    subscription,
    effectivePlan,
    plan,
    limits: plan.limits,
    isTrialing,
    trialDaysLeft: isTrialing ? daysBetween(now, trialEnds) : 0,
    trialExpired,
    isPaidActive,
  };
}

/** Current billing-period key (YYYY-MM) matching the DB usage_counters rows. */
function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7); // 'YYYY-MM'
}

/**
 * Reads how many times a metered feature has been used this period for the
 * current user. Server-side source of truth (RLS owner-only).
 */
export async function getUsage(feature: string): Promise<number> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from('usage_counters')
    .select('used')
    .eq('user_id', user.id)
    .eq('feature', feature)
    .eq('period', currentPeriod())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.used ?? 0;
}

/** The authenticated user's transaction/billing history (owner-only). */
export async function listTransactions(): Promise<Transaction[]> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as Transaction[] | null) ?? [];
}

export interface LimitCheck {
  allowed: boolean;
  limit: number | null; // null = unlimited
  current: number;
  reason?: string;
}

/**
 * Server-side property-count limit check. Never trusts the client: it reads the
 * effective plan AND the real property count from the database.
 */
export async function checkPropertyLimit(): Promise<LimitCheck> {
  const { supabase, user } = await requireUser();
  const state = await getSubscriptionState();
  const limit = state.limits.maxProperties; // null = unlimited

  const { count, error } = await supabase
    .from('properties')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);
  if (error) throw new Error(error.message);

  const current = count ?? 0;
  if (limit === null) return { allowed: true, limit: null, current };
  if (current >= limit) {
    return {
      allowed: false,
      limit,
      current,
      reason:
        state.trialExpired
          ? `Your free plan allows ${limit} properties. Upgrade to Pro to add more.`
          : `You've reached your plan limit of ${limit} properties.`,
    };
  }
  return { allowed: true, limit, current };
}

/**
 * Server-side AI-generation monthly limit check. Reads the effective plan's
 * monthly allowance and the real usage counter from the database.
 */
export async function checkAiGenerationLimit(): Promise<LimitCheck> {
  const state = await getSubscriptionState();
  const limit = state.limits.maxAiGenerationsPerMonth; // null = unlimited
  const current = await getUsage('ai_generation');

  if (limit === null) return { allowed: true, limit: null, current };
  if (current >= limit) {
    return {
      allowed: false,
      limit,
      current,
      reason:
        state.trialExpired
          ? `Your free plan allows ${limit} AI generations per month. Upgrade to Pro for unlimited.`
          : `You've used all ${limit} AI generations for this month.`,
    };
  }
  return { allowed: true, limit, current };
}

/**
 * Atomically records one use of a metered feature via the tamper-proof
 * SECURITY DEFINER RPC. Returns the new total for this period.
 */
export async function recordUsage(feature: string, amount = 1): Promise<number> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc('increment_usage', {
    p_feature: feature,
    p_amount: amount,
  });
  if (error) throw new Error(error.message);
  return (data as number | null) ?? 0;
}
