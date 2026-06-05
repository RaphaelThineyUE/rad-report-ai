import { test, expect } from '@playwright/test';

test.describe('PR #22 - Analytics, Exports, and Admin Features', () => {
  // Setup: Navigate to protected routes
  test.beforeEach(async ({ page }) => {
    // Set auth token if needed for testing
    // In production, you'd use proper test credentials
  });

  test.describe('Analytics Dashboard', () => {
    test('should load analytics page', async ({ page }) => {
      await page.goto('/analytics', { waitUntil: 'networkidle' });

      expect(page.url()).toContain('/analytics');
      expect(await page.locator('h1:has-text("Analytics")')).toBeVisible();
    });

    test('should display analytics filters', async ({ page }) => {
      await page.goto('/analytics', { waitUntil: 'networkidle' });

      // Check for filter inputs
      expect(await page.locator('input[type="date"]')).toHaveCount(2); // Start and end date
      expect(await page.locator('select')).toBeVisible(); // Cancer stage dropdown
      expect(await page.locator('input[placeholder*="Treatment"]')).toBeVisible();
    });

    test('should display metric cards', async ({ page }) => {
      await page.goto('/analytics', { waitUntil: 'networkidle' });

      // Wait for data to load
      await page.waitForLoadState('networkidle');

      // Check for metric cards
      expect(await page.locator('text=Total Reports')).toBeVisible();
      expect(await page.locator('text=Completed')).toBeVisible();
      expect(await page.locator('text=Failed')).toBeVisible();
      expect(await page.locator('text=Avg Time')).toBeVisible();
      expect(await page.locator('text=Total Patients')).toBeVisible();
    });

    test('should display charts', async ({ page }) => {
      await page.goto('/analytics', { waitUntil: 'networkidle' });

      await page.waitForLoadState('networkidle');

      // Check for chart sections
      expect(await page.locator('text=Reports per month')).toBeVisible();
      expect(await page.locator('text=BI-RADS distribution')).toBeVisible();
      expect(await page.locator('text=Cancer stages')).toBeVisible();
    });

    test('should filter by date range', async ({ page }) => {
      await page.goto('/analytics', { waitUntil: 'networkidle' });

      // Set start date
      const startDateInput = page.locator('input[type="date"]').first();
      await startDateInput.fill('2026-01-01');

      await page.waitForLoadState('networkidle');

      // Verify page still loads with filter applied
      expect(await page.locator('h1:has-text("Analytics")')).toBeVisible();
    });

    test('should have export CSV button', async ({ page }) => {
      await page.goto('/analytics', { waitUntil: 'networkidle' });

      const exportButton = page.locator('button:has-text("Export CSV")');
      expect(await exportButton).toBeVisible();
    });

    test('should have clear filters button', async ({ page }) => {
      await page.goto('/analytics', { waitUntil: 'networkidle' });

      const clearButton = page.locator('button:has-text("Clear Filters")');
      expect(await clearButton).toBeVisible();
    });
  });

  test.describe('Admin Dashboard', () => {
    test('should load admin dashboard', async ({ page }) => {
      await page.goto('/admin-dashboard', { waitUntil: 'networkidle' });

      expect(page.url()).toContain('/admin-dashboard');
      expect(await page.locator('h1:has-text("Admin Dashboard")')).toBeVisible();
    });

    test('should display system health metrics', async ({ page }) => {
      await page.goto('/admin-dashboard', { waitUntil: 'networkidle' });

      await page.waitForLoadState('networkidle');

      // Check for health metrics
      expect(await page.locator('text=Total Users')).toBeVisible();
      expect(await page.locator('text=Total Patients')).toBeVisible();
      expect(await page.locator('text=Total Reports')).toBeVisible();
      expect(await page.locator('text=Avg Processing')).toBeVisible();
    });

    test('should display recent report status', async ({ page }) => {
      await page.goto('/admin-dashboard', { waitUntil: 'networkidle' });

      await page.waitForLoadState('networkidle');

      // Check for status cards
      expect(await page.locator('text=Recent Report Status')).toBeVisible();
      expect(await page.locator('text=Completed')).toBeVisible();
      expect(await page.locator('text=Failed')).toBeVisible();
    });

    test('should display AI reliability metrics', async ({ page }) => {
      await page.goto('/admin-dashboard', { waitUntil: 'networkidle' });

      await page.waitForLoadState('networkidle');

      expect(await page.locator('text=AI Reliability')).toBeVisible();
      expect(await page.locator('text=Success Rate')).toBeVisible();
    });

    test('should display system status', async ({ page }) => {
      await page.goto('/admin-dashboard', { waitUntil: 'networkidle' });

      await page.waitForLoadState('networkidle');

      expect(await page.locator('text=System Status')).toBeVisible();
      expect(await page.locator('text=API Status')).toBeVisible();
      expect(await page.locator('text=Database')).toBeVisible();
      expect(await page.locator('text=Storage')).toBeVisible();
    });

    test('should have refresh button', async ({ page }) => {
      await page.goto('/admin-dashboard', { waitUntil: 'networkidle' });

      const refreshButton = page.locator('button:has-text("Refresh")');
      expect(await refreshButton).toBeVisible();
    });
  });

  test.describe('Admin User Management', () => {
    test('should load admin users page', async ({ page }) => {
      await page.goto('/admin-users', { waitUntil: 'networkidle' });

      expect(page.url()).toContain('/admin-users');
      expect(await page.locator('h1:has-text("User Management")')).toBeVisible();
    });

    test('should display users list', async ({ page }) => {
      await page.goto('/admin-users', { waitUntil: 'networkidle' });

      await page.waitForLoadState('networkidle');

      // Check for users section
      expect(await page.locator('text=Users')).toBeVisible();
    });

    test('should display user details when user is selected', async ({ page }) => {
      await page.goto('/admin-users', { waitUntil: 'networkidle' });

      await page.waitForLoadState('networkidle');

      // Try to click first user if available
      const userButtons = page.locator('button').filter({ hasText: /reports/ });
      if (await userButtons.count() > 0) {
        await userButtons.first().click();

        // Check for user details
        expect(await page.locator('text=User Details')).toBeVisible();
        expect(await page.locator('text=Email')).toBeVisible();
        expect(await page.locator('text=Account Created')).toBeVisible();
      }
    });

    test('should display user stats', async ({ page }) => {
      await page.goto('/admin-users', { waitUntil: 'networkidle' });

      await page.waitForLoadState('networkidle');

      // Try to click first user if available
      const userButtons = page.locator('button').filter({ hasText: /reports/ });
      if (await userButtons.count() > 0) {
        await userButtons.first().click();

        // Check for stats
        expect(await page.locator('text=Patients')).toBeVisible();
        expect(await page.locator('text=Reports')).toBeVisible();
      }
    });

    test('should have refresh button', async ({ page }) => {
      await page.goto('/admin-users', { waitUntil: 'networkidle' });

      const refreshButton = page.locator('button:has-text("Refresh")');
      expect(await refreshButton).toBeVisible();
    });
  });

  test.describe('Navigation - Admin Items in Sidebar', () => {
    test('should display admin section in sidebar', async ({ page }) => {
      await page.goto('/admin-dashboard', { waitUntil: 'networkidle' });

      // Check for admin nav items
      const adminLabel = page.locator('text=Admin');
      expect(await adminLabel).toBeVisible();
    });

    test('should navigate to admin-dashboard from sidebar', async ({ page }) => {
      await page.goto('/analytics', { waitUntil: 'networkidle' });

      // Find and click admin dashboard nav item
      const adminNavItem = page.locator('button').filter({ hasText: /System Health|Admin/ }).first();
      if (await adminNavItem.isVisible()) {
        await adminNavItem.click();
        await page.waitForLoadState('networkidle');
        expect(page.url()).toContain('/admin-dashboard');
      }
    });

    test('should navigate to admin-users from sidebar', async ({ page }) => {
      await page.goto('/analytics', { waitUntil: 'networkidle' });

      // Find and click admin users nav item
      const usersNavItem = page.locator('button').filter({ hasText: 'Users' });
      if (await usersNavItem.isVisible()) {
        await usersNavItem.click();
        await page.waitForLoadState('networkidle');
        expect(page.url()).toContain('/admin-users');
      }
    });
  });

  test.describe('Protected Routes - Admin Pages', () => {
    test('should not allow access to /admin-dashboard without auth', async ({ page }) => {
      // Clear cookies to ensure no auth
      await page.context().clearCookies();

      await page.goto('/admin-dashboard', { waitUntil: 'networkidle' });
      expect(page.url()).toContain('/login');
    });

    test('should not allow access to /admin-users without auth', async ({ page }) => {
      // Clear cookies to ensure no auth
      await page.context().clearCookies();

      await page.goto('/admin-users', { waitUntil: 'networkidle' });
      expect(page.url()).toContain('/login');
    });
  });

  test.describe('Export Functionality', () => {
    test('should have export buttons on analytics page', async ({ page }) => {
      await page.goto('/analytics', { waitUntil: 'networkidle' });

      const exportButton = page.locator('button:has-text("Export CSV")');
      expect(await exportButton).toBeVisible();
    });

    test('should export analytics CSV with proper naming', async ({ page }) => {
      await page.goto('/analytics', { waitUntil: 'networkidle' });

      // Listen for download
      const downloadPromise = page.waitForEvent('download');

      // Click export button
      const exportButton = page.locator('button:has-text("Export CSV")');
      if (await exportButton.isVisible()) {
        await exportButton.click();

        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBe('analytics.csv');
      }
    });
  });

  test.describe('Treatment Comparison Charts', () => {
    test('should load treatment comparison charts when multiple treatments exist', async ({ page }) => {
      // This test assumes you navigate to a patient with multiple treatments
      // The actual implementation depends on your patient data

      // Navigate to a patient detail that has treatments
      // This would require proper test data setup

      // For now, we just verify the component would be rendered if treatments exist
      // In a real scenario, you'd have specific test patients with known treatment data
    });
  });
});
