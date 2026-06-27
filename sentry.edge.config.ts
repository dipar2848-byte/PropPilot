// ============================================================================
// Sentry — edge runtime configuration (Phase 8)
// ============================================================================
// Loaded via src/instrumentation.ts when NEXT_RUNTIME === 'edge' (middleware
// and edge routes). No-op when no DSN is configured.
import * as Sentry from '@sentry/nextjs';
import { SENTRY_DSN, SENTRY_ENVIRONMENT, TRACES_SAMPLE_RATE } from '@/lib/sentry-options';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    tracesSampleRate: TRACES_SAMPLE_RATE,
    enabled: true,
    debug: false,
  });
}
