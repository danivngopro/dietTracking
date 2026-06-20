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
