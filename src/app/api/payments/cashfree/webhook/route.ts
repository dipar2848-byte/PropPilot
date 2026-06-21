// ============================================================================
// PropPilot — Cashfree webhook handler (Phase 6)
// ============================================================================
// Receives payment notifications from Cashfree. Trust nothing until the
// signature is verified against the raw body with our secret key. On a verified
// PAYMENT_SUCCESS we apply the upgrade through the idempotent service-role RPC
// — duplicate deliveries are safe no-ops.
//
// This route is intentionally public (the gateway calls it) but it performs NO
// privileged action without a valid HMAC signature.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { verifyCashfreeWebhook, isCashfreeConfigured } from '@/lib/payments/cashfree';
import { applyPayment } from '@/lib/data/payments';

// Always run on the Node.js runtime (we use node:crypto) and never cache.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // Read the RAW body exactly as sent — required for signature verification.
  const rawBody = await req.text();
  const timestamp = req.headers.get('x-webhook-timestamp') ?? '';
  const signature = req.headers.get('x-webhook-signature') ?? '';

  if (!isCashfreeConfigured()) {
    // Nothing to verify against; acknowledge so the gateway stops retrying.
    return NextResponse.json({ ok: false, reason: 'not_configured' }, { status: 200 });
  }

  if (!verifyCashfreeWebhook(rawBody, timestamp, signature)) {
    // Invalid signature — reject. (401 so the gateway flags misconfiguration.)
    return NextResponse.json({ ok: false, reason: 'invalid_signature' }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, reason: 'bad_json' }, { status: 400 });
  }

  // Cashfree v2 webhook shape: { type, data: { order, payment, ... } }
  const event = payload as {
    type?: string;
    data?: {
      order?: { order_id?: string };
      payment?: { cf_payment_id?: string | number; payment_status?: string };
    };
  };

  const type = event.type ?? '';
  const orderId = event.data?.order?.order_id ?? '';
  const cfPaymentId = event.data?.payment?.cf_payment_id?.toString() ?? '';
  const paymentStatus = event.data?.payment?.payment_status ?? '';

  // Only successful payments upgrade a subscription. Everything else is ACKed.
  const isSuccess = type === 'PAYMENT_SUCCESS_WEBHOOK' || paymentStatus === 'SUCCESS';

  if (isSuccess && orderId) {
    try {
      // Idempotent: a duplicate delivery for an already-paid order is a no-op.
      await applyPayment(orderId, cfPaymentId, 1);
    } catch (err) {
      // Surface a 500 so the gateway retries; the apply is idempotent so retries
      // are safe.
      const message = err instanceof Error ? err.message : 'apply_failed';
      return NextResponse.json({ ok: false, reason: message }, { status: 500 });
    }
  }

  // Acknowledge receipt.
  return NextResponse.json({ ok: true }, { status: 200 });
}

// Some gateways probe with GET; respond healthily.
export async function GET() {
  return NextResponse.json({ ok: true, service: 'cashfree-webhook' }, { status: 200 });
}
