// ============================================================================
// Sentry — browser/client configuration (Phase 8)
// ============================================================================
// Next.js loads this automatically in the browser. No-op when no DSN is set.
import * as Sentry from '@sentry/nextjs';
import { SENTRY_DSN, SENTRY_ENVIRONMENT, TRACES_SAMPLE_RATE } from '@/lib/sentry-options';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    tracesSampleRate: TRACES_SAMPLE_RATE,
    // Session Replay — capture only on errors to stay light + privacy-safe.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
    ],
    enabled: true,
    debug: false,
  });
}
