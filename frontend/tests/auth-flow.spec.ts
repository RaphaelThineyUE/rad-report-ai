import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('displays all login form elements', async ({ page }) => {
    await expect(page.getByLabel('Work email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in securely' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Forgot password?' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();
  });

  test('shows error message on invalid credentials', async ({ page }) => {
    await test.step('Submit invalid credentials', async () => {
      await page.getByLabel('Work email').fill('invalid@example.com');
      await page.getByLabel('Password').fill('wrongpassword');
      await page.getByRole('button', { name: 'Sign in securely' }).click();
    });

    await test.step('Verify error is shown', async () => {
      const errorMessage = page.locator('[role="alert"]');
      await expect(errorMessage).toBeVisible();
    });
  });

  test('shows loading state while signing in', async ({ page }) => {
    await page.getByLabel('Work email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');

    const signInButton = page.getByRole('button', { name: 'Sign in securely' });
    await signInButton.click();

    await expect(page.getByRole('button', { name: 'Signing in...' })).toBeVisible();
  });

  test('navigates to forgot password page', async ({ page }) => {
    await page.getByRole('button', { name: 'Forgot password?' }).click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });

  test('navigates to sign up page via link', async ({ page }) => {
    await page.getByRole('link', { name: 'Sign up' }).click();
    await expect(page).toHaveURL(/\/signup/);
  });

  test('sign in with valid credentials redirects to worklist', async ({ page }) => {
    const email = process.env.E2E_TEST_EMAIL;
    const password = process.env.E2E_TEST_PASSWORD;
    if (!email || !password) test.skip(true, 'E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set');

    await test.step('Enter credentials', async () => {
      await page.getByLabel('Work email').fill(email!);
      await page.getByLabel('Password').fill(password!);
    });

    await test.step('Submit and verify redirect', async () => {
      await page.getByRole('button', { name: 'Sign in securely' }).click();
      await expect(page).toHaveURL(/\/worklist/, { timeout: 15000 });
    });
  });
});

test.describe('Sign Up Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
  });

  test('displays all sign-up form elements', async ({ page }) => {
    await expect(page.getByLabel('Full name')).toBeVisible();
    await expect(page.getByLabel('Work email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
  });

  test('navigates to login page via sign-in link', async ({ page }) => {
    await page.getByRole('link', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Protected Route Redirects', () => {
  const protectedRoutes = ['/worklist', '/patients', '/analytics', '/settings'];

  for (const route of protectedRoutes) {
    test(`redirects unauthenticated user from ${route} to login`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'networkidle' });
      await expect(page).toHaveURL(/\/login/);
    });
  }
});
