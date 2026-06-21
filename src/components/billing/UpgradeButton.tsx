'use client';

// ============================================================================
// PropPilot — Upgrade to Pro button (Phase 6, client)
// ============================================================================
// Calls the server action to create a Cashfree order, then launches the
// Cashfree hosted checkout with the returned payment_session_id. The client
// never decides the price or applies the upgrade — it only opens the gateway.
// ============================================================================

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { startCheckoutAction } from '@/app/(dashboard)/billing/actions';
import { SparklesIcon, SpinnerIcon } from '@/components/ui/Icons';

declare global {
  interface Window {
    // Cashfree SDK global (loaded on demand).
    Cashfree?: (opts: { mode: 'sandbox' | 'production' }) => {
      checkout: (opts: {
        paymentSessionId: string;
        redirectTarget?: '_self' | '_blank' | '_modal';
      }) => Promise<unknown>;
    };
  }
}

const SDK_SRC = 'https://sdk.cashfree.com/js/v3/cashfree.js';

function loadCashfreeSdk(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Cashfree) return resolve(true);
    const existing = document.querySelector(`script[src="${SDK_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(!!window.Cashfree));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const s = document.createElement('script');
    s.src = SDK_SRC;
    s.async = true;
    s.onload = () => resolve(!!window.Cashfree);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function UpgradeButton({
  disabled = false,
  className = '',
}: {
  disabled?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loading = pending || busy;

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const res = await startCheckoutAction();
      if (!res.ok || !res.paymentSessionId || !res.mode) {
        setError(res.error ?? 'Could not start checkout.');
        return;
      }
      setBusy(true);
      const ok = await loadCashfreeSdk();
      if (!ok || !window.Cashfree) {
        setBusy(false);
        setError('Could not load the secure checkout. Please try again.');
        return;
      }
      try {
        const cashfree = window.Cashfree({ mode: res.mode });
        // _self returns to our return_url (which carries order_id) after pay.
        await cashfree.checkout({ paymentSessionId: res.paymentSessionId, redirectTarget: '_self' });
        // If checkout resolves without a redirect, refresh to reconcile.
        router.refresh();
      } catch {
        setError('Checkout was cancelled or failed. Please try again.');
      } finally {
        setBusy(false);
      }
    });
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <SpinnerIcon className="h-4 w-4 animate-spin" /> Starting checkout…
          </>
        ) : (
          <>
            <SparklesIcon className="h-4 w-4" /> Upgrade to Pro
          </>
        )}
      </button>
      {error && <p className="mt-2 text-center text-xs text-rose-600">{error}</p>}
    </div>
  );
}
