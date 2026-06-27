// ============================================================================
// Next.js instrumentation entrypoint (Phase 8)
// ============================================================================
// Loads the right Sentry runtime config and wires the App Router's
// onRequestError hook so server-side render/route errors are captured.
import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
