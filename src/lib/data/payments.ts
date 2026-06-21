// ============================================================================
// PropPilot — Payments data layer (Phase 6)
// ============================================================================
// Server-side helpers for creating and reconciling Cashfree payment orders.
//
// SECURITY: payment_orders is owner-read-only under RLS; ALL writes go through
// the service-role admin client here, never the client. A payment is *applied*
// (subscription upgrade + ledger row) only by the tamper-proof, idempotent
// `apply_subscription_payment` RPC.
// ============================================================================

import { createAdminClient } from '@/lib/supabase/server';
import type { PaymentOrder } from '@/lib/types';

/** Generates an app-side order id sent to the gateway. Unique + readable. */
export function newOrderId(userId: string): string {
  const short = userId.replace(/-/g, '').slice(0, 8);
  const rand = Math.random().toString(36).slice(2, 8);
  return `pp_${short}_${Date.now().toString(36)}_${rand}`;
}

export interface NewOrderRecord {
  userId: string;
  orderId: string;
  planId: string;
  amount: number;
  currency?: string;
}

/** Inserts a 'created' payment_orders row via the service role. */
export async function insertPaymentOrder(rec: NewOrderRecord): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from('payment_orders').insert({
    user_id: rec.userId,
    order_id: rec.orderId,
    plan_id: rec.planId,
    amount: rec.amount,
    currency: rec.currency ?? 'INR',
    status: 'created',
    provider: 'cashfree',
  });
  if (error) throw new Error(error.message);
}

/** Records the gateway ids on an order after creation (service role). */
export async function attachGatewayRefs(
  orderId: string,
  cfOrderId: string,
  paymentSessionId: string,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from('payment_orders')
    .update({ cf_order_id: cfOrderId, payment_session_id: paymentSessionId })
    .eq('order_id', orderId);
  if (error) throw new Error(error.message);
}

/** Marks an order failed/expired (service role). Idempotent-ish; never throws fatally. */
export async function markOrderFailed(orderId: string, status: 'failed' | 'expired' = 'failed'): Promise<void> {
  const admin = createAdminClient();
  await admin.from('payment_orders').update({ status }).eq('order_id', orderId).eq('status', 'created');
}

/** Reads a payment order by app order id (service role; bypasses RLS). */
export async function getOrderByOrderId(orderId: string): Promise<PaymentOrder | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('payment_orders')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as PaymentOrder | null) ?? null;
}

/**
 * Applies a verified/confirmed payment via the idempotent service-role RPC.
 * Returns true when THIS call transitioned the order to paid (side-effects
 * applied), false when it was already paid or the order is unknown.
 */
export async function applyPayment(
  orderId: string,
  cfPaymentId = '',
  periodMonths = 1,
): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('apply_subscription_payment', {
    p_order_id: orderId,
    p_cf_payment_id: cfPaymentId,
    p_period_months: periodMonths,
  });
  if (error) throw new Error(error.message);
  return Boolean(data);
}
