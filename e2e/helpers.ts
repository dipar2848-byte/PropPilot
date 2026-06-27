import { expect, type Page } from '@playwright/test';

/**
 * Shared helpers for PropPilot E2E specs.
 */

/** Protected routes that must redirect unauthenticated visitors to /login. */
export const PROTECTED_ROUTES = [
  '/dashboard',
  '/properties',
  '/properties/new',
  '/marketing',
  '/landing-pages',
  '/billing',
  '/search',
  '/settings',
  '/onboarding',
  '/admin',
  '/admin/users',
  '/admin/transactions',
] as const;

/**
 * Assert that visiting a protected route while unauthenticated lands the user
 * on the login page (proving middleware auth enforcement). The app may either
 * 302-redirect to /login or render /login directly with a ?redirect= param.
 */
export async function expectRedirectToLogin(page: Page, route: string): Promise<void> {
  await page.goto(route);
  await page.waitForURL(/\/login(\?|$)/, { timeout: 15_000 });
  expect(page.url()).toContain('/login');
}
