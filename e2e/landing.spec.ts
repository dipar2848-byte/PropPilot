import { test, expect } from '@playwright/test';

/**
 * Critical flow: public marketing / landing pages.
 * These render without authentication and are the top of the funnel.
 */
test.describe('Public landing pages', () => {
  test('home page renders hero, value props and primary CTAs', async ({ page }) => {
    await page.goto('/');

    // Hero headline.
    await expect(
      page.getByRole('heading', { name: /List, market and sell properties/i }),
    ).toBeVisible();

    // Brand + primary navigation CTAs.
    await expect(page.getByRole('link', { name: /Sign in/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Get started/i }).first()).toBeVisible();

    // Feature cards (value proposition) — target the headings specifically to
    // avoid colliding with the <title>/metadata text.
    await expect(page.getByRole('heading', { name: 'Property management' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'AI marketing kits' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Landing pages' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Instant search' })).toBeVisible();
  });

  test('home page CTA navigates to signup', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Get started/i }).first().click();
    await page.waitForURL(/\/signup(\?|$)/);
    await expect(page.getByRole('heading', { name: /Create/i }).first()).toBeVisible();
  });

  test('home page sign-in link navigates to login', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Sign in/i }).first().click();
    await page.waitForURL(/\/login(\?|$)/);
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();
  });

  test('unknown public property slug returns 404', async ({ page }) => {
    const res = await page.goto('/p/this-slug-does-not-exist-e2e');
    expect(res?.status()).toBe(404);
  });

  test('offline fallback page renders', async ({ page }) => {
    const res = await page.goto('/offline');
    expect(res?.status()).toBeLessThan(400);
  });
});
