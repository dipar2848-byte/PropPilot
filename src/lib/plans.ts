// ============================================================================
// PropPilot — Plan definitions & limits (Phase 4)
// ============================================================================
// Plan limits live in code (not the database) so they can evolve without a
// migration. The `subscriptions` table stores only per-user state (plan,
// status, trial window). Limit ENFORCEMENT lands in Phase 5; this module is the
// single source of truth those checks will read from.
//
// A limit of `null` means "unlimited".
// ============================================================================

import type { SubscriptionPlan } from '@/lib/types';

export interface PlanLimits {
  /** Max properties a user may own. null = unlimited. */
  maxProperties: number | null;
  /** Max published landing pages. null = unlimited. */
  maxLandingPages: number | null;
  /** Max AI marketing-kit generations per month. null = unlimited. */
  maxAiGenerationsPerMonth: number | null;
  /** Max documents per property (also hard-capped in the document vault). */
  maxDocumentsPerProperty: number;
}

export interface PlanDefinition {
  id: SubscriptionPlan;
  name: string;
  /** Monthly price in INR (paise handled at the payment layer). 0 = free. */
  priceMonthly: number;
  tagline: string;
  features: string[];
  limits: PlanLimits;
}

export const PLANS: Record<SubscriptionPlan, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    tagline: 'Get started — great for trying PropPilot.',
    features: [
      'Up to 3 properties',
      '1 published landing page',
      '10 AI generations / month',
      '5 documents per property',
    ],
    limits: {
      maxProperties: 3,
      maxLandingPages: 1,
      maxAiGenerationsPerMonth: 10,
      maxDocumentsPerProperty: 5,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 999,
    tagline: 'For active agents who list and market at scale.',
    features: [
      'Unlimited properties',
      'Unlimited landing pages',
      'Unlimited AI generations',
      '5 documents per property',
      'Priority support',
    ],
    limits: {
      maxProperties: null,
      maxLandingPages: null,
      maxAiGenerationsPerMonth: null,
      maxDocumentsPerProperty: 5,
    },
  },
};

export const PLAN_ORDER: SubscriptionPlan[] = ['free', 'pro'];

export function getPlan(plan: SubscriptionPlan): PlanDefinition {
  return PLANS[plan] ?? PLANS.free;
}

/** Whether the user currently has paid/active access (vs. expired trial/free). */
export function planLabel(plan: SubscriptionPlan): string {
  return getPlan(plan).name;
}
