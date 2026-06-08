import { test, expect, type Page } from '@playwright/test';

const TEST_PATIENT_MARKER = '[PW-CRUD-TEST]';

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

test.describe('Patient CRUD Operations', () => {
  test('should create, edit, and delete a patient', async ({ page }) => {
    const patientName = `${TEST_PATIENT_MARKER} John Doe`;
    let patientId: string;

    await test.step('Navigate to Patients page', async () => {
      await page.goto('/patients');
      await page.waitForLoadState('networkidle');
    });

    await test.step('Create a new patient via form', async () => {
      // Open Add Patient dialog
      await page.getByRole('button', { name: 'Add Patient' }).click();
      await expect(page.getByRole('dialog', { name: 'Add patient' })).toBeVisible();

      // Fill required fields
      await page.getByLabel('Full Name *').fill(patientName);
      await page.getByLabel('Date of Birth *').fill('1965-08-20');
      await page.getByLabel('Diagnosis Date *').fill('2023-06-15');
      await page.getByLabel('Cancer Type *').fill('Invasive Lobular Carcinoma');

      // Fill optional fields
      await page.getByLabel('Cancer Stage').selectOption('Stage III');
      await page.getByLabel('Gender').selectOption('Male');
      await page.getByLabel('ER Status').selectOption('Positive');
      await page.getByLabel('PR Status').selectOption('Negative');
      await page.getByLabel('HER2 Status').selectOption('Unknown');

      // Submit form
      await page.getByRole('button', { name: 'Create Patient' }).click();
      await expect(page.getByRole('dialog', { name: 'Add patient' })).not.toBeVisible({ timeout: 8000 });
      await expect(page.getByText(patientName)).toBeVisible({ timeout: 8000 });
    });

    await test.step('Retrieve patient ID from API', async () => {
      const res = await apiRequest(page, 'GET', '/api/patients');
      expect(res.status).toBe(200);
      const patients: { id: string; full_name: string }[] = res.body?.patients ?? res.body ?? [];
      const patient = patients.find(p => p.full_name === patientName);
      expect(patient).toBeDefined();
      patientId = patient!.id;
    });

    await test.step('Edit patient via API', async () => {
      const updateRes = await apiRequest(page, 'PATCH', `/api/patients/${patientId}`, {
        cancer_stage: 'Stage IV',
        tumor_size_cm: 5.5,
        er_status: 'Negative',
      });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.cancer_stage).toBe('Stage IV');
      expect(updateRes.body.tumor_size_cm).toBe(5.5);
      expect(updateRes.body.er_status).toBe('Negative');
    });

    await test.step('Verify edited patient in API response', async () => {
      const getRes = await apiRequest(page, 'GET', `/api/patients/${patientId}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.cancer_stage).toBe('Stage IV');
      expect(getRes.body.tumor_size_cm).toBe(5.5);
      expect(getRes.body.er_status).toBe('Negative');
    });

    await test.step('Delete patient via API', async () => {
      const deleteRes = await apiRequest(page, 'DELETE', `/api/patients/${patientId}`);
      expect(deleteRes.status).toBe(200);
    });

    await test.step('Verify patient is deleted', async () => {
      const getRes = await apiRequest(page, 'GET', `/api/patients/${patientId}`);
      expect(getRes.status).toBe(404);
    });

    await test.step('Verify patient no longer appears in list after reload', async () => {
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(patientName)).not.toBeVisible();
    });
  });
});
