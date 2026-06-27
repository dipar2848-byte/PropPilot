// ============================================================================
// Sentry — server runtime configuration (Phase 8)
// ============================================================================
// Loaded via src/instrumentation.ts when NEXT_RUNTIME === 'nodejs'.
// The DSN comes from NEXT_PUBLIC_SENTRY_DSN (a public DSN is safe to expose).
// With no DSN configured the SDK is a no-op, so the app runs normally.
import * as Sentry from '@sentry/nextjs';
import { SENTRY_DSN, SENTRY_ENVIRONMENT, TRACES_SAMPLE_RATE } from '@/lib/sentry-options';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    tracesSampleRate: TRACES_SAMPLE_RATE,
    // Surface useful context without being noisy.
    enabled: true,
    debug: false,
  });
}
