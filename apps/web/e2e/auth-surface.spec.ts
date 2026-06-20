import { expect, test } from '@playwright/test';

test('auth surfaces render at desktop and mobile widths', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.locator('[data-nextjs-dialog]')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/login-desktop.png', fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/signup');
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
  await page.screenshot({ path: 'test-results/signup-mobile.png', fullPage: true });
});

test('unauthenticated dashboard redirects to login', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/, { timeout: 5_000 });
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
});

test('authenticated dashboard leaves the account loading state', async ({ page }) => {
  test.skip(!process.env.TEST_AUTH_COOKIE, 'Requires a local authenticated test cookie');
  await page.context().addCookies([{ name: 'diet_session', value: process.env.TEST_AUTH_COOKIE!, domain: 'localhost', path: '/' }]);
  await page.goto('/dashboard');
  await expect(page.getByText('Loading your account')).toHaveCount(0, { timeout: 5_000 });
  await expect(page.getByRole('heading', { name: 'Today', exact: true })).toBeVisible();
});
