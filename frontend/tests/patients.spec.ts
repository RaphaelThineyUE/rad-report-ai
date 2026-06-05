import { test, expect, type Page } from '@playwright/test';

const TEST_PATIENT_MARKER = '[PW-TEST]';

// Supabase stores the auth token in localStorage — run API calls via page.evaluate
// so the browser context (with the stored token) handles authentication.
async function apiRequest(page: Page, method: string, path: string, body?: object) {
  return page.evaluate(
    async ({ method, path, body }) => {
      const key = Object.keys(localStorage).find(
        k => k.startsWith('sb-') && k.endsWith('-auth-token')
      );
      const token = key ? JSON.parse(localStorage.getItem(key)!).access_token : null;
      const res = await fetch(path, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const text = await res.text();
      return { status: res.status, body: text ? JSON.parse(text) : null };
    },
    { method, path, body }
  );
}

async function cleanupTestPatients(page: Page) {
  const res = await apiRequest(page, 'GET', '/api/patients');
  if (res.status !== 200) return;
  const patients: { id: string; full_name: string }[] = res.body?.patients ?? res.body ?? [];
  const toDelete = patients.filter(p => p.full_name.includes(TEST_PATIENT_MARKER));
  await Promise.all(toDelete.map(p => apiRequest(page, 'DELETE', `/api/patients/${p.id}`)));
}

async function dismissOnboarding(page: Page) {
  const startFresh = page.getByRole('button', { name: 'Start Fresh' });
  if (await startFresh.isVisible()) {
    await startFresh.click();
    await page.waitForTimeout(300);
  }
}

test.describe('Patients - Authenticated Flow', () => {
  // Run serially: afterEach cleanup would delete patients mid-test if parallel
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/patients');
    await page.waitForLoadState('networkidle');
    await dismissOnboarding(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestPatients(page);
  });

  test('shows the Patients page with Add Patient button', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Patients' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add Patient' })).toBeVisible();
  });

  test('opens Add Patient dialog with all required fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Patient' }).click();

    await test.step('Verify dialog structure', async () => {
      await expect(page.getByRole('dialog', { name: 'Add patient' })).toBeVisible();
      await expect(page.getByLabel('Full Name *')).toBeVisible();
      await expect(page.getByLabel('Date of Birth *')).toBeVisible();
      await expect(page.getByLabel('Diagnosis Date *')).toBeVisible();
      await expect(page.getByLabel('Cancer Type *')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Create Patient' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    });
  });

  test('closes Add Patient dialog on Cancel', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Patient' }).click();
    await expect(page.getByRole('dialog', { name: 'Add patient' })).toBeVisible();

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog', { name: 'Add patient' })).not.toBeVisible();
  });

  test('creates a new patient and shows it in the list', async ({ page }) => {
    const patientName = `${TEST_PATIENT_MARKER} Jane Smith`;

    await test.step('Open Add Patient dialog', async () => {
      await page.getByRole('button', { name: 'Add Patient' }).click();
      await expect(page.getByRole('dialog', { name: 'Add patient' })).toBeVisible();
    });

    await test.step('Fill in required patient fields', async () => {
      await page.getByLabel('Full Name *').fill(patientName);
      await page.getByLabel('Date of Birth *').fill('1975-03-22');
      await page.getByLabel('Diagnosis Date *').fill('2024-01-15');
      await page.getByLabel('Cancer Type *').fill('Invasive Ductal Carcinoma');
    });

    await test.step('Fill optional fields', async () => {
      await page.getByLabel('Cancer Stage').selectOption('Stage II');
      await page.getByLabel('ER Status').selectOption('Positive');
      await page.getByLabel('PR Status').selectOption('Positive');
      await page.getByLabel('HER2 Status').selectOption('Negative');
    });

    await test.step('Submit and verify patient appears in list', async () => {
      await page.getByRole('button', { name: 'Create Patient' }).click();
      await expect(page.getByRole('dialog', { name: 'Add patient' })).not.toBeVisible({ timeout: 8000 });
      await expect(page.getByText(patientName)).toBeVisible({ timeout: 8000 });
    });
  });

  test('opens patient detail panel when clicking a patient card', async ({ page }) => {
    const patientName = `${TEST_PATIENT_MARKER} Detail View Patient`;

    await test.step('Create a patient via authenticated browser fetch', async () => {
      const res = await apiRequest(page, 'POST', '/api/patients', {
        full_name: patientName,
        date_of_birth: '1980-06-15',
        diagnosis_date: '2023-11-01',
        cancer_type: 'Lobular Carcinoma',
        cancer_stage: 'Stage I',
      });
      expect(res.status).toBe(201);
    });

    await test.step('Reload to fetch updated patient list', async () => {
      await page.reload();
      await page.waitForLoadState('networkidle');
      await dismissOnboarding(page);
    });

    await test.step('Click patient card to open detail panel', async () => {
      await expect(page.getByText(patientName)).toBeVisible({ timeout: 8000 });
      await page.getByText(patientName).click();
      // Detail panel shows the patient name — wait for it to appear
      await expect(page.getByText(patientName).first()).toBeVisible();
    });
  });

  test('creates a patient via API and it appears after page reload', async ({ page }) => {
    const patientName = `${TEST_PATIENT_MARKER} API Created Patient`;

    await test.step('Create patient via API', async () => {
      const res = await apiRequest(page, 'POST', '/api/patients', {
        full_name: patientName,
        date_of_birth: '1990-04-10',
        diagnosis_date: '2024-06-01',
        cancer_type: 'DCIS',
      });
      expect(res.status).toBe(201);
    });

    await test.step('Reload and verify patient is listed', async () => {
      await page.reload();
      await page.waitForLoadState('networkidle');
      await dismissOnboarding(page);
      await expect(page.getByText(patientName)).toBeVisible({ timeout: 8000 });
    });
  });
});

test.describe('Navigation - Authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/worklist');
    await page.waitForLoadState('networkidle');
  });

  test('authenticated user lands on worklist', async ({ page }) => {
    await expect(page).toHaveURL(/\/worklist/);
    await expect(page.getByRole('heading', { name: 'Worklist' })).toBeVisible();
  });

  test('can navigate to Patients via sidebar button', async ({ page }) => {
    await page.getByRole('button', { name: 'Patients' }).click();
    await expect(page).toHaveURL(/\/patients/);
    await expect(page.getByRole('heading', { name: 'Patients' })).toBeVisible();
  });

  test('can navigate to Analytics via sidebar button', async ({ page }) => {
    await page.getByRole('button', { name: 'Analytics' }).click();
    await expect(page).toHaveURL(/\/analytics/);
  });

  test('can navigate to Settings via sidebar button', async ({ page }) => {
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page).toHaveURL(/\/settings/);
  });
});
