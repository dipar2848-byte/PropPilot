// ============================================================================
// PropPilot — Shared Sentry options (Phase 8)
// ============================================================================
// Single source of truth for Sentry's DSN / environment / sampling, read from
// environment variables. A *public* DSN is safe to ship to the browser, but we
// still resolve it from env so each deployment can point at its own project and
// disable monitoring entirely by leaving the var blank.
//
// No secrets are hardcoded here: the auth token (used only for build-time
// source-map upload) lives in SENTRY_AUTH_TOKEN and is never referenced at
// runtime.

/** Public Sentry DSN (client + server + edge). Blank disables the SDK. */
export const SENTRY_DSN: string = process.env.NEXT_PUBLIC_SENTRY_DSN ?? '';

/** Logical environment tag shown in Sentry (defaults to NODE_ENV). */
export const SENTRY_ENVIRONMENT: string =
  process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development';

/** Performance trace sample rate (0..1). Defaults to 10%. */
export const TRACES_SAMPLE_RATE: number = (() => {
  const raw = process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n >= 0 && n <= 1 ? n : 0.1;
})();

/** True when monitoring is configured for this deployment. */
export const SENTRY_ENABLED: boolean = SENTRY_DSN.length > 0;
