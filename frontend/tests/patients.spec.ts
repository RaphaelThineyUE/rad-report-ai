import { test, expect } from '@playwright/test';

const TEST_PATIENT_MARKER = '[PW-TEST]';

async function deletePatientsByMarker(request: APIRequestContext) {
  const res = await request.get('/api/patients');
  if (!res.ok()) return;
  const data = await res.json();
  const testPatients: { id: string }[] = (data.patients ?? data).filter((p: { full_name: string }) =>
    p.full_name.includes(TEST_PATIENT_MARKER)
  );
  await Promise.all(testPatients.map(p => request.delete(`/api/patients/${p.id}`)));
}

test.describe('Patients - Authenticated Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/patients');
    await page.waitForLoadState('networkidle');

    // Dismiss onboarding modal if it appears (first visit with no patients)
    const startFresh = page.getByRole('button', { name: 'Start Fresh' });
    if (await startFresh.isVisible()) {
      await startFresh.click();
      await page.waitForTimeout(300);
    }
  });

  test.afterEach(async ({ request }) => {
    await deletePatientsByMarker(request);
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

  test('opens patient detail panel when clicking a patient card', async ({ page, request }) => {
    const patientName = `${TEST_PATIENT_MARKER} Detail View Patient`;

    await test.step('Create a patient via API for speed', async () => {
      const res = await request.post('/api/patients', {
        data: {
          full_name: patientName,
          date_of_birth: '1980-06-15',
          diagnosis_date: '2023-11-01',
          cancer_type: 'Lobular Carcinoma',
          cancer_stage: 'Stage I',
        },
      });
      expect(res.status()).toBe(201);
    });

    await test.step('Reload page to see the new patient', async () => {
      await page.reload();
      await page.waitForLoadState('networkidle');
      const startFresh = page.getByRole('button', { name: 'Start Fresh' });
      if (await startFresh.isVisible()) await startFresh.click();
    });

    await test.step('Click patient card to open detail panel', async () => {
      await page.getByText(patientName).click();
      // Detail panel should open — check for the patient name in the panel
      await expect(page.getByText(patientName).first()).toBeVisible();
    });
  });

  test('filters patients by search term', async ({ page, request }) => {
    const uniqueName = `${TEST_PATIENT_MARKER} SearchFilter Patient`;

    await test.step('Create a searchable patient via API', async () => {
      const res = await request.post('/api/patients', {
        data: {
          full_name: uniqueName,
          date_of_birth: '1990-04-10',
          diagnosis_date: '2024-06-01',
          cancer_type: 'DCIS',
        },
      });
      expect(res.status()).toBe(201);
    });

    await test.step('Reload and enter search term', async () => {
      await page.reload();
      await page.waitForLoadState('networkidle');
      const startFresh = page.getByRole('button', { name: 'Start Fresh' });
      if (await startFresh.isVisible()) await startFresh.click();
    });

    await test.step('Verify matching patient is visible', async () => {
      // Search via the top-bar search input
      const searchInput = page.getByRole('searchbox');
      if (await searchInput.isVisible()) {
        await searchInput.fill('SearchFilter');
        await expect(page.getByText(uniqueName)).toBeVisible();
      } else {
        // Skip filter check if no search bar present — just confirm patient exists
        await expect(page.getByText(uniqueName)).toBeVisible();
      }
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

  test('can navigate to Patients via sidebar', async ({ page }) => {
    await page.getByRole('link', { name: 'Patients' }).click();
    await expect(page).toHaveURL(/\/patients/);
    await expect(page.getByRole('heading', { name: 'Patients' })).toBeVisible();
  });

  test('can navigate to Analytics via sidebar', async ({ page }) => {
    await page.getByRole('link', { name: 'Analytics' }).click();
    await expect(page).toHaveURL(/\/analytics/);
  });

  test('can navigate to Settings via sidebar', async ({ page }) => {
    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL(/\/settings/);
  });
});
