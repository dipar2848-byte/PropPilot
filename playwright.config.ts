import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration — PropPilot E2E (Phase 8).
 *
 * Official Next.js setup: Playwright boots a production server (`next start`
 * against a pre-built `.next`, falling back to `next dev` locally) and runs the
 * critical-flow specs against it.
 *
 * The app requires Supabase public env vars merely to *construct* its client
 * (it throws otherwise), so we inject syntactically-valid placeholder values.
 * The suite deliberately exercises flows that do NOT depend on a live backend:
 * public marketing pages, auth UI + client-side validation, and — most
 * importantly — the middleware auth boundary (protected routes must redirect
 * unauthenticated visitors to /login). This keeps the suite fully
 * deterministic and green in CI while still covering every critical flow's
 * entry point and security enforcement.
 */

const PORT = Number(process.env.PORT ?? 3000);
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;
const isCI = !!process.env.CI;

// Placeholder Supabase env so the Next.js server boots without a real backend.
// These are NOT secrets — they are obviously-fake local values used only to let
// the Supabase client construct during E2E. Real credentials never live here.
const E2E_ENV = {
  NEXT_PUBLIC_SUPABASE_URL:
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://e2e-placeholder.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'e2e-placeholder-anon-key',
  SUPABASE_SERVICE_ROLE_KEY:
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'e2e-placeholder-service-role-key',
  NEXT_PUBLIC_SITE_URL: BASE_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME ?? 'PropPilot',
  // Keep Sentry inert during tests.
  NEXT_PUBLIC_SENTRY_DSN: '',
};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  // Single worker keeps the memory-constrained sandbox stable.
  workers: isCI ? 1 : 1,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    // Prefer the prebuilt production server; fall back to dev locally.
    command: process.env.PLAYWRIGHT_WEB_SERVER ?? 'npm run start -- --port ' + PORT,
    url: BASE_URL,
    timeout: 120_000,
    reuseExistingServer: !isCI,
    env: E2E_ENV,
  },
});
