import { test, expect } from '@playwright/test';
import { expectRedirectToLogin } from './helpers';

/**
 * Critical flows behind authentication — verified at the security boundary.
 *
 * "Never trust the frontend": every protected surface (property CRUD, AI
 * generation, billing, landing-page management, admin) MUST redirect an
 * unauthenticated visitor to /login. This proves middleware + server-side
 * enforcement for each flow without needing seeded user data.
 */
test.describe('Auth boundary — protected production flows', () => {
  test('dashboard requires auth', async ({ page }) => {
    await expectRedirectToLogin(page, '/dashboard');
  });

  test('property CRUD — list requires auth', async ({ page }) => {
    await expectRedirectToLogin(page, '/properties');
  });

  test('property CRUD — create page requires auth', async ({ page }) => {
    await expectRedirectToLogin(page, '/properties/new');
  });

  test('AI marketing generation requires auth', async ({ page }) => {
    await expectRedirectToLogin(page, '/marketing');
  });

  test('landing-page management requires auth', async ({ page }) => {
    await expectRedirectToLogin(page, '/landing-pages');
  });

  test('data export page requires auth', async ({ page }) => {
    await expectRedirectToLogin(page, '/export');
  });

  test('leads CSV export API rejects unauthenticated requests (401)', async ({ request }) => {
    const res = await request.get('/api/export/leads', { maxRedirects: 0 });
    // Either a 401 from the handler or a 3xx redirect to /login from middleware.
    expect([301, 302, 303, 307, 308, 401]).toContain(res.status());
  });

  test('properties CSV export API rejects unauthenticated requests (401)', async ({
    request,
  }) => {
    const res = await request.get('/api/export/properties', { maxRedirects: 0 });
    expect([301, 302, 303, 307, 308, 401]).toContain(res.status());
  });

  test('billing requires auth', async ({ page }) => {
    await expectRedirectToLogin(page, '/billing');
  });

  test('search requires auth', async ({ page }) => {
    await expectRedirectToLogin(page, '/search');
  });

  test('settings requires auth', async ({ page }) => {
    await expectRedirectToLogin(page, '/settings');
  });

  test('admin dashboard requires auth', async ({ page }) => {
    await expectRedirectToLogin(page, '/admin');
  });

  test('admin users requires auth', async ({ page }) => {
    await expectRedirectToLogin(page, '/admin/users');
  });

  test('admin transactions requires auth', async ({ page }) => {
    await expectRedirectToLogin(page, '/admin/transactions');
  });

  test('login preserves the intended destination via ?redirect=', async ({ page }) => {
    await page.goto('/properties/new');
    await page.waitForURL(/\/login/);
    // Middleware should carry the original path so post-login returns the user.
    expect(page.url()).toMatch(/redirect=.*propert/i);
  });
});
