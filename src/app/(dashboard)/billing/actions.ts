'use server';

// ============================================================================
// PropPilot — Billing / checkout server actions (Phase 6)
// ============================================================================
// Starts a Cashfree checkout for the Pro plan and reconciles an order after the
// customer returns. The client cannot self-upgrade: it only ever receives a
// payment_session_id to launch the gateway checkout; the actual subscription
// change is applied server-side via the idempotent apply_subscription_payment
// RPC after the payment is independently confirmed (webhook or re-query).
// ============================================================================

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/data/properties';
import { getMyProfile } from '@/lib/data/profile';
import { getSubscriptionState } from '@/lib/data/subscription';
import { getPlan } from '@/lib/plans';
import { publicEnv } from '@/lib/env';
import {
  createCashfreeOrder,
  getCashfreeOrderStatus,
  isCashfreeConfigured,
} from '@/lib/payments/cashfree';
import {
  applyPayment,
  attachGatewayRefs,
  getOrderByOrderId,
  insertPaymentOrder,
  markOrderFailed,
  newOrderId,
} from '@/lib/data/payments';

export interface CheckoutState {
  ok: boolean;
  error?: string;
  paymentSessionId?: string;
  orderId?: string;
  mode?: 'sandbox' | 'production';
}

/**
 * Starts a Pro checkout. Returns a payment_session_id the client uses to open
 * the Cashfree checkout. All amounts/plan come from the server source of truth.
 */
export async function startCheckoutAction(): Promise<CheckoutState> {
  const { user } = await requireUser();

  if (!isCashfreeConfigured()) {
    return { ok: false, error: 'Online payments are not enabled on this server yet.' };
  }

  // Don't let an already-Pro user pay again.
  const state = await getSubscriptionState();
  if (state.isPaidActive) {
    return { ok: false, error: 'You are already on the Pro plan.' };
  }

  const pro = getPlan('pro');
  const amount = pro.priceMonthly;
  if (!amount || amount <= 0) {
    return { ok: false, error: 'This plan is not purchasable.' };
  }

  let profile;
  try {
    profile = await getMyProfile();
  } catch {
    profile = null;
  }

  const orderId = newOrderId(user.id);
  const base = publicEnv.siteUrl.replace(/\/+$/, '');
  const returnUrl = `${base}/billing?order_id=${encodeURIComponent(orderId)}`;
  const notifyUrl = `${base}/api/payments/cashfree/webhook`;

  // 1) Record the order BEFORE talking to the gateway (so the webhook can find it).
  try {
    await insertPaymentOrder({ userId: user.id, orderId, planId: 'pro', amount });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Could not start checkout.' };
  }

  // 2) Create the Cashfree order.
  const result = await createCashfreeOrder({
    orderId,
    amount,
    customerId: user.id,
    customerEmail: profile?.email || user.email || 'noreply@example.com',
    customerPhone: profile?.phone || profile?.whatsapp_number || '',
    customerName: profile?.full_name || 'PropPilot User',
    returnUrl,
    notifyUrl,
  });

  if (!result.ok || !result.paymentSessionId) {
    await markOrderFailed(orderId).catch(() => {});
    return { ok: false, error: result.error ?? 'Could not create the payment order.' };
  }

  // 3) Persist gateway refs for reconciliation.
  await attachGatewayRefs(orderId, result.cfOrderId ?? '', result.paymentSessionId).catch(() => {});

  const { getCashfreeConfig } = await import('@/lib/env');
  return {
    ok: true,
    paymentSessionId: result.paymentSessionId,
    orderId,
    mode: getCashfreeConfig().mode,
  };
}

export interface ReconcileState {
  status: 'paid' | 'pending' | 'failed' | 'unknown';
  message: string;
}

/**
 * Called when the customer returns from Cashfree (return_url carries order_id).
 * Re-queries the gateway for the authoritative status and, if PAID, applies the
 * upgrade via the idempotent RPC — so the user sees Pro immediately even if the
 * webhook is delayed. Safe to call repeatedly.
 */
export async function reconcileOrderAction(orderId: string): Promise<ReconcileState> {
  if (!orderId) return { status: 'unknown', message: 'No order to reconcile.' };

  // Ensure the caller owns this order (defence in depth — the gateway query is
  // server-side, but we still scope to the authenticated user).
  const { user } = await requireUser();
  const order = await getOrderByOrderId(orderId);
  if (!order || order.user_id !== user.id) {
    return { status: 'unknown', message: 'Order not found.' };
  }

  if (order.status === 'paid') {
    return { status: 'paid', message: 'Payment confirmed — welcome to Pro!' };
  }

  if (!isCashfreeConfigured()) {
    return { status: 'pending', message: 'Awaiting payment confirmation.' };
  }

  const status = await getCashfreeOrderStatus(orderId);
  if (!status.ok) {
    return { status: 'pending', message: 'Awaiting payment confirmation.' };
  }

  if (status.status === 'PAID') {
    await applyPayment(orderId, status.cfPaymentId ?? '', 1);
    revalidatePath('/billing');
    revalidatePath('/dashboard');
    return { status: 'paid', message: 'Payment confirmed — welcome to Pro!' };
  }

  if (status.status === 'EXPIRED') {
    await markOrderFailed(orderId, 'expired').catch(() => {});
    return { status: 'failed', message: 'This checkout expired. Please try again.' };
  }

  return { status: 'pending', message: 'Your payment is still being processed.' };
}
