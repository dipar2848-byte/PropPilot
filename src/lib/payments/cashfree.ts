// ============================================================================
// PropPilot — Cashfree Payment Gateway integration (Phase 6)
// ============================================================================
// Thin, server-only wrapper around the Cashfree Payment Gateway "Orders" API.
//
// SECURITY NOTES
//   * This module must only ever run on the server (it uses the secret key).
//   * The client is NEVER trusted to report a payment. A successful order is
//     applied to the subscription only after we (a) receive a webhook whose
//     signature we verify, or (b) re-query the gateway for the order's true
//     status. Both paths funnel through the idempotent `apply_subscription_
//     payment` RPC (service role).
//   * If Cashfree is not configured, every call degrades gracefully so the app
//     keeps working on the trial flow.
// ============================================================================

import crypto from 'node:crypto';
import { getCashfreeConfig } from '@/lib/env';

const API_VERSION = '2023-08-01';

export interface CreateOrderInput {
  orderId: string;
  amount: number; // INR, whole rupees
  currency?: string;
  customerId: string;
  customerEmail: string;
  customerPhone: string;
  customerName?: string;
  returnUrl: string;
  notifyUrl?: string;
}

export interface CreateOrderResult {
  ok: boolean;
  cfOrderId?: string;
  paymentSessionId?: string;
  error?: string;
}

export interface OrderStatusResult {
  ok: boolean;
  status?: string; // Cashfree order_status: PAID | ACTIVE | EXPIRED | ...
  cfOrderId?: string;
  cfPaymentId?: string;
  error?: string;
}

/** Whether payments are configured (env present). */
export function isCashfreeConfigured(): boolean {
  return getCashfreeConfig().isConfigured;
}

function authHeaders() {
  const { appId, secretKey } = getCashfreeConfig();
  return {
    'Content-Type': 'application/json',
    'x-api-version': API_VERSION,
    'x-client-id': appId,
    'x-client-secret': secretKey,
  };
}

/**
 * Cashfree requires a phone number; some agents store none. Fall back to a
 * gateway-acceptable placeholder so order creation does not fail. (Real numbers
 * are used when present.)
 */
function normalisePhone(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return '9999999999';
}

/**
 * Creates a Cashfree order and returns the payment_session_id used to launch
 * the hosted/JS checkout. Returns `{ ok: false, error }` on any failure (never
 * throws) so the caller can show a friendly message.
 */
export async function createCashfreeOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const cfg = getCashfreeConfig();
  if (!cfg.isConfigured) {
    return { ok: false, error: 'Payments are not configured on this server.' };
  }

  const body = {
    order_id: input.orderId,
    order_amount: Number(input.amount),
    order_currency: input.currency ?? 'INR',
    customer_details: {
      customer_id: input.customerId,
      customer_email: input.customerEmail || 'noreply@example.com',
      customer_phone: normalisePhone(input.customerPhone),
      customer_name: input.customerName || 'PropPilot User',
    },
    order_meta: {
      return_url: input.returnUrl,
      ...(input.notifyUrl ? { notify_url: input.notifyUrl } : {}),
    },
    order_note: 'PropPilot Pro subscription',
  };

  try {
    const res = await fetch(`${cfg.apiBase}/orders`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const json = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      const message = (json?.message as string) || `Cashfree error (${res.status})`;
      return { ok: false, error: message };
    }
    return {
      ok: true,
      cfOrderId: (json.cf_order_id as string | number | undefined)?.toString(),
      paymentSessionId: json.payment_session_id as string | undefined,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Network error contacting Cashfree.' };
  }
}

/**
 * Re-queries Cashfree for the authoritative status of an order. Used as a
 * post-return reconciliation (in case the webhook is delayed) and as a guard
 * before applying a payment we believe succeeded.
 */
export async function getCashfreeOrderStatus(orderId: string): Promise<OrderStatusResult> {
  const cfg = getCashfreeConfig();
  if (!cfg.isConfigured) {
    return { ok: false, error: 'Payments are not configured on this server.' };
  }
  try {
    const res = await fetch(`${cfg.apiBase}/orders/${encodeURIComponent(orderId)}`, {
      method: 'GET',
      headers: authHeaders(),
      cache: 'no-store',
    });
    const json = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      return { ok: false, error: (json?.message as string) || `Cashfree error (${res.status})` };
    }
    return {
      ok: true,
      status: json.order_status as string | undefined,
      cfOrderId: (json.cf_order_id as string | number | undefined)?.toString(),
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Network error contacting Cashfree.' };
  }
}

/**
 * Verifies a Cashfree webhook signature.
 *
 * Cashfree signs each webhook with HMAC-SHA256 over `timestamp + rawBody`,
 * using the merchant secret key, base64-encoded. We compute the same and do a
 * constant-time comparison. Returns false (reject) when payments are not
 * configured or any input is missing.
 *
 * @param rawBody   The exact raw request body string (NOT re-serialised JSON).
 * @param timestamp The `x-webhook-timestamp` header.
 * @param signature The `x-webhook-signature` header (base64).
 */
export function verifyCashfreeWebhook(rawBody: string, timestamp: string, signature: string): boolean {
  const cfg = getCashfreeConfig();
  if (!cfg.isConfigured || !rawBody || !timestamp || !signature) return false;

  const expected = crypto
    .createHmac('sha256', cfg.secretKey)
    .update(timestamp + rawBody)
    .digest('base64');

  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
