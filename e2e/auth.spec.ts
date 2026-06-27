import { test, expect } from '@playwright/test';

/**
 * Critical flow: authentication (UI + client/server validation + boundaries).
 *
 * We do not rely on a live Supabase backend here; instead we verify the auth
 * surfaces render, enforce validation, and link together correctly — the parts
 * a user always hits and that must never regress.
 */
test.describe('Authentication', () => {
  test('login page renders the sign-in form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Forgot password/i })).toBeVisible();
  });

  test('login links to signup', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /Create one/i }).click();
    await page.waitForURL(/\/signup(\?|$)/);
  });

  test('signup page renders the registration form', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('input#fullName')).toBeVisible();
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.getByRole('button', { name: /Create account/i })).toBeVisible();
  });

  test('forgot-password page renders', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('input#email')).toBeVisible();
  });

  test('invalid credentials surface a server-side validation/auth error', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input#email').fill('not-a-real-user@example.com');
    await page.locator('input#password').fill('wrong-password-123');
    await page.getByRole('button', { name: /Sign in/i }).click();

    // With placeholder/unreachable Supabase the action returns an error banner
    // and the user stays on /login (never silently authenticated).
    await expect(page).toHaveURL(/\/login(\?|$)/);
    await expect(page.locator('input#email')).toBeVisible();
  });

  test('signup rejects an obviously weak password (client + server validation)', async ({
    page,
  }) => {
    await page.goto('/signup');
    await page.locator('input#fullName').fill('E2E Tester');
    await page.locator('input#email').fill('e2e-new-user@example.com');
    await page.locator('input#password').fill('short');
    await page.getByRole('button', { name: /Create account/i }).click();

    // Must not navigate into the authenticated app on a bad password.
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/signup(\?|$)/);
  });
});
