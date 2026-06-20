'use client';

// ============================================================================
// PropPilot — Checkout return reconciler (Phase 6, client)
// ============================================================================
// Rendered on /billing when the customer returns from Cashfree with an
// ?order_id=. It asks the server to re-query the gateway and apply the upgrade
// if PAID (idempotent), then shows the result and refreshes the page so the new
// Pro status is reflected. It performs NO privileged action itself.
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { reconcileOrderAction, type ReconcileState } from '@/app/(dashboard)/billing/actions';
import { CheckIcon, SpinnerIcon } from '@/components/ui/Icons';

export function CheckoutReturn({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [state, setState] = useState<ReconcileState | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    let active = true;
    (async () => {
      const res = await reconcileOrderAction(orderId);
      if (!active) return;
      setState(res);
      if (res.status === 'paid') {
        // Reflect the new Pro status.
        router.refresh();
      }
    })();
    return () => {
      active = false;
    };
  }, [orderId, router]);

  const tone =
    state?.status === 'paid'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : state?.status === 'failed'
        ? 'border-rose-200 bg-rose-50 text-rose-700'
        : 'border-amber-200 bg-amber-50 text-amber-700';

  return (
    <div className={`mb-6 flex items-center gap-3 rounded-2xl border p-4 ${tone}`}>
      {state?.status === 'paid' ? (
        <CheckIcon className="h-5 w-5 shrink-0" />
      ) : (
        <SpinnerIcon className="h-5 w-5 shrink-0 animate-spin" />
      )}
      <p className="text-sm font-medium">
        {state ? state.message : 'Confirming your payment…'}
      </p>
    </div>
  );
}
