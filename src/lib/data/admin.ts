// ============================================================================
// PropPilot — Admin data layer (Phase 7)
// ============================================================================
// Platform-wide reads for the admin panel. Every entry point re-verifies the
// caller is a platform admin SERVER-SIDE (never trusting the frontend). Reads
// go through the user's RLS-bound client, relying on the additive admin SELECT
// policies from migration 0013 — so even here we are not bypassing RLS.
//
// All functions degrade gracefully if a table/RPC is missing (older install /
// pending migration) by returning empty/zeroed data rather than crashing.
// ============================================================================

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/data/properties';
import { getPlan } from '@/lib/plans';
import type {
  AdminPlatformStats,
  Profile,
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
  Transaction,
} from '@/lib/types';

const EMPTY_STATS: AdminPlatformStats = {
  total_users: 0,
  admin_users: 0,
  total_properties: 0,
  published_landing: 0,
  total_leads: 0,
  total_documents: 0,
  subs_trialing: 0,
  subs_active: 0,
  subs_pro: 0,
  paid_orders: 0,
  revenue_total: 0,
};

/** Reads the caller's admin flag server-side. Returns false on any failure. */
export async function getIsAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();
  if (error) return false;
  return Boolean(data?.is_admin);
}

/**
 * Hard guard for admin-only server contexts. Redirects non-admins to the
 * dashboard (so a guessed /admin URL is never served). Returns the verified
 * user + client for downstream queries.
 */
export async function requireAdmin() {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !data?.is_admin) {
    redirect('/dashboard');
  }
  return { supabase, user };
}

/** Platform-wide aggregate stats via the admin RPC (admin-gated). */
export async function getPlatformStats(): Promise<AdminPlatformStats> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.rpc('admin_platform_stats');
  if (error || !data) {
    console.error('[admin] platform stats unavailable:', error?.message);
    return EMPTY_STATS;
  }
  return data as AdminPlatformStats;
}

export interface AdminUserRow {
  id: string;
  full_name: string;
  email: string;
  agency_name: string | null;
  is_admin: boolean;
  created_at: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus | 'none';
  planLabel: string;
  currentPeriodEnd: string | null;
}

/**
 * Lists every user with their subscription state, newest first. Joins are done
 * in two cheap queries + an in-memory merge to avoid relying on a PostgREST
 * embed across schemas that may not have an FK relationship declared.
 */
export async function listUsers(limit = 200): Promise<AdminUserRow[]> {
  const { supabase } = await requireAdmin();

  const [{ data: profiles, error: pErr }, { data: subs }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email, agency_name, is_admin, created_at')
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase.from('subscriptions').select('user_id, plan, status, current_period_end'),
  ]);

  if (pErr) {
    console.error('[admin] listUsers failed:', pErr.message);
    return [];
  }

  const subByUser = new Map<
    string,
    Pick<Subscription, 'plan' | 'status' | 'current_period_end'>
  >();
  for (const s of (subs as Array<Pick<Subscription, 'user_id' | 'plan' | 'status' | 'current_period_end'>> | null) ?? []) {
    subByUser.set(s.user_id, {
      plan: s.plan,
      status: s.status,
      current_period_end: s.current_period_end,
    });
  }

  return ((profiles as Array<Pick<Profile, 'id' | 'full_name' | 'email' | 'agency_name' | 'is_admin' | 'created_at'>> | null) ?? []).map(
    (p) => {
      const sub = subByUser.get(p.id);
      const plan: SubscriptionPlan = sub?.plan ?? 'free';
      return {
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        agency_name: p.agency_name,
        is_admin: p.is_admin,
        created_at: p.created_at,
        plan,
        status: sub?.status ?? 'none',
        planLabel: getPlan(plan).name,
        currentPeriodEnd: sub?.current_period_end ?? null,
      };
    },
  );
}

export interface AdminTransactionRow extends Transaction {
  email: string;
}

/** Lists the most recent platform-wide transactions (admin-gated). */
export async function listAllTransactions(limit = 100): Promise<AdminTransactionRow[]> {
  const { supabase } = await requireAdmin();

  const { data: txns, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    if (error.code === '42P01') return [];
    console.error('[admin] listAllTransactions failed:', error.message);
    return [];
  }

  const rows = (txns as Transaction[] | null) ?? [];
  if (rows.length === 0) return [];

  // Resolve emails for the involved users (best-effort).
  const userIds = Array.from(new Set(rows.map((t) => t.user_id)));
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email')
    .in('id', userIds);
  const emailById = new Map<string, string>();
  for (const p of (profiles as Array<{ id: string; email: string }> | null) ?? []) {
    emailById.set(p.id, p.email);
  }

  return rows.map((t) => ({ ...t, email: emailById.get(t.user_id) ?? '—' }));
}
