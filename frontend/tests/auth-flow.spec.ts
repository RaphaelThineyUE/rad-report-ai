import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await page.goto('/worklist', { waitUntil: 'networkidle' });
    // Should redirect to /login
    expect(page.url()).toContain('/login');
  });

  test('should display login form', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });

    expect(await page.locator('input[type="email"]')).toBeVisible();
    expect(await page.locator('input[type="password"]')).toBeVisible();
    expect(await page.locator('button:has-text("Sign in securely")')).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });

    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button:has-text("Sign in securely")');

    // Wait for error message
    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage).toBeVisible();
  });

  test('should display forgot password link', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });

    const forgotPasswordLink = page.locator('button:has-text("Forgot password?")');
    await expect(forgotPasswordLink).toBeVisible();
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });

    await page.click('button:has-text("Forgot password?")');
    expect(page.url()).toContain('/forgot-password');
  });

  test('should show loading state during sign in', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });

    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');

    const signInButton = page.locator('button:has-text("Sign in securely")');
    await signInButton.click();

    // Check if button shows loading state
    const loadingButton = page.locator('button:has-text("Signing in...")');
    expect(await loadingButton.isVisible()).toBeTruthy();
  });
});

test.describe('Protected Routes', () => {
  test('should not allow access to /patients without auth', async ({ page }) => {
    await page.goto('/patients', { waitUntil: 'networkidle' });
    expect(page.url()).toContain('/login');
  });

  test('should not allow access to /analytics without auth', async ({ page }) => {
    await page.goto('/analytics', { waitUntil: 'networkidle' });
    expect(page.url()).toContain('/login');
  });

  test('should not allow access to /settings without auth', async ({ page }) => {
    await page.goto('/settings', { waitUntil: 'networkidle' });
    expect(page.url()).toContain('/login');
  });

  test('should not allow access to /worklist without auth', async ({ page }) => {
    await page.goto('/worklist', { waitUntil: 'networkidle' });
    expect(page.url()).toContain('/login');
  });
});
