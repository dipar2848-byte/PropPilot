'use client';

import { useEffect } from 'react';
import { Logo } from '@/components/ui/Logo';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-screen place-items-center bg-ink-50 px-6">
      <div className="max-w-md text-center">
        <Logo className="justify-center" />
        <h1 className="mt-8 text-2xl font-bold text-ink-900">Something went wrong</h1>
        <p className="mt-2 text-ink-500">
          An unexpected error occurred. Please try again — if the problem persists, refresh the
          page.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <button onClick={reset} className="btn-primary">
            Try again
          </button>
          <a href="/dashboard" className="btn-secondary">
            Go to dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
