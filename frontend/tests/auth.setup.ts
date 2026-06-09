import { test as setup, expect } from '@playwright/test';

export const authFile = 'playwright/.auth/user.json';

const TEST_EMAIL = process.env.E2E_TEST_EMAIL;
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD;

setup('authenticate as test user', async ({ page }) => {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    throw new Error('E2E_TEST_EMAIL and E2E_TEST_PASSWORD must be set in .env.e2e.local');
  }

  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  await page.getByLabel('Work email').fill(TEST_EMAIL);
  await page.getByLabel('Password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Sign in securely' }).click();

  await page.waitForURL('**/worklist', { timeout: 15000 });
  await expect(page).toHaveURL(/\/worklist/);

  await page.context().storageState({ path: authFile });
});
